import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// 返回已有行情快照（上次「刷新行情」写入的结果），供前端打开页面即展示
export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("stock_snapshots").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, snapshots: data || [] });
}
