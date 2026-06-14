import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/root.txt") {
    console.log("[ROOT.TXT ACCESS] ==================================");
    console.log(`[ROOT.TXT] Method: ${req.method}`);
    console.log(`[ROOT.TXT] URL: ${req.url}`);
    console.log(`[ROOT.TXT] Protocol: ${req.nextUrl.protocol}`);
    console.log(`[ROOT.TXT] Host: ${req.headers.get("host")}`);
    console.log(`[ROOT.TXT] User-Agent: ${req.headers.get("user-agent")}`);
    console.log(`[ROOT.TXT] X-Forwarded-For: ${req.headers.get("x-forwarded-for")}`);
    console.log(`[ROOT.TXT] Accept: ${req.headers.get("accept")}`);
    console.log(`[ROOT.TXT] Time: ${new Date().toISOString()}`);
    console.log("[ROOT.TXT ACCESS] ==================================");
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/root.txt",
};
