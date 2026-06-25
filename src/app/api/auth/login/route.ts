import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

    // 登录成功！Supabase 已经通过 setAll 回调设置了 session cookie
    // 浏览器下次请求时自动携带这个 cookie
    return NextResponse.json({
      success: true,
      user: data.user,
      message: '登录成功',
    });
  } catch (err: any) {
    console.error("[Auth Login API Error]", err);
    return NextResponse.json({ error: err.message || "登录失败，请稍后重试" }, { status: 500 });
  }
}
