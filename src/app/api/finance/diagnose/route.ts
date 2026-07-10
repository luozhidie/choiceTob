import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// 只读诊断：用于排查股票监控清单为空的问题，不写入任何数据
export async function GET() {
  const out: Record<string, any> = {
    serviceRoleConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKeyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("stock_watchlist")
      .select("*", { count: "exact", head: true });
    out.watchlistCount = count;
    out.selectError = error?.message || null;

    const { data: snapCount, error: snapErr } = await supabase
      .from("stock_snapshots")
      .select("*", { count: "exact", head: true });
    out.snapshotsCount = snapCount;
    out.snapshotsError = snapErr?.message || null;
  } catch (e: any) {
    out.fatal = e?.message || String(e);
  }
  return NextResponse.json(out);
}
