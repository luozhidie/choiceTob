// src/lib/price-config.ts
// 价格后台化：把「实际计费金额」收归后端权威源（site_settings 配置 + 硬编码兜底）。
// 前端不再可信传金额（unified-order 忽略前端 total_fee），虚拟支付按 productId 查配置价。
// 注意：虚拟支付道具价格同时存在于微信 MP 后台「虚拟支付 → 道具管理」，改价需同步那里。

import { createServiceRoleClient } from "@/lib/supabase/service-role";

/* ===================== 兜底常量（与 discount.ts / virtual-pay.ts 一致） ===================== */

// 充值档位金额（分）—— 对应 discount.ts MEMBER_TIERS 里 wholesale 的 minRecharge
export const WHOLESALE_FALLBACK: Record<string, number> = {
  wholesale_6k: 600000,
  wholesale_5w: 5000000,
  wholesale_10w: 10000000,
  wholesale_30w: 30000000,
};

// 虚拟道具金额（分）—— 对应 virtual-pay.ts VIRTUAL_GOODS 的 priceFen
export const VIRTUAL_GOODS_FALLBACK: Record<string, number> = {
  tryon_first_9_9: 990,
  tryon_normal_99: 9900,
  tryon_normal_299: 29900,
  tryon_pro_998: 99800,
  tryon_test_cent: 100,
  daily_looks_monthly: 99900,
  daily_looks_yearly: 999900,
  articles_monthly: 13800,
  articles_yearly: 138000,
};

/* ===================== 读取 site_settings ===================== */

async function readSetting(key: string): Promise<any> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) {
      console.warn("[price-config] 读取失败", key, error.message);
      return null;
    }
    return data?.value ?? null;
  } catch (e: any) {
    console.warn("[price-config] 异常", key, e?.message);
    return null;
  }
}

/* ===================== 对外查询 ===================== */

/** 充值档位（wholesale_xxx）的实际金额（分）。key 非 wholesale_ 前缀返回 null。 */
export async function getWholesalePriceFen(key: string): Promise<number | null> {
  if (!key || !String(key).startsWith("wholesale_")) return null;
  const cfg = await readSetting("wholesale_tiers");
  if (cfg && typeof cfg === "object" && cfg[key] && typeof cfg[key].amountFen === "number") {
    return cfg[key].amountFen;
  }
  return WHOLESALE_FALLBACK[key] ?? null;
}

/** 虚拟道具（productId）的实际金额（分）。优先配置，回退硬编码。 */
export async function getVirtualGoodsPriceFen(productId: string): Promise<number | null> {
  const cfg = await readSetting("virtual_goods_prices");
  if (cfg && typeof cfg === "object" && typeof cfg[productId] === "number") {
    return cfg[productId];
  }
  return VIRTUAL_GOODS_FALLBACK[productId] ?? null;
}
