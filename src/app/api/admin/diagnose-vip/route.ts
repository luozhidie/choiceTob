import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const result: Record<string, any> = {};

  // 1. 检查 vip_customers 表
  try {
    const { data: vipData, count: vipCount, error: vipErr } = await supabase
      .from("vip_customers").select("*", { count: "exact", head: true });
    if (vipErr) {
      result.vip_customers = { error: vipErr.message };
    } else {
      result.vip_customers = { count: vipCount };
      // 获取前2条样例数据看字段
      const { data: samples } = await supabase.from("vip_customers").select("*").limit(2);
      result.vip_customers.samples = samples;
      result.vip_customers.columns = samples?.length > 0 ? Object.keys(samples[0]) : [];
    }
  } catch (e: any) {
    result.vip_customers = { error: e.message };
  }

  // 2. 检查 customers 表
  try {
    const { data: custData, count: custCount, error: custErr } = await supabase
      .from("customers").select("*", { count: "exact", head: true });
    if (custErr) {
      result.customers = { error: custErr.message };
    } else {
      result.customers = { count: custCount };
      const { data: samples } = await supabase.from("customers").select("*").limit(2);
      result.customers.samples = samples;
      result.customers.columns = samples?.length > 0 ? Object.keys(samples[0]) : [];
    }
  } catch (e: any) {
    result.customers = { error: e.message };
  }

  // 3. 检查 profiles 表（有名字的）
  try {
    const { data: profData, count: profCount, error: profErr } = await supabase
      .from("profiles").select("*", { count: "exact", head: true });
    if (profErr) {
      result.profiles = { error: profErr.message };
    } else {
      result.profiles = { total: profCount };
      // 有姓名或电话的记录
      const { data: named } = await supabase.from("profiles")
        .select("*").or("full_name.neq.,name.neq.,phone.neq.").limit(5);
      result.profiles.withInfo = named?.length || 0;
      result.profiles.samples = named;
      result.profiles.columns = named?.length > 0 ? Object.keys(named[0]) : [];
    }
  } catch (e: any) {
    result.profiles = { error: e.message };
  }

  // 4. 检查 stores 表的 member_stats 字段
  try {
    const { data: storeData } = await supabase.from("stores").select("id, name, member_stats").limit(5);
    result.stores = storeData?.map(s => ({
      id: s.id,
      name: s.name,
      stats: s.member_stats,
    }));
  } catch (e: any) {
    result.stores_error = e.message;
  }

  return NextResponse.json({ timestamp: new Date().toISOString(), ...result });
}
