import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // 简单任务令牌保护，用完即删
  if (req.headers.get("x-task-token") !== "lzd-diag-2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 401 });
  }

  const result: any = { ts: new Date().toISOString() };

  // 1. profiles 数量
  try {
    const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    result.profiles_count = count;
    result.profiles_error = error?.message || null;
  } catch (e: any) { result.profiles_error = e.message; }

  // 2. coupons 表是否存在 + 行数
  try {
    const { count, error } = await supabase.from("coupons").select("*", { count: "exact", head: true });
    result.coupons_count = count;
    result.coupons_error = error?.message || null;
  } catch (e: any) { result.coupons_error = e.message; }

  // 3. red_packets 表是否存在 + 行数
  try {
    const { count, error } = await supabase.from("red_packets").select("*", { count: "exact", head: true });
    result.red_packets_count = count;
    result.red_packets_error = error?.message || null;
  } catch (e: any) { result.red_packets_error = e.message; }

  // 4. 实测插入一张券（诊断后清理）
  try {
    const { data: users, error: ue } = await supabase.from("profiles").select("id").limit(1);
    if (ue) {
      result.insert_test = "no profiles: " + ue.message;
    } else if (!users || users.length === 0) {
      result.insert_test = "no users to insert";
    } else {
      const uid = (users as any)[0].id;
      const { error: ie } = await supabase
        .from("coupons")
        .insert({ user_id: uid, title: "DIAG_TEST", discount_amount: 100, status: "unused" });
      result.insert_test = ie ? "insert error: " + ie.message : "insert ok";
      if (!ie) await supabase.from("coupons").delete().eq("title", "DIAG_TEST");
    }
  } catch (e: any) { result.insert_test = "exception: " + e.message; }

  return NextResponse.json(result);
}
