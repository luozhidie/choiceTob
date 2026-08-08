import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";

/**
 * 微信小程序登录接口
 * POST /api/auth/wechat-login
 * Body: { code: string, nickName?: string, avatarUrl?: string }
 *
 * 流程：
 * 1. 用 code + appid + secret 调微信接口换 openid
 * 2. 用 openid 查 profiles 表
 * 3. 不存在则自动创建（需要先创建 auth.users 记录）
 * 4. 返回用户信息 + token（小程序端存到 Storage）
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, nickName, avatarUrl } = body;

    if (!code) {
      return NextResponse.json({ error: "缺少 code 参数" }, { status: 400 });
    }

    // 1. 调微信接口换 openid
    const appid = process.env.WECHAT_MINI_APPID || "wxe0ffec0a398de8b7";
    const secret = process.env.WECHAT_MINI_SECRET || "";

    if (!secret) {
      console.error("[Wechat Login] 缺少 WECHAT_MINI_SECRET 环境变量");
      return NextResponse.json({ error: "服务器配置错误，请联系管理员" }, { status: 500 });
    }

    const wxRes = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
    );
    const wxData: any = await wxRes.json();

    if (wxData.errcode) {
      console.error("[Wechat Login] 微信接口错误", wxData);
      return NextResponse.json({ error: `微信登录失败：${wxData.errmsg}` }, { status: 400 });
    }

    const { openid, session_key } = wxData;
    if (!openid) {
      return NextResponse.json({ error: "获取 openid 失败" }, { status: 400 });
    }

    // 2. 查/创用户（用 Service Role 绕过 RLS）
    const supabase = createServiceRoleClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 查 profiles 表里是否有这个 openid
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("wx_openid", openid)
      .single();

    let userId: string;
    let profile = existingProfile;

    if (existingProfile) {
      // 已存在：更新昵称和头像（如果传了）
      userId = existingProfile.id;
      const updateData: any = {};
      if (nickName) updateData.full_name = nickName;
      if (avatarUrl) updateData.avatar_url = avatarUrl;
      if (Object.keys(updateData).length > 0) {
        await supabase.from("profiles").update(updateData).eq("id", userId);
        profile = { ...existingProfile, ...updateData };
      }
    } else {
      // 不存在：新建 auth.users + profiles
      // 用微信 openid 生成唯一 email（Supabase Auth 要求 email 唯一）
      const fakeEmail = `${openid}@wx.luozhidie.com`;

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: fakeEmail,
        password: `wx_${openid.slice(0, 16)}`,  // 随机密码，用户不会用它登录
        email_confirm: true,
        user_metadata: { wx_openid: openid, nickName, avatarUrl },
      });

      if (createError) {
        console.error("[Wechat Login] 创建用户失败", createError);
        return NextResponse.json({ error: "创建用户失败：" + createError.message }, { status: 500 });
      }

      userId = newUser.user.id;

      // 创建 profiles 记录
      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: fakeEmail,
          full_name: nickName || null,
          avatar_url: avatarUrl || null,
          wx_openid: openid,
          role: "user",
          membership_type: "none",
        })
        .select()
        .single();

      if (profileError) {
        console.error("[Wechat Login] 创建 profile 失败", profileError);
        return NextResponse.json({ error: "创建用户资料失败" }, { status: 500 });
      }

      profile = newProfile;
    }

    // 3. 生成自定义 token（用 Supabase Auth 的 admin.signInWithId 获取 session）
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.signInWithId(userId);

    if (sessionError || !sessionData?.session) {
      console.error("[Wechat Login] 生成 session 失败", sessionError);
      // 降级：不返回 token，只返回用户信息（小程序下次启动重新登录）
      return NextResponse.json({
        success: true,
        user: profile,
        openid,
        message: "登录成功（请重新登录以获取完整功能）",
      });
    }

    // 4. 返回 token
    return NextResponse.json({
      success: true,
      user: profile,
      token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      openid,
      message: "登录成功",
    });

  } catch (err: any) {
    console.error("[Wechat Login API Error]", err);
    return NextResponse.json({ error: err.message || "登录失败，请稍后重试" }, { status: 500 });
  }
}
