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
  // 外层catch：捕获所有未预期错误
  try {
    // 步骤1：鉴权
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权", step: "auth" }, { status: 401 });
    }

    // 步骤2：解析 FormData
    let file: File | null = null;
    let formDataBody: string | null = null;
    try {
      const formData = await request.formData();
      file = formData.get("file") as File | null;
      // 记录formData基本信息用于调试
      formDataBody = `file=${file ? `${fileName}(${mimeType},${file.size}B)` : "null"}`;
    } catch (parseErr: any) {
      console.error("[图片上传] FormData解析失败:", parseErr.message);
      return NextResponse.json(
        { error: `FormData解析失败: ${parseErr.message}`, step: "formdata" },
        { status: 400 }
      );
    }

    console.log(`[图片上传] ${formDataBody}`);

    // 步骤3：文件校验
    if (!file) {
      return NextResponse.json(
        { error: "未找到文件（formData中无file字段）", step: "validate" },
        { status: 400 }
      );
    }

    // iOS/微信图片的file.type可能为空，默认按image/jpeg处理
    const mimeType = (file.type && file.type.startsWith("image/")) ? file.type : "image/jpeg";
    const fileName = file.name || `image_${Date.now()}.jpg`;

    // 如果明确是非图片类型才拒绝（空的不拒绝）
    if (file.type && !file.type.startsWith("image/") && !file.type.startsWith("application/octet-stream")) {
      return NextResponse.json(
        { error: `不支持的文件类型：${file.type}`, step: "validate" },
        { status: 400 }
      );
    }

    // 步骤4：读取文件内容为Buffer
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      console.log(`[图片上传] 文件读取成功: ${fileName} (${(buffer.length / 1024).toFixed(1)}KB)`);
    } catch (readErr: any) {
      console.error("[图片上传] 文件读取失败:", readErr);
      return NextResponse.json(
        { error: `文件读取失败: ${readErr.message}`, step: "read" },
        { status: 500 }
      );
    }

    // 步骤5：创建Supabase client并上传Storage
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = getServiceRoleClient();
    } catch (clientErr: any) {
      console.error("[图片上传] Supabase客户端创建失败:", clientErr.message);
      return NextResponse.json(
        { error: `存储服务初始化失败: ${clientErr.message}`, step: "client" },
        { status: 500 }
      );
    }

    const storagePath = `grabbed/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    let uploadResult: any;
    try {
      uploadResult = await supabase.storage
        .from("products")
        .upload(storagePath, buffer, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: false,
        });
      console.log(`[图片上传] 上传结果:`, {
        path: storagePath,
        hasData: !!uploadResult.data,
        error: uploadResult.error?.message || null,
      });

      if (uploadResult.error) {
        return NextResponse.json(
          { error: `存储失败(${uploadResult.error.code || "未知"}): ${uploadResult.error.message}`, step: "storage-upload" },
          { status: 500 }
        );
      }
    } catch (uploadErr: any) {
      console.error("[图片上传] Storage上传异常:", uploadErr);
      // 捕获详细的异常栈信息
      const errDetail = uploadErr.stack || uploadErr.message;
      console.error("[图片上传] 异常详情:", errDetail);
      return NextResponse.json(
        { 
          error: `存储上传异常: ${uploadErr.message}`,
          detail: typeof uploadErr.stack === "string" ? uploadErr.stack.slice(0, 500) : String(uploadErr).slice(0, 500),
          step: "storage-upload-exception" 
        },
        { status: 500 }
      );
    }

    // 步骤6：获取公开URL
    let publicUrl: string | null = null;
    try {
      const urlData = await supabase.storage
        .from("products")
        .getPublicUrl(storagePath);

      // 兼容不同版本SDK返回格式
      publicUrl = (urlData as any).publicUrl || (urlData as any).publicURL || null;

      if (!publicUrl) {
        console.warn("[图片上传] getPublicUrl返回空，使用拼接URL");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        publicUrl = `${supabaseUrl}/storage/v1/object/public/products/${storagePath}`;
      }
    } catch (urlErr: any) {
      console.error("[图片上传] 获取公网URL失败:", urlErr.message);
      // 不阻断主流程，用拼接方式兜底
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      publicUrl = `${supabaseUrl}/storage/v1/object/public/products/${storagePath}`;
    }

    console.log(`[图片上传] 完成: ${file.name} -> ${publicUrl}`);

    return NextResponse.json({
      success: true,
      filename: fileName,
      storedUrl: publicUrl,
      size: buffer.length,
      path: storagePath,
    });
  } catch (err: any) {
    console.error("[图片上传API] 未预期的顶层错误:", err);
    console.error("[图片上传API] 错误堆栈:", err.stack || "无堆栈");
    return NextResponse.json(
      { 
        error: err.message || "服务器内部错误", 
        stack: (err.stack || "").slice(0, 1000),
        step: "unknown"
      },
      { status: 500 }
    );
  }
}
