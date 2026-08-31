// app/api/virtual-pay/_check/route.ts
// 临时自检探针：确认 virtual_orders 表是否存在、有多少订单、最近订单状态
// 验证完毕后可删除
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  VIRTUAL_PAY_ENABLED,
  VIRTUAL_OFFER_ID,
  VIRTUAL_ENV,
  getAppKey,
  VIRTUAL_GOODS,
} from "@/lib/virtual-pay";

export async function GET(request: NextRequest) {
  const out: any = {
    enabled: VIRTUAL_PAY_ENABLED,
    env: VIRTUAL_ENV,
    offerIdSet: !!VIRTUAL_OFFER_ID,
    appKeySet: !!getAppKey(VIRTUAL_ENV),
    goodsCount: Object.keys(VIRTUAL_GOODS).length,
    goods: VIRTUAL_GOODS,
    table: null as any,
    orders: null as any,
  };
  try {
    const svc = createServiceRoleClient();
    const r = await svc
      .from("virtual_orders")
      .select("out_trade_no,openid,goods_key,product_id,amount_cents,status,env,paid_at,created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (r.error) {
      out.table = { ok: false, error: r.error.message, code: (r.error as any).code };
    } else {
      out.table = { ok: true };
      out.orders = r.data;
    }
    // 统计 paid 数量
    const c = await svc
      .from("virtual_orders")
      .select("out_trade_no", { count: "exact", head: true });
    out.totalCount = (c as any).count ?? null;
  } catch (e: any) {
    out.table = { ok: false, error: e?.message };
  }
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
