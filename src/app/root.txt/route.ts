import { type NextRequest, NextResponse } from "next/server";

const ROOT_CONTENT = "ba7d09da4e2c3a0749ca086f47e29bc7";

export async function GET(req: NextRequest) {
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

  return new NextResponse(ROOT_CONTENT, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

export async function HEAD(req: NextRequest) {
  console.log("[ROOT.TXT HEAD] ==================================");
  console.log(`[ROOT.TXT] Method: ${req.method}`);
  console.log(`[ROOT.TXT] URL: ${req.url}`);
  console.log(`[ROOT.TXT] User-Agent: ${req.headers.get("user-agent")}`);
  console.log("[ROOT.TXT HEAD] ==================================");

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Length": String(new TextEncoder().encode(ROOT_CONTENT).length),
    },
  });
}
