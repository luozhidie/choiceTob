// 管理员 API：修复已发布但缺少「系列促销活动」的组货方案
// 场景：promotions.promo_type 约束曾不含 'series'，导致历史发布漏建 promo，
//       首页与小程序「当季系列」入口缺失。本接口为这类方案补建 series 促销并更新 marketing.promo_id。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !key) return NextResponse.json({ success: false, error: "缺少 SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    // 1. 取出所有已发布方案
    const { data: plans, error: planErr } = await supabase
      .from("assortment_plans")
      .select("id, title, marketing")
      .eq("status", "published");
    if (planErr) return NextResponse.json({ success: false, error: planErr.message }, { status: 500 });

    const needRepair: any[] = (plans || []).filter((p: any) => {
      const promoId = p.marketing?.promo_id;
      return !promoId || (typeof promoId === "string" && promoId.trim() === "");
    });

    let repaired = 0;
    const errors: string[] = [];

    for (const p of needRepair) {
      const m = p.marketing || {};
      const title = m.headline || p.title || "当季系列";
      const description = m.subheadline || "";
      const banner = m.banner_image_url || "";
      const endDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

      const { data: promo, error: promoErr } = await supabase
        .from("promotions")
        .insert({
          title,
          description,
          promo_type: "series",
          discount_rate: null,
          start_date: new Date().toISOString(),
          banner_image_url: banner,
          link_url: `/assortment/${p.id}`,
          status: "active",
          sort_order: 0,
          end_date: endDate,
        })
        .select()
        .single();

      if (promoErr) {
        errors.push(`${p.title || p.id}: ${promoErr.message}`);
        continue;
      }
      if (!promo) continue;

      const { error: updErr } = await supabase
        .from("assortment_plans")
        .update({ marketing: { ...m, promo_id: promo.id } })
        .eq("id", p.id);
      if (updErr) {
        errors.push(`更新方案 ${p.title || p.id} 失败: ${updErr.message}`);
        continue;
      }
      repaired += 1;
    }

    return NextResponse.json({
      success: true,
      repaired,
      scanned: (plans || []).length,
      needRepair: needRepair.length,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
