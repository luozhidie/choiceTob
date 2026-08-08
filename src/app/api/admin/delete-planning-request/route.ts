import { NextRequest, NextResponse } from "next/server";

/**
 * 删除企划需求记录
 * DELETE /api/admin/delete-planning-request?id=xxx
 *
 * 使用 Supabase REST API + service role key 删除（完全绕过 RLS）
 * 必须在 Vercel 环境变量中设置 SUPABASE_SERVICE_ROLE_KEY
 */

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[DeletePlanningRequest] 缺少环境变量");
      return NextResponse.json(
        { error: "服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量，请在 Vercel Dashboard > Settings > Environment Variables 中添加" },
        { status: 500 }
      );
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/planning_requests?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[DeletePlanningRequest] REST API 删除失败:", res.status, errText);
      return NextResponse.json({ error: `删除失败 (${res.status}): ${errText}` }, { status: 500 });
    }

    const deleted = await res.json();
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: "记录不存在或已被删除" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "已删除" });

  } catch (error: any) {
    console.error("[DeletePlanningRequest] error:", error.message);
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
