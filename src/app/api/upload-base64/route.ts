// app/api/upload-base64/route.ts
// 图片上传 API（base64 版）— 兼容小程序未配置 uploadFile 域名的情况
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "blocks-images";
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

function detectMimeFromBytes(buffer: Buffer) {
  if (buffer.length < 8) return null;
  const head = buffer.slice(0, 8);
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "image/png";
  if (head[0] === 0xff && head[1] === 0xd8) return "image/jpeg";
  if (head.toString("ascii", 0, 3) === "GIF") return "image/gif";
  if (head.toString("ascii", 0, 4) === "RIFF" && buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { image, mime } = await request.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "未收到图片" }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 权威识别：按文件 Magic Bytes；mime 参数仅作为兜底提示
    const fileType = detectMimeFromBytes(buffer) || (ALLOWED.includes(mime || "") ? mime! : null) || "image/jpeg";
    if (!ALLOWED.includes(fileType)) {
      return NextResponse.json({ error: "仅支持 JPG/PNG/WEBP/GIF 格式" }, { status: 400 });
    }

    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "图片不能超过 5MB" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ALLOWED,
      fileSizeLimit: 5242880,
    });

    const ext = MIME_EXT[fileType] || "jpg";
    const filename = `block-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType: fileType, upsert: false });

    if (upErr) {
      return NextResponse.json({ error: "上传失败：" + upErr.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
