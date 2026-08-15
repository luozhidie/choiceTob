// 通用风格测试图片上传 API（后台）
// 上传文件到 Supabase Storage blocks-images bucket 的指定路径
// POST /api/admin/style-upload
// form-data: file=@xxx.jpg; path=style-test/xxx.jpg
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function verifyAdmin(request: NextRequest) {
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
    const file = formData.get("file") as File | null;
    const path = (formData.get("path") as string | null) || "";

    if (!file) {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 });
    }
    if (!path || path.includes("..") || path.startsWith("/")) {
      return NextResponse.json({ error: "路径不合法" }, { status: 400 });
    }

    const { error } = await supabase.storage
      .from("blocks-images")
      .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });

    if (error) {
      console.error("[style-upload] 上传失败", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("blocks-images").getPublicUrl(path);
    return NextResponse.json({ success: true, path, url: urlData.publicUrl });
  } catch (error: any) {
    console.error("[style-upload] 异常", error);
    return NextResponse.json({ error: error.message || "服务器内部错误" }, { status: 500 });
  }
}
