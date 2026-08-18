// 公开：代理客户落地页数据
// GET /api/agent/landing?ref=CODE
// 返回代理名称 + 其商品对客价（隐藏批发价），供客户浏览/试衣/下单
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("服务器配置错误");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const ref = (request.nextUrl.searchParams.get("ref") || "").trim().toUpperCase();
    if (!ref) return NextResponse.json({ valid: false, products: [] });

    const supabase = getServiceRoleClient();

    // 解析有效代理（预存货款 + 充值，或认证店主/管理员均可预览/开通店铺）
    const { data: agent } = await supabase
      .from("profiles")
      .select("id, full_name, membership_type, deposit_amount, is_admin, store_owner_certified, role")
      .eq("invite_code", ref)
      .maybeSingle();
    const isDepositAgent =
      !!agent && agent.membership_type === "deposit_discount" && Number(agent.deposit_amount || 0) > 0;
    const isPrivileged =
      !!agent && (agent.is_admin === true || agent.store_owner_certified === true || agent.role === "admin");
    const isValid = isDepositAgent || isPrivileged;
    if (!isValid) {
      return NextResponse.json({ valid: false, products: [] });
    }

    // 已发布商品 + 该代理自定义卖价
    const { data: products } = await supabase
      .from("products")
      .select("id, title, cover_image, price")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    const { data: prices } = await supabase
      .from("agent_product_prices")
      .select("product_id, custom_price")
      .eq("agent_id", agent.id);
    const map = new Map((prices || []).map((p: any) => [p.product_id, p.custom_price]));

    const list = (products || []).map((p: any) => ({
      product_id: p.id,
      title: p.title,
      cover_image: p.cover_image || null,
      // 对客价：代理自定义卖价优先，否则用平台零售价；绝不暴露批发价
      price: map.has(p.id) ? map.get(p.id) : p.price,
    }));

    return NextResponse.json({
      valid: true,
      agentName: agent.full_name || "精选推荐",
      inviteCode: ref,
      products: list,
    });
  } catch (err: any) {
    console.error("[agent/landing]", err);
    return NextResponse.json({ valid: false, products: [] });
  }
}
