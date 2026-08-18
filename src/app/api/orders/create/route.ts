import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateOrderNo } from "@/lib/payment";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { resolveAgentByCode } from "@/lib/agent-settlement";

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
      })
      .select()
      .single();

    if (dbError) {
      console.error("创建订单失败:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: order,
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
