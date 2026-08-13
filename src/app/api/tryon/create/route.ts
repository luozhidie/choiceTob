// app/api/tryon/create/route.ts
// 虚拟试衣下单：建单 + 微信统一下单，回调指向独立的 /api/tryon/notify
// 价格由服务端按套餐字典定死，杜绝前端篡改金额。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unifiedOrder, generateJsapiPayParams } from "@/lib/wechat-pay";
import type { PayPlatform } from "@/lib/wechat-pay";

// 与小程序端 PACKAGES 保持一致（服务端权威定价）
// 金额与次数由服务端定死；days 为有效期（天），有效期内用完次数为止。
// normal = 普通版剩余次数，pro = 专业版剩余次数。
const PACKAGES: Record<string, { name: string; price: number; unit: string; type: string; days: number; normal: number; pro: number }> = {
  tryon_first_1yuan:      { name: "首单体验", price: 9.9,  unit: "次", type: "first",        days: 365, normal: 9,   pro: 1 },
  tryon_normal_monthly_59: { name: "普通月卡", price: 59,   unit: "月", type: "normal_month", days: 30,  normal: 70,  pro: 0 },
  tryon_pro_monthly_199:   { name: "专业月卡", price: 199,  unit: "月", type: "pro_month",    days: 30,  normal: 0,   pro: 200 },
  tryon_pro_year_999:      { name: "专业年卡", price: 999,  unit: "年", type: "pro_year",     days: 365, normal: 0,   pro: 1000 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { package_id, openid } = body;

    if (!openid) {
      return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
    }
    const pkg = PACKAGES[package_id];
    if (!pkg) {
      return NextResponse.json({ error: "未知套餐" }, { status: 400 });
    }

    const total_fee = Math.round(pkg.price * 100); // 分
    const order_no = `TRY${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 1) 预建订单（pending），供回调对账
    const supabase = await createClient();
    const { error: insErr } = await supabase.from("tryon_orders").insert({
      order_no,
      openid,
      package_id,
      amount_cents: total_fee,
      status: "pending",
    });
    if (insErr) {
      console.error("[试衣下单] 建单失败", insErr);
      return NextResponse.json({ error: "建单失败，请稍后重试" }, { status: 500 });
    }

    // 2) 微信统一下单（回调指向试衣专属 notify）
    const notify_url = `${new URL(request.url).origin}/api/tryon/notify`;
    const wxResult = await unifiedOrder({
      out_trade_no: order_no,
      body: `骆芷蝶智选·虚拟试衣${pkg.name}`,
      total_fee,
      openid,
      platform: "mini" as PayPlatform,
      notify_url,
    });

    if (wxResult.return_code === "FAIL") {
      return NextResponse.json({ error: wxResult.return_msg || "下单失败" }, { status: 500 });
    }
    if (wxResult.result_code === "FAIL") {
      return NextResponse.json({ error: wxResult.err_code_des || wxResult.err_code || "下单失败" }, { status: 500 });
    }

    const payParams = generateJsapiPayParams(wxResult.prepay_id, "mini" as PayPlatform);
    return NextResponse.json({ success: true, order_no, ...payParams });
  } catch (err: any) {
    console.error("[试衣下单] 异常", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}
