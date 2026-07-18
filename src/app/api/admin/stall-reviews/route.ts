// 管理员 API：档口评价 增/改/查（删除走通用 common/delete，白名单已含 stall_reviews）
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

// GET - 全部评价（含档口名称），可按 stall_id 过滤
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const stallId = searchParams.get("stall_id");
    const supabase = getServiceRoleClient();
    let query = supabase
      .from("stall_reviews")
      .select("*, peer_stalls(name)")
      .order("created_at", { ascending: false });
    if (stallId) query = query.eq("stall_id", stallId);
    const { data, error } = await query;
    if (error) {
      console.error("[获取评价] 失败:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    console.error("[获取评价] 异常:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - 新建 / 更新评价
export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { id, stall_id, user_name, content, rating } = body;

    if (!stall_id) {
      return NextResponse.json({ error: "缺少所属档口" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "请输入评价内容" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const now = new Date().toISOString();
    const reviewData: any = {
      stall_id,
      user_name: user_name && user_name.trim() ? user_name.trim() : "匿名买手",
      content: content.trim(),
      rating: rating !== undefined && rating !== null && rating !== "" ? Number(rating) : 5,
    };

    let result;
    if (id && !id.startsWith("demo-")) {
      const { data, error } = await supabase
        .from("stall_reviews")
        .update(reviewData)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        console.error("[更新评价] 失败:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      const newId = crypto.randomUUID();
      const { data, error } = await supabase
        .from("stall_reviews")
        .insert([{ ...reviewData, id: newId, created_at: now }])
        .select()
        .single();
      if (error) {
        console.error("[创建评价] 失败:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("[保存评价] 异常:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
