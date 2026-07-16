// ============================================================
// 店铺级可编辑内容 API：/api/admin/store-content
// GET 读取单行 / PUT 更新（仅管理员，admin_logged_in cookie）
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function authAdmin(request: NextRequest): Promise<{ ok: boolean; response?: NextResponse }> {
  const cookie = request.cookies.get("admin_logged_in")?.value;
  if (cookie !== "true") {
    return { ok: false, response: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  return { ok: true };
}

// GET 读取店铺内容单行
export async function GET(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  const { data, error } = await supabase
    .from("store_content")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data || null });
}

// PUT 更新店铺内容
export async function PUT(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  try {
    const body = await req.json();
    const clean: any = {};
    if (body.shop_name !== undefined) clean.shop_name = body.shop_name;
    if (body.intro !== undefined) clean.intro = body.intro;
    if (body.shipping_note !== undefined) clean.shipping_note = body.shipping_note;
    if (body.wholesale_guide !== undefined) clean.wholesale_guide = body.wholesale_guide;
    if (body.seller_tips !== undefined) clean.seller_tips = body.seller_tips;
    if (body.fabric_care !== undefined) clean.fabric_care = body.fabric_care;
    clean.updated_at = new Date().toISOString();

    // 取现有第一行 id（全店共用一行）
    const { data: existing } = await supabase
      .from("store_content")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let result;
    if (existing?.id) {
      result = await supabase
        .from("store_content")
        .update(clean)
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      result = await supabase.from("store_content").insert(clean).select().single();
    }

    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: result.data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
