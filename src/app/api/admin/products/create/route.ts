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
        duplicate?: boolean;
        message?: string;
      }> = [];

      // ===== 去重辅助：拉取现有商品标题做相似度比对 =====
      const normalizeTitle = (t: string) =>
        (t || "")
          .toLowerCase()
          .replace(/[\s\-_|｜—,，.。·、×x*#@！!?？()（）\[\]【】"'"'`~]/g, "")
          .replace(/^(新款|现货|批发|厂家直销|2024|2025|2026|男|女|中性)/g, "");
      const existingTitles: string[] = [];
      try {
        const { data: ex } = await supabase.from("products").select("title").limit(2000);
        if (ex) ex.forEach((r: any) => { if (r.title) existingTitles.push(normalizeTitle(r.title)); });
      } catch {}
      const checkDuplicate = (title: string): boolean => {
        const n = normalizeTitle(title);
        if (!n || n.length < 4) return false;
        return existingTitles.some((t) => {
          if (Math.abs(t.length - n.length) > Math.max(6, n.length * 0.5)) return false;
          if (t.includes(n) || n.includes(t)) return true;
          // 简单编辑距离：允许少量字符差异
          let diff = 0;
          const minLen = Math.min(t.length, n.length);
          for (let i = 0; i < minLen; i++) if (t[i] !== n[i]) diff++;
          diff += Math.abs(t.length - n.length);
          return diff <= 3;
        });
      };

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

      // ===== 分支 A：JSON 数据导入（1688/淘宝提取脚本结果） =====
      // 支持格式：单个 JSON 对象 {…} / JSON 数组 […] / 多对象拼接
      const jsonItems: string[] = [];
      for (const s of urls) {
        if (typeof s !== "string") continue;
        const t = s.trim();
        if (t.startsWith("{")) {
          jsonItems.push(t);
        } else if (t.startsWith("[")) {
          // JSON 数组：拆分为多个对象项
          try {
            const arr = JSON.parse(t);
            if (Array.isArray(arr)) arr.forEach((o: any) => { if (o && typeof o === "object") jsonItems.push(JSON.stringify(o)); });
          } catch {}
        }
      }
      const urlOnlyItems = urls.filter(s => !(typeof s === "string" && (s.trim().startsWith("{") || s.trim().startsWith("["))));

      // 处理 JSON 数据项
      for (const raw of jsonItems) {
        try {
          const item = JSON.parse(raw);
          if (!item.title && !item.images?.length) {
            results.push({ url: raw.slice(0, 80) + "...", status: "error", message: "JSON 缺少标题或图片字段" });
            continue;
          }

          const title = (item.title || `导入商品_${Date.now()}`).toString().slice(0, 120);
          let price = 0;
          const rawPrice = item.price ? parseFloat(String(item.price).replace(/[^\d.]/g, "")) : NaN;
          if (!isNaN(rawPrice) && rawPrice > 0) price = Math.round(rawPrice * 100);

          const specs: string[] = [];
          if (item.specs) {
            if (Array.isArray(item.specs)) specs.push(...item.specs.map(s => String(s)));
            else if (typeof item.specs === "object") specs.push(...Object.entries(item.specs).map(([k, v]) => `${k}:${v}`));
          }
          if (item.description) specs.push(item.description.toString().slice(0, 60));

          let imageList: string[] = [];
          if (item.images && Array.isArray(item.images)) imageList = item.images;
          // 去重+过滤
          const uniqueImages = [...new Set(imageList)]
            .filter(src => typeof src === "string" && /\.(jpg|jpeg|png|webp|gif)/i.test(src))
            .slice(0, 10);

          // 下载图片到 Storage
          const uploadedImages: string[] = [];
          for (const imgUrl of uniqueImages) {
            try {
              const imgResp = await fetch(imgUrl, { headers: { Referer: new URL(imgUrl).origin } });
              const buf = await imgResp.arrayBuffer();
              const ext = imgUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
              const filename = `${item.platform || "import"}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
              const { data, error } = await supabase.storage.from("products").upload(filename, buf, { contentType: `image/${ext}`, upsert: false });
              if (!error && data) {
                const { data: pub } = supabase.storage.from("products").getPublicUrl(data.path);
                if (pub?.publicUrl) uploadedImages.push(pub.publicUrl);
              }
            } catch {}
          }

          // 创建商品
          const payload: any = {
            title,
            price,
            original_price: price,
            cover_image: uploadedImages[0] || null,
            images: JSON.stringify(uploadedImages),
            category: "待分类",
            is_published: true,
            stock: 0,
            tags: ["导入", item.platform || ""].filter(Boolean),
            specs: specs.length > 0 ? JSON.stringify(specs) : null,
          };
          let { data, error: createError } = await supabase.from("products").insert(payload).select().single();
          if (createError) {
            delete payload.specs;
            const { data: d2, error: e2 } = await supabase.from("products").insert(payload).select().single();
            if (d2) { data = d2; createError = null; }
            else { results.push({ url: raw.slice(0, 80), status: "error", message: e2?.message || "创建失败" }); continue; }
          }
          if (data) results.push({
            url: raw.slice(0, 80),
            status: "success",
            productId: data.id,
            title: data.title,
            price: (data.price / 100).toString(),
            imageCount: uploadedImages.length,
            duplicate: checkDuplicate(title),
            specs,
          });
        } catch (err: any) {
          results.push({ url: raw.slice(0, 80), status: "error", message: err.message || "JSON 解析失败" });
        }
      }

      // ===== 分支 B：URL 网页抓取导入 =====
      for (const u of urlOnlyItems.slice(0, 20)) {
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
              duplicate: checkDuplicate(title),
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
