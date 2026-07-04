// 通用管理员版块 CRUD API - 使用 service_role 绕过 RLS
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';


function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET - 获取所有版块
export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("page_blocks")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      // 表不存在时返回空数组而不是错误
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ success: true, data: [] });
      }
      console.error("[获取版块] 失败:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    console.error("[获取版块] 异常:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - 新建或更新版块
export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, type, content, style, section_title, section_subtitle, is_published, sort_order } = body;

    if (!title || !type) {
      return NextResponse.json({ error: "缺少版块名称或类型" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const now = new Date().toISOString();

    const blockData = {
      title,
      type,
      content: content || {},
      style: style || {},
      section_title: section_title || null,
      section_subtitle: section_subtitle || null,
      is_published: is_published !== undefined ? is_published : true,
      sort_order: sort_order || 0,
      updated_at: now,
    };

    let result;
    if (id && !id.startsWith("demo-")) {
      // 更新已有版块
      const { data, error } = await supabase
        .from("page_blocks")
        .update(blockData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("[更新版块] 失败:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      // 新建版块 - 始终生成有效 ID
      const newId = crypto.randomUUID();
      const { data, error } = await supabase
        .from("page_blocks")
        .insert([{ ...blockData, id: newId, created_at: now }])
        .select()
        .single();

      if (error) {
        console.error("[创建版块] 失败:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("[保存版块] 异常:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT - 切换发布状态 / 更新排序
export async function PUT(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少版块ID" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    if (action === "toggle_publish") {
      // 获取当前状态
      const { data: current } = await supabase
        .from("page_blocks")
        .select("is_published")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("page_blocks")
        .update({
          is_published: !(current?.is_published ?? true),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "update_sort") {
      // 批量更新排序
      const items = body.items as Array<{ id: string; sort_order: number }>;
      for (const item of items) {
        await supabase
          .from("page_blocks")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
