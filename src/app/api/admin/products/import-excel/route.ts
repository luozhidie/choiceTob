// 供应商 Excel/CSV 批量导入：解析 → 自动映射字段 → 批量上架商品
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseMiniToken(token: string): { uid: string; exp?: number } | null {
  try {
    if (!token || token.includes(".")) return null;
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!payload.uid) return null;
    if (payload.exp && payload.exp < Date.now()) return null;
    return { uid: payload.uid as string, exp: payload.exp as number | undefined };
  } catch {
    return null;
  }
}

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const cookie = request.headers.get("cookie") || "";
  if (cookie.includes("admin_logged_in=true")) return true;
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  let userId: string | null = null;
  if (token.includes(".")) {
    try {
      const { data } = await supabase.auth.getUser(token);
      if (data.user) userId = data.user.id;
    } catch {}
  } else {
    const mini = parseMiniToken(token);
    if (mini) userId = mini.uid;
  }
  if (!userId) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return !!profile?.is_admin;
}

// 把价格文本转成分（去掉 ¥ ￥ 元 等）
function toCents(v: any): number | null {
  if (v == null) return null;
  const s = String(v).replace(/[^\d.]/g, "");
  if (!s) return null;
  const n = parseFloat(s);
  if (isNaN(n) || n <= 0) return null;
  return Math.round(n * 100);
}

// 字段 → 候选表头关键词（越具体越靠前）
const FIELD_KEYWORDS: Record<string, string[]> = {
  title: ["商品标题", "标题", "商品名", "品名", "名称", "货号", "商品", "name", "title"],
  wholesale_price: ["批发价", "拿货价", "代理价", "供货价", "批发", "拿货", "成本", "wholesale", "cost"],
  price: ["零售价", "吊牌价", "售价", "销售价", "卖价", "单价", "价格", "零售", "price", "retail"],
  sizes: ["尺码", "规格", "码数", "大小", "尺", "sizes", "size"],
  color: ["颜色", "色", "colour", "color"],
  category: ["分类", "品类", "类目", "类别", "category", "cat"],
  images: ["图片链接", "主图", "商品图", "图链接", "图片", "图", "image", "img", "pic", "photo"],
  stock: ["库存数", "库存", "数量", "存货", "stock", "qty"],
  material: ["材质", "面料", "成分", "material", "fabric"],
  brand: ["品牌名", "品牌", "brand"],
};

const FIELD_ORDER = ["wholesale_price", "price", "title", "sizes", "color", "category", "images", "stock", "material", "brand"];

function buildColumnMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const used = new Set<number>();
  const norm = (h: string) => String(h || "").trim().toLowerCase();
  for (const field of FIELD_ORDER) {
    const kws = FIELD_KEYWORDS[field];
    for (const kw of kws) {
      const idx = headers.findIndex((h, i) => !used.has(i) && norm(h).includes(kw.toLowerCase()));
      if (idx !== -1) {
        map[field] = idx;
        used.add(idx);
        break;
      }
    }
  }
  return map;
}

function splitImages(v: any): string[] {
  if (!v) return [];
  return String(v)
    .split(/[;,，；\s]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//.test(s));
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "未收到文件" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(buf, { type: "buffer" });
    } catch {
      return NextResponse.json({ error: "文件解析失败，请确认是 xlsx/xls/csv" }, { status: 400 });
    }
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (!rows.length) return NextResponse.json({ error: "表格为空" }, { status: 400 });

    const headers = Object.keys(rows[0]);
    const colMap = buildColumnMap(headers);

    if (colMap.title == null) {
      return NextResponse.json({ error: "未识别到「标题/名称」列，请检查表头" }, { status: 400 });
    }

    const results: any[] = [];
    let ok = 0, skip = 0, err = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const get = (f: string) => (colMap[f] != null ? r[headers[colMap[f]]] : "");
      const title = String(get("title") || "").trim();
      if (!title) { results.push({ row: i + 2, status: "skipped", message: "缺标题" }); skip++; continue; }

      const price = toCents(get("price"));
      const wholesale = toCents(get("wholesale_price"));
      const images = splitImages(get("images"));
      const sizes = String(get("sizes") || "").trim();
      const color = String(get("color") || "").trim();
      const category = String(get("category") || "待分类").trim() || "待分类";
      const material = String(get("material") || "").trim();
      const stockRaw = toCents(get("stock"));
      const stock = stockRaw != null ? Math.round(stockRaw / 100) : 0;

      const payload: any = {
        title: title.slice(0, 120),
        category,
        price: price || 0,
        wholesale_price: wholesale ?? null,
        original_price: price || 0,
        cover_image: images[0] || null,
        images: images.length ? images : [],
        sizes,
        color,
        material,
        stock,
        is_published: true,
        tags: [],
      };
      if (material) payload.tags = [material];

      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error) {
        results.push({ row: i + 2, status: "error", title, message: error.message });
        err++;
      } else {
        results.push({ row: i + 2, status: "success", title, productId: data?.id, price: price ? (price / 100).toFixed(2) : "0", wholesale: wholesale ? (wholesale / 100).toFixed(2) : "-" });
        ok++;
      }
    }

    return NextResponse.json({ success: true, total: rows.length, success: ok, skipped: skip, error: err, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "服务器错误" }, { status: 500 });
  }
}
