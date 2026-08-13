// 公开：国内买家购买词元 API 调用额度 → 微信支付（native 扫码）
// 美元计价不变，实际按等值人民币（pkg.cny）扣款。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import QRCode from "qrcode";
import { unifiedOrder } from "@/lib/wechat-pay";
import { getPackage } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const pkg = getPackage(body.package);
    if (!pkg) return NextResponse.json({ ok: false, error: "套餐不存在" }, { status: 400 });

    const buyerEmail = (body.email || "").trim();
    const buyerName = (body.name || "").trim() || "词元买家";
    const supabase = getServiceRoleClient();
    const apiKey = "tk_" + crypto.randomBytes(16).toString("hex");
    const outTradeNo = `WX${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // 1) 先落 key（pending，支付后由微信回调激活）
    const { data: keyRow, error: keyErr } = await supabase
      .from("token_api_keys")
      .insert({
        api_key: apiKey,
        name: buyerName,
        owner: buyerEmail || "wechat-buyer",
        status: "pending",
        credit_balance: pkg.calls,
        credit_used: 0,
      })
      .select()
      .single();
    if (keyErr) throw keyErr;

    // 2) 落订单（pending，人民币金额）
    const { data: order, error: orderErr } = await supabase
      .from("token_orders")
      .insert({
        api_key_id: keyRow.id,
        api_key: apiKey,
        package_key: pkg.key,
        amount: pkg.cny, // 人民币分
        currency: "cny",
        calls: pkg.calls,
        buyer_email: buyerEmail || null,
        buyer_name: buyerName,
        status: "pending",
        out_trade_no: outTradeNo,
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    // 3) 微信统一下单（native 扫码）
    const wx = await unifiedOrder({
      out_trade_no: outTradeNo,
      body: `骆芷蝶智选-词元API ${pkg.nameEn} (${pkg.calls} calls)`,
      total_fee: pkg.cny, // 人民币分
      platform: "native",
    });
    if (wx.return_code === "FAIL") throw new Error(wx.return_msg || "下单失败");
    if (wx.result_code === "FAIL") throw new Error(wx.err_code_des || wx.err_code || "下单失败");

    // 4) 生成扫码二维码（data url，前端直接 <img>）
    const qr = await QRCode.toDataURL(wx.code_url, { width: 280, margin: 1 });

    return NextResponse.json({
      ok: true,
      order_no: outTradeNo,
      code_url: wx.code_url,
      qr,
      cny: pkg.cny,
      usd: pkg.amount,
      calls: pkg.calls,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "下单失败" }, { status: 500 });
  }
}
