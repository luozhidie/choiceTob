import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/migrate
 * 数据库健康检查 + 执行迁移
 */
export async function POST(req: NextRequest) {
  const { secret, action } = await req.json();
  
  // 使用环境变量中的密钥，必须有 MIGRATE_SECRET 才能调用
  const expectedSecret = process.env.MIGRATE_SECRET;
  
  if (!expectedSecret) {
    console.error('[Migrate] MIGRATE_SECRET 环境变量未设置！');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  
  if (secret !== expectedSecret) {
    console.warn('[Migrate] Invalid secret attempt');
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const results: string[] = [];

    // ── 健康检查 ──
    const tables = [
      "stores", "vip_customers", "categories", "inventory",
      "purchase_orders", "purchase_order_items", "weekly_sales_analysis",
      "product_structure_plan", "product_matrix_plan", "wave_plan",
      "product_evaluation", "salon_events", "content_calendar",
      "project_tracker", "budget_tracker", "vip_service_logs",
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select("id").limit(1);
      if (error) {
        results.push(`❌ ${table}: ${error.message}`);
      } else {
        results.push(`✅ ${table}`);
      }
    }

    // 检查关键列
    const columns = [
      { table: "inventory", col: "unit_cost" },
      { table: "purchase_orders", col: "store_id" },
      { table: "purchase_order_items", col: "store_id" },
    ];
    for (const c of columns) {
      const { error } = await supabase.from(c.table).select(c.col).limit(1);
      if (error && error.message.includes("column")) {
        results.push(`❌ ${c.table}.${c.col} 列缺失`);
      } else {
        results.push(`✅ ${c.table}.${c.col}`);
      }
    }

    // 检查 refresh_store_member_stats 函数
    const { error: fnErr } = await supabase.rpc("refresh_store_member_stats", {
      p_store_id: "00000000-0000-0000-0000-000000000000",
    });
    if (fnErr && fnErr.message.includes("Could not find the function")) {
      results.push("❌ refresh_store_member_stats 函数缺失");
      results.push("→ 请在 Supabase SQL Editor 中执行 migration: 20250521_fix_data_flow.sql");
    } else {
      results.push("✅ refresh_store_member_stats 函数存在");
    }

    // ── 如果 action=fix，尝试修复可以自动修复的问题 ──
    if (action === "fix") {
      // 检查并添加缺失列（通过 insert 测试）
      // inventory.unit_cost
      const { error: ucErr } = await supabase.from("inventory").select("unit_cost").limit(1);
      if (ucErr && ucErr.message.includes("column")) {
        results.push("⚠ inventory.unit_cost 缺失，需要手动执行 ALTER TABLE（supabase client 不支持 DDL）");
      }
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
