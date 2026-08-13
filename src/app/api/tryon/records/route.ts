// app/api/tryon/records/route.ts
// GET  ?openid=  查询最近 7 天试衣记录
// POST {openid, mode, cloth_urls, result_url, person_url?}  写入一条试衣记录
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// 只返回 7 天内记录（应用层即"已清理"）
const WINDOW_DAYS = 7;

export async function GET(request: NextRequest) {
  const openid = request.nextUrl.searchParams.get("openid");
  if (!openid) {
    return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
  }
  try {
    const supabase = await createClient();
    const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString();
    const { data, error } = await supabase
      .from("tryon_records")
      .select("id, mode, cloth_urls, result_url, person_url, created_at")
      .eq("openid", openid)
      .gt("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[试衣记录查询] 失败", error);
      return NextResponse.json({ error: "查询失败" }, { status: 500 });
    }
    return NextResponse.json({ records: data || [] });
  } catch (err: any) {
    console.error("[试衣记录查询] 异常", err);
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { openid, mode, cloth_urls, result_url, person_url } = body;

    if (!openid) {
      return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
    }
    if (!Array.isArray(cloth_urls) || cloth_urls.length === 0) {
      return NextResponse.json({ error: "缺少 cloth_urls" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tryon_records")
      .insert({
        openid,
        mode: mode === "pro" ? "pro" : "normal",
        cloth_urls,
        result_url: result_url || null,
        person_url: person_url || null,
      })
      .select("id, mode, cloth_urls, result_url, created_at")
      .single();

    if (error) {
      console.error("[试衣记录写入] 失败", error);
      return NextResponse.json({ error: "写入失败" }, { status: 500 });
    }
    return NextResponse.json({ success: true, record: data });
  } catch (err: any) {
    console.error("[试衣记录写入] 异常", err);
    return NextResponse.json({ error: err.message || "写入失败" }, { status: 500 });
  }
}
