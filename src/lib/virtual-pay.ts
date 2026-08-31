// src/lib/virtual-pay.ts
// 微信小程序「虚拟支付」服务端能力：paySig / signature 签名、道具表、订单号、xpay 服务端接口
// 文档：https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/business-capabilities/virtual-payment.html
//
// 签名公式（官方）：
//   paySig    = to_hex(hmac_sha256(appKey,     uri + '&' + signData))   // 基础库场景 uri 固定为 requestVirtualPayment
//   signature = to_hex(hmac_sha256(sessionKey, signData))
//
import crypto from "crypto";
import { WECHAT_MINI_APPID } from "./wechat-pay";

/* ===================== 环境变量配置 ===================== */
// 是否启用虚拟支付（0 = 关闭，走原 JSAPI；1/缺省 = 开启）
export const VIRTUAL_PAY_ENABLED = process.env.VIRTUAL_PAY_ENABLED !== "0";
// 虚拟支付 offerId（MP 后台 → 虚拟支付 → 基本配置 → 基础配置）
export const VIRTUAL_OFFER_ID = process.env.VIRTUAL_OFFER_ID || "";
// 现网 AppKey
export const VIRTUAL_APPKEY = process.env.VIRTUAL_APPKEY || "";
// 沙箱 AppKey
export const VIRTUAL_APPKEY_SANDBOX = process.env.VIRTUAL_APPKEY_SANDBOX || "";
// 环境：0 现网 / 1 沙箱（沙箱不产生技术服务费，联调用）
export const VIRTUAL_ENV: 0 | 1 = process.env.VIRTUAL_ENV === "1" ? 1 : 0;

export function getAppKey(env: number): string {
  return env === 1 ? VIRTUAL_APPKEY_SANDBOX || VIRTUAL_APPKEY : VIRTUAL_APPKEY;
}

/* ===================== 道具（商品）表 =====================
 * 服务端权威定价。productId 必须与 MP 后台「虚拟支付 → 道具管理」里创建的道具ID 完全一致。
 * 约定：后台创建道具时，道具ID 直接填这里的 key，价格（分）按下表填写，可免去二次映射。
 */
export type VirtualGoods = {
  productId: string;
  name: string;
  priceFen: number; // 道具单价（分），会作为 goodsPrice 传给基础库做价格校验
};

export const VIRTUAL_GOODS: Record<string, VirtualGoods> = {
  // —— AI 虚拟试衣 ——
  // 注意：内部 goodsKey 与微信后台 productId 可以不同（后台道具ID 限 20 位以内）
  tryon_first_9_9: { productId: "tryon_first_9_9", name: "试衣首单体验", priceFen: 990 },
  tryon_normal_month_99: { productId: "tryon_normal_99", name: "试衣普通月卡", priceFen: 9900 },
  tryon_normal_month_299: { productId: "tryon_normal_299", name: "试衣普通月卡续费", priceFen: 29900 },
  tryon_pro_998: { productId: "tryon_pro_998", name: "试衣专业版·100次", priceFen: 99800 },
  tryon_test_cent: { productId: "tryon_test_cent", name: "试衣一元测试", priceFen: 100 },

  // —— 每日搭配灵感 ——
  daily_looks_monthly: { productId: "daily_looks_monthly", name: "搭配灵感·月度会员", priceFen: 99900 },
  daily_looks_yearly: { productId: "daily_looks_yearly", name: "搭配灵感年度会员", priceFen: 999900 },

  // —— 时尚资讯 ——
  articles_monthly: { productId: "articles_monthly", name: "时尚资讯·月费订阅", priceFen: 13800 },
  articles_yearly: { productId: "articles_yearly", name: "时尚资讯·年费订阅", priceFen: 138000 },
};

export function getGoods(key: string): VirtualGoods | null {
  return VIRTUAL_GOODS[key] || null;
}

/* ===================== 签名 ===================== */
export function hmacSha256Hex(key: string, msg: string): string {
  return crypto.createHmac("sha256", key).update(msg, "utf8").digest("hex");
}

/** 支付签名：uri 在 requestVirtualPayment 场景固定为 "requestVirtualPayment" */
export function calcPaySig(signData: string, env: number): string {
  return hmacSha256Hex(getAppKey(env), "requestVirtualPayment&" + signData);
}

/** 用户态签名：直接用 session_key 对 signData 签名 */
export function calcSignature(signData: string, sessionKey: string): string {
  return hmacSha256Hex(sessionKey, signData);
}

/* ===================== 订单号 =====================
 * 规则：8-32 字符，数字/大小写字母/符号 _-|*@ 组成，不能以下划线开头
 */
export function genOutTradeNo(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = crypto.randomBytes(3).toString("hex").toUpperCase();
  return "VP" + ts + rnd; // 例：VPMJR3K0A1B2C3
}

/* ===================== access_token（服务端接口用） ===================== */
let _tokenCache: { token: string; expireAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (_tokenCache && _tokenCache.expireAt > Date.now() + 60_000) return _tokenCache.token;
  const secret = process.env.WECHAT_MINI_SECRET || "";
  if (!secret) throw new Error("缺少 WECHAT_MINI_SECRET");
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_MINI_APPID}&secret=${secret}`;
  const res = await fetch(url);
  const data = (await res.json()) as any;
  if (!data.access_token) throw new Error("获取 access_token 失败: " + JSON.stringify(data));
  _tokenCache = { token: data.access_token, expireAt: Date.now() + (data.expires_in || 7200) * 1000 };
  return _tokenCache.token;
}

/* ===================== xpay 服务端接口 ===================== */
async function xpayPost(path: string, body: Record<string, any>, env: number) {
  const token = await getAccessToken();
  const postBody = JSON.stringify(body);
  const paySig = hmacSha256Hex(getAppKey(env), path + "&" + postBody);
  const url = `https://api.weixin.qq.com${path}?access_token=${encodeURIComponent(token)}&pay_sig=${paySig}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: postBody,
  });
  const data = (await res.json()) as any;
  return data;
}

/* ===================== 订单状态 =====================
 * 官方枚举（Res.order.status）：
 *   0 订单初始化（未创建成功，不可用于支付）
 *   1 订单创建成功（尚未支付）
 *   2 订单已经支付，待发货   ← 仅从这里开始才能发货
 *   3 订单发货中
 *   4 订单已发货
 *   5 订单已经退款
 *   6 订单已经关闭（不可再使用）
 *   7 订单退款失败
 *   8 用户退款完成
 *   9 回收广告金完成 / 10 分账回退完成
 */
export const PAID_STATUSES = [2, 3, 4];

export function isPaidStatus(st: any): boolean {
  const n = Number(st);
  return Number.isFinite(n) && PAID_STATUSES.includes(n);
}

/** 查询现金单（道具直购）——用于发货前核实是否真付款
 *  注意：官方字段名是 order_id（不是 out_trade_no），传错会返回 268490002
 */
export async function queryOrder(outTradeNo: string, openid: string, env: number) {
  return xpayPost(
    "/xpay/query_order",
    { openid, env, order_id: outTradeNo },
    env
  );
}

/** 通知平台已发货（现金单）；正常走推送返回成功后无需调用 */
export async function notifyProvideGoods(outTradeNo: string, env: number) {
  return xpayPost(
    "/xpay/notify_provide_goods",
    { order_id: outTradeNo, env },
    env
  );
}

/* ===================== code2session ===================== */
export async function code2Session(code: string) {
  const secret = process.env.WECHAT_MINI_SECRET || "";
  if (!secret) throw new Error("缺少 WECHAT_MINI_SECRET");
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_MINI_APPID}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
  const res = await fetch(url);
  const data = (await res.json()) as any;
  if (data.errcode || !data.openid) {
    throw new Error("code2session 失败: " + (data.errmsg || JSON.stringify(data)));
  }
  return { openid: data.openid as string, sessionKey: (data.session_key || "") as string };
}

/* ===================== 配置自检 ===================== */
export function configError(): string | null {
  if (!VIRTUAL_OFFER_ID) return "未配置 VIRTUAL_OFFER_ID（虚拟支付 offerId）";
  if (!getAppKey(VIRTUAL_ENV)) return "未配置 VIRTUAL_APPKEY（虚拟支付 AppKey）";
  if (!process.env.WECHAT_MINI_SECRET) return "未配置 WECHAT_MINI_SECRET";
  return null;
}
