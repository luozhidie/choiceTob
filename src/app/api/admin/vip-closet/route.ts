// 后台：客户衣橱（云衣橱 × VIP形象设计 合并）智能推送接口
// GET  ?openid=xxx  → 返回客户形象档案 + 统一衣橱(自传/顾问推荐分区) + 按季型/风格智能推荐商品
// GET  ?q=手机号/姓名 → 在 vip_customers / profiles 中定位客户，返回候选(含 openid)
// POST            → 把推荐款/图片推入指定 openid 的 user_closet（source=stylist）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function verifyAdmin(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// 取已发布商品（含季型/风格标签），用于智能推荐
async function loadProducts(sb: any) {
  const { data } = await sb
    .from("products")
    .select("id,title,price,cover_image,color_season_codes,style_tag_codes,category")
    .eq("is_published", true)
    .not("cover_image", "is", null)
    .limit(240);
  return (data || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    cover: p.cover_image,
    seasons: p.color_season_codes || [],
    styles: p.style_tag_codes || [],
    category: p.category || "",
  }));
}

// 智能打分：与 look-studio 试用间完全一致的逻辑（保证顾问推荐=消费者所见）
function scoreProduct(p: any, seasonTypes: string[], styleTags: string[]) {
  let s = 0;
  (p.seasons || []).forEach((x: string) => {
    if (seasonTypes.indexOf(x) >= 0) s += 2;
  });
  (p.styles || []).forEach((x: string) => {
    if (styleTags.indexOf(x) >= 0) s += 1;
  });
  return s;
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const sb = getServiceRoleClient();
  const openid = request.nextUrl.searchParams.get("openid");
  const q = (request.nextUrl.searchParams.get("q") || "").trim();

  // —— 搜索模式：按手机号/姓名/微信 定位客户 ——
  if (!openid && q) {
    const candidates: any[] = [];
    try {
      const { data: vip } = await sb
        .from("vip_customers")
        .select("id,name,phone,wechat,gender,color_season,main_style,vip_level,openid")
        .or(`name.ilike.%${q}%,phone.ilike.%${q}%,wechat.ilike.%${q}%`)
        .limit(20);
      for (const r of (vip || [])) {
        let oid = r.openid || null;
        // 回填：无 openid 的老客户，按手机号关联 profiles.wx_openid
        if (!oid && r.phone) {
          try {
            const { data: prof } = await sb
              .from("profiles")
              .select("wx_openid")
              .eq("phone", r.phone)
              .maybeSingle();
            if (prof && prof.wx_openid) {
              oid = prof.wx_openid;
              await sb.from("vip_customers").update({ openid: oid }).eq("id", r.id);
            }
          } catch {}
        }
        candidates.push({
          id: r.id,
          name: r.name,
          phone: r.phone,
          wechat: r.wechat,
          gender: r.gender,
          color_season: r.color_season,
          main_style: r.main_style,
          vip_level: r.vip_level,
          openid: oid,
          _source: "VIP客户",
        });
      }
    } catch {}
    try {
      const { data: prof } = await sb
        .from("profiles")
        .select("id,full_name,name,phone,openid")
        .or(`full_name.ilike.%${q}%,name.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(20);
      (prof || []).forEach((r: any) => {
        if (r.openid) {
          candidates.push({
            id: r.id,
            name: r.full_name || r.name,
            phone: r.phone,
            openid: r.openid,
            _source: "注册用户",
          });
        }
      });
    } catch {}
    return NextResponse.json({ candidates });
  }

  if (!openid) {
    return NextResponse.json({ error: "缺少 openid 或 q" }, { status: 400 });
  }

  // —— 客户形象档案（智能底座）——
  let profile: any = null;
  try {
    const { data } = isUuid(openid)
      ? await sb.from("style_profiles").select("*").eq("user_id", openid).maybeSingle()
      : await sb.from("style_profiles").select("*").eq("openid", openid).maybeSingle();
    profile = data;
  } catch {}

  // —— 统一衣橱：自传 + 顾问推荐 分区 ——
  let closetAll: any[] = [];
  try {
    const { data } = isUuid(openid)
      ? await sb.from("user_closet").select("*").eq("user_id", openid).order("created_at", { ascending: false })
      : await sb.from("user_closet").select("*").eq("openid", openid).order("created_at", { ascending: false });
    closetAll = data || [];
  } catch {}
  const selfItems = closetAll.filter((x: any) => (x.source || "self") === "self");
  const stylistItems = closetAll.filter((x: any) => x.source === "stylist");

  // —— 智能推荐：按客户季型/风格打分排序 ——
  const products = await loadProducts(sb);
  const seasonTypes = profile?.season_type ? [profile.season_type] : [];
  const styleTags = Array.isArray(profile?.style_tags) ? profile.style_tags : [];
  const ranked = products
    .map((p: any) => ({ p, s: scoreProduct(p, seasonTypes, styleTags) }))
    .sort((a: any, b: any) => b.s - a.s)
    .slice(0, 30)
    .map((x: any) => ({
      id: x.p.id,
      title: x.p.title,
      price: x.p.price,
      cover: x.p.cover,
      category: x.p.category,
      score: x.s,
    }));

  return NextResponse.json({
    profile: profile
      ? {
          season_type: profile.season_type,
          season_name: profile.season_name,
          style_tags: profile.style_tags || [],
        }
      : null,
    selfItems,
    stylistItems,
    recommendations: ranked,
  });
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  try {
    const b = await request.json();
    const openid = b.openid;
    if (!openid) return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
    if (!b.image_url) return NextResponse.json({ error: "缺少 image_url" }, { status: 400 });

    const sb = getServiceRoleClient();
    const row: any = {
      openid: isUuid(openid) ? null : openid,
      user_id: isUuid(openid) ? openid : null,
      image_url: b.image_url,
      category: b.category || "top",
      color: b.color || null,
      style_tags: Array.isArray(b.style_tags) ? b.style_tags : [],
      season_type: b.season_type || null,
      source: "stylist",
      recommended_by: b.recommended_by || "形象顾问",
      recommend_note: b.recommend_note || null,
    };
    const { data, error } = await sb.from("user_closet").insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
