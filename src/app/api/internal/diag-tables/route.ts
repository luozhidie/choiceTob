import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  if (req.headers.get("x-task-token") !== "lzd-diag-2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 401 });
  }
  const result: any = { ts: new Date().toISOString() };

  // 全量样本（模拟后台“用户券”列表）
  const { data: coupons } = await supabase
    .from("coupons")
    .select("id,title,status,expire_at,user_id,discount_amount")
    .order("created_at", { ascending: false })
    .limit(20);
  result.coupons_sample = (coupons || []).map((c: any) => ({
    title: c.title,
    status: c.status,
    expire_at: c.expire_at,
    discount: c.discount_amount,
    uid: (c.user_id || "").slice(0, 8),
  }));

  const { data: packets } = await supabase
    .from("red_packets")
    .select("id,title,status,expire_at,user_id,amount")
    .order("created_at", { ascending: false })
    .limit(20);
  result.red_packets_sample = (packets || []).map((p: any) => ({
    title: p.title,
    status: p.status,
    expire_at: p.expire_at,
    amount: p.amount,
    uid: (p.user_id || "").slice(0, 8),
  }));

  // 每个 profile 在小程序“未使用”里能看到几条（模拟小程序 GET 视图）
  const { data: profiles } = await supabase.from("profiles").select("id,full_name,email,phone").limit(10);
  result.per_profile = [];
  for (const u of profiles || []) {
    const { count: cc } = await supabase
      .from("coupons").select("*", { count: "exact", head: true })
      .eq("user_id", u.id).eq("status", "unused");
    const { count: pc } = await supabase
      .from("red_packets").select("*", { count: "exact", head: true })
      .eq("user_id", u.id).eq("status", "unused");
    result.per_profile.push({
      uid: (u.id || "").slice(0, 8),
      name: u.full_name || u.email || u.phone || "(未填)",
      coupons_unused: cc,
      packets_unused: pc,
    });
  }

  // 状态分布
  const { data: cAll } = await supabase.from("coupons").select("status");
  const { data: pAll } = await supabase.from("red_packets").select("status");
  const dist = (arr: any[]) => {
    const d: any = {};
    (arr || []).forEach((x: any) => { d[x.status] = (d[x.status] || 0) + 1; });
    return d;
  };
  result.coupons_status_dist = dist(cAll);
  result.red_packets_status_dist = dist(pAll);

  return NextResponse.json(result);
}
