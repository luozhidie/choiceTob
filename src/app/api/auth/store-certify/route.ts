import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 小程序店铺认证接口（信息录入式，替代原答题认证）
 * POST /api/auth/store-certify
 * Body: { token, store:{ name, contact_person, phone, wechat, city, district, shop_size, style_position, target_age, price_range, business_data, notes } }
 *
 * 流程：
 * 1. 解析小程序自定义 token（base64url，含 uid）
 * 2. service_role 写入 stores 表（owner = 当前用户）
 * 3. 更新 profiles：store_owner_certified = true
 * 4. 写入 store_owner_certifications（数据积累）
 *
 * 注意：本接口只处理用户自己提交的店铺数据，不涉及后台管理权限。
 * 后台店铺管理页的管理员鉴权由该页面自身控制，与本条接口无关。
 */

function decodeToken(token: string): { uid?: string } | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
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

    // ── service_role 写入（绕过 RLS，owner 绑定当前用户）──
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 整理经营数据（弹性 JSONB）
    const businessData: Record<string, any> = {};
    if (store.business_data && typeof store.business_data === "object") {
      businessData.extra = store.business_data;
    }

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
      business_data: businessData,
      notes: store.notes || null,
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

    // 写入数据积累表（字段对齐 store_owner_certifications 表结构）
    const { error: cErr } = await serviceClient.from("store_owner_certifications").insert({
      user_id: uid,
      quiz_passed: true,
      style: store.style_position || null,
      monthly_sales: null,
      region: store.city || null,
    });

    if (cErr) {
      console.error("[Store Certify] 写入 certifications 失败:", cErr);
    }

    return NextResponse.json({
      success: true,
      message: "认证成功，已开启批发价",
      store_owner_certified: true,
      store_id: inserted?.id || null,
    });
  } catch (err: any) {
    console.error("[Store Certify API Error]", err);
    return NextResponse.json({ error: err.message || "认证失败" }, { status: 500 });
  }
}
