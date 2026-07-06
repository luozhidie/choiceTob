// /api/admin/products/import/route.ts
// 多平台商品一键导入API
// 粘贴商品页链接 → 自动抓取图片+参数 → 创建商品
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function authAdmin(request: NextRequest) {
  const cookie = request.cookies.get("admin_logged_in")?.value;
  if (cookie !== "true") {
    return { ok: false, response: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  return { ok: true };
}

// ─── 平台检测 ───
function detectPlatform(url: string): string | null {
  const l = url.toLowerCase();
  if (l.includes("1688.com")) return "1688";
  if (l.includes("taobao.com") || l.includes("tb.cn")) return "taobao";
  if (l.includes("tmall.com")) return "tmall";
  if (l.includes("pinduoduo.com") || l.includes("pdd.com")) return "pdd";
  if (l.includes("jd.com")) return "jd";
  if (l.includes("xiaohongshu.com") || l.includes("xhslink")) return "xiaohongshu";
  if (l.includes("douyin.com") || l.includes("iesdouyin")) return "douyin";
  if (l.indexOf("#小程序://") > -1 || l.indexOf("#微信小程序//") > -1) return "miniprogram";
  if (l.includes("weidian.com")) return "weidian";
  if (l.includes("kuaishou.com")) return "kuaishou";
  if (l.includes("yangkeduo.com")) return "yangkeduo";
  if (l.includes("meituan.com")) return "meituan";
  if (l.includes("suning.com")) return "suning";
  return null;
}

// ─── HTTP获取页面 ───
async function fetchPage(url: string): Promise<{ html: string; error?: string }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: new URL(url).origin,
      },
      redirect: "follow",
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return { html: await res.text() };
  } catch (e: any) {
    return { html: "", error: e.message || "超时" };
  }
}

// ─── 提取图片URL ───
function extractImages(html: string, baseUrl: string): string[] {
  const urls = new Set<string>();
  // img标签
  const imgRe = /<img[^>]+(?:src|data-src|data-original|data-lazy-src|data-url)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = imgRe.exec(html)) !== null) {
    let s = m[1];
    if (s.startsWith("//")) s = "https:" + s;
    else if (s.startsWith("/")) s = new URL(s, baseUrl).href;
    else if (!s.startsWith("http")) continue;
    urls.add(s);
  }
  // background-image
  const bgRe = /(?:background|background-image)\s*:\s*url\(\s*["']?([^"')\s]+)["']?\s*\)/gi;
  while ((m = bgRe.exec(html)) !== null) {
    let s = m[1];
    if (s.startsWith("//")) s = "https:" + s;
    else if (s.startsWith("/")) s = new URL(s, baseUrl).href;
    else if (!s.startsWith("http")) continue;
    urls.add(s);
  }
  // 过滤
  return [...urls].filter(function(u: string) {
    var l = u.toLowerCase();
    return (
      (/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(l) ||
        l.indexOf("qpic.cn") >= 0 ||
        l.indexOf("alicdn") >= 0 ||
        l.indexOf("tbcdn") >= 0 ||
        l.indexOf("oss-") >= 0 ||
        l.indexOf("1688.com") >= 0)
      && l.indexOf("icon") < 0 && l.indexOf("logo") < 0 && l.indexOf("avatar") < 0 && l.indexOf("loading") < 0
    );
  }).map(function(u) {
    return u.replace(/_\d+x\d+[.\w]*$/, "").replace(/\.webp$/i, ".jpg").replace(/\.gifv$/i, ".jpg");
  }).filter(function(v, i, arr) { return arr.indexOf(v) === i; }).slice(0, 20); // 最多20张
}

// ─── 提取1688参数 ───
function extract1688Info(html: string): Record<string, any> | null {
  var info: Record<string, any> = {};
  var tMatch =
    html.match(new RegExp('"title"\\s*:\\s*"([^"]{10,200})"')) ||
    html.match(/itemprop="name"[^>]*>\s*([^<]+)/) ||
    html.match(/class="d-title[^"]*"[^>]*>([^<]+)/) ||
    html.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)/);
  if (tMatch) info.title = decodeHtmlEntities(tMatch[1].trim());

  var pMatch =
    html.match(new RegExp('"priceText"\\s*:\\s*"([\\d.]+)"', 'i')) ||
    html.match(new RegExp('"price"\\s*:\\s*"[¥¥]?([\\d.]+)"')) ||
    html.match(/class="price[^"]*value[^"]*"[^>]*>([^<]+)/) ||
    html.match(/<span[^>]*class="price-text[^"]*"[^>]*>([^<]+)/);
  if (pMatch) info.price = pMatch[1].trim();

  var opMatch =
    html.match(new RegExp('"originalPriceText"\\s*:\\s*"([\\d.]+)"', 'i')) ||
    html.match(new RegExp('"marketPrice"\\s*:\\s*"([\\d.]+)"'));
  if (opMatch) info.originalPrice = opMatch[1].trim();

  var specs: string[] = [];
  var f = html.match(/面料[：:]?\s*([^\n<]{2,30})/);
  if (f) specs.push("面料:" + f[1].trim());
  var mt = html.match(/材质[：:]?\s*([^\n<]{2,30})/);
  if (mt) specs.push("材质:" + mt[1].trim());
  var c = html.match(/颜色[：:]?\s*([^\n<]{2,50})/);
  if (c) specs.push("颜色:" + c[1].trim());
  var sz = html.match(/尺码[：:]?\s*([^\n<]{2,50})/);
  if (sz) specs.push("尺码:" + sz[1].trim());
  if (specs.length > 0) info.specs = specs;

  var st = html.match(/库存[：:]?\s*(\d+)/);
  if (st) info.stock = st[1];
  var sh = html.match(/发货[：:]\s*([^\n<]{2,20})/);
  if (sh) info.shipFrom = sh[1].trim();

  return Object.keys(info).length > 0 ? info : null;
}

// ─── 通用参数提取 ───
function extractGenericInfo(html: string): Record<string, any> | null {
  var info: Record<string, any> = {};
  var titlePatterns = [/<title>([^<]{5,100})<\/title>/, /itemprop="name"[^>]*content="([^"]+)"/, /<h1[^>]*>([^<]{5,100})<\/h1>/];
  for (var pi = 0; pi < titlePatterns.length; pi++) {
    var tm = html.match(titlePatterns[pi]);
    if (tm) { info.title = decodeHtmlEntities(tm[1].trim()); break; }
  }
  var descM = html.match(/<meta\s+name="description"\s+content="([^"]{10,300})"/);
  if (descM) info.description = descM[1].trim();
  var ogImg = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
  if (ogImg) info.mainImage = ogImg[1];
  var rawP = html.match(/[¥￥]\s*([\d,]+\.?\d*)/) || html.match(/\$[\s]?([\d,]+\.?\d*)/);
  if (rawP) info.price = rawP[1];

  return Object.keys(info).length > 0 ? info : null;
}

function decodeHtmlEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

// ─── 下载单张图片到Storage ───
async function downloadImageToStorage(imageUrl: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(imageUrl, {
      headers: { Referer: imageUrl },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    // 检查是真实图片（至少100字节）
    if (buf.length < 100) return null;

    const ext = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || "jpg";
    const filename = `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from("products")
      .upload(filename, buf, { contentType: `image/${ext}`, upsert: false });

    if (error) console.error("[Import] 图片上传失败:", error);
    if (data) {
      const publicUrl = supabase.storage.from("products").getPublicUrl(data.path);
      return publicUrl?.signedUrl || filename;
    }
    return null;
  } catch (e: any) {
    console.error("[Import] 图片下载失败:", e.message);
    return null;
  }
}

// ─── POST 入口 ───
export async function POST(request: NextRequest) {
  const auth = await authAdmin(request);
  if (!auth.ok) return auth.response!;

  try {
    const body = await request.json();
    const urls: string[] = body.urls || [];
    
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "请提供 urls 数组", success: false }, { status: 400 });
    }

    // 去重 & 过滤
    const uniqueUrls = [...new Set(urls.filter((u: string) => 
      u.trim() && u.startsWith("http")
    )].slice(0, 30); // 最多30个

    if (uniqueUrls.length === 0) {
      return NextResponse.json({ error: "没有有效的URL", success: false }, { status: 400 });
    }

    const results: Array<{
      url: string;
      platform: string | null;
      status: "success" | "error" | "skipped";
      productId?: string;
      title?: string;
      price?: string;
      originalPrice?: string;
      imageCount?: number;
      images?: string[];
      message?: string;
      productInfo?: Record<string, any>;
    }> = [];

    for (let i = 0; i < uniqueUrls.length; i++) {
      const url = uniqueUrls[i].trim();
      const platform = detectPlatform(url);
      const result: typeof results[number] = {
        url,
        platform,
        status: "error",
        message: "",
      };

      try {
        // 微信小程序跳过
        if (platform === "miniprogram") {
          result.status = "skipped";
          result.message = "微信小程序链接无法抓取，请在微信内打开后长按保存图片";
          results.push(result);
          continue;
        }

        // 获取HTML
        const { html, error } = await fetchPage(url);
        if (!html) {
          result.status = "error";
          result.message = "无法访问该页面: " + (error || "未知错误");
          results.push(result);
          continue;
        }

        // 提取图片
        const imageUrls = extractImages(html, url);
        
        // 提取商品信息
        let productInfo: Record<string, any> | null = null;
        if (platform === "1688") {
          productInfo = extract1688Info(html);
        } else {
          productInfo = extractGenericInfo(html);
        }

        // 下载图片到 Storage
        const uploadedImages: string[] = [];
        if (imageUrls.length > 0) {
          // 取前3张作为主图候选，全部下载
          const imagesToDownload = imageUrls.slice(0, 15);
          
          for (const imgUrl of imagesToDownload) {
            const storedUrl = await downloadImageToStorage(imgUrl);
            if (storedUrl) uploadedImages.push(storedUrl);
            // 避免请求太快被限制
            await new Promise(r => setTimeout(r, 300));
          }
        }

        // 创建商品
        if (productInfo?.title || uploadedImages.length > 0) {
          const priceFen = productInfo?.price 
            ? Math.round(parseFloat(productInfo.price) * 100) 
            : 0;
          const originFen = productInfo?.originalPrice 
            ? Math.round(parseFloat(productInfo.originalPrice) * 100)
            : 0;

          const payload: Record<string, any> = {
            title: productInfo?.title || ("导入商品_" + (i + 1)),
            price: priceFen,
            original_price: originFen,
            cover_image: uploadedImages[0] || productInfo?.mainImage || null,
            images: JSON.stringify(uploadedImages),
            category: "", // 待分类
            is_published: true,
            stock: productInfo?.stock ? parseInt(productInfo.stock) : 0,
            detail: productInfo?.description || "",
            tags: platform ? ["导入_" + platform] : ["导入"],
          };

          // 尝试创建商品
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
              result.productId = d2.id;
            } else {
              result.status = "error";
              result.message = "商品创建失败: " + (e2?.message || JSON.stringify(createError));
              results.push(result);
              continue;
            }
          } else {
            result.productId = data.id;
          }

          result.title = productInfo?.title;
          result.price = priceFen > 0 ? (priceFen / 100).toString() : "";
          result.originalPrice = originFen > 0 ? (originFen / 100).toString() : "";
          result.imageCount = uploadedImages.length;
          result.images = uploadedImages;
          result.productInfo = productInfo;
          result.status = "success";

        } else {
          result.status = "error";
          result.message = "未能提取到任何图片或标题";
        }
      } else {
        result.status = "error";
        result.message = "页面中没有找到图片或商品信息";
      }

        results.push(result);

      } catch (err: any) {
        result.status = "error";
        result.message = err.message || "处理异常";
        results.push(result);
      }
    }

    const successCount = results.filter(r => r.status === "success").length;
    const skippedCount = results.filter(r => r.status === "skipped").length;
    const errorCount = results.filter(r => r.status === "error").length;

    return NextResponse.json({
      success: successCount > 0,
      total: urls.length,
      success: successCount,
      skipped: skippedCount,
      errors: errorCount,
      results,
    });

  } catch (error: any) {
    console.error("[Products Import] Error:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误", success: false },
      { status: 500 }
    );
  }
}
