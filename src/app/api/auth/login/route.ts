import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
    }

    // 用 ANON Key 创建客户端（不是 Service Role），这样登录后能正确设置用户 session cookie
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // 关键！把 Supabase 的 session cookie 设置到响应中
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      let msg = error.message;
      if (msg === "Invalid login credentials") msg = "邮箱或密码错误";
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    // 登录成功！用 service_role 查 profiles 表获取会员信息
    let membershipType = null;
    let membershipExpiresAt = null;
    try {
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("membership_type, membership_expires_at")
        .eq("id", data.user!.id)
        .maybeSingle();
      if (profile) {
        membershipType = profile.membership_type;
        membershipExpiresAt = profile.membership_expires_at;
      }
    } catch (e) {
      console.error("[Auth Login] 查会员信息失败:", e);
    }

    // 判断是否为价格会员（用于小程序端批发价显示）
    const isPriceMember = !!(
      membershipType === "view_price" &&
      membershipExpiresAt &&
      new Date(membershipExpiresAt) > new Date()
    );

    // 生成小程序用的自定义 token（与 phone-login 同格式，含 uid），便于小程序端调用认证等接口
    const token = Buffer.from(
      JSON.stringify({
        uid: data.user!.id,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      })
    ).toString("base64url");

    // 登录成功！Supabase 已经通过 setAll 回调设置了 session cookie
    // 浏览器下次请求时自动携带这个 cookie
    return NextResponse.json({
      success: true,
      token,
      user: data.user,
      message: '登录成功',
      membership_type: membershipType,
      membership_expires_at: membershipExpiresAt,
      is_price_member: isPriceMember,
    });
  } catch (err: any) {
    console.error("[Auth Login API Error]", err);
    return NextResponse.json({ error: err.message || "登录失败，请稍后重试" }, { status: 500 });
  }
}
