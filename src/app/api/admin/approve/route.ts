import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';


// 获取待审批用户列表
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const isAdmin = cookieHeader.includes("admin_logged_in=true");
    if (!isAdmin) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, company_name, created_at, approval_status")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 审批操作（批准/拒绝）
// 删除用户申请
export async function DELETE(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const isAdmin = cookieHeader.includes("admin_logged_in=true");
    if (!isAdmin) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: "缺少 user_id" }, { status: 400 });
    }

    const supabase = await createClient();

    // 先删除 profiles 表中的记录
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "已删除" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const isAdmin = cookieHeader.includes("admin_logged_in=true");
    if (!isAdmin) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, action, reason } = body; // action: "approve" | "reject"

    if (!user_id || !action) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const supabase = await createClient();

    if (action === "approve") {
      const { error } = await supabase
        .from("profiles")
        .update({
          approval_status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", user_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "已批准" });
    }

    if (action === "reject") {
      const { error } = await supabase
        .from("profiles")
        .update({
          approval_status: "rejected",
          rejected_reason: reason || "",
        })
        .eq("id", user_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "已拒绝" });
    }

    return NextResponse.json({ error: "无效操作" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
