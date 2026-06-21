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
    if (!id) return NextResponse.json({ error: "\u7F3A\u5C11\u8BA2\u5355ID" }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.from("membership_orders").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "\u5220\u9664\u5931\u8D25" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body;
    if (!id) return NextResponse.json({ error: "\u7F3A\u5C11\u8BA2\u5355ID" }, { status: 400 });

    const supabase = await createClient();

    if (action === "confirm") {
      /* 确认开通：更新状态为 confirmed + 记录时间 */
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
      return NextResponse.json({ success: true, message: "\u5DF2\u5F00\u901A" });
    }

    return NextResponse.json({ error: "\u672A\u77E5\u64CD\u4F5C" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "\u64CD\u4F5C\u5931\u8D25" }, { status: 500 });
  }
}
