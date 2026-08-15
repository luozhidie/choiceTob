// app/api/mini/upload-product-image/route.ts
// 小程序端商品图上传：相册选图 → base64 → Supabase products 公共桶
// 鉴权：小程序自定义 token 或 Supabase JWT（需登录），service_role 绕过 Storage RLS
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { removeBackgroundToImage } from "@/lib/tryon/removeBg";

function parseMiniToken(token: string): { uid: string; exp?: number } | null {
  try {
    if (!token || token.includes(".")) return null;
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!payload.uid) return null;
    if (payload.exp && payload.exp < Date.now()) return null;
    return { uid: payload.uid as string, exp: payload.exp as number | undefined };
  } catch {
    return null;
  }
}

const BUCKET = "products";
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

function detectMimeFromBytes(buffer: Buffer): string | null {
  if (buffer.length < 8) return null;
  const head = buffer.slice(0, 8);
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "image/png";
  if (head[0] === 0xff && head[1] === 0xd8) return "image/jpeg";
  if (head.toString("ascii", 0, 3) === "GIF") return "image/gif";
  if (
    head.toString("ascii", 0, 4) === "RIFF" &&
    buffer.length >= 12 &&
    head.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "服务器配置错误" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 鉴权：必须登录
    let uid: string | null = null;
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (token) {
      if (token.includes(".")) {
        const { data } = await supabase.auth.getUser(token);
        if (data.user) uid = data.user.id;
      } else {
        const mini = parseMiniToken(token);
        if (mini) uid = mini.uid;
      }
    }
    if (!uid) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { image, mime } = await request.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "未收到图片" }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 权威识别按 Magic Bytes；mime 仅兜底
    const fileType =
      detectMimeFromBytes(buffer) ||
      (ALLOWED.includes(mime || "") ? (mime as string) : null) ||
      "image/jpeg";
    if (!ALLOWED.includes(fileType)) {
      return NextResponse.json({ error: "仅支持 JPG/PNG/WEBP/GIF 格式" }, { status: 400 });
    }
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "单张图片不能超过 5MB" }, { status: 400 });
    }

    // 自动白底化：上传前先抠图转白底（失败回退原图，绝不阻断上传）
    let uploadBuffer: Buffer = buffer;
    let uploadMime: string = fileType;
    try {
      const whitened = await removeBackgroundToImage(buffer, fileType, { person: false });
      if (whitened && whitened.length > 0) {
        uploadBuffer = whitened;
        uploadMime = "image/jpeg";
      }
    } catch (rbErr: any) {
      console.error("[小程序商品图上传] 白底处理失败，回退原图:", rbErr?.message);
    }

    const ext = uploadMime === "image/jpeg" ? "jpg" : (MIME_EXT[uploadMime] || "jpg");
    const filename = `collected/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(filename, uploadBuffer, { contentType: uploadMime, upsert: false });
    if (upErr) {
      return NextResponse.json({ error: "上传失败：" + upErr.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    return NextResponse.json({ success: true, url: (urlData as any).publicUrl });
  } catch (err: any) {
    console.error("[小程序商品图上传] 错误:", err);
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}
