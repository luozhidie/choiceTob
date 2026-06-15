import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 后台管理员登录 API
 * POST /api/admin/login
 * body: { email, password }
 * 
 * 这个 API 专门给后台登录用，使用独立的 session cookie。
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

    // 验证邮箱是否在管理员列表中
    const ADMIN_EMAILS_FALLBACK = ["luozhidie@live.cn"];
    const adminEmailsRaw = (
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      ""
    );
    const adminEmails = adminEmailsRaw.split(",").map((e: string) => e.trim()).filter(Boolean);
    const validEmails = adminEmails.length > 0 ? adminEmails : ADMIN_EMAILS_FALLBACK;

    if (!validEmails.includes(email)) {
      return NextResponse.json(
        { success: false, error: "该邮箱不是管理员账号" },
        { status: 403 }
      );
    }

    // 使用 Supabase 验证登录
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || "登录失败" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (error: any) {
    console.error("[Admin Login API] 错误:", error);
    return NextResponse.json(
      { success: false, error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
