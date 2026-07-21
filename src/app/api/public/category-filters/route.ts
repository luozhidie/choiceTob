// ============================================================
// 公开接口：读取某品类的筛选项配置
// GET /api/public/category-filters?category=休闲裤
// 数据来自 app-config 桶 category-filters.json
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

let cache: Config | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 30_000;

async function getConfig(): Promise<Config> {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL_MS) return cache;

  const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
  if (error || !data) {
    cacheAt = now;
    cache = DEFAULT_CATEGORY_CONFIG;
    return cache;
  }
  try {
    const text = await data.text();
    const parsed = JSON.parse(text);
    cacheAt = now;
    cache = sanitize(parsed);
    return cache;
  } catch {
    cacheAt = now;
    cache = DEFAULT_CATEGORY_CONFIG;
    return cache;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const config = await getConfig();
  const cfg = config[category] || config["休闲裤"] || DEFAULT_CATEGORY_CONFIG["休闲裤"];
  return NextResponse.json({ success: true, data: cfg });
}
