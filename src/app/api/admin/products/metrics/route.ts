// 管理员 API：批量更新商品主数据维度（商品数据化第①层的录入口）
// PATCH /api/admin/products/metrics
//   body: { ids: ["uuid1","uuid2"], patch: { product_role: "key", wave: 1, ... } }
//
// 只允许改「数据化维度」字段，价格/库存/标题等敏感列一律不在这改（防误操作）
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

// 可写字段白名单
const ALLOWED = [
  "product_role",   // staple常用品 / key重点品 / image形象品 / buffer备补品 / trial试销品
  "price_band",     // image形象 / main主力 / trial试销促销 / buffer备补
  "wave",           // 1-4 上货波段
  "season_code",    // 如 2026-AW
  "supplier",       // 供应商
  "occasion",       // commute / date / casual / banquet / vacation / daily
  "color_area_pct", // 色彩面积占比
  "purchased_qty",  // 进货量（售罄率分母，很重要）
  "first_on_sale_at", // 首次上架日
];

// 枚举校验（跟数据库 CHECK 约束保持一致，提前报错更友好）
const ENUM_CHECK: Record<string, string[]> = {
  product_role: ["staple", "key", "image", "buffer", "trial"],
  price_band: ["image", "main", "trial", "buffer"],
  occasion: ["commute", "date", "casual", "banquet", "vacation", "daily"],
};

export async function PATCH(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });

    const body = await request.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const patch = body.patch || {};

    if (ids.length === 0) return NextResponse.json({ error: "ids 不能为空" }, { status: 400 });

    // 过滤 + 校验
    const payload: Record<string, any> = {};
    for (const k of ALLOWED) {
      if (patch[k] === undefined) continue;
      const v = patch[k];
      if (ENUM_CHECK[k] && v !== null && !ENUM_CHECK[k].includes(v)) {
        return NextResponse.json({ error: `${k} 取值非法，只能是：${ENUM_CHECK[k].join(" / ")}` }, { status: 400 });
      }
      if (k === "wave" && v !== null && (Number(v) < 1 || Number(v) > 4)) {
        return NextResponse.json({ error: "wave 只能是 1-4" }, { status: 400 });
      }
      payload[k] = v;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "没有可更新的维度字段" }, { status: 400 });
    }

    const { data, error } = await withClient((s) =>
      s.from("products").update(payload).in("id", ids).select("id,title")
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, updated: data?.length || 0, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新失败" }, { status: 500 });
  }
}
