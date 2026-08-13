import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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
    const adminEmails = (
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      "luozhidie@live.cn"
    )
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (!adminEmails.includes(email)) {
      return NextResponse.json(
        { success: false, error: "该邮箱没有管理员权限" },
        { status: 403 }
      );
    }

    // 检查环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[Admin Login] 环境变量缺失:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      return NextResponse.json(
        { success: false, error: "系统配置错误，请联系管理员" },
        { status: 500 }
      );
    }

    // 用 Supabase 验证密码（无 cookie client）
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    });

    // 加 10 秒超时保护
    const loginPromise = supabase.auth.signInWithPassword({ email, password });
    const timeoutPromise = new Promise<
      { data: any; error: any } | null
    >((resolve) =>
      setTimeout(() => resolve(null), 10000)
    );

    const result = await Promise.race([loginPromise, timeoutPromise]);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "登录超时，请稍后重试" },
        { status: 408 }
      );
    }

    const { data, error } = result;

    if (error || !data?.user) {
      console.error("[Admin Login] Supabase 错误:", error);
      return NextResponse.json(
        { success: false, error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 登录成功：设置 admin_logged_in cookie（独立于 Supabase session）
    const response = NextResponse.json({
      success: true,
      user: { id: data.user.id, email: data.user.email },
    });

    response.cookies.set("admin_logged_in", "true", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 小时
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Admin Login API] 异常:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
