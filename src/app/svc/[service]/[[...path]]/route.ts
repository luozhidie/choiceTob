import { NextRequest, NextResponse } from "next/server";

// 反向代理：把三个独立 Vercel 项目经主站域名（colour-choice.art）内嵌，
// 绕过国内对 *.vercel.app 的封锁。服务端抓取子应用内容并把绝对路径
// (/_next/、/api/、子应用域名) 改写为 /svc/<service>/...，iframe 走主站同域。
const ORIGINS: Record<string, string> = {
  collectible: "https://web3-collectible-luozhidies-projects.vercel.app",
  trace: "https://chain-trace-smoky.vercel.app",
  tryon: "https://embodied-ai-eight.vercel.app",
};

export const dynamic = "force-dynamic";

async function handler(req: NextRequest, ctx: { params: { service: string; path?: string[] } }) {
  const { service, path } = ctx.params;
  const origin = ORIGINS[service];
  if (!origin) return new NextResponse("unknown service", { status: 404 });

  const sub = (path || []).join("/");
  const target = origin + (sub ? "/" + sub : "") + (req.nextUrl.search || "");

  const upstreamRes = await fetch(target, {
    method: req.method,
    headers: {
      accept: req.headers.get("accept") || "*/*",
      "content-type": req.headers.get("content-type") || "application/json",
    },
    // GET 无 body；其余（如虚拟试衣 POST multipart）原样转发流
    body: req.method === "GET" ? undefined : req.body,
    // @ts-expect-error - duplex 在 Node 18+ 流式转发时需要
    duplex: req.method === "GET" ? undefined : "half",
  });

  const contentType = upstreamRes.headers.get("content-type") || "";
  const isText = /text\/html|application\/javascript|text\/css|application\/json|text\/plain/i.test(contentType);

  const headers = new Headers();
  headers.set("content-type", contentType);
  headers.set("cache-control", "no-store");

  if (!isText) {
    // 二进制（图片等）直接透传，不做文本改写
    return new NextResponse(upstreamRes.body, { status: upstreamRes.status, headers });
  }

  const body = await upstreamRes.text();
  const out = body
    .split(origin).join(`/svc/${service}`)
    .split("/_next/").join(`/svc/${service}/_next/`)
    .split("/api/").join(`/svc/${service}/api/`);

  return new NextResponse(out, { status: upstreamRes.status, headers });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
