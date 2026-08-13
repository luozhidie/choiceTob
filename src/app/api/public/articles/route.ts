// 公开 API：获取流行资讯文章（小程序「时尚资讯与趋势」页消费）
// 优先用 service_role_key 绕过 RLS，缺失时降级到 publishable key
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// 正确的 publishable key（公开安全，作为环境变量缺失时的兜底）
const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

// 视频平台域名（用于识别/提取视频链接，含 Vogue 官方秀场页）
const VIDEO_HOST_RE =
  /https?:\/\/(www\.)?(youtube\.com|youtu\.be|bilibili\.com|b23\.tv|douyin\.com|v\.douyin\.com|ixigua\.com|weibo\.com|youku\.com|v\.qq\.com|xiaohongshu\.com|kuaishou\.com|toutiao\.com|vogue\.com)[^\s)"'<>]+/i;

function extractVideoUrl(text: string): string | null {
  const m = text?.match(VIDEO_HOST_RE);
  return m ? m[0] : null;
}

// 把 articles 行映射成小程序需要的字段
function formatArticle(a: any) {
  const content: string = a.content || "";
  const isVideo = a.tag === "秀场速报" || VIDEO_HOST_RE.test(content);
  const videoUrl = isVideo ? extractVideoUrl(content) : null;
  return {
    id: a.id,
    title: a.title || "",
    summary: a.excerpt || "",
    excerpt: a.excerpt || "",
    description: a.excerpt || "",
    content,
    image_url: a.image_url || "",
    cover_image: a.image_url || "",
    tag: a.tag || "时尚资讯",
    is_premium: !!a.is_premium,
    is_published: !!a.is_published,
    author: a.author || "骆芷蝶智选",
    published_at: a.published_at || a.created_at || "",
    created_at: a.created_at || "",
    hasVideo: isVideo,
    videoUrl,
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
      .from("articles")
      .select("*")
      .eq("id", singleId)
      .maybeSingle();
    if (error) return { error };
    return { success: true, data: data ? [formatArticle(data)] : [], error: null };
  }

  // 列表：仅返回已发布
  let query = supabase
    .from("articles")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (category && category !== "全部") query = query.eq("tag", category);

  const { data, error } = await query;
  if (error) return { error };
  return { success: true, data: (data || []).map(formatArticle), error: null };
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const result = await queryWithClient(supabase, request);
      if (result.error) {
        console.error("[articles API] service_role 查询出错:", result.error);
      } else {
        return NextResponse.json(result);
      }
    } catch (e: any) {
      console.error("[articles API] service_role 异常:", e.message);
    }
  } else {
    console.warn("[articles API] 警告: SUPABASE_SERVICE_ROLE_KEY 未设置，使用 publishable key");
  }

  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE;
  try {
    const supabase = createClient(supabaseUrl, publishableKey);
    const result = await queryWithClient(supabase, request);
    if (result.error) {
      console.error("[articles API] 查询出错:", result.error);
      return NextResponse.json({ success: false, data: [], error: result.error.message }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[articles API] 异常:", e.message);
    return NextResponse.json({ success: false, data: [], error: e.message }, { status: 500 });
  }
}
