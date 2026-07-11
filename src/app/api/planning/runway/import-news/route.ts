import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * POST /api/planning/runway/import-news
 * 把秀场采集到的高清图片（Vogue Runway 秀场图）一键导入「流行资讯」（articles 表）
 *   body: { season: "2027 春夏", brand?: "香奈儿" }
 *   返回: { imported, skipped, total, items: [...] }
 *
 * 设计说明：
 * - 不新增数据列。图片资讯用 tag='秀场LOOK' 标记，图片转存到 Supabase products 桶（稳定、不被墙）。
 * - 每品牌每季生成一篇文章，正文为 Markdown 画廊（多张 LOOK），首图作封面，解决空白卡。
 * - 文章注明来源 Vogue Runway（高清秀场图，仅供灵感参考），并附 Vogue 视频页链接（订阅用户可看）。
 * - 按文章标题去重，重复导入不会生成重复条目。
 */

const NEWS_TAG = "秀场LOOK";

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

function vogueShowSlug(season: string): string {
  const ym = season.match(/(\d{4})/);
  const year = ym ? parseInt(ym[1], 10) : new Date().getFullYear();
  let part = "全年";
  for (const p of ["春夏", "夏秋", "秋冬", "冬春"]) if (season.includes(p)) { part = p; break; }
  switch (part) {
    case "春夏": return `spring-${year}-ready-to-wear`;
    case "秋冬": return `fall-${year}-ready-to-wear`;
    case "夏秋": return `resort-${year}`;
    case "冬春": return `pre-fall-${year}`;
    default: return `spring-${year}-ready-to-wear`;
  }
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

// 下载 Vogue 高清图（公开可访问），返回 buffer 或 null
async function fetchImageBuffer(imgUrl: string): Promise<Buffer | null> {
  try {
    const resp = await fetch(imgUrl, {
      headers: { "User-Agent": UA, Referer: "https://www.vogue.com/", Accept: "image/avif,image/webp,image/jpeg,*/*" },
      signal: AbortSignal.timeout(20000),
    });
    if (resp.ok) return Buffer.from(await resp.arrayBuffer());
  } catch {
    /* 忽略 */
  }
  return null;
}

// 转存到 Supabase products 桶，返回公开 URL
async function rehostImage(supabase: any, imgUrl: string): Promise<string | null> {
  const buf = await fetchImageBuffer(imgUrl);
  if (!buf) return null;
  const ext = imgUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
  const fname = `runway_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  try {
    const { data, error } = await supabase.storage
      .from("products")
      .upload(fname, buf, { contentType: `image/${ext}`, upsert: false });
    if (error || !data) return null;
    const { data: pub } = supabase.storage.from("products").getPublicUrl(data.path);
    return pub?.publicUrl || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { season, brand } = await req.json();
    if (!season) return NextResponse.json({ error: "请提供 season" }, { status: 400 });

    const supabase = createServiceRoleClient();

    // 读取该季节已采集的秀场趋势（含 videos，现存放图片媒体对象）
    let query = supabase.from("brand_runway_trends").select("brand, season, summary, videos").eq("season", season);
    if (brand) query = query.eq("brand", brand);
    const { data: rows, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 收集图片（kind 缺省视为 image），按 品牌|季节 分组
    const groups = new Map<string, { brand: string; season: string; summary: string; images: any[] }>();
    for (const r of rows || []) {
      const imgs = (r.videos || [])
        .filter((v: any) => (v.kind || "image") === "image" && v.url)
        .map((v: any) => ({ url: v.url, title: v.title || "" }));
      if (imgs.length === 0) continue;
      const key = `${r.brand}|${r.season}`;
      if (!groups.has(key)) groups.set(key, { brand: r.brand, season: r.season, summary: r.summary || "", images: [] });
      groups.get(key)!.images.push(...imgs);
    }

    if (groups.size === 0) {
      return NextResponse.json({
        imported: 0,
        skipped: 0,
        total: 0,
        items: [],
        message: `${season} 暂无采集到的秀场图片。请先在上方点击「采集秀场趋势」（图片源为 Vogue Runway 高清图库，国际一线品牌；国内品牌如江南布衣/之禾暂未覆盖）。`,
      });
    }

    // 已存在标题（去重）
    const { data: existing } = await supabase.from("articles").select("title").eq("tag", NEWS_TAG);
    const existingTitles = new Set((existing || []).map((e: any) => e.title));

    const items: any[] = [];
    const errors: any[] = [];
    let imported = 0;
    let skipped = 0;

    for (const g of groups.values()) {
      const title = `${g.brand} ${g.season} 秀场 LOOK · Vogue Runway`;
      if (existingTitles.has(title)) {
        skipped += 1;
        continue;
      }
      // 去重 + 限量
      const seenUrls = new Set<string>();
      const picked = g.images.filter((i: any) => {
        if (seenUrls.has(i.url)) return false;
        seenUrls.add(i.url);
        return true;
      }).slice(0, 15);

      // 转存图片到 Supabase
      const rehosted: string[] = [];
      for (const i of picked) {
        const u = await rehostImage(supabase, i.url);
        if (u) rehosted.push(u);
      }
      if (rehosted.length === 0) {
        errors.push({ title, error: "图片转存失败（Vogue 源不可达或被限流）" });
        continue;
      }

      const summary = (g.summary || "").slice(0, 160);
      const slug = VOGUE_BRAND_SLUG[g.brand];
      const vogueShowUrl = slug
        ? `https://www.vogue.com/fashion-shows/${vogueShowSlug(g.season)}/${slug}`
        : "https://www.vogue.com/fashion-shows";
      const gallery = rehosted.map((u) => `![](${u})`).join("\n\n");
      const content =
        (summary ? `${summary}\n\n` : "") +
        gallery +
        `\n\n> 秀场图片来源：Vogue Runway（高清秀场图，仅供灵感参考）` +
        `\n> ▶ 观看秀场视频（Vogue Runway，订阅用户可看）：${vogueShowUrl}`;

      const { data: inserted, error: insErr } = await supabase
        .from("articles")
        .insert({
          title,
          excerpt: summary || `${g.brand} ${g.season} 时装周秀场 LOOK`,
          content,
          image_url: rehosted[0],
          tag: NEWS_TAG,
          is_premium: false,
          is_published: true,
        })
        .select("id, title")
        .single();
      if (insErr) {
        console.error("[import-news] 插入失败:", insErr.message);
        errors.push({ title, error: insErr.message });
        continue;
      }
      existingTitles.add(title);
      imported += 1;
      items.push({ id: inserted?.id, title, count: rehosted.length, cover: rehosted[0], brand: g.brand });
    }

    return NextResponse.json({
      imported,
      skipped,
      total: groups.size,
      items,
      errors: errors.length > 0 ? errors : undefined,
      message: `成功导入 ${imported} 篇秀场 LOOK 到流行资讯${skipped > 0 ? `，跳过 ${skipped} 篇重复` : ""}${errors.length > 0 ? `，${errors.length} 篇转存失败` : ""}。`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
