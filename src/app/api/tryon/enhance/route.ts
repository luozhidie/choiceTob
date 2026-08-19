// app/api/tryon/enhance/route.ts
// 独立画质修复接口：接收 imageUrl（或上传文件），返回增强后的 Supabase 公共 URL。
// 用于前端"画质修复 / 人像增强"按钮手动触发或二次增强对比。
// 后端增强逻辑见 lib/tryon/enhance.ts（当前为 sharp 本地增强，零成本）。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enhanceBuffer, enhanceFaceViaAlibaba, ALIYUN_VISION_ENABLED } from "@/lib/tryon/enhance";

const BUCKET = "blocks-images";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const ct = request.headers.get("content-type") || "";
    let imageUrl = "";
    let file: File | null = null;
    if (ct.includes("application/json")) {
      const j = await request.json();
      imageUrl = j.imageUrl || "";
    } else {
      const form = await request.formData();
      imageUrl = (form.get("imageUrl") as string) || "";
      file = (form.get("image") as File) || null;
    }
    if (!imageUrl && !file) {
      return NextResponse.json({ error: "缺少图片" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "存储未配置" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await supabase.storage.createBucket(BUCKET, { public: true });

    let buffer: Buffer;
    if (file) {
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      const r = await fetch(imageUrl);
      if (!r.ok) return NextResponse.json({ error: "图片下载失败" }, { status: 400 });
      buffer = Buffer.from(await r.arrayBuffer());
    }

    // 先落盘原图拿公网 URL；配置了阿里云则优先 AI 人脸修复，否则本地 sharp 增强
    const srcName = `tryon-src-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
    await supabase.storage.from(BUCKET).upload(srcName, buffer, { contentType: "image/jpeg", upsert: false });
    const srcUrl = supabase.storage.from(BUCKET).getPublicUrl(srcName).data.publicUrl;

    const aiBuf = ALIYUN_VISION_ENABLED ? await enhanceFaceViaAlibaba(srcUrl) : null;
    const enhanced = aiBuf ?? (await enhanceBuffer(buffer, { scale: 2 }));

    const outName = `tryon-enhanced-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(outName, enhanced, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (error) {
      return NextResponse.json({ error: "转存失败：" + error.message }, { status: 500 });
    }
    const finalUrl = supabase.storage.from(BUCKET).getPublicUrl(outName).data.publicUrl;

    return NextResponse.json({
      ok: true,
      resultUrl: finalUrl,
      enhanced: true,
      ai: Boolean(aiBuf),
      debug: {
        enabled: ALIYUN_VISION_ENABLED,
        hasId: Boolean(process.env.ALIYUN_VISION_ACCESS_KEY_ID),
        hasSecret: Boolean(process.env.ALIYUN_VISION_ACCESS_KEY_SECRET),
      },
    });
  } catch (err: any) {
    console.error("[tryon/enhance] 异常", err);
    // 增强失败不影响原图：若传入的是 URL，回退返回原图，保证流程不中断
    return NextResponse.json({ ok: true, enhanced: false, error: err.message }, { status: 200 });
  }
}
