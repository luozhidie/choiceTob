// app/api/diagnosis-consult/route.ts
// 顾问人工服务线索：用户提交资料（姓名/联系方式/需求/照片），
// 顾问后续人工跟进并报价（不在此展示价格，避免强调补差价）。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const openid = b.openid;
    const userId = b.user_id;
    if (!openid && !userId) {
      return NextResponse.json({ error: "缺少 openid 或 user_id" }, { status: 400 });
    }

    const row: any = {
      openid: openid && !isUuid(openid) ? openid : null,
      user_id: userId || (openid && isUuid(openid) ? openid : null),
      name: (b.name || "").toString().slice(0, 50),
      contact: (b.contact || "").toString().slice(0, 100),
      notes: (b.notes || "").toString().slice(0, 1000),
      photo_urls: Array.isArray(b.photo_urls) ? b.photo_urls.slice(0, 9) : [],
      source: (b.source || "personal_image_manual").toString().slice(0, 40),
      status: "pending",
    };

    const { data, error } = await supabase.from("diagnosis_consults").insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      id: data.id,
      message: "资料已提交，顾问会在 24 小时内联系你报价",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "服务器错误" }, { status: 500 });
  }
}
