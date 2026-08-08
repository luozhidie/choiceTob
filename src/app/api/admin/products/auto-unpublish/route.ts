// 定时下架：每日把 unpublish_at 已到且仍上架的商品自动下架
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const maxDuration = 60;

// Vercel Cron 定时触发（无需 admin cookie，用内置 CRON_SECRET 鉴权）
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceRoleClient();
    const nowIso = new Date().toISOString();
    // unpublish_at 存于 params JSONB（与 season/set_items 一致），按 ISO 字符串比较
    const { count, error } = await supabase
      .from("products")
      .update({ is_published: false })
      .eq("is_published", true)
      .not("params", "is", null)
      .lte("params->>unpublish_at", nowIso);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, unpublished: count ?? 0, at: nowIso });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
