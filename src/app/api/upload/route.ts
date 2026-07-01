// app/api/upload/route.ts
// 图片上传 API — 存到 Supabase Storage (blocks-images bucket)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "blocks-images";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "未收到文件" }, { status: 400 });

    // 校验类型
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "仅支持 JPG/PNG/WEBP/GIF 格式" }, { status: 400 });
    }
    // 限 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "图片不能超过 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Supabase 管理员客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 确保 bucket 存在
    const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: allowed,
      fileSizeLimit: 5242880,
    });
    // bucket 已存在不报错就忽略

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `block-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType: file.type, upsert: false });

    if (upErr) {
      return NextResponse.json({ error: "上传失败：" + upErr.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
