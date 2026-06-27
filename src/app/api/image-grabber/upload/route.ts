// /api/image-grabber/upload/route.ts
// 图片上传 API - 使用 service_role 绕过 Storage RLS
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
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "未找到文件" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: `不支持的文件类型：${file.type}` },
        { status: 400 }
      );
    }

    // 转换 File → ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 用 Service Role 上传到 Supabase Storage（绕过 RLS）
    const supabase = getServiceRoleClient();
    const storagePath = `grabbed/${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from("products")
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[图片上传API] Storage 错误:", error);
      return NextResponse.json(
        { error: `存储失败：${error.message}` },
        { status: 500 }
      );
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from("products")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl || null;

    return NextResponse.json({
      success: true,
      filename: file.name,
      storedUrl: publicUrl,
      size: buffer.length,
      path: storagePath,
    });
  } catch (err: any) {
    console.error("[图片上传API错误]", err);
    return NextResponse.json(
      { error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}
