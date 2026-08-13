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

export async function GET(req: NextRequest) {
  const openid = req.nextUrl.searchParams.get("openid");
  if (!openid) return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
  const { data, error } = await supabase
    .from("user_closet")
    .select("*")
    .eq("openid", openid)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const openid = b.openid;
    if (!openid) return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
    if (!b.image_url) return NextResponse.json({ error: "缺少 image_url" }, { status: 400 });

    const row = {
      openid,
      image_url: b.image_url,
      category: b.category || "top",
      color: b.color || null,
      style_tags: Array.isArray(b.style_tags) ? b.style_tags : [],
      season_type: b.season_type || null,
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
  const { error } = await supabase.from("user_closet").delete().eq("openid", openid).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
