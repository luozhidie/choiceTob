import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

/**
 * POST /api/trend/crawl
 * 爆款数据采集 API
 * 
 * 策略：
 * 1. DeepSeek AI 生成高质量爆款数据（主要来源，100%可用）
 * 2. Google搜索（Vercel海外服务器可直接访问）
 * 3. Bing搜索（备选）
 * 4. 各平台直爬（淘宝/小红书/微博/1688）
 */

interface CrawledItem {
  name: string;
  platform: string;
  category: string;
  price_range: string;
  colors: string[];
  style: string;
  heat_score: number;
  sales_volume: string;
  trend_type: string;
  source_url: string;
  image_url: string;
  keywords: string[];
  description: string;
}

const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
];
function getUA() { return UAS[Math.floor(Math.random() * UAS.length)]; }

// ==================== DeepSeek AI 生成爆款数据（主要来源）====================
async function generateAIItems(keyword: string, count: number = 15): Promise<CrawledItem[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.log('[Crawl] AI API Key未配置，跳过AI生成');
    return [];
  }

  try {
    const prompt = `你是资深服装买手，基于关键词"${keyword}"，生成${count}个真实具体的爆款服装商品。

要求：
1. 每个商品名称要真实具体，包含年份+季节+风格+品类（如"2026夏季法式复古碎花连衣裙 高腰显瘦款"）
2. 价格区间合理（零售价¥89-599，批发价¥35-280）
3. 热度分根据真实市场（60-98分），高热度给90+分
4. 销量用真实表述（如"月销2.3w+""已售5.8万件"）
5. 来源平台分布：淘宝/天猫(4个)、小红书(3个)、抖音(3个)、1688(3个)、微博(2个)
6. 每个商品要有1-3个颜色标签和1个风格标签
7. trend_type: 热度≥85为"全网爆款"，70-84为"潜在爆款"，<70为"爆款微调款"
8. 每个商品写一句简短的爆款原因描述

只返回JSON数组（不要任何其他文字）：
[
  {"name":"商品全称","platform":"淘宝","price_range":"¥168","heat_score":92,"sales_volume":"月销3.2w+","trend_type":"全网爆款","colors":["粉色","白色"],"style":"法式","description":"高腰A字版型显瘦，碎花元素本季热度上升40%"},
  ...
]`;

    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!resp.ok) {
      console.error('[Crawl] AI API返回错误:', resp.status);
      return [];
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // 提取JSON数组
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const aiItems = JSON.parse(jsonMatch[0]);
      console.log(`[Crawl] AI生成 ${aiItems.length} 条数据`);
      
      return aiItems.map((item: any, i: number) => ({
        name: item.name || `${keyword}商品${i + 1}`,
        platform: item.platform || "综合",
        category: keyword,
        price_range: item.price_range || "",
        colors: item.colors || [],
        style: item.style || "",
        heat_score: typeof item.heat_score === 'number' ? item.heat_score : Math.floor(Math.random() * 30) + 60,
        sales_volume: item.sales_volume || "",
        trend_type: item.trend_type || "潜在爆款",
        source_url: "",
        image_url: item.image_url || "",
        keywords: [keyword, ...(item.colors || []), item.style].filter(Boolean),
        description: item.description || "",
      }));
    }
  } catch (e: any) {
    console.error("[Crawl] AI生成失败:", e.message);
  }
  return [];
}

// ==================== Google搜索（Vercel海外服务器可直接访问）====================
async function crawlGoogle(keyword: string): Promise<CrawledItem[]> {
  const items: CrawledItem[] = [];
  try {
    // 用Google搜索服装相关内容
    const url = `https://www.google.com/search?q=${encodeURIComponent(keyword + ' 服装 爆款 热销')}&hl=zh-CN&num=20`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": getUA(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) return items;
    const html = await resp.text();
    const $ = cheerio.load(html);

    // Google搜索结果卡片
    $('div.g, div[data-ved]').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('h3').first().text().trim();
        const snippet = $el.find('.VwiC3b, .s3v94d, span').first().text().trim();
        const link = $el.find('a').first().attr('href') || '';

        if (title && title.length > 5 && !title.includes('Google') && !title.includes('广告')) {
          let platform = "综合";
          if (link.includes('taobao') || link.includes('tmall')) platform = "淘宝/天猫";
          else if (link.includes('xiaohongshu')) platform = "小红书";
          else if (link.includes('douyin') || link.includes('iesdouyin')) platform = "抖音";
          else if (link.includes('1688')) platform = "1688";
          else if (link.includes('jd.com')) platform = "京东";
          else if (link.includes('pinduoduo')) platform = "拼多多";

          items.push({
            name: title.substring(0, 200),
            platform,
            category: keyword,
            price_range: extractPrice(snippet),
            colors: extractColors(snippet + ' ' + title),
            style: extractStyle(snippet + ' ' + title),
            heat_score: Math.floor(Math.random() * 25) + 55,
            sales_volume: "",
            trend_type: "潜在爆款",
            source_url: link,
            image_url: "",
            keywords: [keyword],
            description: snippet.substring(0, 300),
          });
        }
      } catch (e) {}
    });

    console.log(`[Crawl] Google返回 ${items.length} 条`);
  } catch (e: any) {
    console.error("[Crawl] Google失败:", e.message);
  }
  return items;
}

// ==================== Bing搜索（备选）====================
async function crawlBing(keyword: string): Promise<CrawledItem[]> {
  const items: CrawledItem[] = [];
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(keyword + ' 服装')}&setlang=zh-CN&count=20`;
    const resp = await fetch(url, {
      headers: { "User-Agent": getUA(), "Accept-Language": "zh-CN,zh;q=0.9" },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) return items;
    const html = await resp.text();
    const $ = cheerio.load(html);

    $("#b_results .b_algo").each((_, el) => {
      const title = $(el).find("h2 a").text().trim();
      const snippet = $(el).find(".b_caption p, .b_lineclamp2").text().trim();
      const link = $(el).find("h2 a").attr("href") || "";
      if (title && snippet && title.length > 5) {
        let platform = "综合";
        try {
          const source = new URL(link).hostname.replace("www.", "");
          if (source.includes('taobao') || source.includes('tmall')) platform = "淘宝/天猫";
          else if (source.includes('xiaohongshu')) platform = "小红书";
          else if (source.includes('douyin')) platform = "抖音";
          else if (source.includes('1688')) platform = "1688";
        } catch {}

        items.push({
          name: title, platform, category: keyword,
          price_range: extractPrice(snippet),
          colors: extractColors(snippet),
          style: extractStyle(snippet),
          heat_score: Math.floor(Math.random() * 25) + 55,
          sales_volume: "", trend_type: "潜在爆款",
          source_url: link, image_url: "",
          keywords: [keyword], description: snippet,
        });
      }
    });

    console.log(`[Crawl] Bing返回 ${items.length} 条`);
  } catch (e: any) {
    console.error("[Crawl] Bing失败:", e.message);
  }
  return items;
}

// ==================== 淘宝搜索 ====================
async function crawlTaobao(keyword: string): Promise<CrawledItem[]> {
  const items: CrawledItem[] = [];
  try {
    const url = `https://s.taobao.com/search?q=${encodeURIComponent(keyword)}&sort=sale-desc`;
    const resp = await fetch(url, {
      headers: { "User-Agent": getUA(), "Accept-Language": "zh-CN,zh;q=0.9" },
      signal: AbortSignal.timeout(12000),
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    const scriptTags = $("script").toArray();
    for (const script of scriptTags) {
      const content = $(script).html() || "";
      const match = content.match(/g_page_config\s*=\s*(\{[\s\S]*?\});/m);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          const auctions = data?.mods?.itemlist?.data?.auctions || [];
          for (const item of auctions.slice(0, 10)) {
            items.push({
              name: item.raw_title || item.title || "",
              platform: "淘宝",
              category: keyword,
              price_range: item.view_price || "",
              colors: [],
              style: "",
              heat_score: calcHeatScore(item.view_sales || ""),
              sales_volume: item.view_sales || "",
              trend_type: "全网爆款",
              source_url: `https://item.taobao.com/item.htm?id=${item.item_id || item.id}`,
              image_url: item.pic_url ? (item.pic_url.startsWith("//") ? "https:" + item.pic_url : item.pic_url) : "",
              keywords: [keyword],
              description: "",
            });
          }
        } catch (e) {}
        break;
      }
    }
    console.log(`[Crawl] 淘宝返回 ${items.length} 条`);
  } catch (e: any) {
    console.error("[Crawl] 淘宝失败:", e.message);
  }
  return items;
}

// ==================== 小红书搜索 ====================
async function crawlXiaohongshu(keyword: string): Promise<CrawledItem[]> {
  const items: CrawledItem[] = [];
  try {
    const url = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": getUA(), "Accept-Language": "zh-CN,zh;q=0.9", "Referer": "https://www.xiaohongshu.com/" },
      signal: AbortSignal.timeout(12000),
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    const scripts = $("script").toArray();
    for (const script of scripts) {
      const text = $(script).html() || "";
      const match = text.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/m);
      if (match) {
        try {
          const data = JSON.parse(match[1].replace(/undefined/g, "null"));
          const notes = data?.search?.notes || [];
          for (const note of notes.slice(0, 10)) {
            const nd = note.note_card || note;
            items.push({
              name: nd.title || nd.display_title || "",
              platform: "小红书", category: keyword, price_range: "",
              colors: [], style: "",
              heat_score: Math.min(100, Math.round((nd.interact_info?.liked_count || 0) / 100)),
              sales_volume: `${nd.interact_info?.liked_count || 0}赞`,
              trend_type: (nd.interact_info?.liked_count || 0) > 10000 ? "全网爆款" : "潜在爆款",
              source_url: `https://www.xiaohongshu.com/explore/${nd.note_id || note.id}`,
              image_url: nd.cover?.url || nd.image_list?.[0]?.url || "",
              keywords: [keyword], description: nd.desc || "",
            });
          }
        } catch (e) {}
        break;
      }
    }
    console.log(`[Crawl] 小红书返回 ${items.length} 条`);
  } catch (e: any) {
    console.error("[Crawl] 小红书失败:", e.message);
  }
  return items;
}

// ==================== 1688批发 ====================
async function crawl1688(keyword: string): Promise<CrawledItem[]> {
  const items: CrawledItem[] = [];
  try {
    const url = `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(keyword)}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": getUA(), "Accept-Language": "zh-CN,zh;q=0.9" },
      signal: AbortSignal.timeout(12000),
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    $(".sm-offer-item, .offer-item").each((_, el) => {
      const name = $(el).find(".title, .offer-title a").text().trim();
      const price = $(el).find(".price-value, .price").text().trim();
      const sales = $(el).find(".sale-num, .sales").text().trim();
      const img = $(el).find("img").attr("src") || $(el).find("img").attr("data-lazyload-src") || "";
      if (name) {
        items.push({
          name, platform: "1688", category: keyword, price_range: price,
          colors: [], style: "", heat_score: calcHeatScore(sales),
          sales_volume: sales, trend_type: calcTrendType(sales),
          source_url: $(el).find("a").attr("href") || "",
          image_url: img.startsWith("//") ? "https:" + img : img,
          keywords: [keyword, "批发"], description: "",
        });
      }
    });
    console.log(`[Crawl] 1688返回 ${items.length} 条`);
  } catch (e: any) {
    console.error("[Crawl] 1688失败:", e.message);
  }
  return items;
}

// ==================== 微博搜索 ====================
async function crawlWeibo(keyword: string): Promise<CrawledItem[]> {
  const items: CrawledItem[] = [];
  try {
    const url = `https://s.weibo.com/weibo?q=${encodeURIComponent(keyword)}&xsort=hot`;
    const resp = await fetch(url, {
      headers: { "User-Agent": getUA(), "Accept-Language": "zh-CN,zh;q=0.9" },
      signal: AbortSignal.timeout(12000),
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    $(".card-wrap .card").each((_, el) => {
      const name = $(el).find(".txt span").text().trim() || $(el).find("p.txt").text().trim();
      const hotNum = $(el).find(".card-act li:first span, .num").text().trim();
      if (name && name.length > 2) {
        items.push({
          name: name.substring(0, 100), platform: "微博", category: keyword,
          price_range: "", colors: [], style: "",
          heat_score: calcHeatScore(hotNum),
          sales_volume: hotNum ? `${hotNum}讨论` : "",
          trend_type: "潜在爆款",
          source_url: $(el).find("a[action-type]").attr("href") || "",
          image_url: $(el).find("img").attr("src") || "",
          keywords: [keyword], description: "",
        });
      }
    });
    console.log(`[Crawl] 微博返回 ${items.length} 条`);
  } catch (e: any) {
    console.error("[Crawl] 微博失败:", e.message);
  }
  return items;
}

// ==================== 辅助函数 ====================
function calcHeatScore(salesStr: string): number {
  if (!salesStr) return 30;
  const num = parseInt(salesStr.replace(/[^\d]/g, ""));
  if (isNaN(num)) return 30;
  if (num >= 10000) return 90 + Math.min(10, Math.floor(num / 50000));
  if (num >= 1000) return 70 + Math.floor(num / 1000);
  if (num >= 100) return 50 + Math.floor(num / 100);
  return 30 + Math.floor(num / 10);
}

function calcTrendType(salesStr: string): string {
  const score = calcHeatScore(salesStr);
  if (score >= 80) return "全网爆款";
  if (score >= 60) return "潜在爆款";
  return "爆款微调款";
}

function extractPrice(text: string): string {
  const priceMatch = text.match(/¥?(\d+[-~]\d+|¥\d+)/);
  return priceMatch ? priceMatch[1] : "";
}

function extractColors(text: string): string[] {
  const colorKeywords = ["黑色", "白色", "红色", "蓝色", "绿色", "粉色", "灰色", "米白", "卡其", "驼色", "藏青", "焦糖", "酒红", "墨绿", "棕色", "杏色", "紫色", "黄色", "橙色"];
  return colorKeywords.filter(c => text.includes(c));
}

function extractStyle(text: string): string {
  const styleKeywords = ["休闲", "通勤", "法式", "韩系", "国潮", "极简", "复古", "甜美", "街头", "优雅", "运动", "轻奢", "OL", "学院", "日系", "欧美"];
  const found = styleKeywords.filter(s => text.includes(s));
  return found[0] || "";
}

// ==================== 主接口 ====================
export async function POST(req: NextRequest) {
  try {
    const { keyword, sources } = await req.json();
    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: "请输入关键词" }, { status: 400 });
    }

    const kw = keyword.trim();
    const enabledSources = sources || ["general", "taobao", "xiaohongshu", "weibo", "1688"];
    let allItems: CrawledItem[] = [];

    console.log(`[Crawl] ===== 开始采集 "${kw}" =====`);

    // 第1步：AI生成高质量数据（主要来源）
    console.log(`[Crawl] Step 1: AI生成...`);
    const aiItems = await generateAIItems(kw, 15);
    if (aiItems.length > 0) {
      allItems.push(...aiItems);
      console.log(`[Crawl] AI生成 ${aiItems.length} 条`);
    }

    // 第2步：并行爬虫（Google/Bing/各平台）
    const crawlTasks: Promise<CrawledItem[]>[] = [];
    if (enabledSources.includes("general")) {
      crawlTasks.push(crawlGoogle(kw));
      crawlTasks.push(crawlBing(kw));
    }
    if (enabledSources.includes("taobao")) crawlTasks.push(crawlTaobao(kw));
    if (enabledSources.includes("xiaohongshu")) crawlTasks.push(crawlXiaohongshu(kw));
    if (enabledSources.includes("weibo")) crawlTasks.push(crawlWeibo(kw));
    if (enabledSources.includes("1688")) crawlTasks.push(crawl1688(kw));

    if (crawlTasks.length > 0) {
      console.log(`[Crawl] Step 2: 并行爬取 ${crawlTasks.length} 个平台...`);
      const results = await Promise.allSettled(crawlTasks);
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.length > 0) {
          allItems.push(...result.value);
        }
      }
    }

    console.log(`[Crawl] 总计 ${allItems.length} 条原始数据`);

    // 去重（按名称前20字）
    const seen = new Set<string>();
    const deduped = allItems.filter(item => {
      const key = item.name.substring(0, 20).trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 按热度排序
    deduped.sort((a, b) => b.heat_score - a.heat_score);

    // 统计分析
    const stats = {
      total: deduped.length,
      byPlatform: deduped.reduce((acc, item) => {
        acc[item.platform] = (acc[item.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: deduped.reduce((acc, item) => {
        acc[item.trend_type] = (acc[item.trend_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      topStyles: Object.entries(
        deduped.filter(i => i.style).reduce((acc, item) => {
          acc[item.style] = (acc[item.style] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topColors: Object.entries(
        deduped.flatMap(i => i.colors).reduce((acc, c) => {
          acc[c] = (acc[c] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1]).slice(0, 8),
      avgHeat: deduped.length > 0
        ? Math.round(deduped.reduce((s, i) => s + i.heat_score, 0) / deduped.length)
        : 0,
    };

    return NextResponse.json({
      keyword: kw,
      items: deduped.slice(0, 50),
      stats,
      crawledAt: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error("[Crawl] API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
