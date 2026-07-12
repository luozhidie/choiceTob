// 公开 API：获取营销方案
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
      .from("marketing_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) return NextResponse.json({ success: false, data: [], error: error.message }, { status: 500 });
    return NextResponse.json({
      success: true,
      data: (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        image_url: p.image_url,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, data: [], error: e.message }, { status: 500 });
  }
}
