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

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const supabase = await createClient();
  const { count } = await supabase.from("stock_watchlist").select("*", { count: "exact", head: true });
  if ((count || 0) > 0) {
    return NextResponse.json({ ok: true, seeded: false, reason: "清单已存在" });
  }
  const { data, error } = await supabase.from("stock_watchlist").insert(DEFAULT_LIST).select();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, seeded: true, records: data });
}
