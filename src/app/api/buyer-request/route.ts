// 用户「提交找货需求」接口
// POST /api/buyer-request          提交需求
// GET  /api/buyer-request?userId=  我的需求列表
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      userId,
      contact_name,
      contact_info,
      category,
      style,
      color,
      has_orphan,
      budget_min,
      budget_max,
      note,
      images,
    } = body as Record<string, any>;

    // 基本要求：至少要描述清楚想找什么（品类 / 风格 / 色系 / 备注至少一个）
    if (!category && !style && !color && !note) {
      return NextResponse.json(
        { error: "请至少填写想要的品类、风格、色系或详细描述中的一项" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("buyer_requests")
      .insert({
        user_id: userId || null,
        contact_name: contact_name || null,
        contact_info: contact_info || null,
        category: category || null,
        style: style || null,
        color: color || null,
        has_orphan: has_orphan === true || has_orphan === "true",
        budget_min: budget_min ? Number(budget_min) : null,
        budget_max: budget_max ? Number(budget_max) : null,
        note: note || null,
        images: Array.isArray(images) ? images : null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[buyer-request] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error("[buyer-request] unexpected:", err);
    return NextResponse.json({ error: err.message || "提交失败" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("buyer_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: data || [] });
  } catch (  err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
