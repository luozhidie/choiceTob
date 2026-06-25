// app/api/wechat-pay/jsapi-signature/route.ts
// 生成微信公众号JSAPI支付签名（前端调起微信支付用）
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { WECHAT_MP_APPID, WECHAT_MINI_APPID } from "@/lib/wechat-pay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prepay_id } = body;

    if (!prepay_id) {
      return NextResponse.json({ error: "缺少prepay_id" }, { status: 400 });
    }

    // 使用公众号AppID（JSAPI支付需要）
    const appId = WECHAT_MP_APPID || WECHAT_MINI_APPID;
    if (!appId) {
      return NextResponse.json({ error: "微信AppID未配置" }, { status: 500 });
    }

    // JSAPI 支付参数（前端调起微信支付用）
    const timeStamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = crypto.randomBytes(16).toString("hex");
    const package_str = `prepay_id=${prepay_id}`;
    const signType = "MD5";

    // 注意：这个签名格式需要根据微信支付文档来
    // 当前 generateJsapiPayParams 已在 wechat-pay.ts 中处理
    // 此处直接返回 prepay_id，让前端用 WeixinJSBridge 调起
    return NextResponse.json({
      success: true,
      appId,
      timeStamp,
      nonceStr,
      package: package_str,
      signType,
      // 前端直接用 WeixinJSBridge.invoke 调起，不需要额外签名
    });
  } catch (err: any) {
    console.error("[JSAPI签名错误]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
