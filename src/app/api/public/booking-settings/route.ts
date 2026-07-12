// 公开 API：获取陪购设置（地点、费用）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("booking_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: data || {
      id: 1, location: "泉州·鲤城服装批发市场", price_per_hour: 200, service_fee: 0, currency: "¥"
    } });
  } catch (e: any) {
    return NextResponse.json({ success: false, data: null, error: e.message }, { status: 500 });
  }
}
