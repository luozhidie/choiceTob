// app/api/wechat-pay/notify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from 'crypto';

const APIV2_KEY = process.env.WECHAT_APIV2_KEY || "QqQq77137992Qq77137992Qq77137992";

export async function POST(request: NextRequest) {
  try {
    const xml = await request.text();
    const params = parseXml(xml);

    console.log('[微信支付回调]', params);

    // 验证签名
    const sign = params.sign;
    delete params.sign;
    const localSign = signMd5(params);

    if (localSign !== sign) {
      console.error('[微信支付回调] 签名验证失败', { localSign, sign });
      return new NextResponse(buildXml({ return_code: 'FAIL', return_msg: '签名失败' }), { headers: { 'Content-Type': 'application/xml' } });
    }
    
    // 更新订单状态 + 自动开通会员
    if (params.result_code === 'SUCCESS') {
      const supabase = await createClient();
      const out_trade_no = params.out_trade_no;
      const transaction_id = params.transaction_id;
      
      // 1. 查询订单
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('order_no', out_trade_no)
        .single();
      
      if (order) {
        // 2. 更新订单为已支付
        await supabase
          .from('orders')
          .update({ 
            status: 'paid', 
            paid_at: new Date().toISOString(),
            payment_trade_no: transaction_id,
          })
          .eq('order_no', out_trade_no);

        // 3. 自动开通会员（核心逻辑）
        if (order.product_id && order.user_id) {
          await autoActivateMembership(supabase, order.user_id, order.product_id, out_trade_no);
        }
      }

      // 如果订单不存在，尝试从 membership_orders 表查找
      const { data: memberOrder } = await supabase
        .from('membership_orders')
        .select('*')
        .eq('order_no', out_trade_no)
        .single();

      if (memberOrder && memberOrder.status !== 'paid') {
        // 更新会员订单状态
        await supabase
          .from('membership_orders')
          .update({ 
            status: 'paid', 
            paid_at: new Date().toISOString(),
            transaction_id: transaction_id,
          })
          .eq('order_no', out_trade_no);

        // 自动开通会员
        await autoActivateMembership(supabase, memberOrder.user_id, memberOrder.plan_id, out_trade_no);
      }
    }
    
    return new NextResponse(buildXml({ return_code: 'SUCCESS', return_msg: 'OK' }), { headers: { 'Content-Type': 'application/xml' } });
  } catch (err: any) {
    console.error('[微信支付回调错误]', err);
    return new NextResponse(buildXml({ return_code: 'FAIL', return_msg: err.message || 'error' }), { headers: { 'Content-Type': 'application/xml' } });
  }
}

// 自动开通会员的核心函数
async function autoActivateMembership(supabase: any, userId: string, productId: string, orderNo: string) {
  console.log('[自动开通会员]', { userId, productId, orderNo });

  // 根据 productId/planId 判断会员类型和有效期
  let membershipType = 'none';
  let expiresAt = new Date();

  // 爆款样衣会员
  if (productId === 'hotpicks_monthly') {
    membershipType = 'hotpicks';
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天
  }
  // 查看价格会员 - 体验卡 (支持新旧 plan_id 格式)
  else if (productId === 'view_price_trial' || productId === 'price_trial') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14天
  }
  // 查看价格会员 - 1年
  else if (productId === 'view_price_year1' || productId === 'price_1y') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1年
  }
  // 查看价格会员 - 2年
  else if (productId === 'view_price_year2' || productId === 'price_2y') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000); // 2年
  }
  // 查看价格会员 - 3年
  else if (productId === 'view_price_year3' || productId === 'price_3y') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000); // 3年
  }
  // 每日穿搭查看（兼容旧 plan_id）
  else if (productId === 'daily_looks') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1年
  }
  // 每日搭配灵感 - 月度会员
  else if (productId === 'daily_looks_monthly') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天
  }
  // 每日搭配灵感 - 年度会员
  else if (productId === 'daily_looks_yearly') {
    membershipType = 'view_price';
    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1年
  }
  // 其他类型...

  // 更新 profiles 表的会员信息
  const { error } = await supabase
    .from('profiles')
    .update({
      membership_type: membershipType,
      membership_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[自动开通会员失败]', error);
  } else {
    console.log('[自动开通会员成功]', { userId, membershipType, expiresAt });
  }
}

function signMd5(params: Record<string, string>) {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + `&key=${APIV2_KEY}`;
  return crypto.createHash('md5').update(sorted, 'utf8').digest('hex').toUpperCase();
}

function buildXml(obj: Record<string, string>) {
  let xml = '<xml>';
  for (const [k, v] of Object.entries(obj)) {
    xml += `<${k}>${v}</${k}>`;
  }
  xml += '</xml>';
  return xml;
}

function parseXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /<([^>]+)>([^<]*)<\/\1>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}