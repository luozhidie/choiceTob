// 临时：微信支付测试链路（验证 Key 激活闭环，不暴露给客户，用完可删）
// 复用与正式下单完全相同的 token_orders / token_api_keys 落库 + unifiedOrder + 回调激活路径。
// 默认 ¥0.01（1 分），可通过 body.amount_fen 调整。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import QRCode from "qrcode";
import { unifiedOrder } from "@/lib/wechat-pay";

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
    const buyerEmail = (body.email || "").trim();
    const buyerName = (body.name || "").trim() || "词元测试¥0.01";
    // 默认 ¥0.01（1 分），可由 body.amount_fen 覆盖。
    const amountFen = Math.max(1, Number(body.amount_fen) || 1);
    const supabase = getServiceRoleClient();
    const apiKey = "tk_" + crypto.randomBytes(16).toString("hex");
    const outTradeNo = `WX${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // 1) 落 key（pending）
    const { data: keyRow, error: keyErr } = await supabase
      .from("token_api_keys")
      .insert({
        api_key: apiKey,
        name: buyerName,
        owner: buyerEmail || "wechat-buyer",
        status: "pending",
        credit_balance: 1,
        credit_used: 0,
      })
      .select()
      .single();
    if (keyErr) throw keyErr;

    // 2) 落订单（pending，金额由 amountFen 决定）
    const { data: order, error: orderErr } = await supabase
      .from("token_orders")
      .insert({
        api_key_id: keyRow.id,
        api_key: apiKey,
        package_key: "trial",
        amount: amountFen,
        currency: "cny",
        calls: 1,
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
      body: `骆芷蝶智选-测试支付¥${(amountFen / 100).toFixed(2)}`,
      total_fee: amountFen,
      platform: "native",
    });
    if (wx.return_code === "FAIL") throw new Error(wx.return_msg || "下单失败");
    if (wx.result_code === "FAIL") throw new Error(wx.err_code_des || wx.err_code || "下单失败");

    // 4) 生成扫码二维码
    const qr = await QRCode.toDataURL(wx.code_url, { width: 280, margin: 1 });

    return NextResponse.json({
      ok: true,
      order_no: outTradeNo,
      code_url: wx.code_url,
      qr,
      cny: amountFen,
      calls: 1,
      test: true,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "下单失败" }, { status: 500 });
  }
}
