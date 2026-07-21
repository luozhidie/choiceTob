// 临时验证路由：确认 params->>unpublish_at 定时下架筛选在真实库上生效（用后即删）
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

const TEMP_TOKEN = "tmp_verify_unpublish_2026";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-temp-token");
    if (token !== TEMP_TOKEN) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const supabase = createServiceRoleClient();
    const past = new Date(Date.now() - 86400000).toISOString();   // 昨天
    const future = new Date(Date.now() + 86400000 * 30).toISOString(); // 30天后

    // 插入 3 条测试商品
    const { data: inserted, error: insErr } = await supabase
      .from("products")
      .insert([
        { title: "TMP_VERIFY_A", price: 100, is_published: true, params: { unpublish_at: past } },
        { title: "TMP_VERIFY_B", price: 100, is_published: true, params: { unpublish_at: future } },
        { title: "TMP_VERIFY_C", price: 100, is_published: true, params: null },
      ])
      .select("id,title,params,is_published");
    if (insErr) return NextResponse.json({ step: "insert", error: insErr.message }, { status: 500 });

    const ids = (inserted || []).map((r: any) => r.id);

    // 跑与 cron 完全相同的下架语句
    const nowIso = new Date().toISOString();
    const { count, error: updErr } = await supabase
      .from("products")
      .update({ is_published: false })
      .eq("is_published", true)
      .not("params", "is", null)
      .lte("params->>unpublish_at", nowIso);
    if (updErr) return NextResponse.json({ step: "update", error: updErr.message }, { status: 500 });

    // 读回 3 条，核对结果
    const { data: after, error: selErr } = await supabase
      .from("products")
      .select("title,is_published")
      .in("id", ids);
    if (selErr) return NextResponse.json({ step: "select", error: selErr.message }, { status: 500 });

    // 清理
    await supabase.from("products").delete().in("id", ids);

    return NextResponse.json({
      ok: true,
      updatedCount: count,
      expectedUnpublished: ["TMP_VERIFY_A"],
      result: after,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
