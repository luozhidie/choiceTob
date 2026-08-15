import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const path = form.get("path"); // 含文件夹，如 style-test/shaonian.jpg
    if (!file || !(file instanceof File) || !path || typeof path !== "string") {
      return NextResponse.json({ ok: false, error: "file 与 path 必填" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });
    const { error } = await supabase.storage
      .from("blocks-images")
      .upload(path, buf, { contentType: file.type || "image/jpeg", upsert: true });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, path });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
