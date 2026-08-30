// src/lib/virtual-deliver.ts
// 虚拟支付统一发货：按 goodsKey 分发到试衣权益 / 内容订阅权益
// 幂等：virtual_orders.status 由 pending → paid 的原子更新保证只发一次
import { grantTryonEntitlement } from "@/lib/tryon-grant";

// 内容订阅类：写入 profiles.membership_type / membership_expires_at
const CONTENT_PLANS: Record<string, { days: number; type: string; label: string }> = {
  daily_looks_monthly: { days: 30, type: "view_price", label: "搭配灵感·月度" },
  daily_looks_yearly: { days: 365, type: "view_price", label: "搭配灵感·年度" },
  articles_monthly: { days: 30, type: "view_price", label: "时尚资讯·月度" },
  articles_yearly: { days: 365, type: "view_price", label: "时尚资讯·年度" },
};

/** 标记订单已支付（原子幂等），返回 true 表示本次抢到发货权 */
export async function markOrderPaid(
  svc: any,
  outTradeNo: string,
  extra: Record<string, any> = {}
): Promise<boolean> {
  const { data, error } = await svc
    .from("virtual_orders")
    .update({ status: "paid", paid_at: new Date().toISOString(), ...extra })
    .eq("out_trade_no", outTradeNo)
    .eq("status", "pending")
    .select("out_trade_no");
  if (error) {
    console.error("[虚拟支付] 标记订单失败", error);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

/** 按 openid 找到 profiles 记录 id */
async function findProfileId(svc: any, openid: string): Promise<string | null> {
  const { data } = await svc
    .from("profiles")
    .select("id")
    .or(`wechat_openid.eq.${openid},wx_openid.eq.${openid}`)
    .maybeSingle();
  return data?.id || null;
}

/** 发放内容订阅（在现有到期时间上顺延） */
async function grantContentPlan(svc: any, openid: string, goodsKey: string) {
  const plan = CONTENT_PLANS[goodsKey];
  if (!plan) return;
  const userId = await findProfileId(svc, openid);
  if (!userId) {
    console.warn("[虚拟支付] 未找到 profile，跳过订阅发放", { openid, goodsKey });
    return;
  }
  const { data: prof } = await svc
    .from("profiles")
    .select("membership_expires_at")
    .eq("id", userId)
    .maybeSingle();

  const now = Date.now();
  const cur = prof?.membership_expires_at ? new Date(prof.membership_expires_at).getTime() : 0;
  const base = cur > now ? cur : now;
  const expiresAt = new Date(base + plan.days * 86400000);

  const { error } = await svc
    .from("profiles")
    .update({
      membership_type: plan.type,
      membership_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) console.error("[虚拟支付] 订阅发放失败", error);
  else console.log(`[虚拟支付] ${plan.label} 订阅已发放`, { openid, expiresAt });
}

/**
 * 统一发货入口
 * @returns 'granted' 已发放 | 'duplicate' 重复回调已跳过 | 'unknown' 未知商品
 */
export async function deliverVirtualGoods(
  svc: any,
  openid: string,
  goodsKey: string,
  outTradeNo: string
): Promise<"granted" | "duplicate" | "unknown"> {
  const ok = await markOrderPaid(svc, outTradeNo);
  if (!ok) return "duplicate";

  if (CONTENT_PLANS[goodsKey]) {
    await grantContentPlan(svc, openid, goodsKey);
    return "granted";
  }
  // 试衣套餐
  const { TRYON_PACKAGES } = await import("@/lib/tryon-grant");
  if (TRYON_PACKAGES[goodsKey]) {
    await grantTryonEntitlement(svc, openid, goodsKey);
    return "granted";
  }
  console.warn("[虚拟支付] 未知商品，仅标记已支付", goodsKey);
  return "unknown";
}
