// 词元内测支付 - 支付回调验证台（service_role 绕过 RLS）
// 用途：在不接真实微信支付的前提下，验证「用户支付成功后后端能否正确收到 API / 回调」。
//   action=create  : 创建一笔内测订单（billing_records, status=pending），返回订单回执
//   action=callback: 模拟支付成功回调，将订单置为 settled 并返回后端收到的完整回执
// 注：原内测支付源码在仓库重组时丢失，此处为最小可用重建版，复用 billing_records 表。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// 与前端 PaywallModal PACKAGES 对齐
export const BETA_PACKAGES = [
  { id: "trial", label: "体验版", price: 299, desc: "14 天全功能体验" },
  { id: "year1", label: "年度会员 1", price: 3980, desc: "12 个月" },
  { id: "year2", label: "年度会员 2", price: 6960, desc: "24 个月" },
];

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const DDL = `
CREATE TABLE IF NOT EXISTS billing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  item text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  period text,
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz
);
`;

// 首次请求时真正执行建表 DDL（beta 与 billing 共用 billing_records 表）
async function ensureBillingTable() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/rest/v1/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        apikey: key,
        Accept: "application/vnd.pgrst.sql",
      },
      body: DDL,
    });
  } catch {
    // 表可能已存在，忽略
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    await ensureBillingTable();
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("billing_records")
      .select("*")
      .like("item", "内测支付 · %")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    await ensureBillingTable();
    const body = await request.json().catch(() => ({}));
    const action = body.action || "create";
    const supabase = getServiceRoleClient();

    if (action === "create") {
      const pkg = BETA_PACKAGES.find((p) => p.id === body.package_id);
      const amount = pkg ? pkg.price : Number(body.amount) || 0;
      if (!amount || amount <= 0) return NextResponse.json({ error: "金额无效" }, { status: 400 });
      const item = `内测支付 · ${pkg ? pkg.label : "自定义"}`;
      const { data, error } = await supabase
        .from("billing_records")
        .insert({
          item,
          user_email: body.user_email || null,
          amount,
          status: "pending",
          period: "beta",
        })
        .select()
        .single();
      if (error) throw error;
      // 返回「下单成功」回执（模拟服务端创建订单后回给前端的包体）
      const receipt = {
        event: "order.created",
        order_id: data.id,
        item,
        amount,
        currency: "CNY",
        status: "pending",
        created_at: data.created_at,
      };
      return NextResponse.json({ ok: true, receipt });
    }

    if (action === "callback") {
      const order_id = body.order_id;
      if (!order_id) return NextResponse.json({ error: "缺少 order_id" }, { status: 400 });
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("billing_records")
        .update({ status: "settled", settled_at: now })
        .eq("id", order_id)
        .select()
        .single();
      if (error) throw error;
      // 返回「支付成功回调」回执（模拟微信/支付网关异步通知后端时携带的包体）
      const receipt = {
        event: "payment.success",
        order_id,
        received_at: now,
        status: "settled",
        amount: Number(data.amount) || 0,
        item: data.item,
        note: "后端已收到支付成功回调，订单置为已结算",
      };
      return NextResponse.json({ ok: true, receipt });
    }

    return NextResponse.json({ error: "未知 action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}
