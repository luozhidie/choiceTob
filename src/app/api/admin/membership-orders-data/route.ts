import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("membership_orders")
    .select("*, profiles:user_id (email, full_name, phone)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data || [] });
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, table } = body;
    if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

    const supabase = createServiceRoleClient();
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

    const supabase = createServiceRoleClient();
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
        /* 根据套餐类型确定 membership_type */
        let mType = "deposit_discount"; // 默认商城会员（拿货折扣）
        const planId = orders[0].plan_id || "";
        // 价格会员（查看批发价权限 + 每日搭配灵感）
        if (["price_trial", "price_1y", "price_2y", "price_3y", "view_price_trial", "view_price_year1", "view_price_year2", "view_price_year3",
             "daily_looks", "daily_looks_monthly", "daily_looks_yearly"].includes(planId)) {
          mType = "view_price";
        }

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
        } else {
          // 如果profile不存在，创建新记录
          await supabase
            .from("profiles")
            .insert({
              id: uid,
              membership_type: mType,
              vip_status: "active",
              membership_confirmed_at: now,
              created_at: now,
              updated_at: now,
            });
        }
      }

      return NextResponse.json({ success: true, message: "已开通" });
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

      return NextResponse.json({ success: true, message: "已取消" });
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
      return NextResponse.json({ success: true, message: "已重置" });
    }

    return NextResponse.json({ error: "未知操作，支持: confirm / cancel / reset-pending / delete-member" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
