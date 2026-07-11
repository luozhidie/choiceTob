import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * POST /api/planning/runway
 * 采集一线品牌发布会/秀场趋势，结构化提取主色/风格/廓形/主题，写入 brand_runway_trends
 *
 * body: { season: "2027 春夏", brands?: string[] }
 * 返回: { season, brands: [...], overall: {...}, collectedAt }
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

// 默认一线品牌（国际 + 国内）
const DEFAULT_BRANDS = [
  "香奈儿", "迪奥", "古驰", "普拉达", "路易威登", "爱马仕",
  "圣罗兰", "巴黎世家", "芬迪", "思琳", "罗意威", "博柏利",
  "江南布衣", "之禾", "例外",
];

// 关键词词典
const COLOR_KEYWORDS = ["黑色", "白色", "红色", "蓝色", "绿色", "粉色", "灰色", "米白", "卡其", "驼色", "藏青", "焦糖", "酒红", "墨绿", "棕色", "杏色", "奶白", "雾霾蓝", "鹅黄", "香芋紫", "薄荷绿", "芭蕾粉", "金属色", "银色", "铬色", "橄榄绿", "勃艮第红", "牛仔蓝", "奶油色", "陶土色", "荧光色"];
const STYLE_KEYWORDS = ["静奢", "老钱", "新中式", "芭蕾风", "运动", "极简", "复古", "甜酷", "解构", "哥特", "Y2K", "学院", "废土", "机能", "度假", "中性", "浪漫", "优雅", "街头", "前卫", "性感", "田园", "未来感", "暗黑"];
const SILHOUETTE_KEYWORDS = ["大衣", "西装", "阔腿裤", "半裙", "连衣裙", "针织", "抹胸", "裹身裙", "廓形", "斗篷", "工装", "羽绒", "马甲", "衬衫", "吊带", "拖地裤", "迷你裙", "长裙", "泡泡袖", "垫肩"];
const THEME_KEYWORDS = ["环保", "可持续", "中性化", "复古回潮", "科技感", "手工艺", "高定", "街头", "东方", "未来主义", "自然", "女性力量"];

function countKeywords(text: string, keywords: string[]) {
  return keywords
    .map((k) => ({ key: k, count: (text.match(new RegExp(k, "g")) || []).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
}

function topFrom(counts: { key: string; count: number }[], n = 5) {
  return counts.slice(0, n).map((x) => x.key);
}

// 视频平台识别
const VIDEO_PLATFORMS: { match: string; name: string }[] = [
  { match: "youtube.com", name: "YouTube" },
  { match: "youtu.be", name: "YouTube" },
  { match: "bilibili.com", name: "B站" },
  { match: "b23.tv", name: "B站" },
  { match: "douyin.com", name: "抖音" },
  { match: "v.douyin.com", name: "抖音" },
  { match: "ixigua.com", name: "西瓜视频" },
  { match: "weibo.com", name: "微博" },
  { match: "youku.com", name: "优酷" },
  { match: "v.qq.com", name: "腾讯视频" },
  { match: "xiaohongshu.com", name: "小红书" },
  { match: "kuaishou.com", name: "快手" },
];
function videoPlatform(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    const hit = VIDEO_PLATFORMS.find((p) => host.includes(p.match));
    return hit ? hit.name : null;
  } catch {
    return null;
  }
}

async function bingSearch(term: string): Promise<{ title: string; snippet: string; url: string }[]> {
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(term)}&setlang=zh-CN`;
    const resp = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9" },
      signal: AbortSignal.timeout(12000),
    });
    const html = await resp.text();
    const $ = cheerio.load(html);
    const items: { title: string; snippet: string; url: string }[] = [];
    $("#b_results .b_algo").each((_, el) => {
      const title = $(el).find("h2 a").text().trim();
      const snippet = $(el).find(".b_caption p, p").text().trim();
      const link = $(el).find("h2 a").attr("href") || "";
      if (title && snippet) items.push({ title, snippet: snippet.substring(0, 300), url: link });
    });
    return items;
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    // 管理员校验（与后台统一）
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { season, brands } = await req.json();
    if (!season) return NextResponse.json({ error: "请提供 season，如 2027 春夏" }, { status: 400 });

    const brandList: string[] = Array.isArray(brands) && brands.length > 0 ? brands : DEFAULT_BRANDS;
    const yearMatch = String(season).match(/(20\d{2})/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

    const supabase = createServiceRoleClient();

    const results: any[] = [];

    // 逐品牌并行采集（每品牌 2 条搜索）
    const brandResults = await Promise.allSettled(
      brandList.map(async (brand) => {
        const searches = [
          `${brand} ${season} 时装周 发布会 秀场`,
          `${brand} ${season} 流行色 风格 单品`,
          `${brand} ${season} 时装周 秀场 视频 回放`,
        ];
        const fetchedAll = await Promise.all(searches.map(bingSearch));
        const trendItems = fetchedAll.slice(0, 2).flat();
        const videoItems = fetchedAll[2] || [];

        const seen = new Set<string>();
        const deduped = trendItems.filter((i) => {
          const k = i.title.substring(0, 20);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        // 视频链接（过滤视频平台）
        const videos = videoItems
          .filter((i) => videoPlatform(i.url))
          .slice(0, 6)
          .map((i) => ({ title: i.title, url: i.url, platform: videoPlatform(i.url) }));

        const allText = deduped.map((i) => i.title + " " + i.snippet).join(" ");
        const colors = countKeywords(allText, COLOR_KEYWORDS);
        const styles = countKeywords(allText, STYLE_KEYWORDS);
        const silhouettes = countKeywords(allText, SILHOUETTE_KEYWORDS);
        const themes = countKeywords(allText, THEME_KEYWORDS);

        // 用 DeepSeek 给该品牌本季一句话总结
        let summary = "";
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (apiKey && deduped.length > 2) {
          try {
            const sp = `你是时尚趋势分析师。基于以下关于「${brand} ${season} 发布会」的搜索摘要，用一句中文（60字内）总结该品牌本季核心趋势信号（主色/风格/廓形）：\n\n${deduped.slice(0, 6).map((i) => "- " + i.snippet).join("\n")}`;
            const r = await fetch("https://api.deepseek.com/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
              body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: sp }], temperature: 0.5, max_tokens: 200 }),
              signal: AbortSignal.timeout(25000),
            });
            if (r.ok) summary = (await r.json()).choices?.[0]?.message?.content?.trim() || "";
          } catch { /* 忽略 */ }
        }

        const record = {
          season, year, brand,
          source_url: deduped[0]?.url || null,
          snippet: deduped[0]?.snippet || null,
          dominant_colors: topFrom(colors, 6),
          dominant_styles: topFrom(styles, 6),
          key_silhouettes: topFrom(silhouettes, 6),
          themes: topFrom(themes, 6),
          summary,
          videos,
        };

        // 覆盖式写入（同品牌同季先删后插，支持重采）
        await supabase.from("brand_runway_trends").delete().eq("season", season).eq("brand", brand);
        await supabase.from("brand_runway_trends").insert(record);

        return { ...record, sourceCount: deduped.length };
      })
    );

    for (const r of brandResults) {
      if (r.status === "fulfilled") results.push(r.value);
    }

    // 整体汇总
    const allColors: Record<string, number> = {};
    const allStyles: Record<string, number> = {};
    const allSil: Record<string, number> = {};
    const allThemes: Record<string, number> = {};
    for (const b of results) {
      (b.dominant_colors || []).forEach((c: string) => (allColors[c] = (allColors[c] || 0) + 1));
      (b.dominant_styles || []).forEach((s: string) => (allStyles[s] = (allStyles[s] || 0) + 1));
      (b.key_silhouettes || []).forEach((s: string) => (allSil[s] = (allSil[s] || 0) + 1));
      (b.themes || []).forEach((t: string) => (allThemes[t] = (allThemes[t] || 0) + 1));
    }
    const overall = {
      topColors: Object.entries(allColors).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k),
      topStyles: Object.entries(allStyles).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k),
      topSilhouettes: Object.entries(allSil).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k),
      topThemes: Object.entries(allThemes).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k),
    };

    return NextResponse.json({ season, year, brands: results, overall, collectedAt: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
