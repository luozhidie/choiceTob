import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// 兜底清单：与迁移保持一致的全行业龙头（迁移已建表并填充，这里仅作空表兜底）
const DEFAULT_LIST = [
  { symbol: "2020.HK", name: "安踏体育", market: "hk", sector: "下游品牌零售", industry: "服装" },
  { symbol: "2331.HK", name: "李宁", market: "hk", sector: "下游品牌零售", industry: "服装" },
  { symbol: "NKE", name: "耐克", market: "us", sector: "下游品牌零售", industry: "服装" },
  { symbol: "LULU", name: "露露乐蒙", market: "us", sector: "下游品牌零售", industry: "服装" },
  { symbol: "0700.HK", name: "腾讯控股", market: "hk", sector: "平台", industry: "科技" },
  { symbol: "9988.HK", name: "阿里巴巴", market: "hk", sector: "平台", industry: "科技" },
  { symbol: "AAPL", name: "苹果", market: "us", sector: "硬件", industry: "科技" },
  { symbol: "NVDA", name: "英伟达", market: "us", sector: "半导体", industry: "科技" },
  { symbol: "TSM", name: "台积电", market: "us", sector: "半导体", industry: "科技" },
  { symbol: "1299.HK", name: "友邦保险", market: "hk", sector: "保险", industry: "金融" },
  { symbol: "JPM", name: "摩根大通", market: "us", sector: "银行", industry: "金融" },
  { symbol: "0883.HK", name: "中国海洋石油", market: "hk", sector: "上游", industry: "能源" },
  { symbol: "XOM", name: "埃克森美孚", market: "us", sector: "上游", industry: "能源" },
  { symbol: "2269.HK", name: "药明生物", market: "hk", sector: "CXO", industry: "医药" },
  { symbol: "PFE", name: "辉瑞", market: "us", sector: "制药", industry: "医药" },
  { symbol: "1211.HK", name: "比亚迪", market: "hk", sector: "整车", industry: "汽车" },
  { symbol: "TSLA", name: "特斯拉", market: "us", sector: "整车", industry: "汽车" },
  { symbol: "1810.HK", name: "小米集团", market: "hk", sector: "硬件", industry: "消费电子" },
  { symbol: "6758.T", name: "索尼", market: "jp", sector: "硬件", industry: "消费电子" },
];

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const supabase = createServiceRoleClient();
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
