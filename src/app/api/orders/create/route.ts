import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateOrderNo } from "@/lib/payment";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { resolveAgentByCode } from "@/lib/agent-settlement";
import { verifyPaymentPassword } from "@/lib/agent-deposit";

/**
 * 解析小程序自定义 token（base64url JSON，如 {uid,exp}），与 user/me 保持一致。
 * 含 '.' 的是 Supabase JWT，不在此解析。
 */
function parseMiniToken(token: string): { uid: string; exp?: number } | null {
  try {
    if (!token || token.includes(".")) return null;
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!payload.uid) return null;
    if (payload.exp && payload.exp < Date.now()) return null;
    return { uid: payload.uid as string, exp: payload.exp as number | undefined };
  } catch {
    return null;
  }
}

/**
 * POST /api/orders/create
 * 创建订单（网站 session / 小程序自定义 token 均可）。
 * 返回 order.order_no，供统一下单复用，使支付回调能按 order_no 标记已支付。
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "服务器配置错误" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. 鉴权：小程序自定义 token 或 Supabase JWT
    let uid: string | null = null;
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (token) {
      if (token.includes(".")) {
        const { data } = await supabase.auth.getUser(token);
        if (data.user) uid = data.user.id;
      } else {
        const mini = parseMiniToken(token);
        if (mini) uid = mini.uid;
      }
    }
    if (!uid) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await req.json();
    const {
      product_id,
      product_title,
      product_image,
      product_price,
      quantity,
      contact,
      address,
      note,
      payment_type = "wechat",
      referral_code,
      use_deposit_deduction = false,
      payment_password,
    } = body;

    // 代理归因：推广码(invite_code) → 代理 user_id
    const svc = createServiceRoleClient();
    let agentId: string | null = null;
    const code = (referral_code as string) || (body.invite as string) || null;
    if (code) {
      agentId = await resolveAgentByCode(svc, code);
    }

    if (!product_id || !contact) {
      return NextResponse.json(
        { error: "product_id and contact are required" },
        { status: 400 }
      );
    }

    let price = Math.round(Number(product_price) || 0);
    const qty = Math.max(1, Number(quantity) || 1);

    // 代理归因场景：对客价以代理自定义卖价为准（防止前端篡改低价）
    if (agentId && product_id) {
      try {
        const { data: app } = await svc
          .from("agent_product_prices")
          .select("custom_price")
          .eq("agent_id", agentId)
          .eq("product_id", product_id)
          .maybeSingle();
        if (app && app.custom_price) {
          price = Math.round(Number(app.custom_price));
        } else {
          const { data: prod } = await svc
            .from("products")
            .select("price")
            .eq("id", product_id)
            .maybeSingle();
          if (prod?.price) price = Math.round(Number(prod.price));
        }
      } catch {
        // agent_product_prices 尚未建：保留前端传入价
      }
    }

    const totalAmount = price * qty;

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: "订单金额必须大于0" },
        { status: 400 }
      );
    }

    // 货款余额抵扣（仅本人有效代理，且已设支付密码）
    let depositDeducted = 0;
    if (use_deposit_deduction) {
      const { data: profile } = await svc
        .from("profiles")
        .select("deposit_amount, payment_password_hash, membership_type")
        .eq("id", uid)
        .maybeSingle();
      const isAgent =
        profile?.membership_type === "deposit_discount" &&
        Number(profile?.deposit_amount || 0) > 0;
      if (!isAgent) {
        return NextResponse.json({ error: "您当前无可用的预存货款" }, { status: 400 });
      }
      if (!profile?.payment_password_hash) {
        return NextResponse.json(
          { error: "请先设置货款支付密码", needPayPassword: true },
          { status: 400 }
        );
      }
      if (!payment_password || !verifyPaymentPassword(payment_password, profile.payment_password_hash)) {
        return NextResponse.json({ error: "支付密码错误", payPasswordError: true }, { status: 401 });
      }
      const avail = Number(profile.deposit_amount || 0);
      depositDeducted = Math.min(avail, totalAmount);
    }

    const wechatPay = totalAmount - depositDeducted;

    const orderNo = generateOrderNo();

    const { data: order, error: dbError } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        user_id: uid,
        product_id,
        product_title: product_title || "爆款样衣",
        product_image: product_image || null,
        product_price: price,
        quantity: qty,
        total_amount: totalAmount,
        contact,
        address: address || null,
        note: note || null,
        status: "pending",
        payment_method: payment_type,
        agent_id: agentId,
        referral_code: code ? String(code).toUpperCase() : null,
        deposit_deducted: depositDeducted,
      })
      .select()
      .single();

    if (dbError) {
      console.error("创建订单失败:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 货款抵扣：扣 profiles.deposit_amount + 写流水（建单成功后，同事务语义）
    if (depositDeducted > 0) {
      try {
        const { data: pf } = await svc
          .from("profiles")
          .select("deposit_amount")
          .eq("id", uid)
          .maybeSingle();
        const cur = Number(pf?.deposit_amount || 0);
        if (cur < depositDeducted) {
          // 余额不足（并发/边界），撤销订单，让用户重新支付
          await supabase.from("orders").delete().eq("order_no", orderNo);
          return NextResponse.json(
            { error: "货款余额不足，抵扣已取消，请重新下单" },
            { status: 409 }
          );
        }
        const newBal = cur - depositDeducted;
        await svc
          .from("profiles")
          .update({ deposit_amount: newBal, updated_at: new Date().toISOString() })
          .eq("id", uid);
        await svc.from("deposit_transactions").insert({
          user_id: uid,
          type: "order_deduct",
          amount: -depositDeducted,
          balance_after: newBal,
          ref_order_no: orderNo,
          remark: "下单货款抵扣",
        });
      } catch (e) {
        // 扣减失败：撤销订单，避免「微信少收但货款未扣」的资金漏洞
        console.error("[货款抵扣] 扣减失败，撤销订单", e);
        await supabase.from("orders").delete().eq("order_no", orderNo);
        return NextResponse.json(
          { error: "货款抵扣处理失败，订单已取消，请重试" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      order: order,
      wechat_pay: wechatPay,
      deposit_deducted: depositDeducted,
      message: "订单已创建",
    });
  } catch (err: any) {
    console.error("创建订单失败:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
