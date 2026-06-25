// 记录测款商品行为事件（曝光/点击/加购/询盘/下单）
// 前台匿名调用，不需要登录
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaign_id, product_id, event_type, visitor_id } = body;

    if (!campaign_id || !product_id || !event_type) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 验证 event_type 合法性
    const validTypes = ["view", "click", "add_cart", "inquire", "order"];
    if (!validTypes.includes(event_type)) {
      return NextResponse.json({ error: `event_type 必须是: ${validTypes.join(",")}` }, { status: 400 });
    }

    // 用 Service Role Key 直接写数据库（匿名用户也能记录）
    const supabase = await (await import("@supabase/supabase-js")).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 去重：同一 visitor 对同一商品同一事件类型，同一天只计数一次（避免刷新页面重复计数）
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("product_test_events")
      .select("id")
      .eq("campaign_id", campaign_id)
      .eq("product_id", product_id)
      .eq("event_type", event_type)
      .eq("visitor_id", visitor_id || "")
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`)
      .limit(1);

    if (existing && existing.length > 0) {
      // 今天已经记录过，不再重复计数
      return NextResponse.json({ success: true, duplicated: true });
    }

    // 插入事件记录
    const { error } = await supabase
      .from("product_test_events")
      .insert({
        campaign_id,
        product_id,
        event_type,
        visitor_id: visitor_id || null,
      });

    if (error) throw error;

    // 同步更新 product_test_items 的计数字段
    const countField = event_type === "view" ? "views"
      : event_type === "click" ? "clicks"
      : event_type === "add_cart" ? "cart_adds"
      : event_type === "inquire" ? "inquiries"
      : "orders";

    // 先查当前值
    const { data: currentItem } = await supabase
      .from("product_test_items")
      .select(countField)
      .eq("campaign_id", campaign_id)
      .eq("product_id", product_id)
      .single();

    if (currentItem) {
      await supabase
        .from("product_test_items")
        .update({ [countField]: (currentItem[countField] || 0) + 1 })
        .eq("campaign_id", campaign_id)
        .eq("product_id", product_id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[测款事件API错误]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
