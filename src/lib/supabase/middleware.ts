import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "csrf_token";

/**
 * 彻底重写的中间件：
 * - 前台 / buyer / products 等：不拦截
 * - 后台 /admin/*：只认 admin_logged_in cookie
 * - /admin/login：后台登录页，直接放行
 * - 登录成功后设置 admin_logged_in cookie（完全独立于 Supabase Auth）
 */
export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  // 非 admin 路由直接放行
  if (!pathname.startsWith("/admin")) {
    return response;
  }

  // /admin/login 页：放行
  if (pathname === "/admin/login") {
    const adminCookie = request.cookies.get("admin_logged_in");
    if (adminCookie?.value === "true") {
      // 已登录，跳转到 dashboard
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return response;
  }

  // 其他 /admin/* 路由：检查 admin_logged_in cookie
  const adminCookie = request.cookies.get("admin_logged_in");
  if (adminCookie?.value !== "true") {
    // 未登录，跳转登录页
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // 已登录：再验证一下 Supabase session 是否真的有效（双重保险）
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // 环境变量缺失，但有 admin cookie，放行
      return response;
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Supabase session 过期，清除 admin cookie，跳转登录页
      response.cookies.set("admin_logged_in", "", { maxAge: 0, path: "/admin" });
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // 验证邮箱是否是管理员
    const adminEmails = (process.env.ADMIN_EMAILS || "luozhidie@live.cn")
      .split(",")
      .map(e => e.trim())
      .filter(Boolean);

    const isAdmin = adminEmails.includes(user.email || "");

    if (!isAdmin) {
      // 不是管理员，清除 cookie，跳转首页
      response.cookies.set("admin_logged_in", "", { maxAge: 0, path: "/admin" });
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 全部通过，放行
    return response;
  } catch (error) {
    // 出错时也放行（因为已经有 admin cookie）
    console.error("[Middleware] 管理员验证出错:", error);
    return response;
  }
}
