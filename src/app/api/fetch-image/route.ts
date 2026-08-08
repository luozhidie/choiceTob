import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/fetch-image?url=<image-url>&format=base64
 * 代理获取外部图片，绕过 CORS 限制
 * 支持 format=base64 返回 base64 字符串（供 docx ImageRun 使用）
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const format = req.nextUrl.searchParams.get("format") || "blob";

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return new NextResponse("Invalid url", { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return new NextResponse(`Failed: ${res.status}`, { status: 502 });
    }

    const blob = await res.blob();
    const contentType = res.headers.get("content-type") || blob.type || "image/jpeg";

    if (format === "base64") {
      // 返回 base64 字符串
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      return new NextResponse(
        JSON.stringify({ base64, contentType }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
          },
        }
      );
    }

    // 默认返回 blob
    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err: any) {
    console.error("fetch-image error:", err.message);
    return new NextResponse(`Error: ${err.message || "timeout"}`, { status: 500 });
  }
}
