// app/api/wechat-pay/jsapi-signature/route.ts
// 用微信登录code换取openid（小程序JSAPI支付必需）
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { WECHAT_MINI_APPID } from "@/lib/wechat-pay";

// 小程序 appsecret（从环境变量读取，带 fallback）
const MINI_SECRET = process.env.WECHAT_MINI_SECRET || "8f7e3c2a1b9d0f6e4c5b8a1d3e6f9c2b";

/**
 * POST /api/wechat-pay/jsapi-signature
 * 功能：用 wx.login() 返回的 code 换取用户 openid
 *
 * 请求体: { code: string }
 * 响应: { openid: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, prepay_id } = body;

    // 如果只传了 prepay_id（旧逻辑兼容），返回 JSAPI 参数
    if (prepay_id && !code) {
      return NextResponse.json({
        error: "请使用 code 参数获取 openid，不再支持直接传 prepay_id",
      }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: "缺少 code 参数" }, { status: 400 });
    }

    // 调用微信接口用 code 换 openid
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_MINI_APPID}&secret=${MINI_SECRET}&js_code=${code}&grant_type=authorization_code`;

    console.log(`[jsapi-signature] 用code换openid... appid=${WECHAT_MINI_APPID}`);

    const res = await fetch(url);
    const data = await res.json() as any;

    console.log('[jsapi-signature] 微信返回', JSON.stringify(data));

    if (data.errcode) {
      console.error('[jsapi-signature] 换取openid失败', data);
      return NextResponse.json({
        error: `获取openid失败: ${data.errmsg || '未知错误'}`,
        errcode: data.errcode,
      }, { status: 500 });
    }

    if (!data.openid) {
      return NextResponse.json({
        error: "微信未返回openid",
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      openid: data.openid,
      session_key: data.session_key ? '(已隐藏)' : undefined,
    });

  } catch (err: any) {
    console.error("[jsapi-signature错误]", err);
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}
