// 临时验证：确认 page-background 配置写入 Storage → 读回 闭环（用后即删）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const TEMP_TOKEN = "tmp_write_bg_2026";
const BUCKET = "site-assets";
const FILE_PATH = "config/page-backgrounds.json";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-temp-token");
    if (token !== TEMP_TOKEN) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const test = {
      home: { color: "#123456", image: "https://colour-choice.art/x.png" },
      buyer: { color: "#abcdef" },
      cart: {},
      my: { image: "https://colour-choice.art/y.png" },
    };
    // 写
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(FILE_PATH, JSON.stringify(test, null, 2), { contentType: "application/json", upsert: true });
    if (upErr) return NextResponse.json({ step: "upload", error: upErr.message }, { status: 500 });
    // 读回
    const { data, error: dlErr } = await supabase.storage.from(BUCKET).download(FILE_PATH);
    if (dlErr) return NextResponse.json({ step: "download", error: dlErr.message }, { status: 500 });
    const text = await data.text();
    const parsed = JSON.parse(text);
    // 清理
    await supabase.storage.from(BUCKET).remove([FILE_PATH]);
    return NextResponse.json({ ok: true, roundtrip: parsed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
