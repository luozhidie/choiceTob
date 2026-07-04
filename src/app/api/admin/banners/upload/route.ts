// app/api/admin/banners/upload/route.ts
// 轮播图图片上传 API - 使用 service_role 绕过 RLS
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// 验证管理员 cookie
async function verifyAdmin(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const supabase = getServiceRoleClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bannerId = formData.get("bannerId") as string;

    if (!file || !bannerId) {
      return NextResponse.json({ error: "缺少文件或bannerId" }, { status: 400 });
    }

    const filePath = `banners/${Date.now()}_${file.name}`;
    
    // 上传到 Storage
    const { data, error } = await supabase.storage
      .from("products")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from("products")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
