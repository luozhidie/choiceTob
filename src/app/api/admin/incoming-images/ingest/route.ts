// /api/admin/incoming-images/ingest
// 接收 1688 提取脚本输出的商品 JSON（单对象 / 数组 / 多对象拼接），
// 下载图片到 products 存储桶，逐图写入 scraped_images（带 product_meta），
// 供前台「待处理图片 → 转为商品」一键生成带标题/价格/规格的草稿商品。
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

// 解析可能是：单个 JSON 对象 / JSON 数组 / 多个对象拼接的文本
function parseItems(raw: string): any[] {
  const text = (raw || "").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const a = JSON.parse(text);
      if (Array.isArray(a)) return a.filter((x) => x && typeof x === "object");
    } catch {
      /* fallthrough */
    }
  }
  if (text.startsWith("{")) {
    try {
      const o = JSON.parse(text);
      if (o && typeof o === "object") return [o];
    } catch {
      /* try multi-object */
    }
    const ms = text.match(/\{[\s\S]*?\}(?=\s*\{|\s*$)/g);
    if (ms) {
      const arr = ms
        .map((m) => {
          try {
            return JSON.parse(m);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      if (arr.length) return arr;
    }
  }
  return [];
}

function hashCode(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

// 价格文本 -> 分
function parsePrice(v: any): number {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v).replace(/[^\d.]/g, ""));
  if (isNaN(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

// 下载远程图片到 products 存储桶，失败返回 null
async function downloadImage(
  url: string,
  supabase: any
): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        Referer: new URL(url).origin,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
      },
    });
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    const ext = url.match(/\.(jpg|jpeg|png|webp|gif)/i)?.[1] || "jpg";
    const fname = `ingest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage
      .from("products")
      .upload(fname, buf, { contentType: `image/${ext}`, upsert: false });
    if (error || !data) return null;
    const { data: pub } = supabase.storage.from("products").getPublicUrl(data.path);
    return pub?.publicUrl || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const items = parseItems(body?.json || "");
  if (!items.length) {
    return NextResponse.json({ error: "未解析到商品 JSON（请粘贴 1688 提取脚本结果）" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  let count = 0;

  for (const item of items) {
    const title = (item.title || "").toString().slice(0, 120);
    const price = parsePrice(item.price);
    const originalPrice = parsePrice(item.originalPrice);
    const description = item.description ? String(item.description).slice(0, 500) : null;
    const specs: string[] = Array.isArray(item.specs)
      ? item.specs.map(String)
      : [];
    const platform = item.platform || "1688";
    const sourceUrl: string = item.url || item.source_url || "";
    const groupKey = hashCode(
      `${title}|${sourceUrl}|${(Array.isArray(item.images) ? item.images[0] : "")}`
    );
    const images: string[] = Array.isArray(item.images)
      ? item.images
          .filter((x: any) => typeof x === "string" && /\.(jpg|jpeg|png|webp|gif)/i.test(x))
          .slice(0, 20)
      : [];

    for (const imgUrl of images) {
      const stored = (await downloadImage(imgUrl, supabase)) || imgUrl;
      const { error } = await supabase.from("scraped_images").insert({
        url: stored,
        filename: title || "1688商品",
        product_meta: {
          title,
          price,
          original_price: originalPrice,
          description,
          specs,
          platform,
          source_url: sourceUrl,
          group_key: groupKey,
        },
        status: "pending",
      });
      if (!error) count++;
    }
  }

  return NextResponse.json({ success: true, count });
}
