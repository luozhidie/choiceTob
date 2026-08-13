// app/api/tryon/notify/route.ts
// 微信支付回调（仅处理试衣订单）。验签 → 记账 → 发放/续期权益。
// 与生产 /api/wechat-pay/notify 完全独立，互不干扰。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseXml, signMd5 } from "@/lib/wechat-pay";
import { upsertTryonEntitlement } from "@/lib/tryon-entitlement";

const APIV2_KEY = process.env.WECHAT_APIV2_KEY || "QqQq77137992Qq77137992Qq77137992";

const PACKAGES: Record<string, { type: string; days: number; normal: number; pro: number }> = {
  // 新套餐：通用次数计入 normal_left
  tryon_first_1yuan:  { type: "first",   days: 365, normal: 10,  pro: 0 },
  tryon_monthly_99:   { type: "month",   days: 30,  normal: 120, pro: 0 },
  tryon_quarter_199:  { type: "quarter", days: 90,  normal: 280, pro: 0 },
  tryon_year_699:     { type: "year",    days: 365, normal: 1000, pro: 0 },
  // 内部测试通道
  tryon_test_cent:    { type: "test",    days: 7,   normal: 1,   pro: 1 },
};

export async function POST(request: NextRequest) {
  try {
    const xml = await request.text();
    const params = parseXml(xml);
    console.log("[试衣支付回调]", params);

    // 验证签名
    const sign = params.sign;
    delete params.sign;
    const localSign = signMd5(params);
    if (localSign !== sign) {
      console.error("[试衣支付回调] 签名失败", { localSign, sign });
      return xmlResp({ return_code: "FAIL", return_msg: "签名失败" });
    }

    if (params.result_code === "SUCCESS") {
      const supabase = await createClient();
      const out_trade_no = params.out_trade_no;
      const transaction_id = params.transaction_id;

      const { data: order } = await supabase
        .from("tryon_orders")
        .select("*")
        .eq("order_no", out_trade_no)
        .single();

      if (order && order.status !== "paid") {
        await supabase
          .from("tryon_orders")
          .update({ status: "paid", paid_at: new Date().toISOString(), transaction_id })
          .eq("order_no", out_trade_no);

        await grantEntitlement(supabase, order.openid, order.package_id);
      }
    }

    return xmlResp({ return_code: "SUCCESS", return_msg: "OK" });
  } catch (err: any) {
    console.error("[试衣支付回调] 异常", err);
    return xmlResp({ return_code: "FAIL", return_msg: err.message || "error" });
  }
}

// 发放/续期权益（按 openid 合并，有效期内续费 normal/pro 次数分别叠加）
async function grantEntitlement(supabase: any, openid: string, package_id: string) {
  const pkg = PACKAGES[package_id];
  if (!pkg) return;
  const now = Date.now();
  const windowMs = pkg.days * 86400000;
  const computedExpires = now + windowMs;

  const { data: exist } = await supabase
    .from("tryon_entitlements")
    .select("*")
    .eq("openid", openid)
    .single();

  let normalLeft: number;
  let proLeft: number;
  let finalExpires: number;
  let type: string;

  if (exist) {
    const existExpires = new Date(exist.expires_at).getTime();
    finalExpires = Math.max(existExpires, computedExpires);
    const expired = existExpires <= now;
    if (pkg.type === "first") {
      // 首单体验：每人只买一次，普通封顶 10 次（防薅羊毛）
      normalLeft = Math.min((exist.normal_left || 0) + pkg.normal, pkg.normal);
      proLeft = Math.min((exist.pro_left || 0) + pkg.pro, pkg.pro);
    } else if (expired) {
      // 已过期：重新发次数
      normalLeft = pkg.normal;
      proLeft = pkg.pro;
    } else {
      // 有效期内续费：次数叠加
      normalLeft = (exist.normal_left || 0) + pkg.normal;
      proLeft = (exist.pro_left || 0) + pkg.pro;
    }
    type = pkg.type === "first" ? (exist.type !== "first" ? exist.type : "first") : pkg.type;
  } else {
    finalExpires = computedExpires;
    normalLeft = pkg.normal;
    proLeft = pkg.pro;
    type = pkg.type;
  }

  const { schema } = await upsertTryonEntitlement(supabase, {
    openid,
    type,
    expires_at: new Date(finalExpires).toISOString(),
    normal_left: normalLeft,
    pro_left: proLeft,
    tries_left: normalLeft + proLeft,
    updated_at: new Date().toISOString(),
  });
  console.log(`[试衣权益发放] 成功 schema=${schema}`, { openid, type, normalLeft, proLeft });
}

function buildXml(obj: Record<string, string>) {
  let xml = "<xml>";
  for (const [k, v] of Object.entries(obj)) xml += `<${k}>${v}</${k}>`;
  xml += "</xml>";
  return xml;
}

function xmlResp(obj: Record<string, string>) {
  return new NextResponse(buildXml(obj), { headers: { "Content-Type": "application/xml" } });
}
