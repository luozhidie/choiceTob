// app/api/tryon/generate/route.ts
// 直连 Genlook 官方 API 生成虚拟试衣图。
// 接收 multipart/form-data（兼容小程序 look-studio 与 shop 两端的旧 form 字段）。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GENLOOK_BASE = "https://api.genlook.app";
const BUCKET = "blocks-images";

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

    // 1. 把人像照片上传到 Supabase，拿到公开 URL
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

    // 2. 调 Genlook 试衣接口
    const externalId = `prod-${Date.now()}`;
    const genlookRes = await fetch(`${GENLOOK_BASE}/tryon/v1/try-on`, {
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
      }),
    });

    const genlookData = await genlookRes.json().catch(() => ({}));

    if (!genlookRes.ok) {
      const msg = genlookData.message || genlookData.error || `试衣生成失败（${genlookRes.status}）`;
      console.error("[tryon/generate] Genlook 错误", genlookRes.status, genlookData);
      return NextResponse.json({ error: msg }, { status: genlookRes.status });
    }

    // Genlook 成功响应的字段名可能是 resultUrl / url / imageUrl / outputUrl
    const resultUrl =
      genlookData.resultUrl ||
      genlookData.url ||
      genlookData.imageUrl ||
      genlookData.outputUrl ||
      genlookData.image?.url ||
      "";

    if (!resultUrl) {
      console.error("[tryon/generate] Genlook 返回中无结果图", genlookData);
      return NextResponse.json({ error: "试衣结果图缺失" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, resultUrl, credits: 1 });
  } catch (err: any) {
    console.error("[tryon/generate] 异常", err);
    return NextResponse.json({ error: err.message || "试衣失败" }, { status: 500 });
  }
}
