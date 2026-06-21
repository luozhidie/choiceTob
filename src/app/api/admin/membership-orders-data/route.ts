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
    const { id } = body;
    if (!id) return NextResponse.json({ error: "缺少订单ID" }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.from("membership_orders").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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

    if (action === "confirm") {
      /* 确认开通：pending -> confirmed */
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("membership_orders")
        .update({
          status: "confirmed",
          confirmed_at: now,
          updated_at: now,
        })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "已开通" });
    }

    if (action === "cancel") {
      /* 取消：any -> cancelled */
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("membership_orders")
        .update({ status: "cancelled", updated_at: now })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "已取消" });
    }

    if (action === "reset-pending") {
      /* 重置为待确认：any -> pending */
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("membership_orders")
        .update({
          status: "pending",
          confirmed_at: null,
          updated_at: now,
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "已重置为待确认" });
    }

    return NextResponse.json({ error: "未知操作，支持：confirm / cancel / reset-pending" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "操作失败" }, { status: 500 });
  }
}
