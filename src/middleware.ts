import { NextRequest, NextResponse } from "next/server";

/**
 * 全站前端门禁：除管理员（admin_logged_in=true cookie）外，
 * 所有客户面向页面重定向到后台登录页。
 *
 * 放行（不拦截）：
 *  - /admin/*            后台登录页与所有后台页面
 *  - /api/*              所有接口（含小程序接口、登录 API、支付回调）
 *  - /_next/*            构建产物（JS/CSS）
 *  - /simg /sapimg       图片代理（Supabase 存储转发）
 *  - /favicon.ico        站点图标
 *  - 带后缀的静态文件    .png/.css/.txt/.xml 等
 */
const ADMIN_COOKIE = "admin_logged_in";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/simg") ||
    pathname.startsWith("/sapimg") ||
    pathname === "/favicon.ico" ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isAdmin = req.cookies.get(ADMIN_COOKIE)?.value === "true";
  if (!isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
