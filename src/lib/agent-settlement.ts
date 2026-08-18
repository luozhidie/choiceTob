import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 代理推广归因 + 差价结算（平台自动结算版）
 * - resolveAgentByCode: 推广码(invite_code) → 代理 user_id
 * - settleAgentSale: 订单支付成功后，把(客户实付 − 批发成本)的差价结算进代理可提现余额
 *   批发成本 = 产品零售价(products.price) × 代理折扣率(profiles.deposit_discount_rate) × 数量
 * 供微信支付回调 / 虎皮椒回调 两条线共用，避免重复实现导致漏算。
 */
type SupabaseClient = ReturnType<typeof createServiceRoleClient>;

/** 把推广码（profiles.invite_code）解析为代理 user_id；找不到返回 null */
export async function resolveAgentByCode(
  supabase: SupabaseClient,
  code: string | null | undefined
): Promise<string | null> {
  if (!code || typeof code !== "string" || code.trim().length === 0) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, membership_type, deposit_amount")
    .eq("invite_code", code.trim().toUpperCase())
    .maybeSingle();
  if (!data) return null;
  const isAgent =
    data.membership_type === "deposit_discount" &&
    Number(data.deposit_amount || 0) > 0;
  return isAgent ? (data.id as string) : null;
}

export interface AgentSettlementResult {
  settled: boolean;
  reason?: string;
  profit?: number;
}

/**
 * 结算单笔代理销售（平台自动结算）。幂等：settlement_status='settled' 则跳过。
 * 资金流：客户付代理设的卖价(orders.total_amount) → 平台发货 →
 *   平台批发成本 = 产品零售价 × 代理折扣率 × 数量
 *   代理差价 = 客户实付 − 批发成本 → 进代理 user_wallet.balance（可提现/抵扣拿货）
 */
export async function settleAgentSale(
  supabase: SupabaseClient,
  orderNo: string
): Promise<AgentSettlementResult> {
  const { data: ord } = await supabase
    .from("orders")
    .select("order_no, agent_id, total_amount, product_id, quantity, settlement_status")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (!ord || !ord.agent_id) return { settled: false, reason: "no_agent" };
  if (ord.settlement_status === "settled") return { settled: false, reason: "already_settled" };

  const gross = Math.round(Number(ord.total_amount || 0));
  if (gross <= 0) return { settled: false, reason: "zero_amount" };

  // 代理折扣率 + 产品零售价
  const { data: agent } = await supabase
    .from("profiles")
    .select("deposit_discount_rate")
    .eq("id", ord.agent_id)
    .maybeSingle();
  const { data: prod } = await supabase
    .from("products")
    .select("price")
    .eq("id", ord.product_id)
    .maybeSingle();

  const rate = Number(agent?.deposit_discount_rate || 1);
  const retail = Number(prod?.price || 0);
  const qty = Math.max(1, Number(ord.quantity || 1));
  const cost = Math.round(retail * rate * qty);
  const profit = Math.max(0, gross - cost);

  // 差价进代理 user_wallet（可提现余额）
  const { data: wallet } = await supabase
    .from("user_wallet")
    .select("balance")
    .eq("user_id", ord.agent_id)
    .maybeSingle();
  if (wallet) {
    await supabase
      .from("user_wallet")
      .update({ balance: Number(wallet.balance || 0) + profit, updated_at: new Date().toISOString() })
      .eq("user_id", ord.agent_id);
  } else {
    await supabase
      .from("user_wallet")
      .insert({ user_id: ord.agent_id, balance: profit, updated_at: new Date().toISOString() });
  }

  // 标记订单已结算
  await supabase
    .from("orders")
    .update({
      agent_cost: cost,
      agent_profit: profit,
      settlement_status: "settled",
    })
    .eq("order_no", orderNo);

  return { settled: true, profit };
}
