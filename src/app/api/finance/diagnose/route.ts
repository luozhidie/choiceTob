import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

// 只读诊断：报告 Vercel 当前连接的是哪个项目、各表数据量，用于定位配置错配
export async function GET() {
  const out: Record<string, any> = {
    serviceRoleConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKeyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // 仅返回 URL（不含任何 key），用于确认连接的是哪个项目
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
  };
  try {
    const supabase = createServiceRoleClient();
    // 当前项目各表数量
    for (const t of ["products", "buyer_products", "orders", "profiles", "stock_watchlist", "stock_snapshots"]) {
      const { count, error } = await supabase
        .from(t)
        .select("*", { count: "exact", head: true });
      out[t + "Count"] = error ? "ERR:" + error.message : count;
    }
  } catch (e: any) {
    out.fatal = e?.message || String(e);
  }
  return NextResponse.json(out);
}
