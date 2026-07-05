// app/api/admin/blocks/upload/route.ts
// 版块图片上传 API - 使用 service_role 绕过 RLS
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyAdmin(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 });
    }

    // 文件大小限制 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "文件大小不能超过5MB" }, { status: 400 });
    }

    // 文件类型检查
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "只支持 JPG/PNG/GIF/WEBP 图片格式" }, { status: 400 });
    }

    const filePath = `blocks/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${file.name}`;

    // 上传到 Storage (products bucket)
    const { error } = await supabase.storage
      .from("products")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("[blocks上传] Storage错误:", error);
      return NextResponse.json({ error: `上传失败: ${error.message}` }, { status: 500 });
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from("products")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error: any) {
    console.error("[blocks上传] 异常:", error);
    return NextResponse.json({ error: error.message || "上传失败" }, { status: 500 });
  }
}
