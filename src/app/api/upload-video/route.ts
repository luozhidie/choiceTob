// app/api/upload-video/route.ts
// 视频上传 API（base64 版）— 兼容小程序未配置 uploadFile 域名的情况（短视频）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "videos";
const ALLOWED = ["video/mp4", "video/mov", "video/quicktime", "video/webm"];
const MIME_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/mov": "mov",
  "video/quicktime": "mov",
  "video/webm": "webm",
};
const MAX_BYTES = 20 * 1024 * 1024;

// 按文件 Magic Bytes 识别视频格式
function detectVideoMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  // MP4 / MOV: 偏移 4 处为 "ftyp"
  if (buffer.toString("ascii", 4, 8) === "ftyp") return "video/mp4";
  // WebM: EBML 头 0x1A45DFA3
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return "video/webm";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { video, mime } = await request.json();
    if (!video || typeof video !== "string") {
      return NextResponse.json({ error: "未收到视频" }, { status: 400 });
    }

    const base64Data = video.replace(/^data:video\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const fileType =
      detectVideoMime(buffer) ||
      (ALLOWED.includes(mime || "") ? mime! : null) ||
      "video/mp4";
    if (!ALLOWED.includes(fileType)) {
      return NextResponse.json({ error: "仅支持 MP4/MOV/WEBM 格式" }, { status: 400 });
    }
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: "视频不能超过 20MB" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ALLOWED,
      fileSizeLimit: MAX_BYTES,
    });

    const ext = MIME_EXT[fileType] || "mp4";
    const filename = `video-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

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
