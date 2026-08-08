import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/inspiration
 * 获取已发布的搭配灵感列表
 * Query: ?style_tag=xxx&season_tag=xxx&page=1&limit=20
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const style_tag = searchParams.get("style_tag");
    const season_tag = searchParams.get("season_tag");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    let query = supabase
      .from("outfit_matches")
      .select("*", { count: "exact" })
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 客户端筛选（style_tags 和 season_tags 是数组字段）
    let filtered = data || [];
    if (style_tag) {
      filtered = filtered.filter((o: any) => o.style_tags && o.style_tags.includes(style_tag));
    }
    if (season_tag) {
      filtered = filtered.filter((o: any) => o.season_tags && o.season_tags.includes(season_tag));
    }

    return NextResponse.json({
      data: filtered,
      total: count || 0,
      page,
      limit,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
