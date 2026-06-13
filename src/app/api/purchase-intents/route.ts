import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/purchase-intents
 * 提交采购意向
 */
export async function POST(req: NextRequest) {
  try {
    // 检查用户是否已登录
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    
    const body = await req.json();
    const { product_id, product_title, product_price, quantity, contact, note } = body;

    if (!product_id || !contact) {
      return NextResponse.json({ error: "product_id and contact are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("purchase_intents")
      .insert({
        product_id,
        product_title,
        product_price,
        quantity: quantity || 1,
        contact,
        note: note || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting purchase intent:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error in POST /api/purchase-intents:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
