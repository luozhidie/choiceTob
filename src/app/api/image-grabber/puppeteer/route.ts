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
  // 微信小程序链接检测
  if (url.includes("#小程序://") || url.includes("#微信小程序//")) return "miniprogram";
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

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { html: await res.text() };
  } catch (e: any) {
    return { html: "", error: e.message || "请求超时" };
  }
}

// ─── 从HTML提取所有图片URL ───
function extractImages(html: string, baseUrl: string): string[] {
  const urls: Set<string> = new Set();

  // 1. img标签 src/data-src/data-original
  const imgRegex = /<img[^>]+(?:src|data-src|data-original|data-lazy-src|data-url)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = imgRegex.exec(html)) !== null) {
    let src = m[1];
    if (src.startsWith("//")) src = "https:" + src;
    else if (src.startsWith("/")) src = new URL(src, baseUrl).href;
    else if (!src.startsWith("http")) continue;
    urls.add(src);
  }

  // 2. background-image CSS
  const bgRegex = /(?:background|background-image)\s*:\s*url\(\s*["']?([^"')\s]+)["']?\s*\)/gi;
  while ((m = bgRegex.exec(html)) !== null) {
    let src = m[1];
    if (src.startsWith("//")) src = "https:" + src;
    else if (src.startsWith("/")) src = new URL(src, baseUrl).href;
    else if (!src.startsWith("http")) continue;
    urls.add(src);
  }

  // 3. 过滤：只要图片文件，排除icon/logo/avatar
  const result = [...urls].filter((u) => {
    const l = u.toLowerCase();
    return (
      /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(l) ||
      l.includes("qpic.cn") ||
      l.includes("alicdn") ||
      l.includes("tbcdn") ||
      l.includes("oss-") ||
      l.includes("1688.com") ||
      l.includes("img.alicdn")
    ) && !l.includes("icon") && !l.includes("logo") && !l.includes("avatar") && !l.includes("loading");
  });

  // 去重 + 转高清（淘宝/1688）
  return result.map((u) =>
    u.replace(/_\d+x\d+[.\w]*$/, "")
     .replace(/\.webp$/i, ".jpg")
     .replace(/\.gifv$/i, ".jpg")
  ).filter((v, i, arr) => arr.indexOf(v) === i);
}

// ─── 提取1688商品参数 ───
function extract1688Info(html: string): Record<string, any> | null {
  const info: Record<string, any> = {};

  // 标题：多种选择器
  const titleMatch =
    html.match(/"title"\s*:\s*"([^"]{10,200})"/) ||
    html.match(/itemprop="name"[^>]*>\s*([^<]+)/) ||
    html.match(/class="d-title[^"]*"[^>]*>([^<]+)/) ||
    html.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)/);

  if (titleMatch) info.title = decodeHtmlEntities(titleMatch[1].trim());

  // 价格
  const priceMatch =
    html.match(/"priceText"\s*:\s*"([\d.]+)")/i) ||
    html.match(/"price"\s*:\s*"[\¥￥]?([\d.]+)"/) ||
    html.match(/class="price[^"]*value[^"]*"[^>]*>([^<]+)/) ||
    html.match(/<span[^>]*class="price-text[^"]*"[^>]*>([^<]+)/);

  if (priceMatch) info.price = priceMatch[1].trim();

  // 原价/参考价
  const originPriceMatch =
    html.match(/"originalPriceText"\s*:\s*"([\d.]+)")/i) ||
    html.match(/"marketPrice"\s*:\s*"([\d.]+)"/);
  if (originPriceMatch) info.originalPrice = originPriceMatch[1].trim();

  // 规格参数
  const specs: string[] = [];
  // 面料
  const fabricMatch = html.match(/面料[：:]?\s*([^\n<]{2,30})/);
  if (fabricMatch) specs.push(`面料:${fabricMatch[1].trim()}`);

  // 材质
  const materialMatch = html.match(/材质[：:]?\s*([^\n<]{2,30})/);
  if (materialMatch) specs.push(`材质:${materialMatch[1].trim()}`);

  // 颜色
  const colorMatch = html.match(/颜色[：:]?\s*([^\n<]{2,50})/);
  if (colorMatch) specs.push(`颜色:${colorMatch[1].trim()}`);

  // 尺码
  const sizeMatch = html.match(/尺码[：:]?\s*([^\n<]{2,50})/);
  if (sizeMatch) specs.push(`尺码:${sizeMatch[1].trim()}`);

  // 版型
  const styleMatch = html.match(/版型[：:]?\s*([^\n<]{2,20})/);
  if (styleMatch) specs.push(`版型:${styleMatch[1].trim()}`);

  // 季节
  const seasonMatch = html.match(/季节[：:]?\s*([^\n<]{2,15})/);
  if (seasonMatch) specs.push(`季节:${seasonMatch[1].trim()}`);

  // 通用参数提取（key:value格式）
  const attrRegex = /(?:attributeValueMap|skuProperty)\s*[=:]\s*(\{[^}]+\})/gi;
  let attrM;
  while ((attrM = attrRegex.exec(html)) !== null) {
    try {
      // 尝试解析JSON
      const cleaned = attrM[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      const obj = JSON.parse(cleaned);
      if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([k, v]) => {
          const vs = String(v).slice(0, 80);
          if (vs.length > 1 && vs.length < 80 && !specs.some(s => s.startsWith(k))) {
            specs.push(`${k}:${vs}`);
          }
        });
      }
    } catch {}
  }

  if (specs.length > 0) info.specs = specs;

  // 库存
  const stockMatch = html.match(/库存[：:]?\s*(\d+)/);
  if (stockMatch) info.stock = stockMatch[1];

  // 发货地
  const shipMatch = html.match(/发货[：:]\s*([^\n<]{2,20})/);
  if (shipMatch) info.shipFrom = shipMatch[1].trim();

  // 商品ID
  const idMatch = html.match(/offerId\s*[:=]?\s*"(\d+)"/) || html.match(/"offerId"\s*:\s*"(\d+)"/);
  if (idMatch) info.offerId = idMatch[1];

  return Object.keys(info).length > 0 ? info : null;
}

// ─── 通用商品参数提取 ───
function extractGenericInfo(html: string, platform: string): Record<string, any> | null {
  const info: Record<string, any> = {};

  // title
  const titlePatterns = [
    /<title>([^<]{5,100})<\/title>/,
    /itemprop="name"[^>]*content="([^"]+)"/,
    /og:title[^>]*content="([^"]+)"/,
    /<h1[^>]*>([^<]{5,100})<\/h1>/,
  ];
  for (const p of titlePatterns) {
    const m = html.match(p);
    if (m) { info.title = decodeHtmlEntities(m[1].trim()); break; }
  }

  // meta description (可能包含价格等信息)
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]{10,300})"/);
  if (descMatch) info.description = descMatch[1].trim();

  // og:image (主图)
  const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
  if (ogImageMatch) info.mainImage = ogImageMatch[1];

  // price patterns for generic sites
  const rawPrice = html.match(/¥\s*([\d,]+\.?\d*)/)
    || html.match(/\$[\s]?([\d,]+\.?\d*)/)
    || html.match(/price[\s]*[:=]["\s]*([\d,]+\.?\d*)/)
    || html.match(/content="([^"]+)"[^>]*itemprop="price"/);
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
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "缺少URL参数", success: false }, { status: 400 });
    }

    console.log("[图片抓取] 开始:", url);

    const platform = detectPlatform(url);
    console.log("[图片抓取] 平台:", platform);

    // 微信小程序链接特殊处理
    if (platform === "miniprogram") {
      return NextResponse.json({
        error: "微信小程序链接只能在微信客户端内打开，服务端无法访问。\n\n请使用以下方式获取图片：\n1. 在微信中打开小程序，长按图片保存\n2. 复制小程序内分享的图片链接\n3. 截图后使用「微信图片上传」功能",
        success: false,
        isMiniprogram: true,
        images: [],
      });
    }

    // 获取页面HTML
    const { html, error } = await fetchPage(url);
    if (!html) {
      return NextResponse.json({
        error: `无法获取页面: ${error}`,
        success: false,
        images: [],
      }, { status: 500 });
    }

    // 提取图片
    const imageUrls = extractImages(html, url);

    // 提取商品信息
    let productInfo: Record<string, any> | null = null;
    if (platform === "1688") {
      productInfo = extract1688Info(html);
    } else if (platform) {
      productInfo = extractGenericInfo(html, platform!);
    }

    // 如果没提取到任何东西，返回提示
    if (imageUrls.length === 0 && !productInfo) {
      const hint = platform ? `${platform}页面可能是动态加载的` : "该页面";
      return NextResponse.json({
        error: `未找到图片。${hint}建议直接粘贴图片链接或使用上传功能`,
        success: false,
        hint: getHintForPlatform(platform),
        images: [],
      });
    }

    console.log(`[图片抓取] 完成: ${imageUrls.length}张图片, ${productInfo ? '有商品信息' : '无商品信息'}`);

    return NextResponse.json({
      success: true,
      images: imageUrls,
      total: imageUrls.length,
      source: url,
      platform: platform || "unknown",
      productInfo,
    });

  } catch (error: any) {
    console.error("[图片抓取] 错误:", error);
    return NextResponse.json({
      error: error.message || "抓取失败",
      success: false,
      images: [],
    }, { status: 500 });
  }
}

function getHintForPlatform(platform: string | null): string {
  switch (platform) {
    case "1688":
      return "1688移动端页面可尝试。提示：右键商品图片→复制图片地址，或使用「详情图直链」格式如 https://xxx.1688.com/offer/xxxx.html";
    case "taobao":
    case "tmall":
      return "淘宝/天猫需要登录才能获取完整图片。建议右键复制图片链接直接粘贴";
    case "jd":
      return "京东部分图片可获取。建议使用图片直链";
    default:
      return "";
  }
}
