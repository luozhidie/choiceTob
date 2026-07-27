import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTagSuggestions } from "@/lib/cmb-tag";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: "缺少 productId" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const result = await generateTagSuggestions(supabase, productId);
    if ("error" in result) {
      // 商品不存在 → 404；其余 AI/格式异常 → 503/500
      const status = result.error === "商品不存在" ? 404 : 503;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[suggest-tags]", err);
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}
