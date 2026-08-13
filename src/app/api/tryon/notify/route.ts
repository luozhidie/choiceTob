// app/api/tryon/notify/route.ts
// 微信支付回调（仅处理试衣订单）。验签 → 记账 → 发放/续期权益。
// 与生产 /api/wechat-pay/notify 完全独立，互不干扰。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

const APIV2_KEY = process.env.WECHAT_APIV2_KEY || "QqQq77137992Qq77137992Qq77137992";

const PACKAGES: Record<string, { type: string; days: number; tries: number }> = {
  tryon_first_1yuan: { type: "first", days: 365, tries: 10 },
  tryon_monthly_99: { type: "month", days: 30, tries: 120 },
  tryon_quarter_199: { type: "quarter", days: 90, tries: 280 },
  tryon_year_699: { type: "year", days: 365, tries: 1000 },
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

// 发放/续期权益（按 openid 合并，有效期内续费次数叠加）
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

  let triesLeft: number;
  let finalExpires: number;
  let type: string;

  if (exist) {
    const existExpires = new Date(exist.expires_at).getTime();
    finalExpires = Math.max(existExpires, computedExpires);
    const expired = existExpires <= now;
    if (pkg.type === "first") {
      // 首单体验：每人只买一次，最多累计 10 次（防薅羊毛）
      triesLeft = Math.min((exist.tries_left || 0) + pkg.tries, pkg.tries);
    } else if (expired) {
      // 已过期：重新发次数
      triesLeft = pkg.tries;
    } else {
      // 有效期内续费：次数叠加
      triesLeft = (exist.tries_left || 0) + pkg.tries;
    }
    type = pkg.type === "first" ? (exist.type !== "first" ? exist.type : "first") : pkg.type;
  } else {
    finalExpires = computedExpires;
    triesLeft = pkg.tries;
    type = pkg.type;
  }

  const { error } = await supabase.from("tryon_entitlements").upsert(
    {
      openid,
      type,
      expires_at: new Date(finalExpires).toISOString(),
      tries_left: triesLeft,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "openid" }
  );
  if (error) console.error("[试衣权益发放] 失败", error);
  else console.log("[试衣权益发放] 成功", { openid, type, triesLeft });
}

function signMd5(params: Record<string, string>) {
  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&") + `&key=${APIV2_KEY}`;
  return crypto.createHash("md5").update(sorted, "utf8").digest("hex").toUpperCase();
}

function buildXml(obj: Record<string, string>) {
  let xml = "<xml>";
  for (const [k, v] of Object.entries(obj)) xml += `<${k}>${v}</${k}>`;
  xml += "</xml>";
  return xml;
}

function parseXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /<([^>]+)>([^<]*)<\/\1>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) result[match[1]] = match[2];
  return result;
}

function xmlResp(obj: Record<string, string>) {
  return new NextResponse(buildXml(obj), { headers: { "Content-Type": "application/xml" } });
}
