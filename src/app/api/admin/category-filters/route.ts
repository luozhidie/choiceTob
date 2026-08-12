// ============================================================
// 小程序分类筛选项配置：/api/admin/category-filters
// 配置以 JSON 文件存于 Storage 桶 app-config/category-filters.json
// GET 读取 / PUT 更新（仅管理员，admin_logged_in cookie）
// 零迁移方案：复用 app-config 桶
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_CATEGORY_CONFIG, sanitize, type Config } from "@/lib/category-filters";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "app-config";
const FILE_PATH = "category-filters.json";

async function ensureBucket() {
  await supabase.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: ["application/json", "text/plain"],
    fileSizeLimit: 1024 * 1024,
  });
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

  const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
  if (error || !data) {
    return NextResponse.json({ success: true, data: DEFAULT_CATEGORY_CONFIG });
  }
  try {
    const text = await data.text();
    const parsed = JSON.parse(text);
    return NextResponse.json({ success: true, data: sanitize(parsed) });
  } catch {
    return NextResponse.json({ success: true, data: DEFAULT_CATEGORY_CONFIG });
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
