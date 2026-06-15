import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 服务端删除VIP订单
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

    // 使用前端传来的 Authorization token 或 cookie
    const authHeader = request.headers.get("authorization");
    let supabase: any;

    if (authHeader?.startsWith("Bearer ")) {
      // 用前端传来的 token 创建客户端
      const token = authHeader.replace("Bearer ", "");
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: { getAll: () => [], setAll: () => {} },
          global: { headers: { Authorization: `Bearer ${token}` } },
        }
      );
    } else {
      // fallback: 用 cookie（标准方式）
      const cookieStore = await cookies();
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() {},
          },
        }
      );
    }

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
