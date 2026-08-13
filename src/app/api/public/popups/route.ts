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
  let storageValid = false;
  const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
  if (!error && data) {
    try {
      const parsed = JSON.parse(await data.text());
      const sanitized = sanitize(parsed);
      if (sanitized.length > 0) {
        result = sanitized;
        storageValid = true;
      }
    } catch {
      /* 解析失败则回退默认 */
    }
  }
  // 补齐缺失的默认示例弹窗（按 id）；不删除用户已有配置
  // 规则：Storage 为空/无效 → 写全量；Storage 含示例但缺几个 → 补齐；用户已主动删光示例 → 尊重意图不补
  const demoIds = new Set(DEFAULT_POPUPS.map((p) => p.id));
  const hasDemo = result.some((p) => demoIds.has(p.id));
  const have = new Set(result.map((p) => p.id));
  const missing = DEFAULT_POPUPS.filter((p) => !have.has(p.id));
  let needWrite = false;
  if (!storageValid) needWrite = true;
  else if (hasDemo && missing.length > 0) {
    result = [...result, ...missing];
    needWrite = true;
  }
  if (needWrite) {
    try {
      await supabase.storage
        .from(BUCKET)
        .upload(
          FILE_PATH,
          new Blob([JSON.stringify(result, null, 2)], {
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
