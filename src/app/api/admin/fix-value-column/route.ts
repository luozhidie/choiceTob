// 临时一次性接口：为 site_assets 表添加缺失的 value 列
// 用完即删，不在生产环境长期保留
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

const FIX_TOKEN = "v3r1fy-site-assets-value-7b4d2f9a";

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (token !== FIX_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // 1. 尝试执行 DDL（依赖数据库中的 exec_sql 存储函数）
    const ddl = "ALTER TABLE public.site_assets ADD COLUMN IF NOT EXISTS value TEXT;";
    const { error: ddlErr } = await supabase.rpc("exec_sql", { sql: ddl });

    if (ddlErr) {
      return NextResponse.json({ success: false, stage: "ddl", error: ddlErr.message });
    }

    // 2. 验证列已存在
    const { data: cols, error: colErr } = await supabase
      .from("site_assets")
      .select("value")
      .limit(1);

    if (colErr) {
      return NextResponse.json({ success: false, stage: "verify", error: colErr.message });
    }

    return NextResponse.json({ success: true, message: "value 列已添加并验证通过" });
  } catch (err: any) {
    return NextResponse.json({ success: false, stage: "exception", error: err.message }, { status: 500 });
  }
}
