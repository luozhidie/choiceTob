// /api/admin/incoming-images/convert
// 将「待处理图片」一键转为商品：
//  - 含 product_meta（1688 抓取）时，带出 标题/价格/原价/描述，并按规格映射 材质/尺码/产地/品牌/重量/洗涤
//  - 同 group_key 的多张图合并到同一商品（用 tags 的 grp_ 标记去重）
//  - 纯图片（无 meta）走原逻辑：建草稿商品
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

interface Meta {
  title?: string;
  price?: number; // 单位：分
  original_price?: number; // 单位：分
  description?: string;
  specs?: string[];
  platform?: string;
  source_url?: string;
  group_key?: string;
}

// 从文件名推导干净标题
function deriveTitle(filename: string | null): string {
  if (!filename) return "待处理商品";
  const name = filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_\-]+/g, " ")
    .replace(/^\d{10,}/, "")
    .trim();
  return name || "待处理商品";
}

// 将 1688 specs（"材质:棉" 等）映射到商品参数字段
function parseSpecs(specs: string[] | undefined): {
  material: string;
  sizes: string;
  origin: string;
  brand: string;
  weight: string;
  care_instructions: string;
  extras: string[];
} {
  const r = {
    material: "",
    sizes: "",
    origin: "",
    brand: "",
    weight: "",
    care_instructions: "",
    extras: [] as string[],
  };
  const append = (field: keyof typeof r, val: string) => {
    const v = val.trim();
    if (!v) return;
    if (typeof r[field] === "string" && (r[field] as string)) {
      // 多值拼接（如多个尺码）
      (r[field] as string) = `${r[field]} ${v}`;
    } else {
      (r[field] as string) = v;
    }
  };
  for (const raw of specs || []) {
    const s = String(raw).trim();
    if (!s) continue;
    const m = s.match(/^(.+?)[:：]\s*(.+)$/);
    const key = m ? m[1].replace(/\s/g, "") : "";
    const val = m ? m[2] : s;
    if (/^(材质|面料|成分|主料)/.test(key)) append("material", val);
    else if (/^(尺码|尺寸|大小|规格)/.test(key)) append("sizes", val);
    else if (/^(产地|发货地|生产地)/.test(key)) append("origin", val);
    else if (/^(品牌)/.test(key)) append("brand", val);
    else if (/^(重量|克重)/.test(key)) append("weight", val);
    else if (/^(洗涤|护理|保养|清洗)/.test(key)) append("care_instructions", val);
    else r.extras.push(s);
  }
  return r;
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
  const meta: Meta | null = row.product_meta || null;

  let productId: string | null = null;

  if (meta && meta.group_key) {
    // ---- 带参数的商品：同 group_key 合并 ----
    const groupTag = `grp_${meta.group_key}`;
    const { data: existing } = await supabase
      .from("products")
      .select("id, images, cover_image")
      .contains("tags", [groupTag])
      .maybeSingle();

    if (existing) {
      // 追加图片到已有商品
      const imgs: string[] = Array.isArray(existing.images)
        ? existing.images.filter(Boolean)
        : [];
      if (!imgs.includes(imageUrl)) imgs.push(imageUrl);
      const { error: updErr } = await supabase
        .from("products")
        .update({
          images: imgs,
          cover_image: existing.cover_image || imageUrl,
        })
        .eq("id", existing.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      productId = existing.id;
    } else {
      // 首次：创建带完整参数的草稿商品
      const sp = parseSpecs(meta.specs);
      const tags = ["待处理转入", groupTag];
      if (meta.platform) tags.push(`平台·${meta.platform}`);
      if (sp.extras.length) tags.push(...sp.extras.slice(0, 5).map((e) => `规格·${e}`));

      const payload: any = {
        title: (meta.title || deriveTitle(row.filename)).toString().slice(0, 120),
        price: meta.price && meta.price > 0 ? meta.price : 0,
        original_price:
          meta.original_price && meta.original_price > 0
            ? meta.original_price
            : meta.price || 0,
        cover_image: imageUrl,
        images: [imageUrl],
        category: "待分类",
        is_published: false,
        stock: 0,
        description: meta.description || null,
        tags,
        material: sp.material || null,
        sizes: sp.sizes || null,
        origin: sp.origin || null,
        brand: sp.brand || null,
        weight: sp.weight || null,
        care_instructions: sp.care_instructions || null,
      };

      const { data: product, error: insErr } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();
      if (insErr) return NextResponse.json({ error: `创建商品失败：${insErr.message}` }, { status: 500 });
      productId = product.id;
    }
  } else {
    // ---- 纯图片：原逻辑建草稿 ----
    const { data: product, error: insErr } = await supabase
      .from("products")
      .insert({
        title: deriveTitle(row.filename),
        price: 0,
        original_price: 0,
        cover_image: imageUrl,
        images: [imageUrl],
        category: "待处理",
        is_published: false,
        stock: 0,
        tags: ["待处理转入"],
      })
      .select()
      .single();
    if (insErr) return NextResponse.json({ error: `创建商品失败：${insErr.message}` }, { status: 500 });
    productId = product.id;
  }

  // 3. 标记原图已用
  const { error: markErr } = await supabase
    .from("scraped_images")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("id", id);
  if (markErr) {
    return NextResponse.json({
      success: true,
      productId,
      warning: "商品已创建，但标记已用失败，可手动标记",
    });
  }

  return NextResponse.json({ success: true, productId });
}
