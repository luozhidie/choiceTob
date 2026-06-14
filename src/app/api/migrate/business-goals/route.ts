import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/migrate/business-goals
 * 执行 business_goals 迁移 — 添加店铺经营目标字段
 * 部署后调用一次即可
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 鉴权：必须登录且为 owner
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "owner") return NextResponse.json({ error: "仅owner可执行迁移" }, { status: 403 });

    // 检查是否已执行过
    const { data: testCol } = await supabase.from("stores").select("business_goals").limit(1);
    if (testCol !== null) {
      // business_goals 列已存在，检查其他
      console.log("[migrate/business-goals] business_goals列已存在，跳过stores表迁移");
    }

    // 注意：Supabase client不支持DDL，需要通过Supabase Dashboard手动执行
    // 这里只做数据层面的初始化

    // 为已有店铺设置默认 business_goals（如果为空）
    const { data: stores } = await supabase.from("stores").select("id, business_goals, monthly_sales, business_data").is("business_goals", null).limit(100);

    let updated = 0;
    if (stores && stores.length > 0) {
      for (const store of stores) {
        const bd = store.business_data || {};
        const defaults: Record<string, any> = {};

        // 从现有数据推断目标
        if (store.monthly_sales) {
          defaults.annual_revenue_target = store.monthly_sales * 12;
          defaults.quarterly_revenue_target = store.monthly_sales * 3;
        }
        if (bd.gross_margin_rate) {
          defaults.gross_margin_target = bd.gross_margin_rate;
        }
        if (bd.attach_rate) {
          defaults.attachment_rate_target = bd.attach_rate;
        }

        if (Object.keys(defaults).length > 0) {
          await supabase.from("stores").update({ business_goals: defaults }).eq("id", store.id);
          updated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "业务目标字段迁移完成",
      storesUpdated: updated,
      note: "DDL迁移（ALTER TABLE等）需要通过Supabase Dashboard SQL编辑器手动执行 supabase/migrations/business_goals.sql",
    });
  } catch (err: any) {
    console.error("[migrate/business-goals] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
