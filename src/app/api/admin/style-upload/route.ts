import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "blocks-images";
const FOLDER = "style-test";
// 一次性临时密钥，用完即删该路由
const ADMIN_KEY = process.env.STYLE_UPLOAD_KEY || "lzd_tmp_style_upload_2026";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-admin-key");
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const form = await request.formData();
  const file = form.get("file") as File | null;
  const name = (form.get("name") as string) || "";
  if (!file || !name) return NextResponse.json({ error: "missing file/name" }, { status: 400 });
  if (!/^[a-zA-Z0-9_\-]+\.jpg$/.test(name)) return NextResponse.json({ error: "bad name" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  await supabase.storage.createBucket(BUCKET, { public: true });

  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(`${FOLDER}/${name}`, buf, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const url = supabase.storage.from(BUCKET).getPublicUrl(`${FOLDER}/${name}`).data.publicUrl;
  return NextResponse.json({ ok: true, url });
}
