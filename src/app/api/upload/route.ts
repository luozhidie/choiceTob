// app/api/upload/route.ts
// 图片上传 API — 存到 Supabase Storage (blocks-images bucket)
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

function extFromName(name: string) {
  const parts = name.split(".");
  const last = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(last)) {
    return last === "jpeg" ? "jpg" : last;
  }
  return "";
}

// 小程序 chooseMedia 返回的临时文件经常没有扩展名，或 MIME 类型被标记为 application/octet-stream。
// 按文件 Magic Bytes 做兜底识别，避免被后端误杀。
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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "未收到文件" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 优先相信 HTTP 头里的 Content-Type；若缺失或无效，则按文件内容识别
    const fileType = ALLOWED.includes(file.type) ? file.type : (detectMimeFromBytes(buffer) || file.type);
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

    // 确保 bucket 存在（已存在会忽略错误）
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ALLOWED,
      fileSizeLimit: 5242880,
    });

    const ext = extFromName(file.name || "") || MIME_EXT[fileType] || "jpg";
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
