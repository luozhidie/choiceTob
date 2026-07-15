// /api/admin/incoming-images/convert
// 将「待处理图片」一键转为商品（草稿）：建商品 + 标记原图已用
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function verifyAdmin(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

// 从文件名推导一个干净的商品标题
function deriveTitle(filename: string | null): string {
  if (!filename) return "待处理商品";
  const name = filename
    .replace(/\.[a-z0-9]+$/i, "") // 去扩展名
    .replace(/[_\-]+/g, " ")
    .replace(/^\d{10,}/, "") // 去时间戳前缀
    .trim();
  return name || "待处理商品";
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { id } = body;
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const supabase = getServiceRoleClient();

  // 1. 读取待处理图片
  const { data: row, error: readErr } = await supabase
    .from("scraped_images")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "待处理图片不存在" }, { status: 404 });
  if (row.status === "used") {
    return NextResponse.json({ error: "该图片已转为商品", alreadyUsed: true }, { status: 409 });
  }

  const imageUrl: string = row.url;

  // 2. 创建草稿商品（价格 0、未发布、归入「待分类」）
  const payload: any = {
    title: deriveTitle(row.filename),
    price: 0,
    original_price: 0,
    cover_image: imageUrl,
    images: [imageUrl],
    category: "待分类",
    is_published: false,
    stock: 0,
    tags: ["待处理转入"],
  };

  const { data: product, error: insertErr } = await supabase
    .from("products")
    .insert(payload)
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: `创建商品失败：${insertErr.message}` }, { status: 500 });
  }

  // 3. 标记原图已用
  const { error: markErr } = await supabase
    .from("scraped_images")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("id", id);
  if (markErr) {
    // 商品已建好，标记失败不阻断，仅提示
    return NextResponse.json({
      success: true,
      productId: product.id,
      warning: "商品已创建，但标记已用失败，可手动标记",
    });
  }

  return NextResponse.json({ success: true, productId: product.id });
}
