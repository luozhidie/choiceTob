import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { filename, mimeType, bucket = "products" } = body;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const safeName = (filename || `video_${Date.now()}.mp4`).replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `videos/${Date.now()}_${safeName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl) {
      console.error("[signed-upload] error:", error);
      return NextResponse.json(
        { error: error?.message || "创建签名上传链接失败" },
        { status: 500 }
      );
    }

    const publicUrl = `${url}/storage/v1/object/public/${bucket}/${storagePath}`;
    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: storagePath,
      publicUrl,
    });
  } catch (err: any) {
    console.error("[signed-upload] 异常:", err);
    return NextResponse.json(
      { error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}
