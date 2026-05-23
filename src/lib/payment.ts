import crypto from "crypto";

/**
 * 虎皮椒（XunHuPay）聚合支付工具
 * 文档：https://www.xunhupay.com/doc/api/page/index.html
 */

const XUNHU_URL = "https://api.xunhupay.com/payment/do.html";

interface PaymentParams {
  trade_order_id: string;
  total_fee: string;
  title: string;
  notify_url: string;
  return_url: string;
  type?: "wechat" | "alipay";
  nonce_str?: string;
}

/**
 * 生成 MD5 签名
 */
function md5(str: string): string {
  return crypto.createHash("md5").update(str, "utf8").digest("hex");
}

/**
 * 生成随机字符串
 */
function nonceStr(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * 计算虎皮椒签名
 * 规则：参数按key ASCII升序排列，拼接为 key=value& 形式，末尾追加 AppSecret，取 MD5
 */
export function createSign(
  params: Record<string, string>,
  appSecret: string
): string {
  const sortedKeys = Object.keys(params).sort();
  const str = sortedKeys
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return md5(str + appSecret);
}

/**
 * 验证回调签名
 */
export function verifySign(
  params: Record<string, string>,
  appSecret: string
): boolean {
  const receivedHash = params.hash;
  if (!receivedHash) return false;

  const paramsWithoutHash = { ...params };
  delete (paramsWithoutHash as any).hash;

  const expectedHash = createSign(paramsWithoutHash, appSecret);
  return expectedHash === receivedHash;
}

/**
 * 创建支付订单，返回支付链接和二维码URL
 */
export async function createPayment(
  params: PaymentParams,
  appId: string,
  appSecret: string
): Promise<{ url_qrcode: string; url: string; order_id: string }> {
  const time = Math.floor(Date.now() / 1000).toString();

  const allParams: Record<string, string> = {
    version: "1.1",
    appid: appId,
    trade_order_id: params.trade_order_id,
    total_fee: params.total_fee,
    title: params.title,
    time,
    notify_url: params.notify_url,
    return_url: params.return_url,
    nonce_str: params.nonce_str || nonceStr(),
    type: params.type || "wechat",
  };

  allParams.hash = createSign(allParams, appSecret);

  const res = await fetch(XUNHU_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(allParams).toString(),
  });

  const data = await res.json();

  if (data.errcode !== 0 && data.errcode !== undefined) {
    throw new Error(data.errmsg || "支付接口调用失败");
  }

  return {
    url_qrcode: data.url_qrcode || data.qr_code || "",
    url: data.url || "",
    order_id: data.open_order_id || "",
  };
}

/**
 * 生成订单号：年月日时分秒 + 6位随机数
 */
export function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now
    .toISOString()
    .replace(/[-T:\.Z]/g, "")
    .slice(0, 14);
  const rand = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `CT${dateStr}${rand}`;
}
