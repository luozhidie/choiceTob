import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 服务端删除VIP订单（绕过RLS）
 * POST /api/admin/delete-membership-order
 * body: { id: string }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少订单ID" }, { status: 400 });
    }

    // 使用服务端client（绕过RLS）
    const supabase = await createClient();

    // 先查询订单是否存在
    const { data: order, error: fetchError } = await supabase
      .from("membership_orders")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 删除订单
    const { error: deleteError } = await supabase
      .from("membership_orders")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[DeleteOrder] 删除失败:", deleteError.message);
      return NextResponse.json({ error: "删除失败: " + deleteError.message }, { status: 500 });
    }

    console.log(`[DeleteOrder] 成功删除订单: ${id}`);
    return NextResponse.json({ success: true, message: "已删除" });

  } catch (error: any) {
    console.error("[DeleteOrder] 未捕获错误:", error.message);
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}
