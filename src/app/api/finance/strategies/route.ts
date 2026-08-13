import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const maxDuration = 30;

// 策略库：列出全部策略（含参数），供后台选择/回测
export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("signal_rules")
    .select("id, name, description, ma_short, ma_long, ma_trend, rsi_buy_min, rsi_buy_max, rsi_sell, vol_ratio, stop_loss, trailing_stop, enabled, created_at")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, strategies: data || [] });
}
