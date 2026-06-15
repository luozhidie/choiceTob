import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// CSRF Token 配置
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

// 生成 CSRF Token
function generateCsrfToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 带超时的 Promise 包装
function withTimeout<T>(promise: Promise<T>, ms: number, defaultValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(defaultValue), ms)),
  ]);
}

// 检查是否需要 CSRF 保护
function needsCsrfProtection(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  return ["POST", "PUT", "DELETE", "PATCH"].includes(method);
}

// 验证 CSRF Token
function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}

// 速率限制配置（登录页面防暴力破解）
interface RateLimitEntry { count: number; resetAt: number; }
const RATE_LIMIT_STORE = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return request.ip || "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = RATE_LIMIT_STORE.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_STORE.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // 判断路由类型
  const isAdminRoute = pathname.startsWith("/admin");
  const isApiAdminRoute = pathname.startsWith("/api/admin");

  // 非 admin 路由直接放行
  if (!isAdminRoute && !isApiAdminRoute) {
    return supabaseResponse;
  }

  // 检查环境变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[Middleware] Supabase 环境变量缺失，跳过认证检查");
    return supabaseResponse;
  }

  // 登录页面 POST 速率限制
  const isLoginPost = isAdminRoute && pathname === "/admin/login" && request.method === "POST";
  if (isLoginPost) {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter || 300), "Content-Type": "application/json" } }
      );
    }
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

  // CSRF 保护（跳过 /api/admin 和登录页 POST）
  const isLoginPage = isAdminRoute && pathname === "/admin/login";
  if (needsCsrfProtection(request) && !isLoginPage && !isApiAdminRoute && !validateCsrfToken(request)) {
    return NextResponse.json({ error: "CSRF token validation failed" }, { status: 403 });
  }

  // 认证检查
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    });

    const { data: { user } } = await withTimeout(
      supabase.auth.getUser(),
      5000,
      { data: { user: null }, error: null }
    );

    // 登录页：已登录则跳转 dashboard，未登录则放行
    if (pathname === "/admin/login") {
      if (user) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return supabaseResponse;
    }

    // 未登录用户 → 跳转登录页
    if (!user) {
      if (isApiAdminRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // 管理员权限检查
    const ADMIN_EMAILS_FALLBACK = ["luozhidie@live.cn"];
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()).filter(Boolean) || ADMIN_EMAILS_FALLBACK;
    let isAdmin = adminEmails.includes(user.email || "");

    if (!isAdmin) {
      try {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
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
