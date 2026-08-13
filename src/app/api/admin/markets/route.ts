// 管理员 API：创建/更新市场（档口板块）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// GET - 获取全部市场（含未发布，后台列表用）
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("markets")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("[获取市场] 失败:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    console.error("[获取市场] 异常:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id, name, location, cover_image, avatar, intro,
      is_published, sort_order,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "缺少市场名称" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const now = new Date().toISOString();

    const marketData: any = {
      name,
      location: location || null,
      cover_image: cover_image || null,
      avatar: avatar || null,
      intro: intro || null,
      is_published: is_published !== undefined ? is_published : false,
      sort_order: sort_order || 0,
    };

    let result;
    if (id && !id.startsWith("demo-")) {
      const { data, error } = await supabase
        .from("markets")
        .update(marketData)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        console.error("[更新市场] 失败:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      const newId = crypto.randomUUID();
      const { data, error } = await supabase
        .from("markets")
        .insert([{ ...marketData, id: newId, created_at: now }])
        .select()
        .single();
      if (error) {
        console.error("[创建市场] 失败:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("[保存市场] 异常:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
