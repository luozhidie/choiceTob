// /api/image-grabber/puppeteer/route.ts
// 使用 Puppeteer 抓取 JS 动态渲染页面的图片（淘宝/1688/小红书等）
import { NextRequest, NextResponse } from "next/server";
import puppeteer, { Browser, Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

// 判断是否本地开发环境
const isDev = process.env.NODE_ENV === "development";

// 平台检测
function detectPlatform(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes("taobao.com") || lower.includes("tb.cn")) return "taobao";
  if (lower.includes("tmall.com")) return "tmall";
  if (lower.includes("1688.com")) return "1688";
  if (lower.includes("pinduoduo.com") || lower.includes("pdd.com")) return "pdd";
  if (lower.includes("jd.com")) return "jd";
  if (lower.includes("xiaohongshu.com") || lower.includes("xhslink")) return "xiaohongshu";
  if (lower.includes("mp.weixin.qq.com") || lower.includes("weixin")) return "weixin";
  return null;
}

// 启动浏览器
async function launchBrowser(): Promise<Browser> {
  if (isDev) {
    // 本地开发：使用本地安装的 Chrome
    return await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // Mac
        // "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Windows
        // "/usr/bin/google-chrome", // Linux
    });
  } else {
    // Serverless 环境：使用 @sparticuz/chromium-min
    return await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
}

// 抓取淘宝商品图片
async function grabTaobao(page: Page, url: string): Promise<string[]> {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  
  // 等待图片加载
  await page.waitForSelector(".tb-main-pic, .main-image, img", { timeout: 10000 }).catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 3000)); // 额外等待

  const images = await page.evaluate(() => {
    const urls: string[] = [];
    
    // 淘宝主图
    const mainImgs = document.querySelectorAll(".tb-main-pic img, .main-image img, .preview-pic img");
    mainImgs.forEach((img) => {
      const src = img.getAttribute("src") || img.getAttribute("data-src");
      if (src) urls.push(src);
    });
    
    // 所有商品图片
    const allImgs = document.querySelectorAll("img");
    allImgs.forEach((img) => {
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-original");
      if (src && (src.includes("alicdn") || src.includes("taobao") || src.includes("tbcdn"))) {
        // 获取高清图（替换尺寸参数）
        let highQuality = src;
        highQuality = highQuality.replace(/_.webp$/, ".jpg");
        highQuality = highQuality.replace(/\.webp$/, ".jpg");
        urls.push(highQuality);
      }
    });

    return urls;
  });

  // 处理相对路径和去重
  const baseUrl = new URL(url);
  const absoluteUrls = images
    .map((src) => {
      if (src.startsWith("//")) return "https:" + src;
      if (src.startsWith("/")) return baseUrl.origin + src;
      if (!src.startsWith("http")) return "";
      return src;
    })
    .filter(Boolean);

  return [...new Set(absoluteUrls)];
}

// 抓取小红书笔记图片
async function grabXiaohongshu(page: Page, url: string): Promise<string[]> {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  
  // 等待内容加载
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const images = await page.evaluate(() => {
    const urls: string[] = [];
    
    // 小红书图片
    const imgs = document.querySelectorAll("img");
    imgs.forEach((img) => {
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
      if (src && !src.includes("avatar") && !src.includes("logo")) {
        urls.push(src);
      }
    });

    return urls;
  });

  return [...new Set(images)];
}

// 通用网页图片抓取
async function grabGeneric(page: Page, url: string): Promise<string[]> {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  
  // 等待页面加载
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const images = await page.evaluate(() => {
    const urls: string[] = [];
    
    // 所有图片
    const imgs = document.querySelectorAll("img");
    imgs.forEach((img) => {
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-lazy-src");
      if (src) urls.push(src);
    });
    
    // background-image
    const elementsWithBg = document.querySelectorAll("[style]");
    elementsWithBg.forEach((el) => {
      const style = el.getAttribute("style") || "";
      const match = style.match(/url\(["']?([^"')]+)["']?\)/);
      if (match && match[1]) {
        urls.push(match[1]);
      }
    });

    return urls;
  });

  // 处理相对路径
  const baseUrl = new URL(url);
  const absoluteUrls = images
    .filter((src) => src && !src.startsWith("data:"))
    .map((src) => {
      if (src.startsWith("//")) return "https:" + src;
      if (src.startsWith("/")) return baseUrl.origin + src;
      if (!src.startsWith("http")) return "";
      return src;
    })
    .filter(Boolean);

  return [...new Set(absoluteUrls)].filter((url) => {
    const lower = url.toLowerCase();
    return (
      /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(lower) ||
      lower.includes("qpic") ||
      lower.includes("cdn") ||
      lower.includes("oss-")
    ) && !lower.includes("icon") && !lower.includes("logo") && !lower.includes("avatar");
  });
}

export async function POST(request: NextRequest) {
  let browser: Browser | null = null;

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "缺少URL参数" }, { status: 400 });
    }

    console.log("[Puppeteer抓取] 开始:", url);

    const platform = detectPlatform(url);
    console.log("[Puppeteer抓取] 检测平台:", platform);

    // 启动浏览器
    browser = await launchBrowser();
    const page = await browser.newPage();

    // 设置 User-Agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // 设置视口
    await page.setViewport({ width: 1920, height: 1080 });

    let imageUrls: string[] = [];

    // 根据平台选择抓取策略
    if (platform === "taobao" || platform === "tmall" || platform === "1688") {
      imageUrls = await grabTaobao(page, url);
    } else if (platform === "xiaohongshu") {
      imageUrls = await grabXiaohongshu(page, url);
    } else {
      imageUrls = await grabGeneric(page, url);
    }

    await browser.close();
    browser = null;

    console.log(`[Puppeteer抓取] 完成，找到 ${imageUrls.length} 张图片`);

    if (imageUrls.length === 0) {
      return NextResponse.json({
        images: [],
        total: 0,
        error: "未在页面中找到图片，页面可能需要登录或图片是动态加载的",
      });
    }

    return NextResponse.json({
      images: imageUrls,
      total: imageUrls.length,
      source: url,
      platform: platform || "unknown",
    });
  } catch (error) {
    console.error("[Puppeteer抓取] 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "抓取失败", images: [] },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
