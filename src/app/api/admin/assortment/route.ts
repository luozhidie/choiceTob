// 管理员 API：组货方案 列表 / 保存（创建或修改）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

async function withClient<T>(fn: (s: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      return await fn(createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY));
    } catch {}
  }
  return await fn(createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE));
}

// GET - 后台列出全部方案（含未发布）
export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const { data, error } = await withClient((s) =>
      s.from("assortment_plans").select("*").order("created_at", { ascending: false })
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - 保存方案（AI 预览或手动）。有 id 则更新，否则新建。
export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const body = await request.json();
    const { id, title, season, categories, price_bands, waves, source, status, source_report } = body;

    if (!title) return NextResponse.json({ error: "缺少方案标题" }, { status: 400 });

    const now = new Date().toISOString();
    const totalSku = Array.isArray(categories)
      ? categories.reduce((s: number, c: any) => s + (Number(c.target_sku) || 0), 0)
      : 0;

    const payload: any = {
      title,
      season: season || null,
      categories: categories || [],
      price_bands: price_bands || null,
      waves: waves || null,
      source: source || "manual",
      total_sku: totalSku,
      updated_at: now,
      marketing: source_report
        ? { source_report, updated_at: now }
        : undefined,
    };
    if (status) payload.status = status;

    let result;
    if (id && !String(id).startsWith("demo-")) {
      const { data, error } = await withClient((s) =>
        s.from("assortment_plans").update(payload).eq("id", id).select().single()
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      result = data;
    } else {
      const { data, error } = await withClient((s) =>
        s
          .from("assortment_plans")
          .insert([{ ...payload, created_at: now }])
          .select()
          .single()
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      result = data;
    }
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
