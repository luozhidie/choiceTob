import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * 1688商品页面爬虫（快代理隧道代理版）
 *
 * 环境变量：
 *   PROXY_HOST     - 快代理隧道代理Host
 *   PROXY_PORT     - 快代理隧道代理端口
 *   PROXY_USERNAME - 快代理用户名
 *   PROXY_PASSWORD - 快代理密码
 *
 * 使用方式：
 *   POST /api/crawl/1688-page
 *   body: { keyword: string, maxPages?: number }
 */

const PROXY_HOST = process.env.PROXY_HOST || "";
const PROXY_PORT = process.env.PROXY_PORT || "";
const PROXY_USERNAME = process.env.PROXY_USERNAME || "";
const PROXY_PASSWORD = process.env.PROXY_PASSWORD || "";

function getProxyConfig() {
  if (!PROXY_HOST || !PROXY_PORT) return undefined;
  return {
    host: PROXY_HOST,
    port: parseInt(PROXY_PORT),
    protocol: 'http' as const,
    auth: (PROXY_USERNAME && PROXY_PASSWORD) ? {
      username: PROXY_USERNAME,
      password: PROXY_PASSWORD,
    } : undefined,
  };
}

function getHeaders() {
  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.1688.com/",
    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-site",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "Connection": "keep-alive",
  };
}

interface Item1688 {
  title: string;
  price: string;
  picUrl: string;
  sales: string;
  shopName: string;
  itemUrl: string;
  location: string;
}

/** 搜索1688商品 */
async function search1688Items(keyword: string, page = 1): Promise<Item1688[]> {
  const searchUrl = `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(keyword)}&beginPage=${page}`;
  const proxyConfig = getProxyConfig();

  try {
    const resp = await axios.get(searchUrl, {
      headers: getHeaders(),
      timeout: 15000,
      proxy: proxyConfig,
      decompress: true,
    });

    const html = String(resp.data);
    const $ = cheerio.load(html);
    const items: Item1688[] = [];

    // 1688搜索结果在 .offer-item 或类似class里
    $(".offer-item, .common-offer-item, [data-offer-id]").each((i, el) => {
      try {
        const $el = $(el);
        const title = $el.find(".title a, .offer-title a, .subject").text().trim();
        const price = $el.find(".price .num, .price, .offer-price").first().text().trim();
        const pic = $el.find("img").first().attr("src") || $el.find("img").first().attr("data-src") || "";
        const sales = $el.find(".sale-num, .trade, .sold").text().trim();
        const shop = $el.find(".company-name, .shop-name, .seller").text().trim();
        const href = $el.find("a").first().attr("href") || "";
        const loc = $el.find(".location, .area").text().trim();

        if (title) {
          items.push({
            title,
            price: price || "面议",
            picUrl: pic.startsWith("//") ? `https:${pic}` : pic.startsWith("http") ? pic : `https:${pic}`,
            sales: sales || "0",
            shopName: shop || "",
            itemUrl: href.startsWith("http") ? href : `https:${href}`,
            location: loc || "",
          });
        }
      } catch (e) {}
    });

    // 如果上面的选择器没找到，尝试更通用的选择器
    if (items.length === 0) {
      $("[data-spm*='offer'], .sm-offer-item").each((i, el) => {
        try {
          const $el = $(el);
          const title = $el.find(".title, .subject, h4").text().trim();
          const price = $el.find(".price, .num").first().text().trim();
          const pic = $el.find("img").first().attr("src") || "";
          const href = $el.find("a").first().attr("href") || "";

          if (title) {
            items.push({
              title,
              price: price || "面议",
              picUrl: pic.startsWith("//") ? `https:${pic}` : pic,
              sales: "",
              shopName: "",
              itemUrl: href.startsWith("http") ? href : `https:${href}`,
              location: "",
            });
          }
        } catch (e) {}
      });
    }

    return items.slice(0, 20);
  } catch (error: any) {
    console.error("[1688爬虫] 搜索失败:", error.message);
    return [];
  }
}

// ============ 主接口 ============

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, maxPages = 1 } = body;

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "请提供搜索关键词" }, { status: 400 });
    }

    if (!PROXY_HOST || !PROXY_PORT) {
      return NextResponse.json({
        error: "快代理未配置",
        help: "注册地址：https://www.kuaidaili.com/",
      }, { status: 401 });
    }

    const startTime = Date.now();
    let allItems: Item1688[] = [];

    for (let page = 1; page <= Math.min(maxPages, 3); page++) {
      console.log(`[1688爬虫] 第${page}页开始...`);
      const items = await search1688Items(keyword, page);
      allItems.push(...items);
      if (items.length === 0) break;
      await new Promise(r => setTimeout(r, 2000));
    }

    const duration = Date.now() - startTime;

    // 转换为统一格式
    const formattedItems = allItems.map((item, i) => ({
      id: `1688_${Date.now()}_${i}`,
      name: item.title,
      platform: "1688",
      category: keyword,
      price_range: item.price || "面议",
      colors: [],
      style: "",
      heat_score: Math.min(100, Math.floor(60 + Math.min(parseInt(item.sales) / 10, 40))),
      sales_volume: parseInt(item.sales) > 0 ? `${(parseInt(item.sales) / 10000).toFixed(1)}万+` : "",
      trend_type: parseInt(item.sales) > 1000 ? "全网爆款" : parseInt(item.sales) > 500 ? "潜在爆款" : "爆款微调款",
      source_url: item.itemUrl,
      image_url: item.picUrl,
      keywords: [keyword, item.shopName],
      description: `${item.shopName} | ${item.location}`,
    }));

    return NextResponse.json({
      success: true,
      keyword,
      items: formattedItems,
      count: formattedItems.length,
      duration_ms: duration,
      dataSource: "1688_page_crawl",
      proxyUsed: !!(PROXY_HOST && PROXY_PORT),
    });

  } catch (error: any) {
    console.error("[1688爬虫] 错误:", error);
    return NextResponse.json({
      error: error.message || "1688爬虫失败",
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const configured = !!(PROXY_HOST && PROXY_PORT);
  return NextResponse.json({
    service: "1688-page-crawl",
    configured,
    proxyProvider: "kuaidaili",
    help: configured ? null : "请注册快代理：https://www.kuaidaili.com/，然后设置环境变量 PROXY_HOST/PORT/USERNAME/PASSWORD",
  });
}
