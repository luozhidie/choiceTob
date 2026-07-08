import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 小程序店铺认证接口（4步渐进式全必填）
 * POST /api/auth/store-certify
 *
 * Step 1: 店铺身份（店名/联系人/电话/微信/城市/商圈/经营模式/面积）— 全必填
 * Step 2: 经营画像（拿货市场/频次/品类/风格/年龄层/价格带）— 全必填
 * Step 3: 补充信息（地址/色系/门头照/陈列照/拿货单/经营数据(选填)/备注）— 全必填
 *
 * 数据写入 stores 表，同步至后台"店铺管理"，电脑端手机端共用同一张表。
 */

function decodeToken(token: string): { uid?: string } | null {
  try {
    return JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/** 后端可信度评分 */
function calcCredibility(s: any): number {
  const bd = s.business_data || {};
  let score = 40;
  if (s.name && String(s.name).trim().length >= 4) score += 12;
  if (s.city) score += 10;
  if (s.contact_person) score += 6;
  if (s.phone && /^1\d{10}$/.test(String(s.phone))) score += 8;
  if (s.wechat) score += 4;
  if (s.style_position) score += 6;
  if (s.target_age) score += 4;
  if (s.price_range) score += 4;

  const markets = String(bd.wholesale_markets || "").split(",").filter(Boolean);
  const cats = String(bd.main_categories || "").split(",").filter(Boolean);
  if (markets.length >= 1) score += 8;
  if (markets.length >= 2) score += 4;
  if (cats.length >= 1) score += 4;
  if (bd.shop_type) score += 4;
  if (bd.purchase_frequency) score += 4;

  // 照片上传是强信号
  if (bd.front_photo_base64) score += 12;
  if (bd.interior_photo_base64) score += 8;
  // 拿货单上传是强信号（证明真实经营）
  if (bd.purchase_order_base64) score += 10;
  // 地址填写
  if (bd.store_address) score += 6;
  // 色系选择
  if (bd.store_color_system) score += 4;

  // 交叉校验异常扣分
  const years = bd.years_experience || "";
  const freq = bd.purchase_frequency || "";
  if ((years.includes("半年") || years.includes("<6")) && freq.includes("每天")) score -= 20;
  if (!s.city && markets.length >= 1) score -= 8;

  return Math.max(0, Math.min(100, score));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, store } = body;

    if (!token) {
      return NextResponse.json({ error: "未登录，请先登录后再认证" }, { status: 401 });
    }
    const decoded = decodeToken(token);
    const uid = decoded?.uid;
    if (!uid) {
      return NextResponse.json({ error: "登录态已失效，请重新登录" }, { status: 401 });
    }

    if (!store || !store.name || !String(store.name).trim()) {
      return NextResponse.json({ error: "请填写店铺名称" }, { status: 400 });
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const bd = store.business_data && typeof store.business_data === "object"
      ? store.business_data : {};

    const score = calcCredibility(store);

    const storePayload = {
      owner_id: uid,
      name: String(store.name).trim(),
      contact_person: store.contact_person || null,
      phone: store.phone || null,
      wechat: store.wechat || null,
      city: store.city || null,
      district: store.district || null,
      shop_size: store.shop_size || null,
      style_position: store.style_position || null,
      target_age: store.target_age || null,
      price_range: store.price_range || null,

      // 弹性 JSON 字段：存放小程序特有的扩展数据
      business_data: {
        ...bd,
        store_address: bd.store_address || null,
        store_color_system: bd.store_color_system || null,
        front_photo_base64: bd.front_photo_base64 || null,
        interior_photo_base64: bd.interior_photo_base64 || null,
        credibility_score: score,
        credibility_level: score >= 80 ? "high" : score >= 55 ? "medium" : "low",
        source: bd.source || "mini_program_certify",
        submitted_at: new Date().toISOString(),
      },

      notes: store.notes || bd.notes || null,
      status: "active",
    };

    const { data: inserted, error: sErr } = await serviceClient
      .from("stores")
      .insert([storePayload])
      .select("id")
      .single();

    if (sErr) {
      console.error("[Store Certify] 写入 stores 失败:", sErr);
      return NextResponse.json({ error: "店铺信息保存失败：" + sErr.message }, { status: 500 });
    }

    // 更新 profiles：标记为认证店主
    const { error: pErr } = await serviceClient
      .from("profiles")
      .update({
        store_owner_certified: true,
        certified_at: new Date().toISOString(),
        certified_style: store.style_position || null,
      })
      .eq("id", uid);

    if (pErr) {
      console.error("[Store Certify] 更新 profiles 失败:", pErr);
    }

    // 数据积累表（非核心路径，失败不阻断）
    try {
      await serviceClient.from("store_owner_certifications").insert({
        user_id: uid,
        quiz_passed: true,
        style: store.style_position || null,
        monthly_sales: null,
        region: store.city || null,
      });
    } catch (e: any) {
      console.error("[Store Certify] certifications 写入失败:", e);
    }

    return NextResponse.json({
      success: true,
      message: "认证成功，已开启批发价",
      store_owner_certified: true,
      store_id: inserted?.id || null,
      credibility_score: score,
    });

  } catch (err: any) {
    console.error("[Store Certify API Error]", err);
    return NextResponse.json({ error: err.message || "认证失败" }, { status: 500 });
  }
}
