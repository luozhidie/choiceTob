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

// 主风格码 -> 中文（覆盖前端 STYLE_DATA 的真实码，含男士 _m 后缀）
const MAIN_STYLE_MAP: Record<string, string> = {
  girl: "少女型", elegant: "优雅型", romantic: "浪漫型", boyish: "少年型",
  fashion: "时尚型", classic: "古典型", natural: "自然型", dramatic: "戏剧型",
  dramatic_m: "戏剧型", natural_m: "自然型", classic_m: "古典型", romantic_m: "浪漫型", fashion_m: "时尚型",
};
// 从 style_tags 解析唯一风格结论（与前端 STYLE_DATA 码一致）
// 单选模式：tags 要么=[主风格码]（纯风格），要么=[偏风格码]（主偏某风格）
function parseStyles(tags: string[]): { main_style: string; sub_style: string } {
  const t = (tags || [])[0] || "";
  if (!t) return { main_style: "", sub_style: "" };
  const isMen = t.indexOf("_m") > -1;
  let mainCode = "";
  let subCode = "";
  if (MAIN_STYLE_MAP[t]) {
    mainCode = t; // 纯主风格
  } else {
    subCode = t; // 偏风格码
    const parts = t.split("_");
    mainCode = isMen && parts.length >= 2 ? parts[0] + "_m" : parts[0];
  }
  const main = MAIN_STYLE_MAP[mainCode] || "";
  let sub = "";
  if (subCode) {
    for (const p of subCode.split("_")) {
      const test = isMen && !MAIN_STYLE_MAP[p] ? p + "_m" : p;
      if (MAIN_STYLE_MAP[test] && test !== mainCode) {
        sub = "偏" + MAIN_STYLE_MAP[test].replace("型", "");
        break;
      }
    }
  }
  return { main_style: main, sub_style: sub };
}
// 形象档案同步到 vip_customers（source='profile'，仅管理员可见）
async function syncProfileToVip(b: any, openid: string) {
  try {
    const ownerId = isUuid(openid) ? openid : openid;
    const hasMale = (b.style_tags || []).some((t: string) => t.indexOf("_m") > -1);
    const gender =
      b.gender === "men" ? "male"
      : b.gender === "women" ? "female"
      : hasMale ? "male" : "female";
    const colorName = b.season_type ? SEASON_TYPES[b.season_type] || null : null;
    const parsed = parseStyles(b.style_tags || []);
    const notes = [
      "形象档案",
      "openid: " + openid,
      b.body_type ? "身材: " + b.body_type : "",
      b.height && b.weight ? "身高: " + b.height + "cm 体重: " + b.weight + "kg" : "",
      b.occasions && b.occasions.length ? "场合: " + b.occasions.join("/") : "",
    ].filter(Boolean).join(" | ");
    const payload: any = {
      owner_id: ownerId, agent_id: null, source: "profile", gender,
      color_season: colorName, main_style: parsed.main_style, sub_style: parsed.sub_style,
      notes, is_active: true, updated_at: new Date().toISOString(),
    };
    const { data: exist, error: selErr } = await supabase
      .from("vip_customers").select("id").eq("owner_id", ownerId).eq("source", "profile").maybeSingle();
    if (selErr) { console.error("syncProfileToVip select error:", selErr.message); return; }
    if (exist && exist.id) {
      const { error: updErr } = await supabase.from("vip_customers").update(payload).eq("id", exist.id);
      if (updErr) console.error("syncProfileToVip update error:", updErr.message);
    } else {
      const { error: insErr } = await supabase.from("vip_customers").insert([payload]);
      if (insErr) console.error("syncProfileToVip insert error:", insErr.message);
    }
  } catch (e: any) {
    console.error("syncProfileToVip error:", e?.message || e);
  }
}

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
      full_body_photos: Array.isArray(b.full_body_photos) ? b.full_body_photos : (b.full_body_photo ? [b.full_body_photo] : []),
      selected_photo_index: typeof b.selected_photo_index === 'number' ? b.selected_photo_index : 0,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("style_profiles")
      .upsert(row, { onConflict: isUuid(openid) ? "user_id" : "openid" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // 同步到 vip_customers（source='profile'，仅管理员可见）
    await syncProfileToVip(b, openid);
    return NextResponse.json({ profile: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
