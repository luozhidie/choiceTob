// 管理员 API：修复已发布但缺少/损坏「系列促销活动」的组货方案
// 场景：promotions.promo_type 约束曾不含 'series'，导致历史发布漏建 promo；
//       且 banner 使用了 pollinations.ai 域名，常被网络拦截导致黑屏。
// 本接口：
//   1. 为已发布但缺 promo 的方案新建 series 促销；
//   2. 把已存在/新建的 series promo 的 banner 换成可靠 Unsplash 图；
//   3. 同步更新对应的 site_assets 首页轮播图与方案 marketing。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

const RELIABLE_BANNER_URL = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6b3f70"/><stop offset="55%" style="stop-color:#a86fa0"/><stop offset="100%" style="stop-color:#d9a7c7"/></linearGradient></defs><rect width="1600" height="400" fill="url(#g)"/></svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
})();

function isUnreliableImage(url: string | null | undefined): boolean {
  if (!url) return true;
  return url.includes("pollinations.ai") || url.startsWith("//") || url.trim() === "";
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

    let created = 0;
    let fixedImage = 0;
    const errors: string[] = [];

    for (const p of plans || []) {
      const m = p.marketing || {};
      const title = m.headline || p.title || "当季系列";
      const description = m.subheadline || "";
      const bannerUrl = isUnreliableImage(m.banner_image_url) ? RELIABLE_BANNER_URL : m.banner_image_url;
      const endDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      const assetKey = `hero_banner_assortment_${p.id}`;

      let promoId: string | null = m.promo_id || null;

      // 1) 还没 promo -> 新建
      if (!promoId || (typeof promoId === "string" && promoId.trim() === "")) {
        const { data: promo, error: promoErr } = await supabase
          .from("promotions")
          .insert({
            title,
            description,
            promo_type: "series",
            discount_rate: null,
            start_date: new Date().toISOString(),
            banner_image_url: bannerUrl,
            link_url: `/assortment/${p.id}`,
            status: "active",
            sort_order: 0,
            end_date: endDate,
          })
          .select()
          .single();

        if (promoErr) {
          errors.push(`新建促销 ${p.title || p.id}: ${promoErr.message}`);
          continue;
        }
        if (!promo) continue;
        promoId = promo.id;
        created += 1;
      } else {
        // 2) 已有 promo -> 检查并修复图片
        const { data: existing } = await supabase
          .from("promotions")
          .select("id, banner_image_url")
          .eq("id", promoId)
          .single();
        if (existing && isUnreliableImage(existing.banner_image_url)) {
          const { error: updErr } = await supabase
            .from("promotions")
            .update({ banner_image_url: bannerUrl })
            .eq("id", promoId);
          if (updErr) {
            errors.push(`更新促销图片 ${p.title || p.id}: ${updErr.message}`);
            continue;
          }
          fixedImage += 1;
        }
      }

      // 3) 更新首页轮播图 site_assets 为可靠图
      const { data: existingAsset } = await supabase
        .from("site_assets")
        .select("id, image_url")
        .eq("key", assetKey)
        .single();
      if (existingAsset) {
        if (isUnreliableImage(existingAsset.image_url)) {
          await supabase.from("site_assets").update({ image_url: bannerUrl }).eq("id", existingAsset.id);
        }
      } else {
        // 兜底：轮播图也丢了则补一条
        await supabase.from("site_assets").insert({
          key: assetKey,
          title,
          subtitle: description,
          image_url: bannerUrl,
          link_url: `/assortment/${p.id}`,
          alt_text: title,
          sort_order: 0,
          is_active: true,
        });
      }

      // 4) 更新方案 marketing
      const newMarketing = { ...m, headline: title, subheadline: description, banner_image_url: bannerUrl, promo_id: promoId };
      const { error: updErr } = await supabase.from("assortment_plans").update({ marketing: newMarketing }).eq("id", p.id);
      if (updErr) {
        errors.push(`更新方案 ${p.title || p.id}: ${updErr.message}`);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      fixedImage,
      scanned: (plans || []).length,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
