import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

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
  
  if (!cookieToken || !headerToken) {
    return false;
  }
  
  return cookieToken === headerToken;
}

// 速率限制配置（登录页面防暴力破解）
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_STORE = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
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
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  entry.count++;
  return { allowed: true };
}

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [ip, entry] of RATE_LIMIT_STORE.entries()) {
    if (now > entry.resetAt) {
      RATE_LIMIT_STORE.delete(ip);
    }
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // 步骤0：速率限制检查（仅登录页面 POST）
  const pathname = request.nextUrl.pathname;
  const isLoginPost = pathname === "/admin/login" && request.method === "POST";
  
  if (isLoginPost) {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp);
    
    if (!rateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests", message: "Rate limit exceeded" }),
        { 
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfter || 300),
            "Content-Type": "application/json",
          }
        }
      );
    }
    
    // 定期清理过期条目
    if (Math.random() < 0.01) {
      cleanupRateLimitStore();
    }
  }

  // 步骤1：确保所有请求都有 CSRF Cookie
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

  // 只有 /admin 和 /api/admin 路由需要认证检查
  const isAdminRoute = pathname.startsWith("/admin");
  const isApiAdminRoute = pathname.startsWith("/api/admin");
  
  if (!isAdminRoute && !isApiAdminRoute) {
    return supabaseResponse;
  }

  // 步骤2：对 admin 路由进行 CSRF 保护（跳过 /api/admin，因为已有 Supabase auth + 管理员邮箱双重保护）
  const isLoginPage = isAdminRoute && pathname === "/admin/login";

  if (needsCsrfProtection(request) && !isLoginPage && !isApiAdminRoute) {
    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        { error: "CSRF token validation failed" },
        { status: 403 }
      );
    }
  }
  
  // 步骤3：认证检查
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await withTimeout(
      supabase.auth.getUser(),
      5000,
      { data: { user: null }, error: null }
    );

    // 登录页 /admin/login
    if (isAdminRoute && pathname === "/admin/login") {
      if (user) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/dashboard";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    // 未登录用户
    if (!user) {
      if (isApiAdminRoute) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      } else {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        return NextResponse.redirect(url);
      }
    }

    // 检查管理员权限
    // 优先使用环境变量，兜底使用硬编码管理员列表
    const ADMIN_EMAILS_FALLBACK = ["luozhidie@live.cn"];
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()).filter(Boolean) || ADMIN_EMAILS_FALLBACK;

    let isAdmin = false;

    if (adminEmails.length > 0) {
      isAdmin = adminEmails.includes(user.email || "");
    }

    // 如果邮箱列表匹配失败，再查 profiles 表
    if (!isAdmin) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        isAdmin = profile?.role === "admin";
      } catch (err) {
        console.error("[Middleware] Failed to fetch profile:", err);
      }
    }
    
    if (!isAdmin) {
      if (isApiAdminRoute) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      } else {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  } catch (err) {
    console.error("[Middleware] Error:", err);
    if (isApiAdminRoute) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    } else if (isAdminRoute && pathname !== "/admin/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }
  
  return supabaseResponse;
}
