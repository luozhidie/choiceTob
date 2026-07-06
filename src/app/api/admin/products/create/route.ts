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
        specs?: string[];
        message?: string;
      }> = [];

      // 动态站点（JS 渲染 / 小程序链接）——服务端无法直接抓取，返回操作指引
      const dynamicSitePatterns = [
        /1688\.com\/offer\//,
        /1688\.com\/.+\/offer\//,
        /taobao\.com/i,
        /tmall\.com/i,
        /item\.jd\.com/i,
        /youzan\.com/i,
        /weidian\.com/i,
        /#小程序\/|#微信小程序\//,
      ];

      for (const u of urls.slice(0, 20)) {
        try {
          // 0. 动态站点拦截
          if (dynamicSitePatterns.some(p => p.test(u))) {
            results.push({
              url: u,
              status: "skipped",
              message: "该平台详情页为 JS 动态加载，服务端无法直接抓取。请改用「图片抓取」模式：在浏览器打开商品页 → 右键图片复制图片地址 → 粘贴图片URL；或在小程序端用「一键导入」走浏览器中转。",
            });
            continue;
          }

          // 1. 获取HTML
          const resp = await fetch(u, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml",
            },
            redirect: "follow",
          });
          const html = await resp.text();

          // 内容为空壳（JS 渲染站点漏网）判定
          const realContent = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          if (realContent.length < 30) {
            results.push({
              url: u,
              status: "skipped",
              message: "页面为纯 JS 渲染（无服务端 HTML），无法自动提取。请改用图片URL方式导入。",
            });
            continue;
          }

          // 2. 提取标题（OG / title / meta）
          const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i)
            || html.match(/name="og:title"\s+content="([^"]+)"/i);
          const titleMatch = ogTitle
            || html.match(/<title>([^<]+)<\/title>/i)
            || html.match(/itemprop="name"[^>]*content="([^"]+)"/i)
            || html.match(/class="d-title"[^>]*>([^<]+)/i);
          let title = titleMatch ? titleMatch[1].trim() : `导入商品_${Date.now()}`;
          title = title.replace(/[_\-|—].{0,20}$/, "").trim().slice(0, 120);

          // 3. 提取价格（JSON-LD / meta / 文本 ¥）
          let price = 0;
          const ldPrice = html.match(/"price"\s*:\s*"?(\d+(?:\.\d+)?)"?/i);
          const metaPrice = html.match(/property="(og:price:amount|product:price:amount)"\s+content="([^"]+)"/i)
            || html.match(/name="price"\s+content="([^"]+)"/i);
          const textPrice = html.match(/[¥￥]\s*(\d[\d,]*\.?\d*)/);
          const rawPrice = (metaPrice ? metaPrice[2] : (ldPrice ? ldPrice[1] : (textPrice ? textPrice[1] : null)));
          if (rawPrice) price = Math.round(parseFloat(rawPrice.toString().replace(/,/g, "")) * 100);

          // 4. 提取商品参数（specs）
          const specs: string[] = [];
          // 4.1 <meta> 描述/关键词作为补充
          const metaDesc = html.match(/name="description"\s+content="([^"]+)"/i);
          if (metaDesc && metaDesc[1].trim()) specs.push(metaDesc[1].trim().slice(0, 60));
          // 4.2 JSON-LD 里的 offers / additionalProperty
          const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
          if (ldMatch) {
            try {
              const ld = JSON.parse(ldMatch[1].replace(/&quot;/g, '"'));
              const leaf = Array.isArray(ld) ? ld[0] : ld;
              if (leaf?.additionalProperty) {
                for (const p of leaf.additionalProperty) {
                  if (p.name && p.value) specs.push(`${p.name}:${p.value}`);
                }
              }
            } catch {}
          }
          // 4.3 常见规格表格/列表
          const specRe = /(?:材质|面料|成分|含量|尺码|颜色|品牌|产地|重量|适用)[：:]\s*([^\n<>，,]{1,20})/g;
          let sm;
          while ((sm = specRe.exec(html)) !== null) {
            if (sm[1].trim()) specs.push(sm[1].trim());
          }
          const uniqueSpecs = [...new Set(specs)].slice(0, 10);

          // 5. 提取图片（OG / src / data-src）
          const ogImg = html.match(/property="og:image"\s+content="([^"]+)"/i);
          const images: string[] = [];
          if (ogImg) images.push(ogImg[1]);
          const imgRe = /<img[^>]+(?:src|data-src|data-original)="([^"]+)"/gi;
          let m;
          while ((m = imgRe.exec(html)) !== null) {
            let src = m[1];
            if (src.startsWith("//")) src = "https:" + src;
            if (src.startsWith("/")) src = new URL(src, u).href;
            if (src.startsWith("http") && !src.includes("icon") && !src.includes("logo") && !src.includes("avatar")) {
              images.push(src);
            }
          }
          const uniqueImages = [...new Set(images)]
            .filter(src => /\.(jpg|jpeg|png|webp)/i.test(src))
            .slice(0, 5);

          // 6. 下载图片到 Storage
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

          // 7. 创建商品（导入到「待分类」，并写入参数）
          const payload: any = {
            title,
            price,
            original_price: price,
            cover_image: uploadedImages[0] || null,
            images: JSON.stringify(uploadedImages),
            category: "待分类",
            is_published: true,
            stock: 0,
            tags: ["导入"],
            specs: uniqueSpecs.length > 0 ? JSON.stringify(uniqueSpecs) : null,
          };
          let { data, error: createError } = await supabase
            .from("products")
            .insert(payload)
            .select()
            .single();

          if (createError) {
            // fallback: 去掉可能不存在的列（specs）
            delete payload.specs;
            const { data: d2, error: e2 } = await supabase.from("products").insert(payload).select().single();
            if (d2) {
              data = d2;
              createError = null;
              if (e2) results.push({ url: u, status: "error", message: e2.message || "创建失败" });
            } else {
              results.push({ url: u, status: "error", message: e2?.message || "创建失败" });
              continue;
            }
          }
          if (data) {
            results.push({
              url: u,
              status: "success",
              productId: data.id,
              title: data.title,
              price: (data.price / 100).toString(),
              imageCount: uploadedImages.length,
              specs: uniqueSpecs,
            });
          }
        } catch (err: any) {
          results.push({ url: u, status: "error", message: err.message || "处理异常" });
        }
      }

      const successCount = results.filter(r => r.status === "success").length;
      const skippedCount = results.filter(r => r.status === "skipped").length;
      return NextResponse.json({
        success: successCount > 0,
        total: urls.length,
        success: successCount,
        skipped: skippedCount,
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
