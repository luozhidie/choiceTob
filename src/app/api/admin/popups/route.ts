// Admin 弹窗 CRUD API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("缺少 Supabase 配置");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET - 获取所有弹窗
export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("popups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01") return NextResponse.json({ success: true, data: [] });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - 新建 / 更新
export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, keywords, image_url, link_url, show_on_home, is_published, start_at, end_at } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const now = new Date().toISOString();

    const popupData: any = {
      title: title.trim(),
      keywords: keywords || null,
      image_url: image_url || null,
      link_url: link_url || null,
      show_on_home: show_on_home || false,
      is_published: is_published !== undefined ? is_published : false,
      start_at: start_at || null,
      end_at: end_at || null,
      updated_at: now,
    };

    let result;
    if (id) {
      const { data, error } = await supabase
        .from("popups")
        .update(popupData)
        .eq("id", id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      result = data;
    } else {
      const { data, error } = await supabase
        .from("popups")
        .insert([{ ...popupData, created_at: now }])
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - 删除弹窗
export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

    const supabase = getServiceRoleClient();
    const { error } = await supabase.from("popups").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
