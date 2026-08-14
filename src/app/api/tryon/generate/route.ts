// app/api/tryon/generate/route.ts
// 直连 Genlook 官方 API 生成虚拟试衣图（异步轮询模式）。
// 接收 multipart/form-data（兼容小程序 look-studio 与 shop 两端的旧 form 字段）。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GENLOOK_BASE = "https://api.genlook.app";
const BUCKET = "blocks-images";

// Genlook 试衣通常需要 10~60s，放宽函数超时。
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const personFile = formData.get("personImage") as File | null;
    const productsRaw = formData.get("products") as string | null;
    const garmentImageUrl = formData.get("garmentImageUrl") as string | null;
    const userId = (formData.get("userId") as string | null) || "anonymous";

    if (!personFile) {
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
    } else if (garmentImageUrl) {
      productUrl = garmentImageUrl;
    }

    if (!productUrl) {
      return NextResponse.json({ error: "缺少衣服图片" }, { status: 400 });
    }

    const apiKey = process.env.GENLOOK_API_KEY;
    if (!apiKey) {
      console.error("[tryon/generate] 未配置 GENLOOK_API_KEY");
      return NextResponse.json({ error: "试衣服务未配置" }, { status: 500 });
    }

    // 1. 把人像照片上传到 Supabase，拿到公开 URL（供 Genlook 拉取）
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
    const ext = (personFile.name?.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
    const filename = `tryon-person-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${safeExt}`;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
      contentType: personFile.type || `image/${safeExt === "jpg" ? "jpeg" : safeExt}`,
      upsert: false,
    });

    if (upErr) {
      console.error("[tryon/generate] 上传人像失败", upErr);
      return NextResponse.json({ error: "上传人像失败：" + upErr.message }, { status: 500 });
    }

    const { data: { publicUrl: personUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename);

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
        output: { watermark: true },
      }),
    });

    const createData = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      const msg = createData.message || createData.error || `试衣任务创建失败（${createRes.status}）`;
      console.error("[tryon/generate] Genlook 创建失败", createRes.status, createData);
      return NextResponse.json({ error: msg }, { status: createRes.status });
    }

    const generationId = createData.generationId;
    if (!generationId) {
      console.error("[tryon/generate] Genlook 未返回 generationId", createData);
      return NextResponse.json({ error: "试衣任务ID缺失" }, { status: 500 });
    }

    // 3. 轮询任务状态直到完成
    let resultUrl = "";
    const FAILED_STATES = new Set(["FAILED", "ERROR", "CANCELED"]);
    for (let i = 0; i < 24; i++) {
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
        const msg = gData.message || gData.error || "试衣生成失败";
        console.error("[tryon/generate] Genlook 任务失败", st, gData);
        return NextResponse.json({ error: msg }, { status: 500 });
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
