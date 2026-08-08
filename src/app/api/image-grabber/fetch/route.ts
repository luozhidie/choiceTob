// /api/image-grabber/fetch/route.ts
// 抓取网页/文章中的图片 - 支持多平台
import { NextRequest, NextResponse } from "next/server";

// 平台检测和提示信息
const PLATFORM_HINTS: Record<string, string> = {
  taobao: "淘宝商品页面需要登录才能获取完整图片。\n建议：右键商品图片 → 复制图片地址，直接粘贴图片链接即可",
  tmall: "天猫商品页面需要登录才能获取完整图片。\n建议：右键商品图片 → 复制图片地址，直接粘贴图片链接即可",
  "1688": "1688商品页面是动态加载的，可能无法抓取全部图片。\n建议：右键商品图片 → 复制图片地址，或使用详情图直链",
  pdd: "拼多多商品页面需要特殊处理。\n建议：右键商品图片 → 复制图片地址，直接粘贴图片链接即可",
  jd: "京东商品页面部分图片可获取，但可能不完整。\n建议：右键商品图片 → 复制图片地址获取高清大图",
  douyin: "抖音/快手等内容平台的图片需要特殊解析。\n建议：保存图片后上传，或使用图片直链",
};

function detectPlatform(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes("taobao.com") || lower.includes("tb.cn")) return "taobao";
  if (lower.includes("tmall.com") || lower.includes("tmall.hk")) return "tmall";
  if (lower.includes("1688.com")) return "1688";
  if (lower.includes("pinduoduo.com") || lower.includes("pdd.com")) return "pdd";
  if (lower.includes("jd.com") || lower.includes("jd.hk")) return "jd";
  if (lower.includes("douyin.com") || (lower.includes("iesdouyin"))) return "douyin";
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "缺少URL参数" }, { status: 400 });
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "无效的URL格式" }, { status: 400 });
    }

    console.log("[图片抓取] 开始抓取:", url);

    // 检测是否是电商平台
    const platform = detectPlatform(url);

    // 获取网页内容
    let html = "";
    let fetchError: string | null = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15秒超时

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Accept-Encoding": "identity", // 不压缩，方便解析
          Cookie: "", // 清空cookie避免干扰
          Referer: new URL(url).origin,
        },
        redirect: "follow",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      html = await response.text();
    } catch (error) {
      console.error("[图片抓取] 获取页面失败:", error);
      fetchError = error instanceof Error ? error.message : "未知错误";
    }

    // 提取所有图片URL
    const imageUrls: string[] = [];

    // 1. 匹配 img 标签的 src
    const imgRegex = /<img[^>]+(?:src|data-src|data-original|data-lazy-src|data-lazyload-src)["\s]*=["']([^"']+)["'][^>]*/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      processImageUrl(src, url, imageUrls);
    }

    // 2. 匹配 background-image 样式
    const bgRegex = /background[-]?image\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
    while ((match = bgRegex.exec(html)) !== null) {
      processImageUrl(match[1], url, imageUrls);
    }

    // 3. 特殊处理：微信公众号文章 - data-src 和 CDN
    if (url.includes("mp.weixin.qq.com") || url.includes("weixin")) {
      // 微信文章通常使用 data-src 属性存储高清图
      const dataSrcRegex = /data-src=["']([^"']+)["']/g;
      while ((match = dataSrcRegex.exec(html)) !== null) {
        if (match[1]) {
          imageUrls.push(match[1]);
        }
      }

      // 提取微信 CDN 图片
      const wechatCdnRegex = /https?:\/\/mmbiz\.qpic\.cn\/[^\s"'\)]+/g;
      while ((match = wechatCdnRegex.exec(html)) !== null) {
        if (match[0]) {
          imageUrls.push(match[0]);
        }
      }
    }

    // 4. 特殊处理：淘宝/天猫 - 从 HTML 中提取可能的图片
    if (platform === "taobao" || platform === "tmall") {
      // 淘宝图片可能在 JSON 数据中
      const jsonImgRegex = /["'](https?:\/\/(?:img|gd\d|alicdn)\.[^"']*?\.(?:jpg|jpeg|png|webp)[^"']*?)["']/gi;
      while ((match = jsonImgRegex.exec(html)) !== null) {
        if (match[1] && !imageUrls.includes(match[1])) {
          imageUrls.push(match[1]);
        }
      }

      // 淘宝 CDN 图片
      const tbCdnRegex = /https?:\/\/(?:img\.alicdn\.com|gw\.alicdn\.com)[^"'\s]*/gi;
      while ((match = tbCdnRegex.exec(html)) !== null) {
        if (match[0] && !imageUrls.includes(match[0])) {
          imageUrls.push(match[0]);
        }
      }
    }

    // 5. 特殊处理：1688 - 提取阿里云CDN图片
    if (platform === "1688") {
      const aliCdnRegex = /https?:\/\/(?:cbu01\.alicdn|img\.alibabagroup)\.[^"'\s]*/gi;
      while ((match = aliCdnRegex.exec(html)) !== null) {
        if (match[0] && !imageUrls.includes(match[0])) {
          imageUrls.push(match[0]);
        }
      }
    }

    // 6. 通用：从页面中提取所有 http(s) 图片 URL
    const allImgUrlRegex = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|gif|webp|bmp)(?:\?[^\s"'<>]*)?/gi;
    while ((match = allImgUrlRegex.exec(html)) !== null) {
      if (match[0] && isValidImageUrl(match[0]) && !imageUrls.includes(match[0])) {
        imageUrls.push(match[0]);
      }
    }

    // 去重并过滤有效图片
    const uniqueImages = [...new Set(imageUrls)].filter((imgUrl) => isValidImageUrl(imgUrl));

    console.log(`[图片抓取] 完成，找到 ${uniqueImages.length} 张图片`);

    // 如果没有找到图片，给出具体提示
    if (uniqueImages.length === 0) {
      let errorMessage = "未找到任何图片";
      if (fetchError) {
        errorMessage = `无法访问该链接: ${fetchError}`;
      } else if (platform && PLATFORM_HINTS[platform]) {
        errorMessage = `该平台暂不支持自动抓取\n${PLATFORM_HINTS[platform]}`;
      } else if (!html || html.length < 500) {
        errorMessage = "页面内容为空或被反爬虫拦截\n建议：直接粘贴图片URL地址";
      } else {
        errorMessage = "未在页面中找到有效图片\n建议：请确认链接正确，或直接粘贴图片URL";
      }

      return NextResponse.json({
        images: [],
        total: 0,
        error: errorMessage,
        platform: platform || "unknown",
      });
    }

    return NextResponse.json({
      images: uniqueImages,
      total: uniqueImages.length,
      source: url,
      platform: platform || "unknown",
    });
  } catch (error) {
    console.error("[图片抓取API错误]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误", images: [] },
      { status: 500 }
    );
  }
}

// 处理单个图片URL
function processImageUrl(src: string, pageUrl: string, results: string[]) {
  if (!src) return;
  if (src.startsWith("data:") || src.startsWith("blob:")) return; // 排除base64

  // 处理相对路径
  let absoluteUrl = src.trim();
  if (absoluteUrl.startsWith("//")) {
    absoluteUrl = "https:" + absoluteUrl;
  } else if (absoluteUrl.startsWith("/")) {
    try {
      const baseUrl = new URL(pageUrl);
      absoluteUrl = `${baseUrl.origin}${absoluteUrl}`;
    } catch {
      return; // 无法解析就跳过
    }
  } else if (!absoluteUrl.startsWith("http://") && !absoluteUrl.startsWith("https://")) {
    return; // 不是有效URL
  }

  // 基本过滤
  if (isValidImageUrl(absoluteUrl)) {
    results.push(absoluteUrl);
  }
}

// 验证是否为有效的商品/内容图片
function isValidImageUrl(url: string): boolean {
  const lower = url.toLowerCase();

  // 必须是图片格式（或已知CDN）
  const isImage =
    /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(lower) ||
    lower.includes("qpic.cn") ||
    lower.includes("alicdn") ||
    lower.includes("alibaba") ||
    lower.includes("oss-") ||
    lower.includes("cdn");

  if (!isImage) return false;

  // 排除不需要的图片类型
  const excludePatterns = [
    "/icon", "/logo", "/avatar", "/favicon", "/emoji", "/sticker",
    "_icon.", "_logo.", "_avatar.",
    "icon.png", "icon.jpg", "logo.png", "logo.jpg",
    "loading", "spinner", "placeholder", "default",
    "1x1.gif", "1x1.png", "pixel.gif", "tracking"
  ];

  for (const pattern of excludePatterns) {
    if (lower.includes(pattern)) return false;
  }

  return true;
}
