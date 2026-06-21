import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const results: any[] = [];

  // 1. vip_customers 表
  try {
    const { data, error } = await supabase
      .from("vip_customers").select("*").order("id", { ascending: false }).limit(200);
    if (!error && data) {
      data.forEach((row: any) => results.push({ ...row, _source: "色彩季型录入" }));
    }
  } catch {}

  // 2. customers 表
  try {
    const { data, error } = await supabase
      .from("customers").select("*").order("id", { ascending: false }).limit(200);
    if (!error && data) {
      data.forEach((row: any) => results.push({ ...row, _source: "客户管理" }));
    }
  } catch {}

  // 3. profiles 表（有名字的）
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or("full_name.neq.,name.neq.,phone.neq.")
      .order("id", { ascending: false })
      .limit(200);
    if (!error && data) {
      data.forEach((row: any) => results.push({ ...row, _source: "注册用户" }));
    }
  } catch {}

  // 按id去重
  const seen = new Set<string>();
  const deduped = results.filter((m: any) => {
    if (!m.id || seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  return NextResponse.json({ success: true, count: deduped.length, data: deduped });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { id, table } = await request.json();
  if (!id || !table) return NextResponse.json({ error: "缺少参数" }, { status: 400 });

  const validTables = ["vip_customers", "customers", "profiles"];
  if (!validTables.includes(table)) return NextResponse.json({ error: "无效的表名" }, { status: 400 });

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
