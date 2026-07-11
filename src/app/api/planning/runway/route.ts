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

// Tagwalk：免费秀场图库（图片版流行资讯主源，替代被墙的 Vogue 视频）
// 设计师 slug 与 Vogue 基本一致，直接复用 VOGUE_BRAND_SLUG
function tagwalkSeasonMatch(url: string, seasonPart: string, year: number): boolean {
  // 只取文件名主体（去掉末尾哈希段），避免哈希里的数字误判年份
  const file = (url.split("/").pop() || "").toLowerCase().replace(/\.[a-z]+$/i, "");
  const base = file.split("-").slice(0, -1).join("-") || file;
  const yr = String(year);
  const yr2 = yr.slice(2);
  const hasYear = base.includes(yr) || base.includes(yr2);
  if (seasonPart === "全年") return true;
  if (seasonPart === "春夏") return /ss2\d|spring.?summer|ss20\d\d/.test(base) && hasYear;
  if (seasonPart === "秋冬") return /(fw2\d|fall.?winter|aw20\d\d|autumn)/.test(base) && hasYear;
  if (seasonPart === "夏秋") return /(cruise20\d\d|resort)/.test(base) && hasYear;
  if (seasonPart === "冬春") return /(prefall|pre-fall)/.test(base) && hasYear;
  return true;
}

async function findTagwalkImages(brand: string, seasonPart: string, year: number): Promise<string[]> {
  const slug = VOGUE_BRAND_SLUG[brand];
  if (!slug) return [];
  const url = `https://www.tag-walk.com/en/collection/search?designer=${slug}&notts=1`;
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
      signal: AbortSignal.timeout(15000),
    });
    const html = await resp.text();
    const urls = Array.from(
      new Set((html.match(/https?:\/\/cdn\.tag-walk\.com\/cover\/[^"'<>\s]+\.jpg/gi) || []))
    );
    const matched = seasonPart === "全年" ? urls : urls.filter((u) => tagwalkSeasonMatch(u, seasonPart, year));
    return matched.slice(0, 40);
  } catch {
    return [];
  }
}

// 品牌 slug 映射（Vogue Runway 与 Tagwalk 通用，复用同一套）
const VOGUE_BRAND_SLUG: Record<string, string> = {
  "香奈儿": "chanel",
  "迪奥": "christian-dior",
  "古驰": "gucci",
  "普拉达": "prada",
  "路易威登": "louis-vuitton",
  "爱马仕": "hermes",
  "圣罗兰": "saint-laurent",
  "巴黎世家": "balenciaga",
  "芬迪": "fendi",
  "思琳": "celine",
  "罗意威": "loewe",
};

const SEASON_PARTS_ALL = ["春夏", "夏秋", "秋冬", "冬春", "全年"];
function getSeasonPart(season: string): string {
  for (const p of SEASON_PARTS_ALL) if (season.includes(p)) return p;
  return "全年";
}
// YouTube Data API：搜索真实秀场视频（需要 YOUTUBE_API_KEY）
async function searchYouTubeVideos(query: string, apiKey: string): Promise<{ title: string; url: string; platform: string }[]> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${apiKey}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await resp.json();
    if (data.error) {
      console.error("[YouTube API] error:", data.error.message);
      return [];
    }
    return (data.items || []).map((item: any) => ({
      title: item.snippet?.title || "秀场视频",
      url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
      platform: "YouTube",
    }));
  } catch (e: any) {
    console.error("[YouTube API] exception:", e.message);
    return [];
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
    const yearMatch = String(season).match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

    const supabase = createServiceRoleClient();

    const results: any[] = [];

    // 逐品牌并行采集
    const brandResults = await Promise.allSettled(
      brandList.map(async (brand) => {
        // 趋势文本搜索（主色/风格/廓形/主题）
        const trendSearches = [
          `${brand} ${season} 时装周 发布会 秀场`,
          `${brand} ${season} 流行色 风格 单品`,
        ];
        const trendItems = (await Promise.all(trendSearches.map(bingSearch))).flat();

        // 图片来源：Tagwalk 免费秀场图库（按品牌+季节抓取，替代被墙的 Vogue 视频）
        const tagwalkImgs = await findTagwalkImages(brand, getSeasonPart(season), year);

        // 视频来源：YouTube Data API（仅当配置了 YOUTUBE_API_KEY）
        const ytKey = process.env.YOUTUBE_API_KEY || "";
        const seasonForVideo = season.replace("全年", "").trim() || String(year);
        const ytQueries = [
          `${brand} ${seasonForVideo} runway full show`,
          `${brand} ${seasonForVideo} fashion show`,
          `${brand} ${seasonForVideo} 秀场`,
          `${brand} ${seasonForVideo} 走秀`,
        ];
        const ytResults = ytKey
          ? (await Promise.all(ytQueries.map((q) => searchYouTubeVideos(q, ytKey)))).flat()
          : [];

        const seen = new Set<string>();
        const deduped = trendItems.filter((i) => {
          const k = i.title.substring(0, 20);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        // 合并媒体：图片（kind:image，Tagwalk）优先，视频（kind:video，YouTube）其次
        const media: { url: string; title: string; platform: string; kind: string }[] = [];
        const seasonLabel = getSeasonPart(season);
        for (const u of tagwalkImgs) {
          if (!media.some((m) => m.url === u)) {
            media.push({ url: u, title: `${brand} ${seasonLabel} ${year} 秀场 LOOK`, platform: "Tagwalk", kind: "image" });
          }
        }
        for (const v of ytResults) {
          if (!media.some((m) => m.url === v.url)) {
            media.push({ url: v.url, title: v.title, platform: v.platform, kind: "video" });
          }
        }
        const videos = media.slice(0, 15).map((m) => ({ url: m.url, title: m.title, platform: m.platform, kind: m.kind }));

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
