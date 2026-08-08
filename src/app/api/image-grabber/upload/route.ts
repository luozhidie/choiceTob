// /api/image-grabber/upload/route.ts
// 图片上传 API - 使用 service_role 绕过 Storage RLS
// 使用 JSON + Base64 方式接收文件（避免 Vercel 的 formData() 兼容性问题）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量"
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    // 鉴权
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权", step: "auth" }, { status: 401 });
    }

    // 解析 JSON Body（不用 formData）
    const body = await request.json();
    const { filename, mimeType, dataUrl } = body;

    if (!dataUrl) {
      return NextResponse.json(
        { error: "缺少图片数据(dataUrl)", step: "validate" },
        { status: 400 }
      );
    }

    // 从 Data URL 提取 Base64 数据
    let base64Data: string;
    let detectedMime: string = mimeType || "image/jpeg";

    if (dataUrl.startsWith("data:")) {
      const commaIdx = dataUrl.indexOf(",");
      if (commaIdx === -1) {
        return NextResponse.json(
          { error: "图片数据格式错误：无效的Data URL", step: "validate" },
          { status: 400 }
        );
      }
      // 从 data:image/jpeg;base64,xxxx 中提取 MIME 和 base64
      const headerPart = dataUrl.slice(5, commaIdx); // "image/jpeg;base64"
      if (headerPart.includes(";")) {
        detectedMime = headerPart.split(";")[0] || detectedMime;
      }
      base64Data = dataUrl.slice(commaIdx + 1);
    } else {
      // 纯 base64
      base64Data = dataUrl;
    }

    // 解码 Base64 → Buffer
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, "base64");
    } catch (decodeErr: any) {
      return NextResponse.json(
        { error: `Base64解码失败: ${decodeErr.message}`, step: "decode" },
        { status: 400 }
      );
    }

    console.log(`[图片上传] ${filename || "unnamed"} (${(buffer.length / 1024).toFixed(1)}KB, ${detectedMime})`);

    // 上传到 Supabase Storage（service_role 绕过 RLS）
    const supabase = getServiceRoleClient();
    const safeName = (filename || `img_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `grabbed/${Date.now()}_${safeName}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(storagePath, buffer, {
        contentType: detectedMime,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[图片上传] Storage错误:", error);
      return NextResponse.json(
        { error: `存储失败: ${error.message}`, step: "storage" },
        { status: 500 }
      );
    }

    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from("products")
      .getPublicUrl(storagePath);

    const publicUrl = (urlData as any).publicUrl || (urlData as any).publicURL ||
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${storagePath}`;

    console.log(`[图片上传] 成功: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      filename: safeName,
      storedUrl: publicUrl,
      size: buffer.length,
      path: storagePath,
    });
  } catch (err: any) {
    console.error("[图片上传API错误]", err);
    console.error("[图片上传API堆栈]", err.stack || "");
    return NextResponse.json(
      { error: err.message || "服务器内部错误", step: "unknown" },
      { status: 500 }
    );
  }
}
