// app/api/tryon/upload-person/route.ts
// 上传真人照并自动白底化，返回稳定 personImageUrl，供八大风格试穿测试复用
// （避免对同一个人像在 8 次试衣调用中重复抠图）。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { removeBackgroundToImage, detectMime } from "@/lib/tryon/removeBg";

const BUCKET = "blocks-images";
export const runtime = "nodejs";
export const maxDuration = 120;
export const memory = 2048;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const personFile = formData.get("personImage") as File | null;
    if (!personFile) {
      return NextResponse.json({ error: "缺少人像照片" }, { status: 400 });
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

    const bytes = await personFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    // 自动去背景转白底（失败回退原图，保证流程不中断）
    let uploadBuffer = buffer;
    try {
      const mime = personFile.type || detectMime(buffer);
      uploadBuffer = await removeBackgroundToImage(buffer, mime, { person: true });
      console.log("[upload-person] 人像已自动去背景转白底");
    } catch (e) {
      console.warn("[upload-person] 人像去背景失败，回退原图", (e as Error)?.message);
    }

    const ext = (personFile.name?.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
    const filename = `style-tryon-person-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${safeExt}`;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, uploadBuffer, {
      contentType: personFile.type || `image/${safeExt === "jpg" ? "jpeg" : safeExt}`,
      upsert: false,
    });
    if (upErr) {
      console.error("[upload-person] 上传人像失败", upErr);
      return NextResponse.json({ error: "上传人像失败：" + upErr.message }, { status: 500 });
    }

    const personImageUrl = supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
    return NextResponse.json({ ok: true, personImageUrl });
  } catch (err: any) {
    console.error("[upload-person] 异常", err);
    return NextResponse.json({ error: err.message || "上传失败" }, { status: 500 });
  }
}
