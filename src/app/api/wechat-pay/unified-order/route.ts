// app/api/wechat-pay/unified-order/route.ts
// 统一下单API - 支持小程序和网站支付
import { NextRequest, NextResponse } from "next/server";
import { unifiedOrder, generateJsapiPayParams } from "@/lib/wechat-pay";
import type { PayPlatform } from "@/lib/wechat-pay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_id,
      product_title,
      total_fee,       // 单位：分
      quantity = 1,
      contact,          // 联系方式（微信/手机）
      address,          // 收货地址
      note,
      platform = 'native', // 'mini' | 'mp' | 'native'
    } = body;

    // 不再检查环境变量（wechat-pay.ts 里已有 fallback）

    const qty = Math.max(1, quantity || 1);
    const pricePerItem = Math.round(Number(total_fee) / qty);

    if (!product_id || !total_fee || pricePerItem <= 0) {
      return NextResponse.json({ error: '缺少必要参数: product_id 或 total_fee' }, { status: 400 });
    }

    // 生成订单号
    const order_no = `WX${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 调用微信统一下单
    const wxResult = await unifiedOrder({
      out_trade_no: order_no,
      body: product_title || `色彩智选-商品${product_id}`,
      total_fee: Math.round(Number(total_fee)),
      openid: body.openid || undefined,
      platform: platform as PayPlatform,
    });

    if (wxResult.return_code === 'FAIL') {
      return NextResponse.json({
        error: wxResult.return_msg || '下单失败',
      }, { status: 500 });
    }
    if (wxResult.result_code === 'FAIL') {
      return NextResponse.json({
        error: wxResult.err_code_des || wxResult.err_code || '下单失败',
        err_code: wxResult.err_code,
      }, { status: 500 });
    }

    const prepay_id = wxResult.prepay_id;

    // 根据平台返回不同格式
    if (platform === 'native') {
      // 扫码支付 - 返回二维码链接
      return NextResponse.json({
        code_url: wxResult.code_url,
        order_no,
        prepay_id,
      });
    }

    // JSAPI支付（小程序/公众号）- 返回调起支付的参数
    const payParams = generateJsapiPayParams(prepay_id, platform as PayPlatform);

    return NextResponse.json({
      success: true,
      order_no,
      prepay_id,
      ...payParams,
    });

  } catch (err: any) {
    console.error('[统一订单API错误]', err);
    return NextResponse.json({ 
      error: err.message || '系统错误，请稍后重试' 
    }, { status: 500 });
  }
}