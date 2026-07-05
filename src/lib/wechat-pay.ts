// lib/wechat-pay.ts - 微信支付工具库
// 支持：小程序JSAPI支付、公众号JSAPI支付、NATIVE扫码支付
import crypto from 'crypto';

// 环境变量校验（启动时打印，方便调试）
// 注意：以下值会从 process.env 读取，如果读取失败则使用硬编码的备用值
const MCHID = process.env.WECHAT_MCHID || "1114330239";
const APIV2_KEY = process.env.WECHAT_APIV2_KEY || "QqQq77137992Qq77137992Qq77137992";
const NOTIFY_URL = process.env.WECHAT_NOTIFY_URL || "https://colour-choice.art/api/wechat-pay/notify";

if (typeof window === 'undefined') {
  // 服务端启动时打印配置状态
  console.log(
    `[微信支付] 配置状态: mchId=${MCHID.slice(0,4)}****${MCHID.slice(-2)} | notify=${NOTIFY_URL.slice(0,30)}...`
  );
}

// 双平台AppID（带fallback）
export const WECHAT_MINI_APPID = process.env.WECHAT_MINI_APPID || "wxe0ffec0a398de8b7";
export const WECHAT_MP_APPID = process.env.WECHAT_MP_APPID || "wxe0ffec0a398de8b7";

// 支付平台类型
export type PayPlatform = 'mini' | 'mp' | 'native' | 'mweb';

// 获取对应平台的appid
function getAppId(platform: PayPlatform): string {
  switch (platform) {
    case 'mini': return WECHAT_MINI_APPID;
    case 'mp':
    case 'mweb':
      return WECHAT_MP_APPID;
    case 'native':
    default:
      // NATIVE默认用小程序appid
      return WECHAT_MINI_APPID || WECHAT_MP_APPID;
  }
}

// 生成随机字符串
function randomStr(len = 32) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// MD5签名（APIv2）
export function signMd5(params: Record<string, string>) {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + `&key=${APIV2_KEY}`;
  return crypto.createHash('md5').update(sorted, 'utf8').digest('hex').toUpperCase();
}

// 构建XML
export function buildXml(obj: Record<string, string>) {
  let xml = '<xml>';
  for (const [k, v] of Object.entries(obj)) {
    xml += `<${k}><![CDATA[${v}]]></${k}>`;
  }
  xml += '</xml>';
  return xml;
}

// 解析XML
export function parseXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  // 处理 CDATA 格式
  const regex = /<([^>\s]+)[^>]*>(?:<!\[CDATA\[)?([^\]<]*)(?:\]\]>)?<\/\1>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

/**
 * 统一下单
 * @param platform - mini:小程序 | mp:公众号(网站) | native:扫码
 */
export async function unifiedOrder(params: {
  out_trade_no: string;
  body: string;
  total_fee: number;       // 单位：分
  openid?: string;          // JSAPI必传
  platform?: PayPlatform;   // 默认 mini
}) {
  // 环境变量校验
  if (!MCHID || !APIV2_KEY) {
    throw new Error('微信支付未配置：缺少 WECHAT_MCHID 或 WECHAT_APIV2_KEY 环境变量');
  }
  if (!NOTIFY_URL) {
    throw new Error('微信支付未配置：缺少 WECHAT_NOTIFY_URL 环境变量');
  }

  let { out_trade_no, body, total_fee, openid, platform = 'native' } = params;

  // 防御：如果平台是 JSAPI（mini/mp）但没有传合法的微信 openid，
  // 强制降级为 native 模式，避免微信 API 报 "JSAPI支付必须传 openid"
  // 注意：Supabase 的 user.id 是 UUID，不是微信 openid，不能传给微信 API
  if ((platform === 'mini' || platform === 'mp') && !openid) {
    console.warn(`[微信支付] 平台=${platform} 但 openid 为空，自动降级为 native 模式`);
    platform = 'native';
  }
  const nonce_str = randomStr();

  const tradeTypeMap: Record<PayPlatform, string> = {
    mini: 'JSAPI',
    mp: 'JSAPI',
    native: 'NATIVE',
    mweb: 'MWEB',
  };

  const data: Record<string, string> = {
    appid: getAppId(platform),
    mch_id: MCHID,
    nonce_str,
    body,
    out_trade_no,
    total_fee: String(total_fee),
    spbill_create_ip: '127.0.0.1',
    notify_url: NOTIFY_URL,
    trade_type: tradeTypeMap[platform],
  };

  if ((platform === 'mini' || platform === 'mp') && openid) {
    data.openid = openid;
  }

  data.sign = signMd5(data);

  const xml = buildXml(data);

  console.log(`[微信统一下单] 平台:${platform} appid:${data.appid} 订单号:${out_trade_no} 金额:${total_fee}分`);

  try {
    const res = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: xml,
    });

    const resText = await res.text();
    const result = parseXml(resText);
    console.log('[微信统一下单返回]', JSON.stringify(result));

    if (result.return_code === 'FAIL') {
      throw new Error(result.return_msg || '下单失败');
    }
    if (result.result_code === 'FAIL') {
      throw new Error(result.err_code_des || result.err_code || '下单失败');
    }

    return result;
  } catch (err: any) {
    console.error('[微信统一下单错误]', err.message);
    throw err;
  }
}

/**
 * 订单查询
 */
export async function orderQuery(out_trade_no: string) {
  const nonce_str = randomStr();

  const data: Record<string, string> = {
    appid: getAppId('mini'),
    mch_id: MCHID,
    out_trade_no,
    nonce_str,
  };

  data.sign = signMd5(data);

  const xml = buildXml(data);

  const res = await fetch('https://api.mch.weixin.qq.com/pay/orderquery', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: xml,
  });

  const resText = await res.text();
  return parseXml(resText);
}

/**
 * 关闭订单
 */
export async function closeOrder(out_trade_no: string) {
  const nonce_str = randomStr();

  const data: Record<string, string> = {
    appid: getAppId('mini'),
    mch_id: MCHID,
    out_trade_no,
    nonce_str,
  };

  data.sign = signMd5(data);

  const xml = buildXml(data);

  const res = await fetch('https://api.mch.weixin.qq.com/pay/closeorder', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: xml,
  });

  const resText = await res.text();
  return parseXml(resText);
}

/**
 * 生成JSAPI调起支付的参数（前端调用 wx.requestPayment 使用）
 *
 * 微信支付 JSAPI v2 签名规则：
 * 签名参数名：appId, timeStamp, nonceStr, package, signType（注意大小写）
 * 签名字符串格式：appId=xxx&nonceStr=xxx&package=prepay_id=xxx&signType=MD5&timeStamp=xxx&key=API密钥
 */
export function generateJsapiPayParams(
  prepay_id: string,
  platform: PayPlatform = 'mini'
): Record<string, string> {
  const appId = getAppId(platform);
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = randomStr();
  const package_str = `prepay_id=${prepay_id}`;
  const signType = 'MD5';

  // 用于签名的参数（字段名必须符合微信要求）
  const signParams: Record<string, string> = {
    appId,
    timeStamp,
    nonceStr,
    package: package_str,
    signType,
  };

  const paySign = signMd5(signParams);

  return {
    appId,
    timeStamp,
    nonceStr,
    package: package_str,
    signType,
    paySign,
  };
}