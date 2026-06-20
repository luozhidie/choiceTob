import { NextRequest, NextResponse } from "next/server";

/**
 * 简化的中间件：
 * - 非 admin 路由：直接放行
 * - /admin/login：直接放行（让页面自己处理）
 * - 其他 /admin/*：只检查 admin_logged_in cookie
 *
 * 不再做 Supabase session 双重验证（因为 admin 登录用的是独立 cookie）。
 * 安全性由 /api/admin/login API 保证（已验证密码 + httpOnly cookie）。
 */
export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 非 admin 路由直接放行
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next({ request });
  }

  // 所有 /admin/* 路由都检查 admin_logged_in cookie
  const adminCookie = request.cookies.get("admin_logged_in");
  if (adminCookie?.value !== "true") {
    // 未登录 → 重定向到登录页
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // 已登录 → 直接放行（不做额外 Supabase 验证）
  return NextResponse.next({ request });
}
