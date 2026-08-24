import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "服务器配置错误" }, { status: 500 });
    }

    const serviceClient = createServiceClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let userId: string | null = null;
    const openid = body.openid ? String(body.openid) : null;

    if (openid) {
      const { data: p1 } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("wx_openid", openid)
        .single();
      if (p1) {
        userId = p1.id;
      } else {
        const { data: p2 } = await serviceClient
          .from("profiles")
          .select("id")
          .eq("wechat_openid", openid)
          .single();
        if (p2) userId = p2.id;
      }
    }

    const { error } = await serviceClient.from("style_test_results").insert({
      user_id: userId,
      gender: body.gender || "female",
      answers: body.answers || {},
      main_style: body.main_style || null,
      source: "mini_program",
    });

    if (error) {
      console.error("[style-test/save-mini] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[style-test/save-mini] exception:", err);
    return NextResponse.json({ error: err.message || "保存失败" }, { status: 500 });
  }
}
