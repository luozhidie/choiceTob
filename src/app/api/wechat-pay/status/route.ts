// app/api/wechat-pay/status/route.ts
// 检查微信支付配置状态（无需登录，仅显示配置状态不显示密钥）
import { NextResponse } from "next/server";

export async function GET() {
  const config = {
    hasMchId: !!process.env.WECHAT_MCHID,
    hasApiKey: !!process.env.WECHAT_APIV2_KEY,
    hasMiniAppId: !!process.env.WECHAT_MINI_APPID,
    hasMpAppId: !!process.env.WECHAT_MP_APPID,
    hasNotifyUrl: !!process.env.WECHAT_NOTIFY_URL,
    mchIdMasked: process.env.WECHAT_MCHID ? 
      process.env.WECHAT_MCHID!.slice(0, 3) + '****' + process.env.WECHAT_MCHID!.slice(-2) : null,
    notifyUrl: process.env.WECHAT_NOTIFY_URL || null,
  };

  const allConfigured = config.hasMchId && config.hasApiKey && config.hasNotifyUrl;

  return NextResponse.json({
    success: allConfigured,
    config,
    message: allConfigured ? '微信支付已配置' : '微信支付未完全配置，请在 Vercel 中添加环境变量',
    help: '查看 VERCEL_SETUP_GUIDE.md 了解如何配置',
  });
}
