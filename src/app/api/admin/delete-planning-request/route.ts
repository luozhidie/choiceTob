import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/admin/delete-planning-request?id=xxx
 * 删除企划需求记录（服务端，绕过 RLS）
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();

  // 鉴权
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });

  // 先确认记录存在
  const { data: existing } = await supabase
    .from("planning_requests")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  // 删除
  const { error } = await supabase
    .from("planning_requests")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[Delete PlanningRequest] error:", error);
    return NextResponse.json({ error: "删除失败：" + error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "已删除" });
}
