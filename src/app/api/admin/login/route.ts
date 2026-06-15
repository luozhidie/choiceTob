import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 后台管理员登录 API
 * POST /api/admin/login
 * body: { email, password }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "请输入邮箱和密码" },
        { status: 400 }
      );
    }

    // 验证是不是管理员邮箱
    const adminEmails = (process.env.ADMIN_EMAILS || "luozhidie@live.cn").split(",").map(e => e.trim());
    if (!adminEmails.includes(email)) {
      return NextResponse.json(
        { success: false, error: "该邮箱没有管理员权限" },
        { status: 403 }
      );
    }

    // 用 Supabase 验证密码
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 登录成功：设置 admin_token cookie（独立于 Supabase session）
    const response = NextResponse.json({
      success: true,
      user: { id: data.user.id, email: data.user.email },
    });

    // 设置一个标记 cookie，让 middleware 识别管理员
    response.cookies.set("admin_logged_in", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8, // 8小时
      path: "/admin",
    });

    return response;
  } catch (error: any) {
    console.error("[Admin Login API] 错误:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
