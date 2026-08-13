// app/api/style-profile/route.ts
// 形象管理（toC）— 用户形象档案读写
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 12 色彩季型（Color Me Beautiful）
export const SEASON_TYPES: Record<string, string> = {
  light_spring: "浅春型",
  warm_spring: "暖春型",
  bright_spring: "亮春型",
  light_summer: "浅夏型",
  soft_summer: "柔夏型",
  cool_summer: "冷夏型",
  light_autumn: "浅秋型",
  soft_autumn: "柔秋型",
  deep_autumn: "深秋型",
  light_winter: "浅冬型",
  clear_winter: "净冬型",
  deep_winter: "深冬型",
};

// 风格标签库
export const STYLE_TAGS: Record<string, string> = {
  natural: "自然",
  elegant: "优雅",
  romantic: "浪漫",
  dramatic: "戏剧",
  classic: "古典",
  gamin: "少年",
  avant_garde: "前卫",
  sporty: "运动",
};

// 场合库
export const OCCASIONS: Record<string, string> = {
  work: "职场通勤",
  date: "约会休闲",
  travel: "出行旅游",
  social: "社交礼仪",
  home: "居家",
};

export async function GET(req: NextRequest) {
  const openid = req.nextUrl.searchParams.get("openid");
  if (!openid) return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
  const { data, error } = await supabase
    .from("style_profiles")
    .select("*")
    .eq("openid", openid)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data || null });
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const openid = b.openid;
    if (!openid) return NextResponse.json({ error: "缺少 openid" }, { status: 400 });

    const row: any = {
      openid,
      season_type: b.season_type || null,
      season_name: b.season_name || (b.season_type ? SEASON_TYPES[b.season_type] || null : null),
      style_tags: Array.isArray(b.style_tags) ? b.style_tags : [],
      body_type: b.body_type || null,
      height: b.height ? Number(b.height) : null,
      weight: b.weight ? Number(b.weight) : null,
      sizes: b.sizes && typeof b.sizes === "object" ? b.sizes : {},
      occasions: Array.isArray(b.occasions) ? b.occasions : [],
      full_body_photo: b.full_body_photo || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("style_profiles")
      .upsert(row, { onConflict: "openid" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
