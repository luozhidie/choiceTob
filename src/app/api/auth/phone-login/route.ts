import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 小程序手机号一键登录
 * POST /api/auth/phone-login
 * Body: { login_code: string, phone_code: string }
 *
 * 流程：
 * 1. login_code → 换取 openid + session_key
 * 2. session_key + phone_code → 解密获取手机号
 * 3. 根据 openid 查找/创建用户
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

    // ── Step 1: 用 login_code 换取 openid + session_key ──
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
    const sessionKey = sessionData.session_key as string;
    const unionid = sessionData.unionid as string | undefined;

    if (!openid || !sessionKey) {
      return NextResponse.json({ error: "无法获取用户标识" }, { status: 500 });
    }

    // ── Step 2: 用 session_key + phone_code 获取手机号 ──
    // 注意：新版本微信小程序用 getPhoneNumber 直接返回加密数据，需后端解密
    // 这里先尝试直接调用微信 getPhoneNumber 接口（如果 code 可直接换）
    let phoneNumber = "";

    try {
      // 方式A：新版 - 用 access_token + phone_code 直接换取手机号
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
        const phoneData = await phoneRes.json() as Record<string, any);

        if (phoneData.errcode === 0 && phoneData.phone_info?.phoneNumber) {
          phoneNumber = phoneData.phone_info.phoneNumber;
        } else {
          console.warn("[phone-login] getuserphonenumber 返回:", JSON.stringify(phoneData).slice(0, 300));
          // fallback：如果接口失败，先用 openid 作为标识，后续引导补录手机号
          phoneNumber = "";
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

    // 先按 openid 查找
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("*")
      .eq("wechat_openid", openid)
      .maybeSingle();

    let userId: string;
    let userProfile: any;

    if (existingUser) {
      // 已有用户 → 更新手机号（如有）和最后登录时间
      userId = existingUser.id;
      const updateData: Record<string, any> = {
        last_login_at: new Date().toISOString(),
      };
      if (phoneNumber) {
        updateData.phone = phoneNumber;
      }
      await supabase.from("profiles").update(updateData).eq("id", userId);
      userProfile = { ...existingUser, ...updateData };
    } else {
      // 新用户 → 创建
      const { data: newUser, error: createErr } = await supabase
        .from("profiles")
        .insert({
          wechat_openid: openid,
          wechat_unionid: unionid || null,
          phone: phoneNumber || null,
          nickname: phoneNumber ? `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-4)}` : `用户${openid.slice(-6)}`,
          role: "user",
          membership_type: "none",
          store_owner_certified: false,
        })
        .select("*")
        .single();

      if (createErr || !newUser) {
        console.error("[phone-login] 创建用户失败:", createErr);
        return NextResponse.json({ error: "创建账号失败，请重试" }, { status: 500 });
      }

      userId = newUser.id;
      userProfile = newUser;
    }

    // ── Step 4: 生成并返回 JWT token（简化：返回 user info + 临时标识）──
    // 小程序端用 token 标识登录态，这里生成一个简单 token
    const token = Buffer.from(JSON.stringify({
      uid: userId,
      openid,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天有效
    })).toString("base64url");

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: userId,
        phone_number: userProfile.phone || phoneNumber || "",
        nickname: userProfile.nickname || "",
        avatarUrl: userProfile.avatar_url || "",
        membership_type: userProfile.membership_type || "none",
        vip_status: userProfile.membership_type !== "none" ? "active" : "",
        membership_expires_at: userProfile.membership_expires_at || null,
        store_owner_certified: !!userProfile.store_owner_certified,
        certified_style: userProfile.certified_style || null,
      },
    });

  } catch (err: any) {
    console.error("[phone-login] 未捕获异常:", err);
    return NextResponse.json({ error: err.message || "登录失败" }, { status: 500 });
  }
}
