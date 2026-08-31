// app/api/virtual-pay/selfcheck/route.ts
// 临时自检探针：确认 virtual_orders 表、配置、订单，以及【两个 AppKey 到底哪个属于哪个环境】
// 验证完毕后可删除
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  VIRTUAL_PAY_ENABLED,
  VIRTUAL_OFFER_ID,
  VIRTUAL_ENV,
  VIRTUAL_APPKEY,
  VIRTUAL_APPKEY_SANDBOX,
  getAppKey,
  getAccessToken,
  VIRTUAL_GOODS,
  hmacSha256Hex,
} from "@/lib/virtual-pay";

/** 用某个候选 key 调一次 query_order，返回微信的应答（用于判断签名是否通过） */
async function probeKey(key: string, env: number, openid: string, outTradeNo: string) {
  try {
    const token = await getAccessToken();
    const path = "/xpay/query_order";
    const body = JSON.stringify({ openid, env, order_id: outTradeNo });
    const paySig = hmacSha256Hex(key, path + "&" + body);
    const url = `https://api.weixin.qq.com${path}?access_token=${encodeURIComponent(token)}&pay_sig=${paySig}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = (await res.json()) as any;
    return {
      errcode: data.errcode,
      errmsg: data.errmsg,
      raw: JSON.stringify(data).slice(0, 200),
    };
  } catch (e: any) {
    return { errcode: "EXC", errmsg: e?.message || String(e) };
  }
}

function mask(k: string) {
  if (!k) return "";
  return k.slice(0, 4) + "..." + k.slice(-4) + "(len" + k.length + ")";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const wantProbe = url.searchParams.get("probe") === "1";

  const out: any = {
    enabled: VIRTUAL_PAY_ENABLED,
    env: VIRTUAL_ENV,
    offerId: VIRTUAL_OFFER_ID || null,
    appKeyProd: mask(VIRTUAL_APPKEY),
    appKeySandbox: mask(VIRTUAL_APPKEY_SANDBOX),
    currentKeyForEnv: mask(getAppKey(VIRTUAL_ENV)),
    secretSet: !!process.env.WECHAT_MINI_SECRET,
    appidSet: !!process.env.WECHAT_MINI_APPID,
    goodsCount: Object.keys(VIRTUAL_GOODS).length,
    goods: VIRTUAL_GOODS,
    table: null as any,
    orders: null as any,
    totalCount: null as any,
    keyProbe: null as any,
  };

  let lastOpenid = "";
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
      if (r.data && r.data.length) lastOpenid = r.data[0].openid || "";
    }
    const c = await svc
      .from("virtual_orders")
      .select("out_trade_no", { count: "exact", head: true });
    out.totalCount = (c as any).count ?? null;
  } catch (e: any) {
    out.table = { ok: false, error: e?.message };
  }

  // AppKey ↔ 环境 归属探测（?probe=1 触发）
  if (wantProbe) {
    if (!lastOpenid) {
      out.keyProbe = { skipped: "库里没有订单，拿不到 openid，先跑一次支付再探测" };
    } else {
      const testNo = "PROBE" + Date.now().toString(36).toUpperCase();
      const candidates: { label: string; key: string }[] = [
        { label: "VIRTUAL_APPKEY(" + mask(VIRTUAL_APPKEY) + ")", key: VIRTUAL_APPKEY },
        { label: "VIRTUAL_APPKEY_SANDBOX(" + mask(VIRTUAL_APPKEY_SANDBOX) + ")", key: VIRTUAL_APPKEY_SANDBOX },
      ];
      const result: any = {};
      for (const c of candidates) {
        result[c.label] = {
          env0: await probeKey(c.key, 0, lastOpenid, testNo),
          env1: await probeKey(c.key, 1, lastOpenid, testNo),
        };
      }
      out.keyProbe = {
        note: "errcode 若为『订单不存在/参数』类说明签名通过；若含 sig/pay_sig/无效 说明该 key 不属于该环境",
        openid: lastOpenid.slice(0, 6) + "..." + lastOpenid.slice(-4),
        result,
      };
    }
  }

  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
