import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * 淘宝商品页面爬虫（快代理隧道代理版）
 *
 * 环境变量：
 *   PROXY_HOST     - 快代理隧道代理Host（如 tunnel.kuaidaili.com）
 *   PROXY_PORT     - 快代理隧道代理端口（如 30008）
 *   PROXY_USERNAME - 快代理用户名
 *   PROXY_PASSWORD - 快代理密码
 *
 * 使用方式：
 *   POST /api/crawl/taobao-page
 *   body: { keyword: string, maxPages?: number }
 *
 * 返回：
 *   { success, items: [{ title, price, picUrl, sales, shopName, itemUrl }], count }
 */

// ============ 配置 ============
const PROXY_HOST = process.env.PROXY_HOST || "";
const PROXY_PORT = process.env.PROXY_PORT || "";
const PROXY_USERNAME = process.env.PROXY_USERNAME || "";
const PROXY_PASSWORD = process.env.PROXY_PASSWORD || "";

// ============ 淘宝商品搜索（使用axios原生proxy配置） ============

interface TaobaoItem {
  title: string;
  price: string;
  picUrl: string;
  sales: string;
  shopName: string;
  itemUrl: string;
  location: string;
}

/** 搜索淘宝商品（使用隧道代理） */
async function searchTaobaoItems(keyword: string, page = 1): Promise<TaobaoItem[]> {
  const searchUrl = `https://s.taobao.com/search?q=${encodeURIComponent(keyword)}&s=${(page - 1) * 44}`;

  // 构建代理配置（axios原生支持http proxy）
  const proxyConfig = (PROXY_HOST && PROXY_PORT) ? {
    host: PROXY_HOST,
    port: parseInt(PROXY_PORT),
    protocol: 'http' as const,
    auth: (PROXY_USERNAME && PROXY_PASSWORD) ? {
      username: PROXY_USERNAME,
      password: PROXY_PASSWORD,
    } : undefined,
  } : undefined;

  try {
    const resp = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Referer": "https://www.taobao.com/",
      },
      timeout: 15000,
      proxy: proxyConfig,
    });

    const $ = cheerio.load(resp.data);
    const items: TaobaoItem[] = [];

    // 淘宝搜索结果在 script 标签里的 JSON 数据中
    const scripts = $("script").toArray();
    for (const script of scripts) {
      const text = $(script).html() || "";
      if (text.includes("g_page_config") || text.includes("__NEXT_DATA__")) {
        try {
          // 尝试解析JSON数据
          const jsonMatch = text.match(/g_page_config\s*=\s*(\{.*?\});/) || text.match(/__NEXT_DATA__\s*=\s*(\{.*)/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[1]);
            // 提取商品列表（根据淘宝数据结构）
            const itemList = data?.mods?.itemlist?.data?.auctions ||
                          data?.pageProps?.initData?.items || [];
            for (const item of itemList.slice(0, 20)) {
              items.push({
                title: item.raw_title || item.title || "",
                price: item.view_price || item.price || "",
                picUrl: item.pic_url || item.img || "",
                sales: item.view_sales || item.sales || "0",
                shopName: item.nick || item.shopName || "",
                itemUrl: `https://item.taobao.com/item.htm?id=${item.nid || item.itemId}`,
                location: item.item_loc || item.location || "",
              });
            }
            break;
          }
        } catch (e) {
          // JSON解析失败，继续尝试其他方式
        }
      }
    }

    // 如果JSON解析失败，尝试HTML解析
    if (items.length === 0) {
      $(".item, [data-category='auctions']").each((i, el) => {
        try {
          const $el = $(el);
          const title = $el.attr("data-title") || $el.find(".title a").text().trim();
          const price = $el.attr("data-price") || $el.find(".price").text().trim();
          const pic = $el.attr("data-pic") || $el.find("img").attr("src") || "";
          const sales = $el.attr("data-sales") || $el.find(".sale").text().trim();
          const shop = $el.attr("data-shop") || $el.find(".shop a").text().trim();
          const href = $el.find("a").first().attr("href") || "";
          if (title) {
            items.push({
              title,
              price,
              picUrl: pic.startsWith("//") ? `https:${pic}` : pic,
              sales,
              shopName: shop,
              itemUrl: href.startsWith("http") ? href : `https:${href}`,
              location: "",
            });
          }
        } catch (e) {}
      });
    }

    return items.slice(0, 20);
  } catch (error: any) {
    console.error("[淘宝爬虫] 搜索失败:", error.message);
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
        error: "快代理未配置，请在环境变量中设置 PROXY_HOST/PORT/USERNAME/PASSWORD",
        help: "注册地址：https://www.kuaidaili.com/",
      }, { status: 401 });
    }

    const startTime = Date.now();
    let allItems: TaobaoItem[] = [];

    // 多页抓取
    for (let page = 1; page <= Math.min(maxPages, 3); page++) {
      console.log(`[淘宝爬虫] 第${page}页开始...`);
      const items = await searchTaobaoItems(keyword, page);
      allItems.push(...items);
      if (items.length === 0) break;
      // 延迟避免被封
      await new Promise(r => setTimeout(r, 2000));
    }

    const duration = Date.now() - startTime;

    // 转换为统一格式
    const formattedItems = allItems.map((item, i) => ({
      id: `tb_page_${Date.now()}_${i}`,
      name: item.title,
      platform: "淘宝",
      category: keyword,
      price_range: item.price || "面议",
      colors: [],
      style: "",
      heat_score: Math.min(100, Math.floor(60 + Math.min(parseInt(item.sales) / 100, 40))),
      sales_volume: parseInt(item.sales) > 0 ? `${(parseInt(item.sales) / 10000).toFixed(1)}万+` : "",
      trend_type: parseInt(item.sales) > 10000 ? "全网爆款" : parseInt(item.sales) > 5000 ? "潜在爆款" : "爆款微调款",
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
      dataSource: "taobao_page_crawl",
      proxyUsed: !!(PROXY_HOST && PROXY_PORT),
    });

  } catch (error: any) {
    console.error("[淘宝爬虫] 错误:", error);
    return NextResponse.json({
      error: error.message || "淘宝爬虫失败",
    }, { status: 500 });
  }
}

/** 健康检查 */
export async function GET(request: NextRequest) {
  const configured = !!(PROXY_HOST && PROXY_PORT);
  return NextResponse.json({
    service: "taobao-page-crawl",
    configured,
    proxyProvider: "kuaidaili",
    help: configured ? null : "请注册快代理：https://www.kuaidaili.com/，然后设置环境变量 PROXY_HOST/PORT/USERNAME/PASSWORD",
  });
}
