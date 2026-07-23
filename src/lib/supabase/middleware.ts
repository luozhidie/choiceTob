import { NextRequest, NextResponse } from "next/server";

/**
 * 管理员预览/灰度模块：即使 SITE_LOCKED=false 也仅对 admin_logged_in 开放。
 * 按路由前缀匹配（例如 /style-test 会同时覆盖 /style-test/male、/style-test/female）。
 */
const ADMIN_PREVIEW_ROUTES = [
  "/courses",        // 线上课程
  "/daily-looks",    // 每日搭配
  "/magazine",       // 时尚资讯
  "/fashion-trends", // 时尚趋势（重定向到 magazine）
  "/style-test",     // 风格测试
  "/personal-image", // VIP形象服务
  "/wardrobe",       // VIP衣橱
  "/booking",        // 预约陪购
];

function isAdminPreviewRoute(pathname: string) {
  return ADMIN_PREVIEW_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

/**
 * 简化的中间件：
 * - /admin/*：独立 cookie（admin_logged_in）校验
 * - /api、/simg、/sapimg：始终放行（接口供小程序与后台使用；图片代理供小程序 <image> 加载，不能上锁）
 * - /coming-soon、/root.txt：始终放行
 * - 其余前台路由：内测锁开启时仅管理员（admin_logged_in cookie）可见，否则跳转 /coming-soon
 * - 即使全站开放（SITE_LOCKED=false），以下模块仍仅管理员可见，便于运营方先积攒内容再放出：
 *     线上课程 /courses、每日搭配 /daily-looks、时尚资讯 /magazine、时尚趋势 /fashion-trends、
 *     风格测试 /style-test、VIP形象服务 /personal-image、VIP衣橱 /wardrobe、预约陪购 /booking
 *
 * 内测锁由环境变量 SITE_LOCKED 控制：
 *   - 未设置 / "true" → 锁定（仅管理员可见）
 *   - "false" → 全站开放（但上述模块仍受管理员可见限制）
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

  // 内测锁 + 管理员预览模块：两者都依赖 admin_logged_in cookie
  const siteLocked = (process.env.SITE_LOCKED || "true") !== "false";
  const adminCookie = request.cookies.get("admin_logged_in")?.value === "true";

  if (!adminCookie && (siteLocked || isAdminPreviewRoute(pathname))) {
    return NextResponse.redirect(new URL("/coming-soon", request.url));
  }

  return NextResponse.next();
}
