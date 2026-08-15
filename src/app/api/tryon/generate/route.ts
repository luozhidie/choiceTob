// app/api/tryon/generate/route.ts
// 直连 Genlook 官方 API 生成虚拟试衣图（异步轮询模式）。
// 接收 multipart/form-data（兼容小程序 look-studio 与 shop 两端的旧 form 字段）。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { removeBackgroundToImage, detectMime } from "@/lib/tryon/removeBg";

const GENLOOK_BASE = "https://api.genlook.app";
const BUCKET = "blocks-images";

// Genlook 试衣通常需要 10~60s，抠图另需数秒~数十秒（含模型冷启动），放宽函数超时与内存。
export const runtime = "nodejs";
export const maxDuration = 120;
export const memory = 2048;

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
    const formData = await request.formData();
    const personFile = formData.get("personImage") as File | null;
    const personImageUrl = formData.get("personImageUrl") as string | null;
    const productsRaw = formData.get("products") as string | null;
    const garmentImageUrl = formData.get("garmentImageUrl") as string | null;
    const garmentFile = formData.get("garmentImage") as File | null;
    const userId = (formData.get("userId") as string | null) || "anonymous";

    if (!personFile && !personImageUrl) {
      return NextResponse.json({ error: "缺少人像照片" }, { status: 400 });
    }

    // Genlook 当前仅支持单品（maxItems: 1），取第一件即可
    let productUrl: string | undefined;
    let productTitle = "单品";

    if (productsRaw) {
      let products: any[];
      try {
        products = JSON.parse(productsRaw);
      } catch {
        return NextResponse.json({ error: "商品信息格式错误" }, { status: 400 });
      }
      if (!Array.isArray(products) || products.length === 0) {
        return NextResponse.json({ error: "至少需要一件商品" }, { status: 400 });
      }
      productUrl = products[0]?.url;
      if (products[0]?.title) productTitle = products[0].title;
    }

    // 注：garmentImageUrl / garmentFile 的最终解析在 supabase 就绪后处理（见下方）

    const apiKey = process.env.GENLOOK_API_KEY;
    if (!apiKey) {
      console.error("[tryon/generate] 未配置 GENLOOK_API_KEY");
      return NextResponse.json({ error: "试衣服务未配置" }, { status: 500 });
    }

    // 1. 解析人像 URL：叠加模式直接复用上一次试衣结果图，首件则上传真人照到 Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "存储服务未配置" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await supabase.storage.createBucket(BUCKET, { public: true });

    let personUrl: string;
    if (personImageUrl) {
      // 叠加模式：直接用上一件试衣的结果图作为本次基底人像
      personUrl = personImageUrl;
    } else {
      const bytes = await personFile!.arrayBuffer();
      const buffer = Buffer.from(bytes);
      // 自动去背景：人像保留透明（抠图失败则回退原图，保证流程不中断）
      let uploadBuffer = buffer;
      try {
        const mime = personFile!.type || detectMime(buffer);
        uploadBuffer = await removeBackgroundToImage(buffer, mime, { person: true });
        console.log("[tryon/generate] 人像已自动去背景");
      } catch (e) {
        console.warn("[tryon/generate] 人像去背景失败，回退原图", (e as Error)?.message);
      }
      const ext = (personFile!.name?.split(".").pop() || "jpg").toLowerCase();
      const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
      const filename = `tryon-person-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${safeExt}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, uploadBuffer, {
        contentType: personFile!.type || `image/${safeExt === "jpg" ? "jpeg" : safeExt}`,
        upsert: false,
      });

      if (upErr) {
        console.error("[tryon/generate] 上传人像失败", upErr);
        return NextResponse.json({ error: "上传人像失败：" + upErr.message }, { status: 500 });
      }

      personUrl = supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
    }

    // 2.0 解析并自动白底化单品图：优先 garmentFile，其次 garmentImageUrl，再其次 products[0].url
    // 统一先拿到 Buffer，再跑抠图转白底，最后上传 Supabase 得到 productUrl
    let garmentBuffer: Buffer | null = null;
    let garmentMime = "image/jpeg";
    if (garmentFile) {
      garmentBuffer = Buffer.from(await garmentFile.arrayBuffer());
      garmentMime = garmentFile.type || detectMime(garmentBuffer);
    } else if (garmentImageUrl) {
      const r = await fetch(garmentImageUrl);
      if (!r.ok) return NextResponse.json({ error: "单品图下载失败" }, { status: 400 });
      garmentBuffer = Buffer.from(await r.arrayBuffer());
      garmentMime = r.headers.get("content-type") || detectMime(garmentBuffer);
    } else if (productUrl) {
      // products[0].url（远程商品图）：下载后同样自动白底化
      const r = await fetch(productUrl);
      if (!r.ok) return NextResponse.json({ error: "商品图下载失败" }, { status: 400 });
      garmentBuffer = Buffer.from(await r.arrayBuffer());
      garmentMime = r.headers.get("content-type") || detectMime(garmentBuffer);
    }
    if (garmentBuffer) {
      let whiteBuf = garmentBuffer;
      try {
        whiteBuf = await removeBackgroundToImage(garmentBuffer, garmentMime);
        console.log("[tryon/generate] 单品已自动去背景转白底");
      } catch (e) {
        console.warn("[tryon/generate] 单品去背景失败，回退原图", (e as Error)?.message);
      }
      const gname = `tryon-garment-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
      const { error: gErr } = await supabase.storage.from(BUCKET).upload(gname, whiteBuf, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (gErr) {
        console.error("[tryon/generate] 上传单品图失败", gErr);
        return NextResponse.json({ error: "上传单品图失败：" + gErr.message }, { status: 500 });
      }
      productUrl = supabase.storage.from(BUCKET).getPublicUrl(gname).data.publicUrl;
    }
    if (!productUrl) {
      return NextResponse.json({ error: "缺少衣服图片" }, { status: 400 });
    }

    // 2. 创建 Genlook 试衣任务（异步）
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
            images: [{ source: { url: productUrl } }],
          },
        ],
        person: { image: { source: { url: personUrl } } },
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

    // 3. 轮询任务状态直到完成（放宽到 40 次 × 3s = 120s，给 Genlook 充足处理时间）
    let resultUrl = "";
    const FAILED_STATES = new Set(["FAILED", "ERROR", "CANCELED"]);
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const gRes = await fetch(`${GENLOOK_BASE}/tryon/v1/generations/${generationId}`, {
        headers: { "x-api-key": apiKey },
      });
      const gData = await gRes.json().catch(() => ({}));
      const st = gData.status;
      if (st === "COMPLETED") {
        resultUrl = gData.resultImageUrl || "";
        break;
      }
      if (FAILED_STATES.has(st)) {
        const raw = gData.message || gData.error || "";
        const statusHint = ` [Genlook状态:${st}]`;
        const diag = `\n已发送 人像:${personUrl}\n已发送 单品:${productUrl}`;
        const msg = translateError(raw || `试衣生成失败${statusHint}`) + (raw ? statusHint : "") + diag;
        console.error("[tryon/generate] Genlook 任务失败", generationId, st, gData);
        return NextResponse.json({ error: msg, raw: gData, generationId, personUrl, productUrl }, { status: 500 });
      }
    }

    if (!resultUrl) {
      console.error("[tryon/generate] 试衣生成超时", generationId);
      return NextResponse.json({ error: "试衣生成超时，请重试" }, { status: 504 });
    }

    // 4. 把结果图转存到自己的 Supabase（Genlook 返回的签名 URL 仅 7 天有效）
    try {
      const imgRes = await fetch(resultUrl);
      if (imgRes.ok) {
        const imgBuf = Buffer.from(await imgRes.arrayBuffer());
        const outName = `tryon-result-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
        await supabase.storage.from(BUCKET).upload(outName, imgBuf, {
          contentType: "image/jpeg",
          upsert: false,
        });
        const { data: { publicUrl: finalUrl } } = supabase.storage.from(BUCKET).getPublicUrl(outName);
        resultUrl = finalUrl;
      } else {
        console.warn("[tryon/generate] 结果图转存失败，回退原始 URL", imgRes.status);
      }
    } catch (e) {
      console.warn("[tryon/generate] 结果图转存异常，回退原始 URL", e);
    }

    return NextResponse.json({ ok: true, resultUrl, credits: 1 });
  } catch (err: any) {
    console.error("[tryon/generate] 异常", err);
    return NextResponse.json({ error: err.message || "试衣失败" }, { status: 500 });
  }
}
