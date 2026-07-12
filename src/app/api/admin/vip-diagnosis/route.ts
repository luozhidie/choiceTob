import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

const CONFIG_KEY = "diagnosis_booking";
const BLOCKS_KEY = "diagnosis_blocks";

/**
 * 读取「形象诊断预约」配置 + 图片模块
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
      .select("key, alt_text")
      .in("key", [CONFIG_KEY, BLOCKS_KEY]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const map: Record<string, string> = {};
    (data || []).forEach((item: any) => { map[item.key] = item.alt_text || ""; });

    let config: any = {};
    if (map[CONFIG_KEY]) {
      try { config = JSON.parse(map[CONFIG_KEY]); } catch { config = {}; }
    }
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

    let blocks: string[] = [];
    if (map[BLOCKS_KEY]) {
      try {
        const list = JSON.parse(map[BLOCKS_KEY]);
        if (Array.isArray(list)) blocks = list.filter((x: any) => typeof x === "string");
      } catch {}
    }

    return NextResponse.json({ success: true, config, blocks });
  } catch (err: any) {
    return NextResponse.json({ error: "服务器内部错误: " + err.message }, { status: 500 });
  }
}

/**
 * 保存「形象诊断预约」配置 + 图片模块
 * POST /api/admin/vip-diagnosis
 * Body: { title, subtitle, price, desc, wechat, outline[], blocks[] }
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
    const blocks = Array.isArray(body.blocks)
      ? body.blocks.filter((x: any) => typeof x === "string").slice(0, 30)
      : [];

    const supabase = await createServerClient();

    // 批量 upsert
    const upsert = async (key: string, value: string, title: string) => {
      const { data: existing } = await supabase
        .from("site_assets")
        .select("id")
        .eq("key", key)
        .maybeSingle();

      if (existing) {
        return await supabase
          .from("site_assets")
          .update({ alt_text: value, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      }
      return await supabase.from("site_assets").insert([{ key, title, alt_text: value, is_active: true }]);
    };

    const { error: cErr } = await upsert(CONFIG_KEY, JSON.stringify(config), "形象诊断预约配置");
    if (cErr) return NextResponse.json({ error: "保存配置失败: " + cErr.message }, { status: 500 });

    const { error: bErr } = await upsert(BLOCKS_KEY, JSON.stringify(blocks), "形象诊断图片模块");
    if (bErr) return NextResponse.json({ error: "保存图片模块失败: " + bErr.message }, { status: 500 });

    return NextResponse.json({ success: true, config, blocks });
  } catch (err: any) {
    return NextResponse.json({ error: "服务器内部错误: " + err.message }, { status: 500 });
  }
}
