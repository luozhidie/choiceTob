// app/api/tryon/generate/route.ts
// 创建虚拟试衣任务（异步）。接收人像 URL + 单品(上装) URL，调用通义百炼 aitryon 创建异步任务，
// 返回 task_id 作为 generationId，由前端轮询 /api/tryon/generate/[generationId]。
import { NextRequest, NextResponse } from "next/server";

const DASHSCOPE_BASE = "https://dashscope.aliyuncs.com";

// 把本站 CDN（public/tryon-garments/）的相对路径补成绝对地址；把 /simg /sapimg 反写为 Supabase 原始 URL，
// 以便通义服务器可直连拉取图片。
function rewriteUrl(u: string): string {
  if (typeof u !== "string") return u;
  if (u.startsWith("/")) u = "https://colour-choice.art" + u;
  u = u.replace(/^https?:\/\/colour-choice\.art\/simg\//i, "https://fxeknwkmytzedkhplozn.supabase.co/");
  u = u.replace(/^https?:\/\/colour-choice\.art\/sapimg\//i, "https://fxeknwkmytzedkhplozn.supabase.co/");
  return u;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const personImageUrl = body.personImageUrl as string | undefined;
    const garmentImageUrl = body.garmentImageUrl as string | undefined;
    const productTitle = body.title || "风格测试衣";
    const userId = body.userId || "anonymous";

    if (!personImageUrl) {
      return NextResponse.json({ error: "缺少人像照片" }, { status: 400 });
    }
    if (!garmentImageUrl) {
      return NextResponse.json({ error: "缺少衣服图片" }, { status: 400 });
    }

    const personUrl = rewriteUrl(personImageUrl);
    const garmentUrl = rewriteUrl(garmentImageUrl);

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      console.error("[tryon/generate] 未配置 DASHSCOPE_API_KEY");
      return NextResponse.json({ error: "试衣服务未配置" }, { status: 500 });
    }

    // 调用通义百炼 aitryon 创建异步虚拟试衣任务（单件上装试穿，保留原脸与下半身）
    const createRes = await fetch(`${DASHSCOPE_BASE}/api/v1/services/aigc/image2image/image-synthesis`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-DashScope-Async": "enable",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "aitryon",
        input: {
          person_image_url: personUrl,
          top_garment_url: garmentUrl,
        },
        parameters: { resolution: -1, restore_face: true },
      }),
    });

    const createData = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      const msg = createData.message || createData.error || `试衣任务创建失败（${createRes.status}）`;
      console.error("[tryon/generate] 通义创建失败", createRes.status, createData);
      return NextResponse.json({ error: msg }, { status: createRes.status });
    }

    const generationId = createData.output?.task_id || createData.task_id;
    if (!generationId) {
      console.error("[tryon/generate] 通义未返回 task_id", createData);
      return NextResponse.json({ error: "试衣任务ID缺失" }, { status: 500 });
    }

    console.log("[tryon/generate] 通义任务已创建", generationId, "title=", productTitle, "user=", userId);
    return NextResponse.json({ ok: true, generationId, status: "PENDING" });
  } catch (err: any) {
    console.error("[tryon/generate] 异常", err);
    return NextResponse.json({ error: err.message || "试衣失败" }, { status: 500 });
  }
}
