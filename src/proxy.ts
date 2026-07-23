import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // 记录 root.txt 访问日志（淘宝验证用）
  if (request.nextUrl.pathname === "/root.txt") {
    console.log("[ROOT.TXT ACCESS] ==================================");
    console.log(`[ROOT.TXT] Method: ${request.method}`);
    console.log(`[ROOT.TXT] URL: ${request.url}`);
    console.log(`[ROOT.TXT] Protocol: ${request.nextUrl.protocol}`);
    console.log(`[ROOT.TXT] Host: ${request.headers.get("host")}`);
    console.log(`[ROOT.TXT] User-Agent: ${request.headers.get("user-agent")}`);
    console.log(`[ROOT.TXT] X-Forwarded-For: ${request.headers.get("x-forwarded-for")}`);
    console.log(`[ROOT.TXT] Accept: ${request.headers.get("accept")}`);
    console.log(`[ROOT.TXT] Time: ${new Date().toISOString()}`);
    console.log("[ROOT.TXT ACCESS] ==================================");
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
