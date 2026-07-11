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

// 视频平台识别（真实视频平台 + Vogue 官方秀场页作为兜底）
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
  { match: "toutiao.com", name: "今日头条" },
];
function videoPlatform(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").replace(/^m\./, "");
    const hit = VIDEO_PLATFORMS.find((p) => host.includes(p.match));
    if (hit) return hit.name;
    if (host.includes("vogue.com")) return "Vogue Runway";
    return null;
  } catch {
    return null;
  }
}

// Vogue Runway：国际一线奢侈品牌秀场官方页（未配置 YouTube key 时的兜底）
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
function vogueSeasonSlugs(seasonPart: string, year: number): string[] {
  switch (seasonPart) {
    case "春夏": return [`spring-${year}-ready-to-wear`];
    case "夏秋": return [`resort-${year}`];
    case "秋冬": return [`fall-${year}-ready-to-wear`];
    case "冬春": return [`pre-fall-${year}`];
    default: // 全年
      return [
        `spring-${year}-ready-to-wear`,
        `resort-${year}`,
        `fall-${year}-ready-to-wear`,
        `pre-fall-${year}`,
      ];
  }
}

async function findVogueVideo(brand: string, seasonPart: string, year: number): Promise<{ url: string; title: string } | null> {
  const slug = VOGUE_BRAND_SLUG[brand];
  if (!slug) return null;
  for (const s of vogueSeasonSlugs(seasonPart, year)) {
    const url = `https://www.vogue.com/fashion-shows/${s}/${slug}`;
    try {
      const resp = await fetch(url, {
        method: "HEAD",
        headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
        signal: AbortSignal.timeout(10000),
      });
      if (resp.status === 200) {
        return { url, title: `${brand} ${seasonPart} 秀场官方报道 · Vogue Runway` };
      }
    } catch {
      /* 该季节段无秀场页，尝试下一个 */
    }
  }
  return null;
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

        // 视频来源：YouTube Data API → Bing 真实视频 → Vogue 官方秀场页兜底
        const seasonForVideo = season.replace("全年", "").trim() || String(year);
        const ytKey = process.env.YOUTUBE_API_KEY || "";
        const ytQueries = [
          `${brand} ${seasonForVideo} runway full show`,
          `${brand} ${seasonForVideo} fashion show`,
          `${brand} ${seasonForVideo} 秀场`,
          `${brand} ${seasonForVideo} 走秀`,
        ];
        const ytResults = ytKey
          ? (await Promise.all(ytQueries.map((q) => searchYouTubeVideos(q, ytKey)))).flat()
          : [];

        const vogueVid = await findVogueVideo(brand, getSeasonPart(season), year);

        const videoSearches = [
          `${brand} ${seasonForVideo} 时装周 秀场 视频 回放`,
          `${brand} ${seasonForVideo} 秀场 B站`,
          `${brand} ${seasonForVideo} 时装周 完整视频 youtube`,
          `${brand} ${seasonForVideo} runway full show video`,
          `${brand} ${seasonForVideo} 走秀 视频`,
          `${brand} ${seasonForVideo} 发布会 视频`,
          `${brand} ${seasonForVideo} 时装秀 高清 视频`,
          `${brand} ${seasonForVideo} 秀场 完整版`,
        ];
        const videoItems = (await Promise.all(videoSearches.map(bingSearch))).flat();

        const seen = new Set<string>();
        const deduped = trendItems.filter((i) => {
          const k = i.title.substring(0, 20);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        // 合并视频：YouTube → Bing 真实视频 → Vogue 官方秀场页（按 URL 去重）
        const mergedVideos: { title: string; url: string }[] = [];
        for (const v of ytResults) {
          if (!mergedVideos.some((m) => m.url === v.url)) mergedVideos.push({ title: v.title, url: v.url });
        }
        for (const i of videoItems) {
          if (videoPlatform(i.url) && !mergedVideos.some((m) => m.url === i.url)) {
            mergedVideos.push({ title: i.title, url: i.url });
          }
        }
        if (vogueVid && !mergedVideos.some((m) => m.url === vogueVid.url)) {
          mergedVideos.push(vogueVid);
        }
        const seenVideoUrls = new Set<string>();
        const videos = mergedVideos
          .filter((m) => {
            if (seenVideoUrls.has(m.url)) return false;
            seenVideoUrls.add(m.url);
            return true;
          })
          .slice(0, 10)
          .map((m) => ({ title: m.title, url: m.url, platform: videoPlatform(m.url) || "Vogue Runway" }));

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
