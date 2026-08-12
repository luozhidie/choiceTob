import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decodeToken } from "../wechat-pay/_lib";

/**
 * 店主认证（免费）→ 写入 stores + 解锁批发价
 * POST /api/auth/store-certify
 * Body: { token, store:{ name, contact_person, phone, wechat, city, district,
 *         shop_size, style_position, target_age, price_range, business_data, notes } }
 *
 * ⚠️ 本地仓库此前缺失此路由（生产环境原有），此为按小程序 certify 页契约重建版。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, store } = body;

    const tk = decodeToken(token);
    if (!tk?.uid) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const userId = tk.uid;

    if (!store || !store.name) {
      return NextResponse.json({ error: "店铺名称必填" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 写入 stores
    const { data: storeRow, error: storeErr } = await supabase
      .from("stores")
      .insert({
        name: store.name,
        contact_person: store.contact_person || null,
        phone: store.phone || null,
        wechat: store.wechat || null,
        city: store.city || null,
        district: store.district || null,
        shop_size: store.shop_size || null,
        style_position: store.style_position || null,
        target_age: store.target_age || null,
        price_range: store.price_range || null,
        business_data: store.business_data || null,
        notes: store.notes || null,
        status: "active",
        source: "mini_program_certify",
      })
      .select("id")
      .single();

    if (storeErr) {
      console.error("[store-certify] 写 stores 失败:", storeErr);
      return NextResponse.json({ error: "店铺创建失败：" + storeErr.message }, { status: 500 });
    }

    // 更新 profile：认证 + 批发价 + 关联店铺
    const { error: profErr } = await supabase
      .from("profiles")
      .update({
        store_owner_certified: true,
        certified_style: store.style_position || null,
        wholesale_enabled: true,
        agent_store_id: storeRow.id,
      })
      .eq("id", userId);

    if (profErr) {
      console.error("[store-certify] 更新 profile 失败:", profErr);
      return NextResponse.json({ error: "认证更新失败：" + profErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, store_id: storeRow.id, wholesale_enabled: true });
  } catch (err: any) {
    console.error("[store-certify] 异常:", err?.message || err);
    return NextResponse.json({ error: "认证失败", detail: err?.message || String(err) }, { status: 500 });
  }
}
