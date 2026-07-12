// 公开 API：获取形象顾问及其排期（前台预约页用）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const DEFAULT_TIMES = ["10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function defaultSlots() {
  return DEFAULT_TIMES.map((t) => ({ time: t, status: "available" }));
}

function nextDays(n: number) {
  const days: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const dt = new Date(d);
    dt.setDate(d.getDate() + i);
    days.push(dt.toISOString().slice(0, 10));
  }
  return days;
}

export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    const { data: consultants, error } = await supabase
      .from("consultants")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) return NextResponse.json({ success: false, data: [], error: error.message }, { status: 500 });

    const days = nextDays(14);
    const result = await Promise.all(
      (consultants || []).map(async (c: any) => {
        const { data: scheds } = await supabase
          .from("booking_schedules")
          .select("*")
          .eq("consultant_id", c.id)
          .in("date", days);
        const map: Record<string, any[]> = {};
        (scheds || []).forEach((s: any) => {
          map[s.date] = s.slots;
        });
        const schedules: Record<string, any[]> = {};
        days.forEach((day) => {
          schedules[day] = map[day] || defaultSlots();
        });
        return {
          id: c.id,
          name: c.name,
          avatar_url: c.avatar_url,
          title: c.title,
          description: c.description,
          schedules,
        };
      })
    );

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ success: false, data: [], error: e.message }, { status: 500 });
  }
}
