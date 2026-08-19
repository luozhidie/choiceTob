import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UPSTREAM = "https://lzdchoice.supabase.co";

export async function GET(request: NextRequest, { params }: { params: { path?: string[] } }) {
  const segments = params.path || [];
  const upstreamPath = segments.join("/");
  const search = request.nextUrl.search;
  const target = `${UPSTREAM}/${upstreamPath}${search}`;

  try {
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const upstreamRes = await fetch(target, {
      method: "GET",
      headers: {
        accept: request.headers.get("accept") || "image/webp,image/apng,image/*,*/*;q=0.8",
        ...(apiKey ? { apikey: apiKey, Authorization: `Bearer ${apiKey}` } : {}),
      },
      redirect: "follow",
    });

    const headers = new Headers();
    [
      "content-type",
      "content-length",
      "cache-control",
      "expires",
      "etag",
      "last-modified",
      "content-disposition",
    ].forEach((key) => {
      const value = upstreamRes.headers.get(key);
      if (value) headers.set(key, value);
    });

    headers.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers,
    });
  } catch (err: any) {
    console.error("[sapimg proxy]", target, err?.message || err);
    return new NextResponse("Image proxy error", { status: 502 });
  }
}
