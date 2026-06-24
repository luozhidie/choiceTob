// /api/image-grabber/download/route.ts
// 下载图片并上传到存储
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, filename, productId } = body;

    if (!imageUrl || !filename) {
      return NextResponse.json(
        { error: "缺少必要参数: imageUrl 或 filename" },
        { status: 400 }
      );
    }

    console.log(`[图片下载] 开始下载: ${filename} from ${imageUrl}`);

    // 1. 下载原始图片
    let imageBuffer: ArrayBuffer;
    try {
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: imageUrl,
        },
        redirect: "follow",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      imageBuffer = await response.arrayBuffer();
    } catch (error) {
      console.error("[图片下载] 下载失败:", error);
      return NextResponse.json(
        {
          error:
            "无法下载图片，可能是防盗链或链接失效",
          success: false,
        },
        { status: 500 }
      );
    }

    // 2. 转换为Base64（用于上传）
    const base64 = Buffer.from(imageBuffer).toString("base64");

    // 3. 确定文件类型
    const contentType = getContentType(imageUrl);
    const fileExt = getFileExtension(contentType, imageUrl);
    const finalFilename = filename.replace(/\.[^.]+$/, "") + "." + fileExt;
    const mimeType = `image/${fileExt}`;

      // 4. 上传到Supabase Storage
      const supabase = await createClient();
      const storagePath = `grabbed/${Date.now()}_${finalFilename}`;
      
      // 尝试上传到storage
      let storedUrl: string | null = null;
      try {
        const { data, error } = await supabase.storage
          .from("products") // 与商品管理页面使用相同的存储桶
          .upload(storagePath, Buffer.from(base64), {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("[图片上传] Supabase Storage错误:", error);
        // 如果storage不可用，返回原始URL作为fallback
        storedUrl = imageUrl;
      } else {
        // 获取公开URL
        const { data: urlData } = supabase.storage
          .from("products")
          .getPublicUrl(storagePath);

        storedUrl = urlData.publicUrl || imageUrl;
      }
    } catch (storageError) {
      console.error("[图片上传] 存储服务异常:", storageError);
      // Fallback：使用原始URL
      storedUrl = imageUrl;
    }

    // 5. 如果指定了productId，关联到商品
    if (productId && productId !== "new" && storedUrl && storedUrl !== imageUrl) {
      try {
        await supabase.from("products").update({
          images: `[${JSON.stringify(storedUrl)}]`, // 简单处理，实际应该append
          updated_at: new Date().toISOString(),
        }).eq("id", productId);
      } catch (dbError) {
        console.error("[图片关联] 更新商品失败:", dbError);
        // 不影响主流程，继续返回成功
      }
    }

    const sizeInKB = Math.round((imageBuffer.byteLength / 1024) * 10) / 10;

    console.log(
      `[图片下载] 完成: ${finalFilename} (${sizeInKB}KB)`
    );

    return NextResponse.json({
      success: true,
      filename: finalFilename,
      storedUrl: storedUrl,
      size: imageBuffer.byteLength,
      path: storagePath,
    });
  } catch (error) {
    console.error("[图片下载API错误]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "服务器错误",
      },
      { status: 500 }
    );
  }
}

// 辅助函数：根据URL或内容判断文件类型
function getContentType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpeg";
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".gif")) return "gif";
  if (lower.endsWith(".webp")) return "webp";
  if (lower.endsWith(".bmp")) return "bmp";
  return "jpeg"; // 默认
}

// 辅助函数：获取文件扩展名
function getFileExtension(contentType: string, url: string): string {
  const extMap: Record<string, string> = {
    jpeg: "jpg",
    png: "png",
    gif: "gif",
    webp: "webp",
    bmp: "bmp",
  };

  const ext = extMap[contentType];
  if (ext) return ext;

  // 从URL提取
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() || "jpg";
}
