import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

const CONFIG_KEY = "diagnosis_booking";

/**
 * 读取「形象诊断预约」配置（存于 site_assets.value，JSON 字符串）
 * GET /api/admin/vip-diagnosis
 */
export async function GET(request: NextRequest) {
  // 验证管理员登录状态
  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "未登录或无权限" }, { status: 401 });
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("site_assets")
      .select("value")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let config: any = {};
    if (data && data.value) {
      try { config = JSON.parse(data.value); } catch { config = {}; }
    }
    // 默认值兜底
    config = {
      title: config.title || "整体形象诊断",
      subtitle: config.subtitle || "一次诊断 终身受益",
      price: config.price ?? 190,
      desc: config.desc || "专业形象顾问一对一定制，找准显白本命色，锁定高级风格。",
      wechat: config.wechat || "luozhidie",
      outline: Array.isArray(config.outline)
        ? config.outline
        : ["风格诊断", "色彩诊断", "身材诊断", "生成报告"],
    };
    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ error: "服务器内部错误: " + err.message }, { status: 500 });
  }
}

/**
 * 保存「形象诊断预约」配置
 * POST /api/admin/vip-diagnosis
 * Body: { title, subtitle, price, desc, wechat, outline[] }
 */
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "未登录或无权限" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const config = {
      title: String(body.title ?? "整体形象诊断").slice(0, 50),
      subtitle: String(body.subtitle ?? "一次诊断 终身受益").slice(0, 50),
      price: Number(body.price ?? 190) || 190,
      desc: String(body.desc ?? "").slice(0, 500),
      wechat: String(body.wechat ?? "luozhidie").slice(0, 50),
      outline: Array.isArray(body.outline)
        ? body.outline.map((x: any) => String(x).slice(0, 50)).slice(0, 20)
        : ["风格诊断", "色彩诊断", "身材诊断", "生成报告"],
    };

    const supabase = await createServerClient();

    // 查询是否已存在
    const { data: existing } = await supabase
      .from("site_assets")
      .select("id")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    let dbError;
    if (existing) {
      const { error } = await supabase
        .from("site_assets")
        .update({ value: JSON.stringify(config), updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      dbError = error;
    } else {
      const { error } = await supabase
        .from("site_assets")
        .insert([{
          key: CONFIG_KEY,
          title: "形象诊断预约配置",
          value: JSON.stringify(config),
          is_active: true,
        }]);
      dbError = error;
    }

    if (dbError) return NextResponse.json({ error: "保存失败: " + dbError.message }, { status: 500 });

    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ error: "服务器内部错误: " + err.message }, { status: 500 });
  }
}
