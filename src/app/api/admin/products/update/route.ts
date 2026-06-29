// 后端更新商品API（绕过RLS）- 支持上下架、编辑等操作
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id, table, data } = await request.json();
    if (!id || !data) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const tableName = table || "products";
    
    // 兼容性处理：如果 wholesale_price 列不存在则移除
    const safeData = { ...data };
    try {
      const { error } = await supabase.from(tableName).update(safeData).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    } catch (updateError: any) {
      if (safeData.wholesale_price !== undefined && 
          (updateError?.message?.includes("wholesale_price") || updateError?.code === "42703")) {
        delete safeData.wholesale_price;
        const { error } = await supabase.from(tableName).update(safeData).eq("id", id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }
      throw updateError;
    }
  } catch (err: any) {
    console.error("[更新商品API错误]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
