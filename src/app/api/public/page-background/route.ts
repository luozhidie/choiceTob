// ============================================================
// 公开读取小程序页面背景配置：/api/public/page-background
// 小程序端调用，无需登录
// ============================================================

import { NextResponse } from "next/server";
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

export async function GET() {
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
