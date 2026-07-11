import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * POST /api/planning/runway/import-news
 * 把秀场采集到的视频一键导入「流行资讯」（articles 表）
 *   body: { season: "2027 春夏", brand?: "香奈儿" }
 *   返回: { imported, skipped, total, items: [...] }
 *
 * 设计说明：
 * - 不新增数据列。视频资讯用 tag='秀场速报' 标记，视频链接内嵌进 content（Markdown）。
 * - 小程序端按 tag 识别视频资讯并展示「复制链接观看」。
 * - 按文章标题去重，重复导入不会生成重复条目。
 */

const NEWS_TAG = "秀场速报";

export async function POST(req: NextRequest) {
  try {
    // 管理员校验（与后台统一）
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { season, brand } = await req.json();
    if (!season) return NextResponse.json({ error: "请提供 season" }, { status: 400 });

    const supabase = createServiceRoleClient();

    // 读取该季节已采集的秀场趋势（含 videos）
    let query = supabase
      .from("brand_runway_trends")
      .select("brand, season, summary, videos")
      .eq("season", season);
    if (brand) query = query.eq("brand", brand);

    const { data: rows, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const videos = (rows || []).flatMap((r: any) =>
      (r.videos || []).map((v: any) => ({ ...v, _brand: r.brand, _summary: r.summary || "" }))
    );

    if (videos.length === 0) {
      return NextResponse.json({
        imported: 0,
        skipped: 0,
        total: 0,
        items: [],
        message: `${season} 暂无采集到的秀场视频，请先在上方「采集秀场趋势」。`,
      });
    }

    // 已存在的标题（去重）
    const { data: existing } = await supabase
      .from("articles")
      .select("title")
      .eq("tag", NEWS_TAG);
    const existingTitles = new Set((existing || []).map((e: any) => e.title));

    const items: any[] = [];
    const errors: any[] = [];
    let imported = 0;
    let skipped = 0;

    for (const v of videos) {
      const brandName = v._brand || "品牌";
      const vTitle = (v.title || "").replace(/\s*[-–|].*$/, "").trim().slice(0, 40) || "秀场视频";
      const title = `${brandName} ${season} 秀场视频 · ${v.platform || "回放"}`;
      if (existingTitles.has(title)) {
        skipped += 1;
        continue;
      }
      const summary = (v._summary || "").slice(0, 120);
      const content =
        (summary ? `${summary}\n\n` : "") +
        `▶ 观看秀场视频：[${vTitle}](${v.url})`;
      const { data: inserted, error: insErr } = await supabase
        .from("articles")
        .insert({
          title,
          excerpt: summary || `${brandName} ${season} 时装周秀场视频回放`,
          content,
          image_url: "",
          tag: NEWS_TAG,
          is_premium: false,
          is_published: true,
          author: brandName,
          published_at: new Date().toISOString(),
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
      items.push({ id: inserted?.id, title, url: v.url, platform: v.platform, brand: brandName });
    }

    return NextResponse.json({
      imported,
      skipped,
      total: videos.length,
      items,
      errors: errors.length > 0 ? errors : undefined,
      message: `成功导入 ${imported} 条秀场视频到流行资讯${skipped > 0 ? `，跳过 ${skipped} 条重复` : ""}${errors.length > 0 ? `，${errors.length} 条写入失败` : ""}。`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
