// app/api/tryon/upload-person-url/route.ts
// 根据已有图片 URL（如形象档案全身照）下载并自动白底化，返回 personImageUrl
// 供八大风格真人试穿复用，避免用户在 style-tryon 重复上传。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { removeBackgroundToImage, detectMime } from "@/lib/tryon/removeBg";

const BUCKET = "blocks-images";
export const runtime = "nodejs";
export const maxDuration = 120;
export const memory = 2048;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const imageUrl = body.imageUrl || body.url;
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "缺少图片地址 imageUrl" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "存储服务未配置" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await supabase.storage.createBucket(BUCKET, { public: true });

    // 下载原图
    const fetchRes = await fetch(imageUrl, { headers: { Accept: "image/*" } });
    if (!fetchRes.ok) {
      return NextResponse.json({ error: `下载图片失败：${fetchRes.status}` }, { status: 500 });
    }
    const arrayBuf = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    if (!buffer.length) {
      return NextResponse.json({ error: "图片内容为空" }, { status: 500 });
    }

    // 自动去背景转白底（失败回退原图）
    let uploadBuffer = buffer;
    try {
      const mime = fetchRes.headers.get("content-type") || detectMime(buffer);
      uploadBuffer = await removeBackgroundToImage(buffer, mime, { person: true });
      console.log("[upload-person-url] 人像已自动去背景转白底");
    } catch (e) {
      console.warn("[upload-person-url] 人像去背景失败，回退原图", (e as Error)?.message);
    }

    const ext = imageUrl.split("?")[0].split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
    const filename = `style-tryon-person-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${safeExt}`;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, uploadBuffer, {
      contentType: `image/${safeExt === "jpg" ? "jpeg" : safeExt}`,
      upsert: false,
    });
    if (upErr) {
      console.error("[upload-person-url] 上传人像失败", upErr);
      return NextResponse.json({ error: "上传人像失败：" + upErr.message }, { status: 500 });
    }

    const personImageUrl = supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
    return NextResponse.json({ ok: true, personImageUrl });
  } catch (err: any) {
    console.error("[upload-person-url] 异常", err);
    return NextResponse.json({ error: err.message || "处理失败" }, { status: 500 });
  }
}
