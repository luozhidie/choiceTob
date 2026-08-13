// 公开 API：提交预约
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { consultant_id, consultant_name, user_name, phone, date, slots, location, price_per_hour, service_fee, coupon, note } = body;
    if (!user_name || !phone || !date || !slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ success: false, error: "信息不完整" }, { status: 400 });
    }
    const total = (Number(price_per_hour) || 0) * slots.length + (Number(service_fee) || 0);
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        consultant_id: consultant_id || null,
        consultant_name: consultant_name || "",
        user_name,
        phone,
        date,
        slots,
        location: location || "",
        price_per_hour: Number(price_per_hour) || 0,
        service_fee: Number(service_fee) || 0,
        total_amount: total,
        coupon: coupon || "",
        note: note || "",
        status: "待确认",
      })
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
