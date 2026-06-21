import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await req.json();

    const { error } = await supabase.from("style_diagnoses").insert({
      user_id: user.id,
      full_name: body.full_name,
      wechat_qr_url: body.wechat_qr_url || null,
      age: body.age,
      video_course_info: body.video_course_info || null,
      look_vs_age: body.look_vs_age || null,
      height: body.height || null,
      answers: body.answers || {},
      photo_urls_1: body.photo_urls_1 || [],
      photo_urls_2: body.photo_urls_2 || [],
      photo_urls_3: body.photo_urls_3 || [],
    });

    if (error) {
      console.error("[API] style-test submit error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[API] style-test submit exception:", err);
    return NextResponse.json({ error: err.message || "提交失败" }, { status: 500 });
  }
}
