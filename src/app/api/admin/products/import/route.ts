import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 模拟 puppeteer route 的抓取逻辑（复用已有函数）
// 由于已删除 puppeteer 依赖，改为纯 HTTP 抓取
// 1688 等动态页面无法抓取，返回提示

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: "请提供 urls 数组" }, { status: 400 });
    }

    const results = [];
    for (const url of urls.slice(0, 20)) {
      try {
        const resp = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          redirect: "follow",
        });
        const html = await resp.text();

        // 提取标题
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
          || html.match(/itemprop=["']name["'][^>]*content=["']([^"']+)["']/i);
        const title = titleMatch ? titleMatch[1].trim() : "";

        // 提取图片（简化版）
        const imgRegex = /<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|webp))["']/gi;
        const images = [];
        let m;
        while ((m = imgRegex.exec(html)) !== null && images.length < 10) {
          images.push(m[1]);
        }

        // 下载图片到 Storage
        const uploadedImages = [];
        for (const imgUrl of images.slice(0, 5)) {
          try {
            const imgResp = await fetch(imgUrl);
            const buf = Buffer.from(await imgResp.arrayBuffer());
            const ext = imgUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
            const filename = `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { data, error } = await supabase.storage
              .from("products")
              .upload(filename, buf, { contentType: `image/${ext}`, upsert: false });
            if (!error && data) {
              const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(data.path);
              uploadedImages.push(publicUrl);
            }
          } catch {}
        }

        // 创建商品
        if (title || uploadedImages.length > 0) {
          const priceMatch = html.match(/[¥￥]\s*(\d+(\.\d+)?)/);
          const price = priceMatch ? Math.round(parseFloat(priceMatch[1]) * 100) : 0;

          const { data, error: createError } = await supabase
            .from("products")
            .insert({
              title: title || `导入商品_${Date.now()}`,
              price,
              original_price: price,
              cover_image: uploadedImages[0] || null,
              images: JSON.stringify(uploadedImages),
              category: "",
              is_published: true,
              stock: 0,
              tags: ["导入"],
            })
            .select()
            .single();

          if (!createError && data) {
            results.push({
              url,
              status: "success",
              productId: data.id,
              title: data.title,
              price: data.price ? (data.price / 100).toString() : "",
              imageCount: uploadedImages.length,
            });
          } else {
            results.push({ url, status: "error", message: createError?.message || "创建失败" });
          }
        } else {
          results.push({ url, status: "error", message: "未提取到标题或图片" });
        }
      } catch (err: any) {
        results.push({ url, status: "error", message: err.message || "处理异常" });
      }
    }

    return NextResponse.json({
      success: results.filter(r => r.status === "success").length > 0,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
