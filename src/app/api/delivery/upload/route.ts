import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/delivery/upload
 * 上传交付文件到 Supabase Storage
 * 使用 FormData: file + orderId
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const orderId = formData.get("orderId") as string | null;
    const itemName = formData.get("itemName") as string | null;

    if (!file || !orderId) {
      return NextResponse.json({ error: "缺少文件或订单ID" }, { status: 400 });
    }

    const supabase = await createClient();

    // 验证用户已登录
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 生成文件路径: deliveries/{orderId}/{timestamp}_{filename}
    const ext = file.name.split(".").pop() || "bin";
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]/g, "_");
    const filePath = `${orderId}/${timestamp}_${safeName}`;

    // 上传到 Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("deliveries")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // 如果 bucket 不存在，返回友好错误
      if (uploadError.message.includes("not found") || uploadError.message.includes("Bucket not found")) {
        return NextResponse.json({
          error: "Storage bucket 'deliveries' 不存在，请在 Supabase Dashboard 创建",
          hint: "前往 Supabase → Storage → New Bucket → 名称: deliveries → Public: 开启",
        }, { status: 500 });
      }
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage.from("deliveries").getPublicUrl(filePath);
    const fileUrl = urlData.publicUrl;

    // 判断文件类型
    const fileType = getFileType(file.type, ext);

    // 插入 delivery_items 记录
    const { data: item, error: itemError } = await supabase
      .from("delivery_items")
      .insert([{
        order_id: orderId,
        item_name: itemName || file.name,
        file_url: fileUrl,
        file_type: fileType,
        file_size: file.size,
        description: "",
        sort_order: 0,
      }])
      .select()
      .single();

    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/delivery/upload?itemId=xxx
 * 删除交付文件
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "缺少itemId" }, { status: 400 });
    }


    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 获取 item 信息
    const { data: item } = await supabase.from("delivery_items").select("*").eq("id", itemId).single();
    if (!item) {
      return NextResponse.json({ error: "交付物不存在" }, { status: 404 });
    }

    // 从 Storage 删除文件
    if (item.file_url) {
      const urlPath = item.file_url.split("/deliveries/")[1];
      if (urlPath) {
        await supabase.storage.from("deliveries").remove([urlPath]);
      }
    }

    // 从数据库删除记录
    const { error } = await supabase.from("delivery_items").delete().eq("id", itemId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getFileType(mimeType: string, ext: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext.toLowerCase())) return "document";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext.toLowerCase())) return "zip";
  return "file";
}
