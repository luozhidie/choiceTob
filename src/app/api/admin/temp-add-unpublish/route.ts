// 临时迁移路由：为 products 表添加 unpublish_at 列（用后即删）
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

// 临时令牌，仅用于本次迁移，路由删除后失效
const TEMP_TOKEN = "tmp_unpublish_migrate_2026";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-temp-token");
    if (token !== TEMP_TOKEN) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const sql = body.sql;
    if (!sql) {
      return NextResponse.json({ error: "缺少 sql" }, { status: 400 });
    }
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc("exec_sql", { sql });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
