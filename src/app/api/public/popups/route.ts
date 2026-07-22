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

// 注意：返回结构仅含 success + data（data 为数组，无启用弹窗时为空数组）

let cache: ReturnType<typeof sanitize> | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 30_000;

async function getConfig(): Promise<ReturnType<typeof sanitize>> {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL_MS) return cache;
  let result: ReturnType<typeof sanitize> = sanitize(DEFAULT_POPUPS);
  const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
  if (!error && data) {
    try {
      const parsed = JSON.parse(await data.text());
      const sanitized = sanitize(parsed);
      if (sanitized.length > 0) result = sanitized;
    } catch {
      /* 解析失败则回退默认 */
    }
  }
  // 种子化：当 Storage 中没有任何有效弹窗配置时，写入默认（含启用示例），保证首次可见
  if (result === sanitize(DEFAULT_POPUPS)) {
    try {
      await supabase.storage
        .from(BUCKET)
        .upload(
          FILE_PATH,
          new Blob([JSON.stringify(DEFAULT_POPUPS, null, 2)], {
            type: "application/json",
          }),
          { upsert: true, contentType: "application/json" }
        );
    } catch {
      /* 写入失败不影响返回 */
    }
  }
  cache = result;
  cacheAt = now;
  return result;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = (searchParams.get("page") || "buyer") as PopupPage;
  const list = await getConfig();
  const filtered = filterByPage(list, page);
  return NextResponse.json({
    success: true,
    data: Array.isArray(filtered) ? filtered : [],
  });
}
