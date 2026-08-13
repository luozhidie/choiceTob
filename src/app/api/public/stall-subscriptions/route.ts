// 公开 API：档口订阅（按微信 openid 服务端持久化）
// GET  ?openid=xxx            返回该用户订阅列表
// POST  {openid, stall_id, action?}  action=unsubscribe 取消，否则订阅（幂等 upsert）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

async function withClient<T>(fn: (s: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      return await fn(createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY));
    } catch (e) {
      // 落到 anon
    }
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE;
  return await fn(createClient(url, key));
}

// 获取某用户订阅的档口 id 列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const openid = searchParams.get("openid");
  if (!openid) {
    return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
  }
  const { data, error } = await withClient((s) =>
    s
      .from("stall_subscriptions")
      .select("stall_id")
      .eq("openid", openid)
      .order("created_at", { ascending: false })
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const ids = (data || []).map((r: any) => r.stall_id);
  return NextResponse.json({ success: true, data: ids });
}

// 订阅 / 取消订阅（幂等）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { openid, stall_id, action } = body;
    if (!openid || !stall_id) {
      return NextResponse.json({ error: "缺少 openid 或 stall_id" }, { status: 400 });
    }

    const result = await withClient(async (s) => {
      if (action === "unsubscribe") {
        const { error } = await s
          .from("stall_subscriptions")
          .delete()
          .eq("openid", openid)
          .eq("stall_id", stall_id);
        return { error };
      }
      const { data, error } = await s
        .from("stall_subscriptions")
        .upsert([{ openid, stall_id }], { onConflict: "openid,stall_id" })
        .select()
        .single();
      return { data, error };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
