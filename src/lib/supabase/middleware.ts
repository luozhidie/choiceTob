import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

function generateCsrfToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function needsCsrfProtection(request: NextRequest): boolean {
  return ["POST", "PUT", "DELETE", "PATCH"].includes(request.method!.toUpperCase());
}

function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  return !!(cookieToken && headerToken && cookieToken === headerToken);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isApiAdminRoute = pathname.startsWith("/api/admin");

  if (!isAdminRoute && !isApiAdminRoute) {
    return supabaseResponse;
  }

  // CSRF Cookie
  let csrfToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    supabaseResponse.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
  }

  // CSRF 保护（跳过 /api/admin）
  const isLoginPage = pathname === "/admin/login";
  if (needsCsrfProtection(request) && !isLoginPage && !isApiAdminRoute) {
    if (!validateCsrfToken(request)) {
      return NextResponse.json({ error: "CSRF token validation failed" }, { status: 403 });
    }
  }

  // 认证检查
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("[Middleware] Supabase 环境变量缺失");
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

    const { data: { user }, error } = await supabase.auth.getUser();

    // 登录页
    if (pathname === "/admin/login") {
      if (user) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return supabaseResponse;
    }

    // 未登录
    if (!user) {
      if (isApiAdminRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // 管理员权限检查（同时检查服务端和客户端环境变量）
    const ADMIN_EMAILS_FALLBACK = ["luozhidie@live.cn"];
    const adminEmailsRaw = (
      process.env.ADMIN_EMAILS ||
      process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
      ""
    );
    const adminEmails = adminEmailsRaw.split(",").map(e => e.trim()).filter(Boolean) || ADMIN_EMAILS_FALLBACK;

    let isAdmin = adminEmails.includes(user.email || "");

    if (!isAdmin) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        isAdmin = profile?.role === "admin";
      } catch {}
    }

    if (!isAdmin) {
      if (isApiAdminRoute) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

  } catch (err) {
    console.error("[Middleware] Error:", err);
    if (isApiAdminRoute) {
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
    if (pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return supabaseResponse;
}
