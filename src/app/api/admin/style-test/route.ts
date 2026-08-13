import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

const BLOCKS_KEY = "style_test_blocks";

/**
 * 读取「智能形象诊断」图片模块
 * GET /api/admin/style-test
 */
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "未登录或无权限" }, { status: 401 });
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("site_assets")
      .select("key, alt_text")
      .eq("key", BLOCKS_KEY)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let blocks: string[] = [];
    if (data?.alt_text) {
      try {
        const list = JSON.parse(data.alt_text);
        if (Array.isArray(list)) blocks = list.filter((x: any) => typeof x === "string");
      } catch {}
    }

    // 合并此前逐张上传产生的独立行（key 形如 style_test_block_xxx），避免用户重复上传
    try {
      const { data: indivRows } = await supabase
        .from("site_assets")
        .select("image_url")
        .like("key", "style_test_block_%")
        .order("updated_at", { ascending: true });
      const indiv = (indivRows || []).map((r: any) => r.image_url).filter(Boolean);
      blocks = Array.from(new Set([...blocks, ...indiv]));
    } catch {}

    return NextResponse.json({ success: true, blocks });
  } catch (err: any) {
    return NextResponse.json({ error: "服务器内部错误: " + err.message }, { status: 500 });
  }
}

/**
 * 保存「智能形象诊断」图片模块
 * POST /api/admin/style-test
 * Body: { blocks: string[] }
 */
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "未登录或无权限" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const blocks = Array.isArray(body.blocks)
      ? body.blocks.filter((x: any) => typeof x === "string").slice(0, 30)
      : [];

    const supabase = await createServerClient();
    const { data: existing } = await supabase
      .from("site_assets")
      .select("id")
      .eq("key", BLOCKS_KEY)
      .maybeSingle();

    let dbError;
    if (existing) {
      const { error } = await supabase
        .from("site_assets")
        .update({ alt_text: JSON.stringify(blocks), updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      dbError = error;
    } else {
      const { error } = await supabase
        .from("site_assets")
        .insert([{ key: BLOCKS_KEY, title: "智能形象诊断图片模块", image_url: "", alt_text: JSON.stringify(blocks), is_active: true }]);
      dbError = error;
    }

    if (dbError) return NextResponse.json({ error: "保存失败: " + dbError.message }, { status: 500 });
    return NextResponse.json({ success: true, blocks });
  } catch (err: any) {
    return NextResponse.json({ error: "服务器内部错误: " + err.message }, { status: 500 });
  }
}
