import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("stock_watchlist").select("*").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data });
}

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const supabase = await createClient();
  const body = await req.json();
  const { symbol, name, market, sector } = body;
  if (!symbol || !name) return NextResponse.json({ error: "代码和名称必填" }, { status: 400 });
  const { data, error } = await supabase.from("stock_watchlist").insert([{ symbol, name, market, sector }]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}

export async function DELETE(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const supabase = await createClient();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  const { error } = await supabase.from("stock_watchlist").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
