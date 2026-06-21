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
    if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

    const supabase = await createClient();
    const targetTable = table || "membership_orders";

    const { error } = await supabase.from(targetTable).delete().eq("id", id);
    if (error) return NextResponse.json({ error: targetTable + ": " + error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "删除失败" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body;
    if (!id) return NextResponse.json({ error: "缺少订单ID" }, { status: 400 });

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

      /* 获取订单信息，同步更新profile */
      const { data: orders } = await supabase
        .from("membership_orders")
        .select("*")
        .eq("id", id);

      if (orders && orders.length > 0 && orders[0].user_id) {
        const uid = orders[0].user_id;
        let mType = "deposit_discount";
        const planId = orders[0].plan_id || "";
        if (planId === "daily_looks") mType = "view_price";

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

      return NextResponse.json({ success: true, message: "已开通" });
    }

    /* 取消 */
    if (action === "cancel") {
      const { error } = await supabase
        .from("membership_orders")
        .update({ status: "cancelled", updated_at: now })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const { data: orderData } = await supabase
        .from("membership_orders")
        .select("user_id")
        .eq("id", id)
        .single();
      if (orderData?.user_id) {
        const { count } = await supabase
          .from("membership_orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", orderData.user_id)
          .eq("status", "confirmed");
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
      return NextResponse.json({ success: true, message: "已取消" });
    }

    /* 重置 */
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
      return NextResponse.json({ success: true, message: "已重置" });
    }

    return NextResponse.json({ error: "未知操作，支持: confirm / cancel / reset-pending" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
