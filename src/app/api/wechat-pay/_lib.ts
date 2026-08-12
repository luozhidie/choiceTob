import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/** service_role 客户端（绕过 RLS） */
export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** 解码小程序 base64url token → { uid, openid, exp } */
export function decodeToken(token?: string): { uid?: string; openid?: string; exp?: number } | null {
  if (!token) return null;
  try {
    const json = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (json.exp && json.exp < Date.now()) return null;
    return json;
  } catch (e) {
    return null;
  }
}

export function md5(s: string): string {
  return crypto.createHash("md5").update(s, "utf8").digest("hex");
}

export function randomStr(len = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let r = "";
  for (let i = 0; i < len; i++) r += chars[crypto.randomInt(chars.length)];
  return r;
}

/** 微信支付 MD5 签名：排序 key=value（去空、去 sign）后 &key=APIKEY，大写 */
export function buildSign(params: Record<string, any>, apiKey: string): string {
  const keys = Object.keys(params)
    .filter((k) => k !== "sign" && params[k] !== "" && params[k] !== undefined && params[k] !== null)
    .sort();
  const raw = keys.map((k) => `${k}=${params[k]}`).join("&") + `&key=${apiKey}`;
  return md5(raw).toUpperCase();
}

export function objToXml(obj: Record<string, any>): string {
  const parts = Object.keys(obj).map((k) => {
    const v = String(obj[k] ?? "");
    return `<${k}><![CDATA[${v}]]></${k}>`;
  });
  return "<xml>" + parts.join("") + "</xml>";
}

export function xmlToObj(xml: string): Record<string, any> {
  const obj: Record<string, any> = {};
  const re = /<([^>]+)><!\[CDATA\[([\s\S]*?)\]\]><\/\1>|<([^>]+)>([\s\S]*?)<\/\3>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const key = m[1] || m[3];
    const val = m[2] !== undefined ? m[2] : m[4];
    obj[key] = val;
  }
  return obj;
}

/** 由 product_id 推断支付订单类型 */
export function productTypeOf(productId: string): string {
  if (productId.startsWith("wholesale")) return "wholesale";
  if (productId.startsWith("tryon")) return "tryon";
  if (productId.startsWith("vip")) return "vip";
  return "product";
}

/**
 * 统一下单核心（供充值 / 试衣月卡 / VIP 复用）
 * 落 payment_orders 并返回 JSAPI 调起参数。
 */
export async function createUnifiedOrder(opts: {
  product_id: string; product_title: string; total_fee: number;
  openid?: string; token?: string; req?: NextRequest;
}): Promise<{ ok: boolean; jsapi?: any; out_trade_no?: string; error?: string }> {
  const APPID = process.env.WECHAT_MINI_APPID || "";
  const MCHID = process.env.WECHAT_PAY_MCHID || "";
  const APIKEY = process.env.WECHAT_PAY_KEY || "";
  const NOTIFY_URL = process.env.WECHAT_PAY_NOTIFY_URL || "https://colour-choice.art/api/wechat-pay/notify";

  if (!APPID || !MCHID || !APIKEY) return { ok: false, error: "微信支付未配置（MCHID/KEY 缺失）" };

  const supabase = getSupabase();
  let userId: string | null = null;
  let userOpenid = opts.openid;
  if (userOpenid) {
    const { data: p } = await supabase.from("profiles").select("id").eq("wechat_openid", userOpenid).maybeSingle();
    if (p) userId = p.id;
  } else if (opts.token) {
    const tk = decodeToken(opts.token);
    if (tk?.uid) userId = tk.uid;
    if (tk?.openid) userOpenid = tk.openid;
  }

  const outTradeNo = `R${Date.now()}${randomStr(6)}`;
  const nonceStr = randomStr(16);
  const ip = opts.req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  const params: Record<string, any> = {
    appid: APPID,
    mch_id: MCHID,
    nonce_str: nonceStr,
    body: opts.product_title.slice(0, 128),
    out_trade_no: outTradeNo,
    total_fee: String(opts.total_fee),
    spbill_create_ip: ip,
    notify_url: NOTIFY_URL,
    trade_type: "JSAPI",
    openid: userOpenid,
    sign_type: "MD5",
  };
  params.sign = buildSign(params, APIKEY);

  const { error: insErr } = await supabase.from("payment_orders").insert({
    out_trade_no: outTradeNo,
    user_openid: userOpenid || null,
    user_id: userId,
    product_type: productTypeOf(opts.product_id),
    product_id: opts.product_id,
    amount_fen: Number(opts.total_fee),
    amount_yuan: Number(opts.total_fee) / 100,
    status: "pending",
  });
  if (insErr) console.error("[createUnifiedOrder] 写 payment_orders 失败:", insErr);

  const xml = objToXml(params);
  const res = await fetch("https://api.mch.weixin.qq.com/pay/unifiedorder", {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: xml,
  });
  const data = xmlToObj(await res.text());

  if (data.return_code !== "SUCCESS" || data.result_code !== "SUCCESS") {
    console.error("[createUnifiedOrder] 微信返回:", JSON.stringify(data).slice(0, 400));
    return { ok: false, error: data.return_msg || data.err_code_des || "统一下单失败" };
  }

  const pkg = `prepay_id=${data.prepay_id}`;
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const payNonce = randomStr(16);
  const jsapiParams: Record<string, any> = {
    appId: APPID, timeStamp, nonceStr: payNonce, package: pkg, signType: "MD5",
  };
  jsapiParams.paySign = buildSign(jsapiParams, APIKEY);

  return { ok: true, jsapi: jsapiParams, out_trade_no: outTradeNo };
}
