// app/api/tryon/create/route.ts
// 虚拟试衣下单：建单 + 微信统一下单，回调指向独立的 /api/tryon/notify
// 价格由服务端按套餐字典定死，杜绝前端篡改金额。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unifiedOrder, generateJsapiPayParams } from "@/lib/wechat-pay";
import { tryonProEnabled } from "@/lib/tryon/flags";
import type { PayPlatform } from "@/lib/wechat-pay";

// 与小程序端 PACKAGES 保持一致（服务端权威定价）
// 金额与次数由服务端定死；days 为有效期（天），有效期内用完次数为止。
// normal = 普通版剩余次数，pro = 专业版剩余次数。
// 双轨套餐：普通版（试穿）与专业版（风格诊断/造型）分开计费，互不稀释。
const PACKAGES: Record<string, { name: string; price: number; unit: string; type: string; days: number; normal: number; pro: number }> = {
  // 普通版
  tryon_first_9_9:       { name: "首单体验", price: 9.9,  unit: "次", type: "first",        days: 365, normal: 10,  pro: 0 },
  tryon_normal_month_99: { name: "普通月卡", price: 99,   unit: "月", type: "normal_month", days: 30,  normal: 100, pro: 0 },
  tryon_normal_month_299: { name: "普通月卡·续费", price: 299, unit: "月", type: "normal_month", days: 30, normal: 100, pro: 0 },
  // 专业版（含 14 题风格测试 / 八大风格真人试穿）
  tryon_pro_998:         { name: "专业版",   price: 998,  unit: "次", type: "pro_pack",     days: 365, normal: 0,   pro: 100 },
  // 内部测试通道
  tryon_test_cent:       { name: "一分测试", price: 0.1, unit: "次", type: "test",         days: 7,   normal: 1,   pro: 1 },
  // 旧套餐兼容（已下线，仅用于历史订单回调/查单补发）
  tryon_normal_month_59: { name: "普通月卡(旧)", price: 59,  unit: "月", type: "normal_month", days: 30,  normal: 70,  pro: 0 },
  tryon_pro_month_199:   { name: "专业月卡(旧)", price: 199, unit: "月", type: "pro_month",    days: 30,  normal: 0,   pro: 200 },
  tryon_pro_year_999:    { name: "专业年卡(旧)", price: 999, unit: "年", type: "pro_year",     days: 365, normal: 0,   pro: 1000 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { package_id, openid, platform } = body;
    const pf: PayPlatform = platform === "native" ? "native" : "mini";

    // JSAPI（小程序）必须 openid；NATIVE 网站扫码付不依赖 openid
    if (pf === "mini" && !openid) {
      return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
    }
    const pkg = PACKAGES[package_id];
    if (!pkg) {
      return NextResponse.json({ error: "未知套餐" }, { status: 400 });
    }
    // 专业版尚未开放（试衣引擎升级打磨中），服务端一并拦截，防止绕过页面直接下单
    // 例外：tryon_pro_998 是「成为合作代理」激活套餐（购买即解锁代理身份），不属于向公众开放专业版试衣，放行
    if (pkg.type === "pro_pack" && !tryonProEnabled() && package_id !== "tryon_pro_998") {
      return NextResponse.json({ error: "专业版升级打磨中，暂未开放购买" }, { status: 403 });
    }

    const supabase = await createClient();

    // 首单体验每个 openid 只能购买一次（已支付或待支付均视为已占用）
    if (package_id === "tryon_first_9_9") {
      const { data: firstOrder } = await supabase
        .from("tryon_orders")
        .select("status")
        .eq("openid", openid)
        .eq("package_id", "tryon_first_9_9")
        .in("status", ["paid", "pending"])
        .maybeSingle();
      if (firstOrder) {
        return NextResponse.json({ error: "首单体验每个账号仅限购买一次" }, { status: 400 });
      }
    }

    const total_fee = Math.round(pkg.price * 100); // 分
    const order_no = `TRY${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 1) 预建订单（pending），供回调对账
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
      platform: pf,
      notify_url,
    });

    if (wxResult.return_code === "FAIL") {
      return NextResponse.json({ error: wxResult.return_msg || "下单失败" }, { status: 500 });
    }
    if (wxResult.result_code === "FAIL") {
      return NextResponse.json({ error: wxResult.err_code_des || wxResult.err_code || "下单失败" }, { status: 500 });
    }

    // NATIVE 网站扫码付：返回微信扫码支付码，前端生成二维码
    if (pf === "native") {
      return NextResponse.json({ success: true, order_no, code_url: wxResult.code_url });
    }
    const payParams = generateJsapiPayParams(wxResult.prepay_id, "mini" as PayPlatform);
    return NextResponse.json({ success: true, order_no, ...payParams });
  } catch (err: any) {
    console.error("[试衣下单] 异常", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}
