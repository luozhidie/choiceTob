// 公开 API：获取时尚趋势（小程序「时尚趋势」Tab 消费，与 web 端 magazine 页 trends 同源）
// 优先用 service_role_key 绕过 RLS，缺失时降级到 publishable key
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// 正确的 publishable key（公开安全，作为环境变量缺失时的兜底）
const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

// 把 fashion_trends 行映射成小程序需要的字段（图片画廊 + 正文 + 分类）
function formatTrend(a: any) {
  const images: string[] = Array.isArray(a.images)
    ? a.images.filter((x: any) => typeof x === "string" && x)
    : [];
  const content: string = a.content || "";
  const cover = images.length > 0 ? images[0] : "";
  // 列表卡片的描述：取正文前 60 字
  const summary = content.replace(/\s+/g, " ").trim().slice(0, 60);
  return {
    id: a.id,
    title: a.title || "",
    category: a.category || "时尚趋势",
    tag: a.category || "时尚趋势",
    summary,
    content,
    images,
    cover_image: cover,
    image_url: cover,
    price: a.price || 0,
    date: a.date || "",
    is_premium: (a.price || 0) > 0,
    is_published: !!a.is_published,
    author: "骆芷蝶智选",
    published_at: a.date || a.created_at || "",
    created_at: a.created_at || "",
  };
}

async function queryWithClient(supabase: any, request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const singleId = searchParams.get("id") || "";
  const category = searchParams.get("category") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 50);

  // 单条详情（给详情页用）
  if (singleId) {
    const { data, error } = await supabase
      .from("fashion_trends")
      .select("*")
      .eq("id", singleId)
      .maybeSingle();
    if (error) return { error };
    return { success: true, data: data ? [formatTrend(data)] : [], error: null };
  }

  // 列表：仅返回已发布
  let query = supabase
    .from("fashion_trends")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (category && category !== "全部") query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return { error };
  return { success: true, data: (data || []).map(formatTrend), error: null };
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const result = await queryWithClient(supabase, request);
      if (result.error) {
        console.error("[fashion-trends API] service_role 查询出错:", result.error);
      } else {
        return NextResponse.json(result);
      }
    } catch (e: any) {
      console.error("[fashion-trends API] service_role 异常:", e.message);
    }
  } else {
    console.warn("[fashion-trends API] 警告: SUPABASE_SERVICE_ROLE_KEY 未设置，使用 publishable key");
  }

  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE;
  try {
    const supabase = createClient(supabaseUrl, publishableKey);
    const result = await queryWithClient(supabase, request);
    if (result.error) {
      console.error("[fashion-trends API] 查询出错:", result.error);
      return NextResponse.json({ success: false, data: [], error: result.error.message }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[fashion-trends API] 异常:", e.message);
    return NextResponse.json({ success: false, data: [], error: e.message }, { status: 500 });
  }
}
