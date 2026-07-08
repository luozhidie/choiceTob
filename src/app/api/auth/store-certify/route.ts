import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 小程序店铺认证接口（三步渐进式信息录入）
 * POST /api/auth/store-certify
 * Body: { token, store:{ name, phone, wechat, city, style_position, price_range, business_data } }
 *
 * business_data 包含：shop_type / years_experience / wholesale_markets /
 *                      purchase_frequency / main_categories / credibility_score / source / notes
 *
 * 设计原则：
 * 1. 只收集对后续"推荐款式+精准服务"有价值、且不敏感的经营画像数据
 * 2. 后端二次计算可信度分（credibility_score），交叉校验异常组合（如新手+每天拿货）
 * 3. 与后台店铺管理 stores 表字段对齐，数据直接同步到后台
 *
 * 本接口只处理用户自己提交的店铺数据，不涉及后台管理权限。
 */

function decodeToken(token: string): { uid?: string } | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** 后端可信度评分：0-100，交叉校验异常组合 */
function calcCredibility(s: any): number {
  const bd = s.business_data || {};
  let score = 40; // 基础分（能提交即给）

  // 身份信息完整度
  if (s.name && String(s.name).trim().length >= 4) score += 12;
  if (s.city) score += 8;
  if (bd.shop_type) score += 4;
  if (s.style_position) score += 6;
  if (s.price_range) score += 4;

  // 经营画像完整度（选择题越多越可信）
  const markets = String(bd.wholesale_markets || "").split(",").filter(Boolean);
  const cats = String(bd.main_categories || "").split(",").filter(Boolean);
  const styles = String(s.style_position || "").split(",").filter(Boolean);
  if (markets.length >= 1) score += 8;
  if (markets.length >= 2) score += 4; // 多市场更真实
  if (cats.length >= 1) score += 6;
  if (styles.length >= 1) score += 4;

  // 联系方式（可选但加分）
  if (s.wechat) score += 4;
  if (s.phone && /^1\d{10}$/.test(String(s.phone))) score += 4;

  // 交叉校验异常组合（扣分）
  const years = bd.years_experience || "";
  const freq = bd.purchase_frequency || "";
  // 新手（<1年）却"每天拿货" → 可疑
  if ((years.includes("半年") || years.includes("<6")) && freq.includes("每天")) {
    score -= 20;
  }
  // 无城市却填了具体拿货市场 → 可疑
  if (!s.city && markets.length >= 1) score -= 8;

  return Math.max(0, Math.min(100, score));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, store } = body;

    // ── 身份识别 ──
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

    // 展开前端传来的 business_data（不再嵌套 extra）
    const bd = store.business_data && typeof store.business_data === "object" ? store.business_data : {};

    // 后端二次算可信度分（防止前端篡改）
    const score = calcCredibility(store);
    const level = score >= 80 ? "high" : score >= 55 ? "medium" : "low";

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
      business_data: {
        ...bd,
        credibility_score: score,
        credibility_level: level,
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
      return NextResponse.json({ error: "认证状态保存失败：" + pErr.message }, { status: 500 });
    }

    // 数据积累表
    const { error: cErr } = await serviceClient.from("store_owner_certifications").insert({
      user_id: uid,
      quiz_passed: true,
      style: store.style_position || null,
      monthly_sales: null,
      region: store.city || null,
    });
    if (cErr) console.error("[Store Certify] 写入 certifications 失败:", cErr);

    return NextResponse.json({
      success: true,
      message: "认证成功，已开启批发价",
      store_owner_certified: true,
      store_id: inserted?.id || null,
      credibility_score: score,
      credibility_level: level,
    });
  } catch (err: any) {
    console.error("[Store Certify API Error]", err);
    return NextResponse.json({ error: err.message || "认证失败" }, { status: 500 });
  }
}
