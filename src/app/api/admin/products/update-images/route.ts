// 批量导入图片到商品 API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';


function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, images } = body;

    if (!productId || productId === "new") {
      return NextResponse.json({ error: "请选择要关联的商品" }, { status: 400 });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "没有可导入的图片" }, { status: 400 });
    }

    // 获取商品当前数据
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 查询现有商品的图片
    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("id, title, images")
      .eq("id", productId)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: `商品不存在：${fetchError?.message}` }, { status: 404 });
    }

    // 合并图片（追加到现有图片列表）
    let existingImages: string[] = [];
    try {
      if (typeof existingProduct.images === "string") {
        existingImages = JSON.parse(existingProduct.images);
        if (!Array.isArray(existingImages)) existingImages = [];
      } else if (Array.isArray(existingProduct.images)) {
        existingImages = existingProduct.images;
      }
    } catch {
      existingImages = [];
    }

    // 追加新图片URL
    const newImageUrls = images.map((img: any) => img.url);
    const updatedImages = [...existingImages, ...newImageUrls];

    // 更新商品
    const { error: updateError } = await supabase
      .from("products")
      .update({
        images: JSON.stringify(updatedImages),
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (updateError) {
      console.error("[批量导入] 更新失败:", updateError);
      return NextResponse.json({ error: `更新失败：${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `已将 ${images.length} 张图片导入到「${existingProduct.title}」`,
      totalImages: updatedImages.length,
      productTitle: existingProduct.title,
    });
  } catch (err: any) {
    console.error("[批量导入API错误]", err);
    return NextResponse.json({ error: err.message || "服务器内部错误" }, { status: 500 });
  }
}
