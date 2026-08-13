// 管理员 API：创建/更新档口（peer_stalls）
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

// 将逗号分隔字符串转数组（tags / product_ids）
function toArray(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string" && v.trim()) {
    return v.split(/[,，]/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

// GET - 获取全部档口（含未发布，后台列表用；附带市场名称）
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("peer_stalls")
      .select("*, markets(name)")
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("[获取档口] 失败:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    console.error("[获取档口] 异常:", err);
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
      id, market_id, name, avatar, intro, market_floor,
      tags, rating, fan_count, reorder_rate, delivery_rate,
      product_ids, recommend_reason, is_published, sort_order,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "缺少档口名称" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const now = new Date().toISOString();

    const stallData: any = {
      market_id: market_id || null,
      name,
      avatar: avatar || null,
      intro: intro || null,
      market_floor: market_floor || null,
      tags: toArray(tags),
      rating: rating !== undefined && rating !== null && rating !== "" ? Number(rating) : 5.0,
      fan_count: fan_count ? Number(fan_count) : 0,
      reorder_rate: reorder_rate !== undefined && reorder_rate !== null && reorder_rate !== "" ? Number(reorder_rate) : 0,
      delivery_rate: delivery_rate !== undefined && delivery_rate !== null && delivery_rate !== "" ? Number(delivery_rate) : 0,
      product_ids: toArray(product_ids),
      recommend_reason: recommend_reason || null,
      is_published: is_published !== undefined ? is_published : false,
      sort_order: sort_order || 0,
    };

    let result;
    if (id && !id.startsWith("demo-")) {
      const { data, error } = await supabase
        .from("peer_stalls")
        .update(stallData)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        console.error("[更新档口] 失败:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      const newId = crypto.randomUUID();
      const { data, error } = await supabase
        .from("peer_stalls")
        .insert([{ ...stallData, id: newId, created_at: now }])
        .select()
        .single();
      if (error) {
        console.error("[创建档口] 失败:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("[保存档口] 异常:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
