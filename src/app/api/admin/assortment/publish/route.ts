// 管理员 API：把组货方案「写入商城」——品类 + 营销活动 + 首页横幅 + AI 文案
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

/* —— 从 AI 报告提取营销文案 —— */
function extractMarketing(source: any, title: string) {
  const report = source || {};
  const season = report.season || "";
  const brandName = report.brandName || "骆芷蝶智选";
  const summary = report.summary || "";

  const colorPlan: any[] = Array.isArray(report.colorPlan) ? report.colorPlan : [];
  const stylePlan: any[] = Array.isArray(report.stylePlan) ? report.stylePlan : [];
  const productStructure: any[] = Array.isArray(report.productStructure) ? report.productStructure : [];
  const displayAdvice = report.displayAdvice || {};
  const topsTips: string[] = Array.isArray(displayAdvice.topsTips) ? displayAdvice.topsTips : [];

  const headline = title || `${season}${brandName}系列上新`;
  const subheadline = summary.length > 80 ? summary.slice(0, 80) + "…" : summary;

  const selling_points: string[] = [];
  colorPlan.slice(0, 2).forEach((c: any) => {
    if (c.type && c.reason) selling_points.push(`${c.type}：${c.reason}`);
  });
  stylePlan.slice(0, 2).forEach((s: any) => {
    if (s.styleCombo) selling_points.push(`${s.styleCombo}风格，${s.occasions?.join("/") || ""}`);
  });
  productStructure.slice(0, 2).forEach((p: any) => {
    if (p.type && p.desc) selling_points.push(`${p.type}：${p.desc}`);
  });
  topsTips.slice(0, 2).forEach((t: string) => selling_points.push(t));

  if (selling_points.length === 0) {
    selling_points.push("精选当季流行款，批发价直出", "VIP 拿货专享折扣，现货速发");
  }

  const hashtags: string[] = [];
  colorPlan.forEach((c: any) => (c.colors || []).forEach((col: string) => { if (!hashtags.includes(col)) hashtags.push(col); }));
  stylePlan.forEach((s: any) => { if (s.styleCombo) hashtags.push(s.styleCombo); });
  if (hashtags.length === 0) hashtags.push(season, brandName, "组货上新");

  const imageKeywords = buildImageKeywords(report);
  const bannerPrompt = `Fashion e-commerce banner, ${season} collection, ${imageKeywords}, elegant women's clothing, professional photography, soft lighting, clean background, high quality`;

  return {
    headline,
    subheadline,
    selling_points: selling_points.slice(0, 6),
    cta: "立即选款，抢现货 →",
    hashtags: hashtags.slice(0, 5),
    image_keywords: imageKeywords,
    banner_prompt: bannerPrompt,
    banner_image_url: buildPollinationsUrl(bannerPrompt),
  };
}

function buildImageKeywords(report: any) {
  const ik = report.imageKeywords || {};
  const parts: string[] = [];
  (ik.colorImages || []).slice(0, 2).forEach((k: string) => parts.push(k));
  (ik.styleImages || []).slice(0, 2).forEach((k: string) => parts.push(k));
  (ik.waveImages || []).slice(0, 1).forEach((w: any) => (w.keywords || []).slice(0, 2).forEach((k: string) => parts.push(k)));
  if (parts.length === 0) {
    const season = report.season || "";
    const style = (report.stylePlan || []).map((s: any) => s.mainStyle).filter(Boolean)[0] || "fashion";
    parts.push(season, style, "women clothing");
  }
  return parts.join(", ");
}

function buildPollinationsUrl(prompt: string) {
  // 使用内嵌 SVG 渐变图，避免 pollinations.ai/unsplash 等外部域名被拦截导致黑屏
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#2d1b2e"/><stop offset="100%" style="stop-color:#4a3a4b"/></linearGradient></defs><rect width="1600" height="400" fill="url(#g)"/></svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const { id } = await request.json();
    if (!id || String(id).startsWith("demo-")) {
      return NextResponse.json({ error: "缺少有效的方案 id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. 读取方案
    const { data: plan, error: planErr } = await supabase
      .from("assortment_plans")
      .select("*")
      .eq("id", id)
      .single();
    if (planErr || !plan) return NextResponse.json({ error: "方案不存在" }, { status: 404 });

    const cats: any[] = Array.isArray(plan.categories) ? plan.categories : [];

    // 2. 现有分类（用于按 label 去重 + 生成新 code）
    const { data: allCats } = await supabase.from("categories").select("code,label");
    const existingByLabel = new Map<string, any>();
    (allCats || []).forEach((c: any) => existingByLabel.set(c.label, c));
    let maxAi = 0;
    (allCats || []).forEach((c: any) => {
      const m = /^AI(\d+)$/.exec(c.code || "");
      if (m) maxAi = Math.max(maxAi, Number(m[1]));
    });
    let seq = maxAi;
    const baseSort = (allCats || []).length;

    const resolved: any[] = [];
    for (const cat of cats) {
      const label = String(cat.category || "").trim();
      if (!label) continue;
      let code: string;
      const ex = existingByLabel.get(label);
      if (ex) {
        code = ex.code;
      } else {
        seq += 1;
        code = "AI" + String(seq).padStart(3, "0");
        const { error: insErr } = await supabase.from("categories").insert({
          code,
          label,
          description: cat.note || "",
          sort_order: baseSort + seq,
          is_default: false,
        });
        if (insErr) {
          code = "AI" + String(Date.now()).slice(-5);
          await supabase
            .from("categories")
            .upsert({ code, label, description: cat.note || "", is_default: false }, { onConflict: "code" });
        }
        existingByLabel.set(label, { code, label });
      }
      resolved.push({ ...cat, code });
    }

    // 3. 生成营销文案
    const marketing = extractMarketing(plan.marketing?.source_report || null, plan.title);

    // 4. 创建/更新 promotions（系列营销活动）
    const existingPromoId = plan.marketing?.promo_id;
    let promoId = existingPromoId;
    if (existingPromoId) {
      const promoUpdate: any = {
        title: marketing.headline,
        description: marketing.subheadline,
        banner_image_url: marketing.banner_image_url,
        link_url: `/assortment/${id}`,
        status: "active",
        updated_at: new Date().toISOString(),
      };
      const { data: existingPromo } = await supabase.from("promotions").select("end_date").eq("id", existingPromoId).single();
      if (!existingPromo?.end_date) promoUpdate.end_date = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      await supabase.from("promotions").update(promoUpdate).eq("id", existingPromoId);
    } else {
      const endDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      const { data: promo, error: promoErr } = await supabase.from("promotions").insert({
        title: marketing.headline,
        description: marketing.subheadline,
        promo_type: "series",
        discount_rate: null,
        start_date: new Date().toISOString(),
        banner_image_url: marketing.banner_image_url,
        link_url: `/assortment/${id}`,
        status: "active",
        sort_order: 0,
        end_date: endDate,
      }).select().single();
      // 不再静默吞掉：创建系列促销失败必须明确报错，
      // 避免方案被误判为「已发布」却无当季系列入口。
      if (promoErr) {
        return NextResponse.json(
          { error: "创建系列促销活动失败：" + promoErr.message, code: "PROMO_INSERT_FAILED", detail: promoErr },
          { status: 500 }
        );
      }
      if (promo) promoId = promo.id;
    }

    // 5. 创建/更新 site_assets 首页横幅
    const existingAssetId = plan.marketing?.site_asset_id;
    let assetId = existingAssetId;
    const assetKey = `hero_banner_assortment_${id}`;
    if (existingAssetId) {
      await supabase.from("site_assets").update({
        title: marketing.headline,
        subtitle: marketing.subheadline,
        image_url: marketing.banner_image_url,
        link_url: `/assortment/${id}`,
        sort_order: 0,
        is_active: true,
        updated_at: new Date().toISOString(),
      }).eq("id", existingAssetId);
    } else {
      const { data: asset, error: assetErr } = await supabase.from("site_assets").insert({
        key: assetKey,
        title: marketing.headline,
        subtitle: marketing.subheadline,
        image_url: marketing.banner_image_url,
        link_url: `/assortment/${id}`,
        alt_text: marketing.headline,
        sort_order: 0,
        is_active: true,
      }).select().single();
      if (assetErr) console.error("[publish] site_assets insert error:", assetErr);
      if (asset) assetId = asset.id;
    }

    // 6. 写一条 ai_marketing_copies 记录
    try {
      await supabase.from("ai_marketing_copies").insert({
        title: marketing.headline,
        product_desc: marketing.subheadline,
        keywords: marketing.hashtags.join(", "),
        image_url: marketing.banner_image_url,
        platform: "group",
        tone: "爆款",
        result_json: marketing,
      });
    } catch (e) {
      console.error("[publish] ai_marketing_copies insert error:", e);
    }

    // 7. 方案置 published 并写入 marketing
    const now = new Date().toISOString();
    const fullMarketing = {
      ...marketing,
      source_report: plan.marketing?.source_report || null,
      promo_id: promoId || null,
      site_asset_id: assetId || null,
    };
    const { data: updated, error: updErr } = await supabase
      .from("assortment_plans")
      .update({ status: "published", categories: resolved, marketing: fullMarketing, updated_at: now })
      .eq("id", id)
      .select()
      .single();
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      data: updated,
      createdCategories: resolved.length,
      marketing: fullMarketing,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
