import { NextRequest, NextResponse } from "next/server";

/**
 * 服务端删除VIP订单
 * POST /api/admin/delete-membership-order
 * body: { id: string }
 *
 * 使用 Supabase REST API + service role key 删除（完全绕过 RLS）
 * 必须在 Vercel 环境变量中设置 SUPABASE_SERVICE_ROLE_KEY
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少订单ID" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[DeleteOrder] 缺少环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { error: "服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量，请在 Vercel Dashboard > Settings > Environment Variables 中添加" },
        { status: 500 }
      );
    }

    // 使用 Supabase REST API + service role key 直接删除（完全绕过 RLS）
    const res = await fetch(`${supabaseUrl}/rest/v1/membership_orders?id=eq.${encodeURIComponent(id)}`, {
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
      console.error("[DeleteOrder] REST API 删除失败:", res.status, errText);
      return NextResponse.json({ error: `删除失败 (${res.status}): ${errText}` }, { status: 500 });
    }

    // 检查是否有记录被删除
    const deleted = await res.json();
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: "订单不存在或已被删除" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "已删除" });

  } catch (error: any) {
    console.error("[DeleteOrder] 未捕获错误:", error.message);
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
