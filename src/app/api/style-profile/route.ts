// app/api/style-profile/route.ts
// 形象管理（toC）— 用户形象档案读写
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 12 色彩季型（新标准）
export const SEASON_TYPES: Record<string, string> = {
  deep_cool: "深冷",
  deep_warm: "深暖",
  light_cool: "浅冷",
  light_warm: "浅暖",
  cool_bright: "冷亮",
  cool_soft: "冷柔",
  warm_bright: "暖亮",
  warm_soft: "暖柔",
  clear_cool: "净冷",
  clear_warm: "净暖",
  soft_cool: "柔冷",
  soft_warm: "柔暖",
};

// 风格标签库（新标准）
export const STYLE_TAGS: Record<string, string> = {
  ingenue: "少女型",
  elegant: "优雅型",
  romantic: "浪漫型",
  gamine: "少年型",
  trendy: "时尚型",
  classic: "古典型",
  natural: "自然型",
  dramatic: "戏剧型",
};

// 场合库
export const OCCASIONS: Record<string, string> = {
  work: "职场通勤",
  date: "约会休闲",
  travel: "出行旅游",
  social: "社交礼仪",
  home: "居家",
};

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function GET(req: NextRequest) {
  const openid = req.nextUrl.searchParams.get("openid");
  if (!openid) return NextResponse.json({ error: "缺少 openid" }, { status: 400 });

  let query = supabase.from("style_profiles").select("*");
  if (isUuid(openid)) {
    query = query.eq("user_id", openid);
  } else {
    query = query.eq("openid", openid);
  }
  const { data, error } = await query.maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data || null });
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const openid = b.openid;
    if (!openid) return NextResponse.json({ error: "缺少 openid" }, { status: 400 });

    const row: any = {
      openid: isUuid(openid) ? null : openid,
      user_id: isUuid(openid) ? openid : null,
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
      .upsert(row, { onConflict: isUuid(openid) ? "user_id" : "openid" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
