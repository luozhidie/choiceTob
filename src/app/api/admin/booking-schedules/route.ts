// 后台 API：顾问排期 CRUD
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function verifyAdmin(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const supabase = getServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const consultantId = searchParams.get("consultant_id");
  let query = supabase.from("booking_schedules").select("*");
  if (consultantId) query = query.eq("consultant_id", consultantId);
  const { data, error } = await query.order("date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// 批量 upsert 一天排期
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const supabase = getServiceRoleClient();
  const { consultant_id, date, slots } = await request.json();
  if (!consultant_id || !date) return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  const { data, error } = await supabase
    .from("booking_schedules")
    .upsert({ consultant_id, date, slots, updated_at: new Date().toISOString() }, { onConflict: "consultant_id,date" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
