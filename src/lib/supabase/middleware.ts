import { NextRequest, NextResponse } from "next/server";

/**
 * 简化的中间件：
 * - /admin/*：独立 cookie（admin_logged_in）校验
 * - /api、/simg、/sapimg：始终放行（接口供小程序与后台使用；图片代理供小程序 <image> 加载，不能上锁）
 * - /coming-soon、/root.txt：始终放行
 * - 其余前台路由：内测锁开启时仅管理员（admin_logged_in cookie）可见，否则跳转 /coming-soon
 *
 * 内测锁由环境变量 SITE_LOCKED 控制：
 *   - 未设置 / "true" → 锁定（仅管理员可见）
 *   - "false" → 全站开放（运营成熟后逐一放出功能时设置）
 */
export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isAdmin = pathname.startsWith("/admin");
  const isApi = pathname.startsWith("/api");
  const isImgProxy = pathname.startsWith("/simg") || pathname.startsWith("/sapimg");
  const isComingSoon = pathname === "/coming-soon";
  const isRootTxt = pathname === "/root.txt";

  // admin 区：独立 cookie 校验（保持原逻辑）
  if (isAdmin) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }
    const adminCookie = request.cookies.get("admin_logged_in");
    if (adminCookie?.value !== "true") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // 接口 / 图片代理 / 占位页 / 验证文件：始终放行
  if (isApi || isImgProxy || isComingSoon || isRootTxt) {
    return NextResponse.next();
  }

  // 内测锁：电脑端网站前端默认仅管理员可见
  const siteLocked = (process.env.SITE_LOCKED || "true") !== "false";
  if (siteLocked) {
    const adminCookie = request.cookies.get("admin_logged_in");
    if (adminCookie?.value !== "true") {
      return NextResponse.redirect(new URL("/coming-soon", request.url));
    }
  }

  return NextResponse.next();
}
