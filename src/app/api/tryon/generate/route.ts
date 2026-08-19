// app/api/tryon/generate/route.ts
// 创建虚拟试衣任务（异步）。接收人像 URL + 单品 URL，立即返回 generationId，由前端轮询 /api/tryon/generate/[generationId]。
import { NextRequest, NextResponse } from "next/server";

const GENLOOK_BASE = "https://api.genlook.app";

function translateError(msg: string): string {
  if (!msg) return "试衣失败";
  const m = msg.toLowerCase();
  if (m.includes("resolution") && m.includes("too low")) {
    return "图片分辨率过低，请上传更清晰的单品图（建议 1024×1024 以上）";
  }
  if (m.includes("face") || m.includes("no person") || m.includes("person not found")) {
    return "未检测到人物，请上传正面、光线良好的半身/全身照";
  }
  if (m.includes("garment")) {
    return "衣服图识别失败，请换一张平铺/挂拍的清晰单品图";
  }
  return msg;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const personImageUrl = body.personImageUrl as string | undefined;
    const garmentImageUrl = body.garmentImageUrl as string | undefined;
    const productTitle = body.title || "单品";
    const userId = body.userId || "anonymous";

    if (!personImageUrl) {
      return NextResponse.json({ error: "缺少人像照片" }, { status: 400 });
    }
    if (!garmentImageUrl) {
      return NextResponse.json({ error: "缺少衣服图片" }, { status: 400 });
    }

    const apiKey = process.env.GENLOOK_API_KEY;
    if (!apiKey) {
      console.error("[tryon/generate] 未配置 GENLOOK_API_KEY");
      return NextResponse.json({ error: "试衣服务未配置" }, { status: 500 });
    }

    // 创建 Genlook 试衣任务
    const externalId = `prod-${Date.now()}`;
    const createRes = await fetch(`${GENLOOK_BASE}/tryon/v1/try-on`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        products: [
          {
            externalId,
            title: productTitle,
            images: [{ source: { url: garmentImageUrl } }],
          },
        ],
        person: { image: { source: { url: personImageUrl } } },
        externalUserId: userId,
        output: { watermark: false },
      }),
    });

    const createData = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      const raw = createData.message || createData.error || "";
      const statusHint = ` [状态码:${createRes.status}]`;
      const msg = translateError(raw || `试衣任务创建失败${statusHint}`) + (raw ? statusHint : "");
      console.error("[tryon/generate] Genlook 创建失败", createRes.status, createData);
      return NextResponse.json({ error: msg, raw: createData }, { status: createRes.status });
    }

    const generationId = createData.generationId;
    if (!generationId) {
      console.error("[tryon/generate] Genlook 未返回 generationId", createData);
      return NextResponse.json({ error: "试衣任务ID缺失" }, { status: 500 });
    }

    console.log("[tryon/generate] 任务已创建", generationId);
    return NextResponse.json({ ok: true, generationId, status: "PENDING" });
  } catch (err: any) {
    console.error("[tryon/generate] 异常", err);
    return NextResponse.json({ error: err.message || "试衣失败" }, { status: 500 });
  }
}
