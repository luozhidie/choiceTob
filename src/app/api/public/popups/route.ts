// ============================================================
// 公开接口：读取某页面的启用弹窗
// GET /api/public/popups?page=buyer|category|cart|my
// 数据来自 app-config 桶 popups.json
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_POPUPS,
  sanitize,
  filterByPage,
  type PopupPage,
} from "@/lib/popups";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "app-config";
const FILE_PATH = "popups.json";

let cache: ReturnType<typeof sanitize> | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 30_000;

async function getConfig(): Promise<ReturnType<typeof sanitize>> {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL_MS) return cache;
  const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
  if (error || !data) {
    cacheAt = now;
    cache = sanitize(DEFAULT_POPUPS);
    return cache;
  }
  try {
    const text = await data.text();
    const parsed = JSON.parse(text);
    cacheAt = now;
    cache = sanitize(parsed);
    return Array.isArray(cache) ? cache : sanitize(DEFAULT_POPUPS);
  } catch {
    cacheAt = now;
    cache = sanitize(DEFAULT_POPUPS);
    return cache;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = (searchParams.get("page") || "buyer") as PopupPage;
  const list = await getConfig();
  const filtered = filterByPage(list, page);
  return NextResponse.json({
    success: true,
    page,
    list_len: Array.isArray(list) ? list.length : "NOT_ARRAY",
    list_type: typeof list,
    filtered_len: Array.isArray(filtered) ? filtered.length : "NOT_ARRAY",
    data: Array.isArray(filtered) ? filtered : [],
  });
}
