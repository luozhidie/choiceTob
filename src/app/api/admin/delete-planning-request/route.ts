import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * DELETE /api/admin/delete-planning-request?id=xxx
 * 删除企划需求记录（使用 service role，完全绕过 RLS）
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });

    // 使用 service role key（完全绕过RLS）
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

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

  } catch (error: any) {
    console.error("[Delete PlanningRequest] 未捕获错误:", error.message);
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
