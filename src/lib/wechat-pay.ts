import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export interface WechatPayConfig {
  appid: string;      // 公众号 / 小程序 appid (微信支付需要 appid)
  mchid: string;        // 商户号
  apiKey: string;      // 商户 APIv3 密钥
  serialNo: string;   // 商户证书序列号
  privateKey: string;  // 私钥 (PEM 格式)
}

export async function getWechatPayConfig(): Promise<WechatPayConfig> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('payment_config')
    .select('*')
    .eq('channel', 'wechat')
    .single();
  if (!data) throw new Error('未找到微信支付配置，请在后台配置');
  return {
    appid: data.app_id,
    mchid: data.mch_id,
    apiKey: data.api_key_encrypted,   // 应该用 pgcrypto 加密, 这里先明码简单处理
    serialNo: data.cert_serial_no,
    privateKey: data.private_key_encrypted,
  };
}

/**
 * 微信支付 V3：JSAPI 下单 (https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi)
 * 返回：prepay_id (前端用它调起支付)
 */
export async function wechatJsapiOrder(config: WechatPayConfig, order: {
  outTradeNo: string;
  description: string;
  amount: number;      // 单位：分 e.g., 1元 = 100 分  (注意：你的 price 是 *100, 保持一致)
  openid: string;      // 微信用户 openid
  notifyUrl: string;  // 支付结果通知地址
}) {
  const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');

  const body = {
    appid: config.appid,
    mchid: config.mchid,
    description: order.description,
    out_trade_no: order.outTradeNo,
    notify_url: order.notifyUrl,
    amount: {
      total: order.amount,
      currency: 'CNY',
    },
    payer: {
      openid: order.openid,
    },
  };

  const bodyStr = JSON.stringify(body);
  const message = `POST\n/v3/pay/transactions/jsapi\n${timestamp}\n${nonceStr}\n${bodyStr}\n`;
  const signature = signMessage(message, config.privateKey, config.serialNo);

  const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${config.serialNo}",signature="${signature}"`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authorization,
    },
    body: bodyStr,
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(`微信支付下单失败：${JSON.stringify(result)}`);
  }
  // result.prepay_id
  return result as { prepay_id: string };
}

/**
 * 构造前端支付参数（wx.requestPayment 需要）
 * 文档：https://pay.weixin.qq.com/doc/v3/merchant/products/jsapi-payment.html
 */
export function buildJsapiPayParams(prepayId: string, config: WechatPayConfig) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const message = `${config.appid}\n${timestamp}\n${nonceStr}\nprepay_id=${prepayId}\n`;
  const signature = signMessage(message, config.privateKey, config.serialNo);

  return {
    appId: config.appid,
    timeStamp: timestamp,
    nonceStr,
    package: `prepay_id=${prepayId}`,
    signType: 'RSA',
    paySign: signature,
  };
}

function signMessage(message: string, privateKey: string, serialNo: string): string {
  const sign = crypto.createSign('RSA-SHA256');
  sign.write(message);
  sign.end();
  return sign.sign(privateKey, 'base64');
}
