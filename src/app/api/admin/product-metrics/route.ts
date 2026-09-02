// 管理员 API：商品数据化指标查询
// GET /api/admin/product-metrics?type=health|restock|structure&limit=50
//   health    商品健康度（售罄率/周转天数/折扣率/毛利/畅销滞销判定）
//   restock   补货与清仓预警（直接看「建议动作」列）
//   structure 订货结构比例校验（对照黄金比例 32/32/12/12/6）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

async function withClient<T>(fn: (s: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      return await fn(createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY));
    } catch {}
  }
  return await fn(createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE));
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const type = sp.get("type") || "health";
    const limit = Math.min(Number(sp.get("limit") || 50), 500);

    const viewMap: Record<string, string> = {
      health: "v_product_health",
      restock: "v_restock_alert",
      structure: "v_assortment_structure",
    };
    const view = viewMap[type];
    if (!view) {
      return NextResponse.json({ error: "type 只能是 health / restock / structure" }, { status: 400 });
    }

    const { data, error } = await withClient((s) => s.from(view).select("*").limit(limit));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, type, count: data?.length || 0, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}
