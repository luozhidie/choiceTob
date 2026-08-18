// app/api/wardrobe/outfits/route.ts
// 按场合生成限量搭配：基于用户 style_profiles（色彩季型 + 风格 + 场合偏好），
// 从在售商品中按"季节匹配 +2 / 风格匹配 +1"打分，为每个场合挑出最高分造型。
// 最多返回 3 套，limited:true（限量，引导开通每日搭配灵感）。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const OCCASION_NAMES: Record<string, string> = {
  work: "通勤",
  date: "约会",
  travel: "出游",
  social: "社交",
  daily: "日常",
  banquet: "宴席",
  sport: "运动",
};

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function GET(req: NextRequest) {
  const openid = req.nextUrl.searchParams.get("openid");
  if (!openid) return NextResponse.json({ error: "缺少 openid" }, { status: 400 });

  // 1. 读形象档案
  let profQuery = supabase.from("style_profiles").select("season_type, style_tags, occasions");
  if (isUuid(openid)) profQuery = profQuery.eq("user_id", openid);
  else profQuery = profQuery.eq("openid", openid);
  const { data: profile } = await profQuery.maybeSingle();

  // 无档案：返回空，前端提示先去形象档案完善
  if (!profile) {
    return NextResponse.json({ profile: null, occasions: [], limited: true });
  }

  // 2. 读在售商品
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select(
      "id, title, name, image_url, cover_image, category, price, original_price, color_season_codes, style_tag_codes"
    )
    .eq("is_published", true)
    .limit(400);
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const seasons = profile.season_type ? [profile.season_type] : [];
  const styles = Array.isArray(profile.style_tags) ? profile.style_tags : [];

  function score(p: any): number {
    let s = 0;
    const pSeasons = Array.isArray(p.color_season_codes) ? p.color_season_codes : [];
    const pStyles = Array.isArray(p.style_tag_codes) ? p.style_tag_codes : [];
    if (pSeasons.some((x: string) => seasons.includes(x))) s += 2;
    if (pStyles.some((x: string) => styles.includes(x))) s += 1;
    return s;
  }

  const scored = (products || []).map((p: any) => ({ ...p, _score: score(p) }));
  const top = scored.filter((p: any) => p._score > 0).sort((a: any, b: any) => b._score - a._score);

  // 3. 按场合生成（最多 3 套，每套最多 3 件，尽量不同品类）
  const occasionCodes = Array.isArray(profile.occasions) && profile.occasions.length ? profile.occasions : ["daily"];
  const occasions = occasionCodes.slice(0, 3).map((code: string) => {
    const picked: any[] = [];
    const usedCats = new Set<string>();
    for (const p of top) {
      if (picked.length >= 3) break;
      const cat = p.category || "";
      if (cat && usedCats.has(cat)) continue;
      picked.push(p);
      if (cat) usedCats.add(cat);
    }
    if (picked.length < 3) {
      for (const p of top) {
        if (picked.length >= 3) break;
        if (!picked.find((x: any) => x.id === p.id)) picked.push(p);
      }
    }
    return {
      code,
      name: OCCASION_NAMES[code] || code,
      items: picked.map((p: any) => ({
        id: p.id,
        title: p.title || p.name || "商品",
        image_url: p.image_url || p.cover_image || null,
        price: p.price || 0,
        original_price: p.original_price || null,
        category: p.category || null,
      })),
    };
  });

  return NextResponse.json({
    profile: {
      season_type: profile.season_type,
      style_tags: profile.style_tags,
      occasions: profile.occasions,
    },
    occasions,
    limited: true,
  });
}
