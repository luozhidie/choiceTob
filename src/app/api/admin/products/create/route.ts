// 后端创建商品API（增加?action=import 支持多平台商品一键导入）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    // ===== 导入模式：接收商品页URL，自动抓取+创建 =====
    if (action === "import") {
      const { urls } = await request.json();
      if (!Array.isArray(urls) || urls.length === 0) {
        return NextResponse.json({ error: "请提供 urls 数组" }, { status: 400 });
      }

      const results: Array<{
        url: string;
        status: "success" | "error" | "skipped";
        productId?: string;
        title?: string;
        price?: string;
        imageCount?: number;
        message?: string;
      }> = [];

      for (const u of urls.slice(0, 20)) {
        try {
          // 1. 获取HTML
          const resp = await fetch(u, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0)" },
            redirect: "follow",
          });
          const html = await resp.text();

          // 2. 提取标题
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
            || html.match(/itemprop="name"[^>]*content="([^"]+)"/i)
            || html.match(/class="d-title"[^>]*>([^<]+)/i);
          const title = titleMatch ? titleMatch[1].trim() : `导入商品_${Date.now()}`;

          // 3. 提取价格
          const priceMatch = html.match(/[¥￥]\s*(\d[\d,]*\.?\d*)/)
            || html.match(/"price"\s*:\s*"(\d+)"/i);
          const price = priceMatch ? Math.round(parseFloat(priceMatch[1].replace(/,/g, "")) * 100) : 0;

          // 4. 提取图片
          const imgRe = /<img[^>]+(?:src|data-src|data-original)="([^"]+)"/gi;
          const images: string[] = [];
          let m;
          while ((m = imgRe.exec(html)) !== null) {
            let src = m[1];
            if (src.startsWith("//")) src = "https:" + src;
            if (src.startsWith("/")) src = new URL(src, u).href;
            if (src.startsWith("http") && !src.includes("icon") && !src.includes("logo")) {
              images.push(src);
            }
          }
          // 去重+最多5张
          const uniqueImages = [...new Set(images)].slice(0, 5);

          // 5. 下载图片到 Storage
          const uploadedImages: string[] = [];
          for (const imgUrl of uniqueImages) {
            try {
              const imgResp = await fetch(imgUrl);
              const buf = await imgResp.arrayBuffer();
              const ext = imgUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
              const filename = `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
              const { data, error } = await supabase.storage
                .from("products")
                .upload(filename, buf, { contentType: `image/${ext}`, upsert: false });
              if (!error && data) {
                const { data: pub } = supabase.storage.from("products").getPublicUrl(data.path);
                if (pub?.publicUrl) uploadedImages.push(pub.publicUrl);
              }
            } catch {}
          }

          // 6. 创建商品
          const payload: any = {
            title,
            price,
            original_price: price,
            cover_image: uploadedImages[0] || null,
            images: JSON.stringify(uploadedImages),
            category: "",
            is_published: true,
            stock: 0,
            tags: ["导入"],
          };
          const { data, error: createError } = await supabase
            .from("products")
            .insert(payload)
            .select()
            .single();

          if (createError) {
            // fallback: 去掉可能不存在的列
            delete payload.wholesale_price;
            const { data: d2, error: e2 } = await supabase.from("products").insert(payload).select().single();
            if (d2) {
              results.push({ url: u, status: "success", productId: d2.id, title: d2.title, price: (d2.price / 100).toString(), imageCount: uploadedImages.length });
            } else {
              results.push({ url: u, status: "error", message: e2?.message || "创建失败" });
            }
          } else {
            results.push({ url: u, status: "success", productId: data.id, title: data.title, price: (data.price / 100).toString(), imageCount: uploadedImages.length });
          }
        } catch (err: any) {
          results.push({ url: u, status: "error", message: err.message || "处理异常" });
        }
      }

      const successCount = results.filter(r => r.status === "success").length;
      return NextResponse.json({
        success: successCount > 0,
        total: urls.length,
        success: successCount,
        results,
      });
    }

    // ===== 普通创建模式 =====
    const payload = await request.json();
    if (!payload.title || !payload.price) {
      return NextResponse.json({ error: "缺少必填字段：标题和价格" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error) {
      // fallback
      delete payload.wholesale_price;
      const { data: d2, error: e2 } = await supabase.from("products").insert(payload).select().single();
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
      return NextResponse.json({ success: true, product: d2 });
    }
    return NextResponse.json({ success: true, product: data });
  } catch (error: any) {
    console.error("[创建商品API错误]", error);
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
