import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

/**
 * POST /api/planning/market-research
 * 商品企划的市场数据采集 + 分析增强
 *
 * 在生成企划之前，先采集真实市场数据注入AI，让企划更客观
 * 返回：市场热度、竞品价格带、流行风格、热销颜色、消费者评价关键词
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export async function POST(req: NextRequest) {
  try {
    const { keyword, season, style, priceBand } = await req.json();
    if (!keyword) {
      return NextResponse.json({ error: "请提供搜索关键词" }, { status: 400 });
    }

    // 构建搜索词
    const searchTerms = [
      `${keyword} ${season || ""} 爆款 热销`,
      `${keyword} ${style || ""} ${season || ""} 流行`,
      `${keyword} 搭配 推荐 ${season || "2025"}`,
    ].filter(t => t.trim().length > 5);

    interface MarketItem {
      title: string;
      price: string;
      sales: string;
      source: string;
      url: string;
      snippet: string;
    }

    const allItems: MarketItem[] = [];

    // 并行搜索
    const searchResults = await Promise.allSettled(
      searchTerms.map(async (term) => {
        const items: MarketItem[] = [];
        try {
          const url = `https://www.bing.com/search?q=${encodeURIComponent(term)}&setlang=zh-CN`;
          const resp = await fetch(url, {
            headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
            signal: AbortSignal.timeout(12000),
          });
          const html = await resp.text();
          const $ = cheerio.load(html);

          $("#b_results .b_algo").each((_, el) => {
            const title = $(el).find("h2 a").text().trim();
            const snippet = $(el).find(".b_caption p, p").text().trim();
            const link = $(el).find("h2 a").attr("href") || "";
            if (title && snippet) {
              const hostname = link ? (() => { try { return new URL(link).hostname.replace("www.", ""); } catch { return ""; } })() : "";
              const priceMatch = snippet.match(/[¥￥](\d+[-~]\d+|\d+)/);
              const salesMatch = snippet.match(/(\d+[\+\w]*)(人|件|次|笔|单)/);

              items.push({
                title,
                price: priceMatch ? priceMatch[1] : "",
                sales: salesMatch ? salesMatch[0] : "",
                source: hostname,
                url: link,
                snippet: snippet.substring(0, 300),
              });
            }
          });
        } catch (e: any) {
          console.error(`搜索"${term}"失败:`, e.message);
        }
        return items;
      })
    );

    for (const result of searchResults) {
      if (result.status === "fulfilled") {
        allItems.push(...result.value);
      }
    }

    // 去重
    const seen = new Set<string>();
    const deduped = allItems.filter(item => {
      const key = item.title.substring(0, 20);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 统计分析
    const prices = deduped.filter(i => i.price).map(i => {
      const nums = i.price.match(/\d+/g);
      if (nums && nums.length >= 2) return (parseInt(nums[0]) + parseInt(nums[1])) / 2;
      if (nums && nums.length === 1) return parseInt(nums[0]);
      return null;
    }).filter(Boolean) as number[];

    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // 颜色统计
    const colorKeywords = ["黑色", "白色", "红色", "蓝色", "绿色", "粉色", "灰色", "米白", "卡其", "驼色", "藏青", "焦糖", "酒红", "墨绿", "棕色", "杏色", "奶白", "雾霾蓝", "鹅黄", "香芋紫"];
    const allText = deduped.map(i => i.title + " " + i.snippet).join(" ");
    const colorCounts = colorKeywords
      .map(c => ({ color: c, count: (allText.match(new RegExp(c, "g")) || []).length }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count);

    // 风格统计
    const styleKeywords = ["休闲", "通勤", "法式", "韩系", "国潮", "极简", "复古", "甜美", "街头", "优雅", "运动", "轻奢", "知性", "浪漫", "中性"];
    const styleCounts = styleKeywords
      .map(s => ({ style: s, count: (allText.match(new RegExp(s, "g")) || []).length }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count);

    // 品类统计
    const categoryKeywords = ["连衣裙", "衬衫", "T恤", "外套", "西装", "风衣", "针织衫", "阔腿裤", "半裙", "卫衣", "马甲", "大衣", "羽绒服", "毛衣", "牛仔裤"];
    const categoryCounts = categoryKeywords
      .map(c => ({ category: c, count: (allText.match(new RegExp(c, "g")) || []).length }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count);

    // 来源分布
    const sourceDistribution = deduped.reduce((acc, item) => {
      const domain = item.source || "其他";
      let label = "综合";
      if (domain.includes("taobao") || domain.includes("tmall")) label = "淘宝/天猫";
      else if (domain.includes("xiaohongshu")) label = "小红书";
      else if (domain.includes("douyin")) label = "抖音";
      else if (domain.includes("jd.com")) label = "京东";
      else if (domain.includes("weibo")) label = "微博";
      else if (domain.includes("zhihu")) label = "知乎";
      else if (domain.includes("bilibili")) label = "B站";
      else if (domain.includes("1688")) label = "1688";
      else if (domain.includes("pinduoduo")) label = "拼多多";
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 用DeepSeek做市场洞察
    let marketInsight = "";
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (apiKey && deduped.length > 3) {
      try {
        const insightPrompt = `你是服装行业市场分析专家。基于以下真实互联网搜索数据，生成简短的市场洞察摘要（300字以内）：

搜索关键词：${keyword} ${season || ""} ${style || ""}
采集数据量：${deduped.length}条
价格区间：${minPrice}-${maxPrice}元，均价${avgPrice}元
热门颜色：${colorCounts.slice(0, 5).map(c => c.color).join("、")}
热门风格：${styleCounts.slice(0, 5).map(s => s.style).join("、")}
热门品类：${categoryCounts.slice(0, 5).map(c => c.category).join("、")}

Top搜索结果：
${deduped.slice(0, 8).map(i => `- ${i.title}（${i.source}）${i.price ? " 价格:" + i.price : ""}${i.sales ? " 销量:" + i.sales : ""}`).join("\n")}

请输出：
1. 市场热度评估
2. 价格带建议
3. 差异化机会点`;

        const insightResp = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: "你是服装行业市场分析专家，输出简洁客观。" },
              { role: "user", content: insightPrompt },
            ],
            temperature: 0.5,
            max_tokens: 800,
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (insightResp.ok) {
          const insightData = await insightResp.json();
          marketInsight = insightData.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.error("市场洞察生成失败:", e);
      }
    }

    return NextResponse.json({
      keyword,
      totalItems: deduped.length,
      priceAnalysis: {
        avg: avgPrice,
        min: minPrice,
        max: maxPrice,
        distribution: prices.length > 0 ? {
          "0-199": prices.filter(p => p < 200).length,
          "200-499": prices.filter(p => p >= 200 && p < 500).length,
          "500-999": prices.filter(p => p >= 500 && p < 1000).length,
          "1000+": prices.filter(p => p >= 1000).length,
        } : {},
      },
      topColors: colorCounts.slice(0, 10),
      topStyles: styleCounts.slice(0, 8),
      topCategories: categoryCounts.slice(0, 8),
      sourceDistribution,
      marketInsight,
      sampleItems: deduped.slice(0, 20),
      crawledAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
