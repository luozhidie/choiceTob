// 管理员 API：上货波段计划（一季 4 波，如 50% / 25% / 15% / 10%）
// GET ?season=2026-AW   列出（可按季节过滤）
// POST                  新建；body 带 id 则更新
// DELETE ?id=           删除
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

const ALLOWED = [
  "season_code",
  "wave_no",
  "planned_date",
  "sku_target",
  "qty_target",
  "pct_target",
  "actual_sku",
  "actual_qty",
  "note",
];

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const season = request.nextUrl.searchParams.get("season");

    const { data, error } = await withClient((s) => {
      let q = s.from("wave_plans").select("*").order("wave_no", { ascending: true });
      if (season) q = q.eq("season_code", season);
      return q;
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const body = await request.json();
    const payload: Record<string, any> = {};
    for (const k of ALLOWED) if (body[k] !== undefined) payload[k] = body[k];

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "没有可写入的字段" }, { status: 400 });
    }
    if (payload.wave_no !== undefined && (payload.wave_no < 1 || payload.wave_no > 4)) {
      return NextResponse.json({ error: "wave_no 只能是 1-4" }, { status: 400 });
    }

    // 带 id 则更新，否则新建
    const { data, error } = body.id
      ? await withClient((s) => s.from("wave_plans").update(payload).eq("id", body.id).select("*").single())
      : await withClient((s) => s.from("wave_plans").insert(payload).select("*").single());

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "保存失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    const { error } = await withClient((s) => s.from("wave_plans").delete().eq("id", id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}
