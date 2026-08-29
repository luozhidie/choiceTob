// 后台更新单条「找货需求」状态 / 备注
// PATCH /api/admin/buyer-requests/[id]  Body: { status?, admin_note? }
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

const STATUS_SET = new Set(["pending", "reviewed", "matched", "contacted", "done"]);

function isAdmin(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "未登录或无权限" }, { status: 401 });
  }
  try {
    const id = params.id;
    const body = await request.json().catch(() => ({}));
    const { status, admin_note } = body as Record<string, any>;

    if (status && !STATUS_SET.has(status)) {
      return NextResponse.json({ error: "非法状态值" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status) update.status = status;
    if (admin_note !== undefined) update.admin_note = admin_note;

    const { error } = await supabase
      .from("buyer_requests")
      .update(update)
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
