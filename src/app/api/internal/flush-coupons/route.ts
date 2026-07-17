// 临时一次性接口：清空 coupon_templates（用完即删）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TASK_TOKEN = "lzd-flush-coupons-2026";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-task-token") || "";
  if (token !== TASK_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // 先计数
  const { count } = await supabase
    .from("coupon_templates")
    .select("*", { count: "exact", head: true });
  const { error } = await supabase.from("coupon_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, deleted: count || 0 });
}
