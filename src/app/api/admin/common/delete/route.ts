// 通用管理员删除 API - 使用 service_role 绕过 RLS
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 允许删除的表名白名单（防止 SQL 注入）
const ALLOWED_TABLES = new Set([
  // 商品相关
  "products",
  "buyer_products",
  // 课程/教学
  "courses",
  // 内容/资讯
  "articles",
  "site_assets",
  "fashion_trends",
  // VIP/会员
  "vip_customers",
  "customers",
  "profiles",
  "membership_orders",
  // 买手选品
  "buyer_features",
  "buyer_steps",
  "buyer_packages",
  // 爆款
  "hot_products",
  "hot_picks",
  "hot_picks_images",
  // 供应商
  "suppliers",
  "supplier_images",
  // 展示
  "display_items",
  "display_images",
  // 设计师
  "designer_packages",
  // 配送
  "delivery_plans",
  // 风格测试
  "style_test_results",
  // 测款码
  "test_codes",
  // 订单
  "orders",
  "purchase_orders",
  "planning_orders",
  // 规划
  "planning_requests",
  "planning_steps",
  "planning_reports",
  // 库存
  "inventory",
  // 每日搭配
  "daily_looks",
  // 营销图
  "marketing_images",
  "sales_images",
  // 分类
  "categories",
  // 版块
  "blocks",
  "page_blocks",
  // 店铺
  "stores",
  "store_reports",
  // 沙龙
  "salon_events",
  // 客户/线索
  "leads",
  // 项目追踪
  "project_tracker_items",
  // 预算
  "budget_items",
  // 内容日历
  "content_calendar",
  // 灵感
  "inspirations",
  "outfit_matches",
  // 图片采集
  "grabbed_images",
  // VIP 增值
  "vip_addons",
  "vip_addon_packages",
  // 企划需求
  "planning_requests_data",
  // 课程购买记录
  "course_purchases",
  // 待处理
  "pending_items",
  // 杂志
  "magazine_issues",
  // CRM
  "crm_contacts",
  "crm_stores",
  "wechat_templates",
  // 轮播图（通过 site_assets 操作）
]);

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量，请联系管理员在 .env.local 中配置"
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { id, table } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少记录 ID" }, { status: 400 });
    }
    if (!table) {
      return NextResponse.json({ error: "缺少表名" }, { status: 400 });
    }
    if (!ALLOWED_TABLES.has(table)) {
      return NextResponse.json(
        { error: `不允许操作表：${table}` },
        { status: 403 }
      );
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      console.error(`[通用删除API] 删除 ${table}.${id} 失败:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[通用删除API错误]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 同时支持 DELETE 方法（RESTful 风格）
export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const table = searchParams.get("table");

    if (!id) {
      return NextResponse.json({ error: "缺少记录 ID" }, { status: 400 });
    }
    if (!table) {
      return NextResponse.json({ error: "缺少表名（查询参数 table）" }, { status: 400 });
    }
    if (!ALLOWED_TABLES.has(table)) {
      return NextResponse.json(
        { error: `不允许操作表：${table}` },
        { status: 403 }
      );
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      console.error(`[通用删除API] 删除 ${table}.${id} 失败:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[通用删除API错误]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
