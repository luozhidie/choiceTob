// ============================================================
// 小程序页面背景配置（颜色 + 图片）：/api/admin/page-background
// 配置以 JSON 文件存于 Storage 桶 site-assets / config/page-backgrounds.json
// GET 读取 / PUT 更新（仅管理员，admin_logged_in cookie）
// 零迁移方案：复用 site-assets 桶与 /api/admin/site-assets 上传接口
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "app-config";
const FILE_PATH = "page-backgrounds.json";

const PAGES = ["home", "buyer", "cart", "my"] as const;
type PageKey = (typeof PAGES)[number];
type PageBg = { color?: string | null; image?: string | null };
type Config = Record<PageKey, PageBg>;

function defaults(): Config {
  return { home: {}, buyer: {}, cart: {}, my: {} };
}

function sanitize(input: any): Config {
  const out: Config = defaults();
  if (input && typeof input === "object") {
    for (const p of PAGES) {
      const v = input[p];
      if (v && typeof v === "object") {
        out[p] = {
          color: typeof v.color === "string" ? v.color : null,
          image: typeof v.image === "string" ? v.image : null,
        };
      }
    }
  }
  return out;
}

// 确保配置桶存在（服务端建桶，无需 DDL；已存在则忽略报错）
async function ensureBucket() {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: ["application/json", "text/plain"],
    fileSizeLimit: 1024 * 1024,
  });
  // 桶已存在时 error 非空但可忽略
  return;
}

async function authAdmin(req: NextRequest) {
  const cookie = req.cookies.get("admin_logged_in")?.value;
  if (cookie !== "true") {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const denied = await authAdmin(req);
  if (denied) return denied;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(FILE_PATH);
  if (error || !data) {
    return NextResponse.json({ success: true, data: defaults() });
  }
  try {
    const text = await data.text();
    const parsed = JSON.parse(text);
    return NextResponse.json({ success: true, data: sanitize(parsed) });
  } catch {
    return NextResponse.json({ success: true, data: defaults() });
  }
}

export async function PUT(req: NextRequest) {
  const denied = await authAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const clean = sanitize(body);
    await ensureBucket();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(FILE_PATH, JSON.stringify(clean, null, 2), {
        contentType: "application/json",
        upsert: true,
      });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: clean });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
