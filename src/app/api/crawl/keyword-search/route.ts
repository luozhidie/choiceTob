import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * 爆款关键词抓取（Google/Bing搜索）
 * 
 * 通过Google/Bing搜索小红书/抖音关键词，抓取真实搜索结果
 * 
 * 使用方式：
 *   POST /api/crawl/keyword-search
 *   body: { keyword: string, platform?: "google"|"bing", maxResults?: number }
 */

const getProxyConfig = () => {
  const PROXY_HOST = process.env.PROXY_HOST || "";
  const PROXY_PORT = process.env.PROXY_PORT || "";
  if (!PROXY_HOST || !PROXY_PORT) return undefined;
  return {
    host: PROXY_HOST,
    port: parseInt(PROXY_PORT),
    protocol: 'http' as const,
  };
};

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  platform: string;
}

/** Google搜索 */
async function searchGoogle(keyword: string, maxResults = 10): Promise<SearchResult[]> {
  const proxyConfig = getProxyConfig();
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=${maxResults}`;
  
  try {
    const resp = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      timeout: 15000,
      proxy: proxyConfig,
      responseType: 'text',
    });

    const html = String(resp.data);
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];

    // Google搜索结果在 .yuRUbf 或 .g 标签里
    $(".yuRUbf, .g, [data-sokc]").each((i, el) => {
      try {
        const $el = $(el);
        const titleEl = $el.find("h3, a").first();
        const title = titleEl.text().trim();
        const linkEl = $el.find("a").first();
        const url = linkEl.attr("href") || "";
        const snippetEl = $el.find(".VwiC3b, .aCOpRe, .lIGfk").first();
        const snippet = snippetEl.text().trim();

        if (title && url && url.startsWith("http")) {
          // 判断平台
          let platform = "other";
          if (url.includes("xiaohongshu.com") || url.includes("xhslink.com")) platform = "小红书";
          else if (url.includes("douyin.com")) platform = "抖音";
          else if (url.includes("taobao.com")) platform = "淘宝";
          else if (url.includes("1688.com")) platform = "1688";

          results.push({ title, url, snippet, platform });
        }
      } catch (e) {}
    });

    return results.slice(0, maxResults);
  } catch (error: any) {
    console.error("[Google搜索] 失败:", error.message);
    return [];
  }
}

/** Bing搜索 */
async function searchBing(keyword: string, maxResults = 10): Promise<SearchResult[]> {
  const proxyConfig = getProxyConfig();
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(keyword)}&count=${maxResults}`;
  
  try {
    const resp = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      timeout: 15000,
      proxy: proxyConfig,
      responseType: 'text',
    });

    const html = String(resp.data);
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];

    // Bing搜索结果在 .b_algo 或 li.b_algo 里
    $(".b_algo, li.b_algo").each((i, el) => {
      try {
        const $el = $(el);
        const titleEl = $el.find("h2, a").first();
        const title = titleEl.text().trim();
        const linkEl = $el.find("a").first();
        const url = linkEl.attr("href") || "";
        const snippetEl = $el.find(".b_caption p, .b_algoSlug").first();
        const snippet = snippetEl.text().trim();

        if (title && url && url.startsWith("http")) {
          let platform = "other";
          if (url.includes("xiaohongshu.com") || url.includes("xhslink.com")) platform = "小红书";
          else if (url.includes("douyin.com")) platform = "抖音";
          else if (url.includes("taobao.com")) platform = "淘宝";
          else if (url.includes("1688.com")) platform = "1688";

          results.push({ title, url, snippet, platform });
        }
      } catch (e) {}
    });

    return results.slice(0, maxResults);
  } catch (error: any) {
    console.error("[Bing搜索] 失败:", error.message);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, platform = "google", maxResults = 10 } = body;

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "请提供搜索关键词" }, { status: 400 });
    }

    console.log(`[关键词搜索] 平台:${platform}, 关键词:${keyword}`);
    
    const startTime = Date.now();
    let results: SearchResult[] = [];

    if (platform === "google") {
      results = await searchGoogle(keyword, maxResults);
    } else if (platform === "bing") {
      results = await searchBing(keyword, maxResults);
    } else {
      return NextResponse.json({ error: "不支持的搜索平台" }, { status: 400 });
    }

    const duration = Date.now() - startTime;

    // 按平台分组统计
    const platformStats = results.reduce((acc, r) => {
      acc[r.platform] = (acc[r.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      keyword,
      platform,
      results,
      count: results.length,
      duration_ms: duration,
      platformStats,
      dataSource: `${platform}_search`,
    });

  } catch (error: any) {
    console.error("[关键词搜索] 错误:", error);
    return NextResponse.json({
      error: error.message || "搜索失败",
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: "keyword-search",
    platforms: ["google", "bing"],
    help: "POST /api/crawl/keyword-search { keyword, platform?, maxResults? }",
  });
}
