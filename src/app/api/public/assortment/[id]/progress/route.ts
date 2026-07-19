// 公开 API：组货方案进度（按品类聚合已传商品数 + 平均零售/批发/批量价，与目标比对）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

function bandOk(avg: number, band: any): boolean {
  if (!band || !Array.isArray(band) || band.length < 2) return true;
  const [min, max] = band;
  if (min && avg < min) return false;
  if (max && avg > max) return false;
  return true;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE;
    const supabase = createClient(url, key);

    const { data: plan, error: planErr } = await supabase
      .from("assortment_plans")
      .select("*")
      .eq("id", id)
      .single();
    if (planErr || !plan) return NextResponse.json({ error: "方案不存在" }, { status: 404 });

    const cats: any[] = Array.isArray(plan.categories) ? plan.categories : [];
    const labels = cats.map((c) => String(c.category || "").trim()).filter(Boolean);

    // 聚合商品（不限发布状态，反映上传完整度）
    const items: any[] = [];
    if (labels.length) {
      const { data: products } = await supabase
        .from("products")
        .select("category, price, wholesale_price, bulk_price, cost_price")
        .in("category", labels);

      const agg: Record<string, { count: number; r: number; w: number; b: number; c: number }> = {};
      (products || []).forEach((p: any) => {
        const lbl = String(p.category || "").trim();
        if (!agg[lbl]) agg[lbl] = { count: 0, r: 0, w: 0, b: 0, c: 0 };
        const a = agg[lbl];
        a.count += 1;
        a.r += Number(p.price) || 0;
        a.w += Number(p.wholesale_price) || 0;
        a.b += Number(p.bulk_price) || 0;
        a.c += Number(p.cost_price) || 0;
      });

      cats.forEach((c) => {
        const lbl = String(c.category || "").trim();
        const a = agg[lbl] || { count: 0, r: 0, w: 0, b: 0, c: 0 };
        const uploaded = a.count;
        const target = Number(c.target_sku) || 0;
        const avgR = uploaded ? Math.round(a.r / uploaded) : 0;
        const avgW = uploaded ? Math.round(a.w / uploaded) : 0;
        const avgB = uploaded ? Math.round(a.b / uploaded) : 0;
        const avgC = uploaded ? Math.round(a.c / uploaded) : 0;
        const progress = target ? Math.min(100, Math.round((uploaded / target) * 100)) : (uploaded ? 100 : 0);
        let margin = null;
        if (avgC > 0 && avgW > 0) margin = Math.round(((avgW - avgC) / avgC) * 100);
        items.push({
          category: lbl,
          code: c.code,
          target_sku: target,
          uploaded,
          progress,
          retail_band: c.retail_band || null,
          wholesale_band: c.wholesale_band || null,
          bulk_band: c.bulk_band || null,
          avg_retail: avgR,
          avg_wholesale: avgW,
          avg_bulk: avgB,
          avg_cost: avgC,
          retail_ok: bandOk(avgR, c.retail_band),
          wholesale_ok: bandOk(avgW, c.wholesale_band),
          bulk_ok: bandOk(avgB, c.bulk_band),
          margin_pct: margin,
          wave: c.wave || "",
          note: c.note || "",
        });
      });
    }

    const totalTarget = items.reduce((s, i) => s + (i.target_sku || 0), 0);
    const totalUploaded = items.reduce((s, i) => s + (i.uploaded || 0), 0);
    const overallProgress = totalTarget ? Math.min(100, Math.round((totalUploaded / totalTarget) * 100)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        id: plan.id,
        title: plan.title,
        season: plan.season,
        status: plan.status,
        items,
        total_target: totalTarget,
        total_uploaded: totalUploaded,
        overall_progress: overallProgress,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
