// 代理/预存货款充值建单 API
// 1. 写入 agent_recharges 表（pending）
// 2. 调用微信统一下单
// 3. 返回小程序 wx.requestPayment 所需参数
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { unifiedOrder, generateJsapiPayParams } from "@/lib/wechat-pay";
import type { PayPlatform } from "@/lib/wechat-pay";

export const dynamic = "force-dynamic";

const PLANS: Record<string, {
  title: string;
  totalFee: number;      // 分
  depositAmount: number; // 分
  discountRate: number;  // 0.28 = 2.8折
  returnRate: number;    // 0.05 = 5%
  isTest?: boolean;
}> = {
  agent_test_cent: {
    title: "充值链路测试",
    totalFee: 1,
    depositAmount: 1,
    discountRate: 0.28,
    returnRate: 0.05,
    isTest: true,
  },
  wholesale_6k: {
    title: "拿货会员·首充6000",
    totalFee: 600000,
    depositAmount: 600000,
    discountRate: 0.28,
    returnRate: 0,
  },
  wholesale_5w: {
    title: "充值会员·5万",
    totalFee: 5000000,
    depositAmount: 5000000,
    discountRate: 0.28,
    returnRate: 0.05,
  },
  wholesale_10w: {
    title: "充值会员·10万",
    totalFee: 10000000,
    depositAmount: 10000000,
    discountRate: 0.28,
    returnRate: 0.10,
  },
  wholesale_30w: {
    title: "充值会员·30万",
    totalFee: 30000000,
    depositAmount: 30000000,
    discountRate: 0.26,
    returnRate: 0.20,
  },
};

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function generateOrderNo(): string {
  return `AR${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan_id, openid, platform = "mini" } = body || {};

    const plan = PLANS[plan_id];
    if (!plan) {
      return NextResponse.json({ error: "无效的充值套餐" }, { status: 400 });
    }
    if (!openid) {
      return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const orderNo = generateOrderNo();

    // 如果该 openid 已关联 auth 用户，记录 user_id
    let userId: string | null = null;
    const { data: profileByWechat } = await supabase
      .from("profiles")
      .select("id")
      .eq("wechat_openid", openid)
      .maybeSingle();
    const { data: profileByWx } = await supabase
      .from("profiles")
      .select("id")
      .eq("wx_openid", openid)
      .maybeSingle();
    userId = profileByWechat?.id || profileByWx?.id || null;

    // 写入待支付订单
    const { error: insertError } = await supabase.from("agent_recharges").insert({
      order_no: orderNo,
      openid,
      user_id: userId,
      plan_id,
      product_title: plan.title,
      amount: plan.totalFee,
      deposit_amount: plan.depositAmount,
      discount_rate: plan.discountRate,
      return_rate: plan.returnRate,
      status: "pending",
      platform,
    });

    if (insertError) {
      console.error("[agent/recharge] 写入订单失败", insertError);
      const msg = String(insertError.message || "");
      // 表不存在：通常是 Supabase 未执行建表 SQL
      if (/relation "agent_recharges" does not exist|42P01/.test(msg)) {
        return NextResponse.json(
          { error: "数据库未初始化：请在 Supabase 执行 20260813_agent_recharge.sql 建表" },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: "创建充值订单失败：" + msg }, { status: 500 });
    }

    // 调用微信统一下单
    const wxResult = await unifiedOrder({
      out_trade_no: orderNo,
      body: plan.title,
      total_fee: plan.totalFee,
      openid,
      platform: platform as PayPlatform,
    });

    const prepayId = wxResult.prepay_id;
    if (!prepayId) {
      return NextResponse.json({ error: wxResult.err_code_des || "微信下单失败" }, { status: 500 });
    }

    const payParams = generateJsapiPayParams(prepayId, platform as PayPlatform);

    return NextResponse.json({
      success: true,
      order_no: orderNo,
      ...payParams,
    });
  } catch (err: any) {
    console.error("[agent/recharge]", err);
    return NextResponse.json(
      { error: err.message || "系统错误" },
      { status: 500 }
    );
  }
}
