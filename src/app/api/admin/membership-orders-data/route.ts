import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membership_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data || [] });
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, table } = body;
    if (!id) return NextResponse.json({ error: "\u7F3A\u5C11ID" }, { status: 400 });

    const supabase = await createClient();
    const targetTable = table || "membership_orders";

    const { error } = await supabase.from(targetTable).delete().eq("id", id);
    if (error) return NextResponse.json({ error: targetTable + ": " + error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "\u5220\u9664\u5931\u8D25" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, user_id } = body;
    if (!id) return NextResponse.json({ error: "\u7F3A\u5C11\u8BA2\u5355ID" }, { status: 400 });

    const supabase = await createClient();
    const now = new Date().toISOString();

    /* 开通：pending -> confirmed + 同步更新profiles表 */
    if (action === "confirm") {
      const { error } = await supabase
        .from("membership_orders")
        .update({
          status: "confirmed",
          confirmed_at: now,
          updated_at: now,
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      /* 获取订单信息 */
      const { data: orders } = await supabase
        .from("membership_orders")
        .select("*")
        .eq("id", id);

      if (orders && orders.length > 0 && orders[0].user_id) {
        const uid = orders[0].user_id;
        /* 根据套餐类型确定 membership_type */
        let mType = "deposit_discount"; // 默认高阶
        const planId = orders[0].plan_id || "";
        if (planId === "daily_looks") mType = "view_price";

        /* 更新或创建profile记录（让前台能识别到VIP状态）*/
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", uid)
          .single();

        if (existingProfile) {
          await supabase
            .from("profiles")
            .update({
              membership_type: mType,
              vip_status: "active",
              membership_confirmed_at: now,
              updated_at: now,
            })
            .eq("id", uid);
        }
      }

      return NextResponse.json({ success: true, message: "\u5DF2\u5F00\u901A" });
    }

    /* 取消：any -> cancelled + 清除profile VIP状态 */
    if (action === "cancel") {
      const { error } = await supabase
        .from("membership_orders")
        .update({ status: "cancelled", updated_at: now })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      /* 清除该用户的VIP状态 */
      const { data: orderData } = await supabase
        .from("membership_orders")
        .select("user_id")
        .eq("id", id)
        .single();
      if (orderData?.user_id) {
        /* 检查是否还有其他已开通的订单 */
        const { count } = await supabase
          .from("membership_orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", orderData.user_id)
          .eq("status", "confirmed");
        /* 如果没有其他已开通的订单了，清除VIP状态 */
        if ((count || 0) === 0) {
          await supabase
            .from("profiles")
            .update({
              membership_type: null,
              vip_status: null,
              updated_at: now,
            })
            .eq("id", orderData.user_id);
        }
      }

      return NextResponse.json({ success: true, message: "\u5DF2\u53D6\u6D88" });
    }

    /* 重置为待确认：any -> pending */
    if (action === "reset-pending") {
      const { error } = await supabase
        .from("membership_orders")
        .update({
          status: "pending",
          confirmed_at: null,
          updated_at: now,
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "\u5DF2\u91CD\u7F6E" });
    }

    return NextResponse.json({ error: "\u672A\u77E5\u64CD\u4F5C", hint: "\u652F\u6301: confirm / cancel / reset-pending / delete-member" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
