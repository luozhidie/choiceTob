import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // 只处理 /admin 和 /api/admin 路由
  const isAdminRoute = pathname.startsWith("/admin");
  const isApiAdminRoute = pathname.startsWith("/api/admin");

  if (!isAdminRoute && !isApiAdminRoute) {
    return supabaseResponse;
  }

  // 登录页：直接放行
  if (pathname === "/admin/login") {
    // 如果已经有 admin_logged_in cookie，直接跳转 dashboard
    const adminLoggedIn = request.cookies.get("admin_logged_in")?.value;
    if (adminLoggedIn === "true") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // 其他 admin 路由：检查 admin_logged_in cookie
  const adminLoggedIn = request.cookies.get("admin_logged_in")?.value;
  if (adminLoggedIn !== "true") {
    // 未登录，跳转到登录页
    if (isApiAdminRoute) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // 已登录：检查管理员权限（双重验证）
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // 环境变量缺失，但 cookie 已验证，放行
      return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Session 过期，清除 admin cookie，跳转登录页
      supabaseResponse.cookies.set("admin_logged_in", "", { maxAge: 0, path: "/admin" });
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
      supabaseResponse.cookies.set("admin_logged_in", "", { maxAge: 0, path: "/admin" });
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 管理员验证通过，放行
    return supabaseResponse;
  } catch (err) {
    console.error("[Middleware] Error:", err);
    // 出错时也放行（因为已经有 admin_logged_in cookie）
    return supabaseResponse;
  }
}
