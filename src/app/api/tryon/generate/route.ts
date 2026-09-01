// app/api/tryon/generate/route.ts
// 创建虚拟试衣任务（异步）。接收人像 URL + 单品 URL，立即返回 generationId，由前端轮询 /api/tryon/generate/[generationId]。
// 引擎：阿里云百炼 · 通义（aitryon / OutfitAnyone），与 /api/tryon/outfit 同源。
import { NextRequest, NextResponse } from "next/server";

const DASHSCOPE_BASE = "https://dashscope.aliyuncs.com";

// 阿里云在国内服务器直连图片源更稳；把本站代理域名反写为 Supabase 原始公共 URL，
// 这样前端/网站端无需关心图片源，只管传可能已被代理改写过的 URL 即可。
function reverseProxy(u: string): string {
  if (typeof u !== "string") return u;
  // 本站自身 CDN（public/tryon-garments/）的图，保留绝对地址直连即可
  if (u.startsWith("/")) u = "https://colour-choice.art" + u;
  u = u.replace(/^https?:\/\/colour-choice\.art\/simg\//i, "https://fxeknwkmytzedkhplozn.supabase.co/");
  u = u.replace(/^https?:\/\/colour-choice\.art\/sapimg\//i, "https://fxeknwkmytzedkhplozn.supabase.co/");
  return u;
}

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
  if (m.includes("url") && (m.includes("invalid") || m.includes("download") || m.includes("access"))) {
    return "图片地址无法访问，请重新上传人物照与单品图";
  }
  return msg;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const personImageUrl = body.personImageUrl as string | undefined;
    const garmentImageUrl = body.garmentImageUrl as string | undefined;
    // bottom = 下装（裤/裙），其余按上装处理
    const slot = body.slot === "bottom" ? "bottom" : "top";
    const bottomImageUrl = body.bottomImageUrl as string | undefined;

    if (!personImageUrl) {
      return NextResponse.json({ error: "缺少人像照片" }, { status: 400 });
    }
    if (!garmentImageUrl && !bottomImageUrl) {
      return NextResponse.json({ error: "缺少衣服图片" }, { status: 400 });
    }

    // 反写为 Supabase 原始公共 URL，确保阿里云服务器可直连拉取
    const personUrl = reverseProxy(personImageUrl);
    const topUrl = garmentImageUrl ? reverseProxy(garmentImageUrl) : "";
    const botUrl = bottomImageUrl ? reverseProxy(bottomImageUrl) : "";

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      console.error("[tryon/generate] 未配置 DASHSCOPE_API_KEY");
      return NextResponse.json({ error: "试衣服务未配置" }, { status: 500 });
    }

    const input: Record<string, string> = { person_image_url: personUrl };
    if (slot === "bottom") {
      input.bottom_garment_url = botUrl || topUrl;
    } else {
      input.top_garment_url = topUrl;
      if (botUrl) input.bottom_garment_url = botUrl;
    }

    const createRes = await fetch(`${DASHSCOPE_BASE}/api/v1/services/aigc/image2image/image-synthesis`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-DashScope-Async": "enable",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "aitryon",
        input,
        parameters: { resolution: -1, restore_face: true },
      }),
    });

    const createData = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      const raw = createData.message || createData.error?.message || createData.error || "";
      const statusHint = ` [状态码:${createRes.status}]`;
      const msg = translateError(raw || `试衣任务创建失败${statusHint}`) + (raw ? statusHint : "");
      console.error("[tryon/generate] 通义创建失败", createRes.status, createData);
      return NextResponse.json({ error: msg, raw: createData }, { status: createRes.status });
    }

    const taskId = createData.output?.task_id || createData.task_id;
    if (!taskId) {
      console.error("[tryon/generate] 通义未返回 task_id", createData);
      return NextResponse.json({ error: "试衣任务ID缺失" }, { status: 500 });
    }

    console.log("[tryon/generate] 任务已创建", taskId);
    // generationId 直接复用通义 task_id，轮询端据此查询
    return NextResponse.json({ ok: true, generationId: taskId, status: "PENDING" });
  } catch (err: any) {
    console.error("[tryon/generate] 异常", err);
    return NextResponse.json({ error: err.message || "试衣失败" }, { status: 500 });
  }
}
