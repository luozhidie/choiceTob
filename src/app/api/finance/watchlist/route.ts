import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIST = [
  { symbol: "2020.HK", name: "安踏体育", market: "hk", sector: "下游品牌零售" },
  { symbol: "2331.HK", name: "李宁", market: "hk", sector: "下游品牌零售" },
  { symbol: "2313.HK", name: "申洲国际", market: "hk", sector: "中游制造" },
  { symbol: "2232.HK", name: "晶苑国际", market: "hk", sector: "中游制造" },
  { symbol: "2199.HK", name: "维珍妮", market: "hk", sector: "中游制造" },
  { symbol: "NKE", name: "耐克", market: "us", sector: "下游品牌零售" },
  { symbol: "LULU", name: "露露乐蒙", market: "us", sector: "下游品牌零售" },
  { symbol: "9983.T", name: "迅销(优衣库)", market: "jp", sector: "下游品牌零售" },
];

export async function GET() {
  const mode = process.env.SUPABASE_SERVICE_ROLE_KEY ? "service-role" : "anon";
  try {
    const supabase = await createClient();
    let { data, error } = await supabase.from("stock_watchlist").select("*").order("created_at");
    if (error) {
      return NextResponse.json({ ok: false, mode, error: error.message }, { status: 500 });
    }
    // 首次访问：若为空，自动写入默认清单
    if (!data || data.length === 0) {
      const { error: insertErr } = await supabase.from("stock_watchlist").insert(DEFAULT_LIST);
      if (insertErr) {
        return NextResponse.json(
          { ok: false, mode, error: "自动初始化失败：" + insertErr.message },
          { status: 500 }
        );
      }
      const { data: d2, error: e2 } = await supabase.from("stock_watchlist").select("*").order("created_at");
      if (e2) {
        return NextResponse.json({ ok: false, mode, error: e2.message }, { status: 500 });
      }
      data = d2;
    }
    return NextResponse.json({ ok: true, mode, records: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, mode, error: e?.message || String(e) },
      { status: 500 }
    );
  }
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
