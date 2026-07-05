// /api/image-grabber/puppeteer/route.ts
// 图片+商品参数抓取（纯HTTP，不需要浏览器）
import { NextRequest, NextResponse } from "next/server";

// ─── 平台检测 ───
function detectPlatform(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes("1688.com")) return "1688";
  if (lower.includes("taobao.com") || lower.includes("tb.cn")) return "taobao";
  if (lower.includes("tmall.com") || lower.includes("tmall.hk")) return "tmall";
  if (lower.includes("pinduoduo.com") || lower.includes("pdd.com")) return "pdd";
  if (lower.includes("jd.com") || lower.includes("jd.hk")) return "jd";
  if (lower.includes("xiaohongshu.com") || lower.includes("xhslink")) return "xiaohongshu";
  if (url.indexOf("#小程序://") > -1 || url.indexOf("#微信小程序//") > -1) return "miniprogram";
  return null;
}

// ─── HTTP 获取页面内容 ───
async function fetchPage(url: string): Promise<{ html: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        Referer: new URL(url).origin,
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return { html: await res.text() };
  } catch (e: any) {
    return { html: "", error: e.message || "请求超时" };
  }
}

// ─── 从HTML提取所有图片URL ───
function extractImages(html: string, baseUrl: string): string[] {
  const urls: Set<string> = new Set();

  // img标签 src/data-src/data-original
  const imgRe = /<img[^>]+(?:src|data-src|data-original|data-lazy-src|data-url)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = imgRe.exec(html)) !== null) {
    let src = m[1];
    if (src.startsWith("//")) src = "https:" + src;
    else if (src.startsWith("/")) src = new URL(src, baseUrl).href;
    else if (!src.startsWith("http")) continue;
    urls.add(src);
  }

  // background-image CSS
  const bgRe = /(?:background|background-image)\s*:\s*url\(\s*["']?([^"')\s]+)["']?\s*\)/gi;
  while ((m = bgRe.exec(html)) !== null) {
    let src = m[1];
    if (src.startsWith("//")) src = "https:" + src;
    else if (src.startsWith("/")) src = new URL(src, baseUrl).href;
    else if (!src.startsWith("http")) continue;
    urls.add(src);
  }

  // 过滤：只要图片文件，排除icon/logo/avatar
  const result = [...urls].filter(function(u) {
    var l = u.toLowerCase();
    return (
      (/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(l) ||
        l.indexOf("qpic.cn") >= 0 ||
        l.indexOf("alicdn") >= 0 ||
        l.indexOf("tbcdn") >= 0 ||
        l.indexOf("oss-") >= 0 ||
        l.indexOf("1688.com") >= 0 ||
        l.indexOf("img.alicdn") >= 0)
      && l.indexOf("icon") < 0 && l.indexOf("logo") < 0 && l.indexOf("avatar") < 0 && l.indexOf("loading") < 0
    );
  });

  // 去重 + 转高清
  return result.map(function(u) {
    return u.replace(/_\d+x\d+[.\w]*$/, "").replace(/\.webp$/i, ".jpg").replace(/\.gifv$/i, ".jpg");
  }).filter(function(v, i, arr) { return arr.indexOf(v) === i; });
}

// ─── 提取1688商品参数 ───
function extract1688Info(html: string): Record<string, any> | null {
  var info: Record<string, any> = {};

  // 标题（用 RegExp 构造器避免双引号问题）
  var titleMatch =
    html.match(new RegExp('"title"\\s*:\\s*"([^"]{10,200})"')) ||
    html.match(/itemprop="name"[^>]*>\s*([^<]+)/) ||
    html.match(/class="d-title[^"]*"[^>]*>([^<]+)/) ||
    html.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)/);
  if (titleMatch) info.title = decodeHtmlEntities(titleMatch[1].trim());

  // 价格
  var priceMatch =
    html.match(new RegExp('"priceText"\\s*:\\s*"([\\d.]+)"', 'i')) ||
    html.match(new RegExp('"price"\\s*:\\s*"[¥￥]?([\\d.]+)"')) ||
    html.match(/class="price[^"]*value[^"]*"[^>]*>([^<]+)/) ||
    html.match(/<span[^>]*class="price-text[^"]*"[^>]*>([^<]+)/);
  if (priceMatch) info.price = priceMatch[1].trim();

  // 原价
  var originPriceMatch =
    html.match(new RegExp('"originalPriceText"\\s*:\\s*"([\\d.]+)"', 'i')) ||
    html.match(new RegExp('"marketPrice"\\s*:\\s*"([\\d.]+)"'));
  if (originPriceMatch) info.originalPrice = originPriceMatch[1].trim();

  // 规格参数
  var specs: string[] = [];
  var fabricMatch = html.match(/面料[：:]?\s*([^\n<]{2,30})/);
  if (fabricMatch) specs.push("面料:" + fabricMatch[1].trim());

  var materialMatch = html.match(/材质[：:]?\s*([^\n<]{2,30})/);
  if (materialMatch) specs.push("材质:" + materialMatch[1].trim());

  var colorMatch = html.match(/颜色[：:]?\s*([^\n<]{2,50})/);
  if (colorMatch) specs.push("颜色:" + colorMatch[1].trim());

  var sizeMatch = html.match(/尺码[：:]?\s*([^\n<]{2,50})/);
  if (sizeMatch) specs.push("尺码:" + sizeMatch[1].trim());

  var styleMatch = html.match(/版型[：:]?\s*([^\n<]{2,20})/);
  if (styleMatch) specs.push("版型:" + styleMatch[1].trim());

  var seasonMatch = html.match(/季节[：:]?\s*([^\n<]{2,15})/);
  if (seasonMatch) specs.push("季节:" + seasonMatch[1].trim());

  if (specs.length > 0) info.specs = specs;

  // 库存
  var stockMatch = html.match(/库存[：:]?\s*(\d+)/);
  if (stockMatch) info.stock = stockMatch[1];

  // 发货地
  var shipMatch = html.match(/发货[：:]\s*([^\n<]{2,20})/);
  if (shipMatch) info.shipFrom = shipMatch[1].trim();

  return Object.keys(info).length > 0 ? info : null;
}

// ─── 通用商品参数提取 ───
function extractGenericInfo(html: string, platform: string): Record<string, any> | null {
  var info: Record<string, any> = {};

  // title
  var titlePatterns = [/<title>([^<]{5,100})<\/title>/, /itemprop="name"[^>]*content="([^"]+)"/, /<h1[^>]*>([^<]{5,100})<\/h1>/];
  for (var pi = 0; pi < titlePatterns.length; pi++) {
    var tm = html.match(titlePatterns[pi]);
    if (tm) { info.title = decodeHtmlEntities(tm[1].trim()); break; }
  }

  // meta description
  var descMatch = html.match(/<meta\s+name="description"\s+content="([^"]{10,300})"/);
  if (descMatch) info.description = descMatch[1].trim();

  // og:image
  var ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
  if (ogImageMatch) info.mainImage = ogImageMatch[1];

  // price
  var rawPrice = html.match(/[¥￥]\s*([\d,]+\.?\d*)/) || html.match(/\$[\s]?([\d,]+\.?\d*)/);
  if (rawPrice) info.price = rawPrice[1];

  return Object.keys(info).length > 0 ? info : null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ─── POST 入口 ───
export async function POST(request: NextRequest) {
  try {
    var body = await request.json();
    var url = body.url as string;

    if (!url) {
      return NextResponse.json({ error: "缺少URL参数", success: false }, { status: 400 });
    }

    console.log("[ImageGrabber] 开始:", url);

    var platform = detectPlatform(url);
    console.log("[ImageGrabber] 平台:", platform);

    // 微信小程序链接
    if (platform === "miniprogram") {
      return NextResponse.json({
        error: "微信小程序链接只能在微信客户端内打开，服务端无法访问。\n\n请使用以下方式获取图片：\n1. 在微信中打开小程序，长按图片保存\n2. 复制小程序内分享的图片链接\n3. 截图后使用上传功能",
        success: false,
        isMiniprogram: true,
        images: [],
      });
    }

    // 获取页面HTML
    var { html, error } = await fetchPage(url);
    if (!html) {
      return NextResponse.json({ error: "无法获取页面: " + error, success: false, images: [] }, { status: 500 });
    }

    // 提取图片
    var imageUrls = extractImages(html, url);

    // 提取商品信息
    var productInfo: Record<string, any> | null = null;
    if (platform === "1688") {
      productInfo = extract1688Info(html);
    } else if (platform) {
      productInfo = extractGenericInfo(html, platform!);
    }

    if (imageUrls.length === 0 && !productInfo) {
      var hint = platform ? platform + "页面可能是动态加载的" : "该页面";
      
      // 1688特殊提示
      if (platform === "1688") {
        return NextResponse.json({
          success: false,
          images: [],
          error: "1688商品详情页是动态加载的，服务端无法直接抓取。\n\n【推荐操作】\n1. 在浏览器打开商品页\n2. 右键点击每张商品图片 → 「复制图片地址」\n3. 切换到「批量粘贴链接」模式，批量粘贴图片URL\n4. 或使用「微信图片上传」功能",
          hint: "1688需要手动复制图片链接",
          isDynamicSite: true,
        });
      }

      return NextResponse.json({
        success: false,
        images: [],
        error: "未找到图片。" + hint + "建议直接粘贴图片链接或使用上传功能",
        hint: getHintForPlatform(platform),
      });
    }

    console.log("[ImageGrabber] 完成:", imageUrls.length, "张图片,", productInfo ? "有商品信息" : "无商品信息");

    return NextResponse.json({
      success: true,
      images: imageUrls,
      total: imageUrls.length,
      source: url,
      platform: platform || "unknown",
      productInfo: productInfo,
    });
  } catch (error: any) {
    console.error("[ImageGrabber] 错误:", error);
    return NextResponse.json({ error: error.message || "抓取失败", success: false, images: [] }, { status: 500 });
  }
}

function getHintForPlatform(platform: string | null): string {
  switch (platform) {
    case "1688": return "1688移动端页面可尝试。提示：右键商品图片→复制图片地址，或使用「详情图直链」格式如 https://xxx.1688.com/offer/xxxx.html";
    case "taobao":
    case "tmall": return "淘宝/天猫需要登录才能获取完整图片。建议右键复制图片链接直接粘贴";
    case "jd": return "京东部分图片可获取。建议使用图片直链";
    default: return "";
  }
}
