import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 小程序手机号一键登录
 * POST /api/auth/phone-login
 * Body: { login_code: string, phone_code: string }
 *
 * 流程：
 * 1. login_code → 换取 openid + session_key
 * 2. phone_code → 换取手机号（新版 API）
 * 3. 根据 openid 查找/创建用户（先 auth.users 再 profiles）
 * 4. 返回 token + user info
 */

const WX_APPID = process.env.WECHAT_MINI_APPID || "";
const WX_SECRET = process.env.WECHAT_MINI_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { login_code, phone_code } = body;

    if (!login_code || !phone_code) {
      return NextResponse.json({ error: "缺少登录凭证" }, { status: 400 });
    }

    // ── Step 1: 用 login_code 换取 openid ──
    const jscodeUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${login_code}&grant_type=authorization_code`;

    let sessionRes;
    try {
      sessionRes = await fetch(jscodeUrl);
    } catch (fetchErr) {
      console.error("[phone-login] 微信API请求失败:", fetchErr);
      return NextResponse.json({ error: "微信服务暂时不可用，请稍后重试" }, { status: 502 });
    }

    const sessionData = await sessionRes.json() as Record<string, any>;

    if (sessionData.errcode && sessionData.errcode !== 0) {
      console.error("[phone-login] jscode2session 失败:", sessionData);
      return NextResponse.json(
        { error: `微信登录失败(${sessionData.errcode}): ${sessionData.errmsg || "未知错误"}` },
        { status: 400 }
      );
    }

    const openid = sessionData.openid as string;
    const unionid = sessionData.unionid as string | undefined;

    if (!openid) {
      return NextResponse.json({ error: "无法获取用户标识" }, { status: 500 });
    }

    // ── Step 2: 用 access_token + phone_code 获取手机号 ──
    let phoneNumber = "";

    try {
      const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WX_APPID}&secret=${WX_SECRET}`;
      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json() as Record<string, any>;

      if (tokenData.access_token) {
        const phoneUrl = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${tokenData.access_token}`;
        const phoneRes = await fetch(phoneUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: phone_code }),
        });
        const phoneData = await phoneRes.json() as Record<string, any>;

        if (phoneData.errcode === 0 && phoneData.phone_info?.phoneNumber) {
          phoneNumber = phoneData.phone_info.phoneNumber;
        } else {
          console.warn("[phone-login] getuserphonenumber 返回:", JSON.stringify(phoneData).slice(0, 300));
        }
      } else {
        console.error("[phone-login] 获取access_token失败:", tokenData);
      }
    } catch (e) {
      console.error("[phone-login] 获取手机号失败:", e);
    }

    // ── Step 3: 在 Supabase 中查找或创建用户 ──
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 先按 openid 查找已有用户
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("*")
      .eq("wechat_openid", openid)
      .maybeSingle();

    let userId: string;
    let userProfile: any;

    if (existingUser) {
      // 已有用户 → 更新
      userId = existingUser.id;
      const updateData: Record<string, any> = {
        last_login_at: new Date().toISOString(),
      };
      if (phoneNumber && !existingUser.phone) {
        updateData.phone = phoneNumber;
        updateData.full_name = `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-4)}`;
      }
      await supabase.from("profiles").update(updateData).eq("id", userId);
      userProfile = { ...existingUser, ...updateData };
    } else {
      // 新用户 → 必须先在 auth.users 创建（因为 profiles.id FK 引用它）
      const fakeEmail = `${phoneNumber || 'wx'}_${openid.slice(-8)}@wechat.phone`;
      const fullName = phoneNumber
        ? `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-4)}`
        : `微信用户${openid.slice(-6)}`;

      // 3a) 用 Admin API 在 auth.users 创建用户
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: fakeEmail,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: {
          provider: 'wechat_mini',
          wechat_openid: openid,
          phone_number: phoneNumber || '',
        },
      });

      if (authErr || !authUser?.user?.id) {
        const errDetail = JSON.stringify(authErr || { message: 'no user returned', data: authUser });
        console.error("[phone-login] 创建 auth.user 失败:", errDetail);
        return NextResponse.json({
          error: "账号创建失败，请重试或使用其它方式登录",
          detail: 'auth.users创建失败: ' + errDetail,
        }, { status: 500 });
      }

      userId = authUser.user.id;

      // 3b) 触发器已自动创建了基础 profile 行，我们 UPDATE 补充字段
      const updateData: Record<string, any> = {
        wechat_openid: openid,
        wechat_unionid: unionid || null,
        phone: phoneNumber || null,
        full_name: fullName,
        role: 'user',
        membership_type: 'none',
        store_owner_certified: false,
      };

      const { data: updProfile, error: profileErr } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId)
        .select("*")
        .single();

      if (profileErr || !updProfile) {
        const errDetail = JSON.stringify(profileErr || { message: 'no data after update' });
        console.error("[phone-login] 更新 profile 失败:", errDetail);
        try { await supabase.auth.admin.deleteUser(userId); } catch(e) {}
        return NextResponse.json({
          error: "账号创建失败，请重试",
          detail: 'profiles更新失败: ' + errDetail,
        }, { status: 500 });
      }

      userProfile = updProfile;
    }

    // ── Step 4: 生成 token 并返回 ──
    const token = Buffer.from(JSON.stringify({
      uid: userId,
      openid,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天有效
    })).toString("base64url");

    const isAdmin = userProfile.role === "admin";

    return NextResponse.json({
      success: true,
      token,
      is_admin: isAdmin,
      user: {
        id: userId,
        phone_number: userProfile.phone || phoneNumber || "",
        full_name: userProfile.full_name || "",
        membership_type: userProfile.membership_type || "none",
        vip_status: userProfile.membership_type !== "none" ? "active" : "",
        membership_expires_at: userProfile.membership_expires_at || null,
        store_owner_certified: !!userProfile.store_owner_certified,
        certified_style: userProfile.certified_style || null,
      },
    });

  } catch (err: any) {
    const errDetail = err?.message || JSON.stringify(err).slice(0, 500);
    console.error("[phone-login] 未捕获异常:", errDetail);
    return NextResponse.json({ error: "登录失败", detail: errDetail }, { status: 500 });
  }
}
