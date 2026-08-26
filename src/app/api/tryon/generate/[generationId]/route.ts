// app/api/tryon/generate/[generationId]/route.ts
// 轮询通义百炼 aitryon 虚拟试衣任务状态（generationId 即通义 task_id）；
// 完成后自动把结果图转存到 Supabase 并做画质增强。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enhancePipeline } from "@/lib/tryon/enhance";
import { cropWatermark } from "@/lib/tryon/removeBg";

const DASHSCOPE_BASE = "https://dashscope.aliyuncs.com";
const BUCKET = "blocks-images";

// 转存 + 画质增强可能耗时较长，放宽函数超时
export const runtime = "nodejs";
export const maxDuration = 120;
export const memory = 2048;

// 简单内存缓存：避免每次轮询都重复转存/增强。Serverless 多实例不共享，但无害（会多转存几张）。
const resultCache = new Map<string, { resultUrl: string; createdAt: number }>();

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("存储服务未配置");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ generationId: string }> }) {
  try {
    const { generationId } = await params;
    if (!generationId) {
      return NextResponse.json({ error: "缺少任务ID" }, { status: 400 });
    }

    const cached = resultCache.get(generationId);
    if (cached && Date.now() - cached.createdAt < 1000 * 60 * 10) {
      return NextResponse.json({ ok: true, status: "COMPLETED", resultUrl: cached.resultUrl });
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "试衣服务未配置" }, { status: 500 });
    }

    const tRes = await fetch(`${DASHSCOPE_BASE}/api/v1/tasks/${generationId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const tData = await tRes.json().catch(() => ({}));
    const out = tData.output || {};
    const status = out.task_status || tData.task_status;

    if (status === "SUCCEEDED") {
      let resultUrl = out.image_url || out.results?.[0]?.url || "";
      if (!resultUrl) {
        return NextResponse.json({ error: "任务完成但未返回图片地址", status }, { status: 500 });
      }

      // 转存到自己的 Supabase（通义结果 URL 仅 24h 有效）
      try {
        const supabase = getSupabase();
        await supabase.storage.createBucket(BUCKET, { public: true });

        const imgRes = await fetch(resultUrl);
        if (imgRes.ok) {
          let imgBuf: Buffer = Buffer.from(await imgRes.arrayBuffer());
          // 去底部水印（兜底，通义通常不带，但保留无害）
          try {
            imgBuf = (await cropWatermark(imgBuf)) as Buffer;
          } catch (cwErr) {
            console.warn("[tryon/generate/poll] 去水印失败，回退原图", (cwErr as Error)?.message);
          }
          const outName = `tryon-result-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
          await supabase.storage.from(BUCKET).upload(outName, imgBuf, {
            contentType: "image/jpeg",
            upsert: false,
          });
          const { data: { publicUrl: finalUrl } } = supabase.storage.from(BUCKET).getPublicUrl(outName);
          resultUrl = finalUrl;

          // 自动画质修复（默认开启，env TRYON_AUTO_ENHANCE=false 可关；失败自动回退原图）
          if (process.env.TRYON_AUTO_ENHANCE !== "false") {
            try {
              const r = await enhancePipeline(imgBuf);
              const enName = `tryon-enhanced-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
              await supabase.storage.from(BUCKET).upload(enName, r.buffer, {
                contentType: "image/jpeg",
                upsert: false,
              });
              resultUrl = supabase.storage.from(BUCKET).getPublicUrl(enName).data.publicUrl;
              console.log("[tryon/generate/poll] 已自动画质增强");
            } catch (enErr) {
              console.warn("[tryon/generate/poll] 画质增强失败，回退原图", (enErr as Error)?.message);
            }
          }
        } else {
          console.warn("[tryon/generate/poll] 结果图转存失败，回退原始 URL", imgRes.status);
        }
      } catch (e) {
        console.warn("[tryon/generate/poll] 结果图转存异常，回退原始 URL", e);
      }

      resultCache.set(generationId, { resultUrl, createdAt: Date.now() });
      return NextResponse.json({ ok: true, status: "COMPLETED", resultUrl });
    }

    const FAILED_STATES = new Set(["FAILED", "CANCELED"]);
    if (FAILED_STATES.has(status)) {
      const raw = out.message || out.err_code || "";
      let msg = raw || `生成失败 [通义状态:${status}]`;
      const m = (raw || "").toLowerCase();
      if (m.includes("resolution") && m.includes("too low")) {
        msg = "图片分辨率过低，请上传更清晰的单品图（建议 1024×1024 以上）";
      } else if (m.includes("face") || m.includes("no person")) {
        msg = "未检测到人物，请上传正面、光线良好的半身/全身照";
      } else if (m.includes("garment")) {
        msg = "衣服图识别失败，请换一张平铺/挂拍的清晰单品图";
      }
      console.error("[tryon/generate/poll] 通义任务失败", generationId, status, out);
      return NextResponse.json({ error: msg, raw: out, status }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: status || "PENDING" });
  } catch (err: any) {
    console.error("[tryon/generate/poll] 异常", err);
    return NextResponse.json({ error: err.message || "轮询失败" }, { status: 500 });
  }
}
