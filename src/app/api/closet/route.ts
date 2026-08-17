// app/api/closet/route.ts
// 我的衣橱（toC）— 用户上传的自己的单品 CRUD
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 品类库
export const CLOSET_CATEGORIES: Record<string, string> = {
  top: "上装",
  bottom: "下装",
  shoes: "鞋履",
  bag: "包袋",
  accessory: "配饰",
};

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function GET(req: NextRequest) {
  const openid = req.nextUrl.searchParams.get("openid");
  const source = req.nextUrl.searchParams.get("source"); // 'self' | 'stylist' 可选过滤
  if (!openid) return NextResponse.json({ error: "缺少 openid" }, { status: 400 });

  let query = supabase.from("user_closet").select("*");
  if (isUuid(openid)) {
    query = query.eq("user_id", openid);
  } else {
    query = query.eq("openid", openid);
  }
  if (source === "self" || source === "stylist") {
    query = query.eq("source", source);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const openid = b.openid;
    if (!openid) return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
    if (!b.image_url) return NextResponse.json({ error: "缺少 image_url" }, { status: 400 });

    const row: any = {
      openid: isUuid(openid) ? null : openid,
      user_id: isUuid(openid) ? openid : null,
      image_url: b.image_url,
      category: b.category || "top",
      color: b.color || null,
      style_tags: Array.isArray(b.style_tags) ? b.style_tags : [],
      season_type: b.season_type || null,
      // 来源：self=消费者自传(云衣橱) / stylist=顾问推荐(VIP衣橱)
      source: b.source === "stylist" ? "stylist" : "self",
      recommended_by: b.recommended_by || null,
      recommend_note: b.recommend_note || null,
    };
    const { data, error } = await supabase.from("user_closet").insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const openid = req.nextUrl.searchParams.get("openid");
  const id = req.nextUrl.searchParams.get("id");
  if (!openid || !id) return NextResponse.json({ error: "缺少 openid 或 id" }, { status: 400 });

  let query = supabase.from("user_closet").delete().eq("id", id);
  if (isUuid(openid)) {
    query = query.eq("user_id", openid);
  } else {
    query = query.eq("openid", openid);
  }
  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
