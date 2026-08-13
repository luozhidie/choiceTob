// 公开词元市场 API（无需登录）
// 安全原则：绝不返回 prompt（底层可调用的判断逻辑）与 fields 内的结构化敏感参数
// （爆款信号/风险点/价格带/客群等），只返回营销级摘要、价格、计量、组合数等可对外信息。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    // 仅取已发布且已上架的字段；不 select prompt 列
    const { data, error } = await supabase
      .from("selection_tokens")
      .select("id, domain, category, title, summary, fields, metric, usage_count, status")
      .eq("status", "published")
      .is("deleted_at", null);
    if (error) throw error;

    // 只留上架状态（quoted）的词元
    const listed = (data || []).filter((t: any) => t.fields?.trade?.status === "quoted");

    // 映射为公开 DTO：剥离 prompt 与 fields 敏感内容
    const publicTokens = listed.map((t: any) => ({
      id: t.id,
      title: t.title,
      domain: t.domain,
      category: t.category,
      layer: t.fields?.layer || "",
      summary: t.summary || "",
      metric: t.metric || "",
      usageCount: t.usage_count || 0,
      price: t.fields?.trade?.price ?? 0,
      unit: t.fields?.trade?.unit || "按次",
      note: t.fields?.trade?.note || "",
      comboCount: Array.isArray(t.fields?.depends_on) ? t.fields.depends_on.length : 0,
      // 注意：以下均不返回 —— prompt、fields 内的爆款信号/风险点/价格带/客群等商业秘密
    }));

    return NextResponse.json({ ok: true, data: publicTokens, count: publicTokens.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}
