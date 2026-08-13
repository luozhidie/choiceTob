// 商品分类层级（市场→风情→风格→品类→明细）公共读接口
// 配置存于 Storage 桶 app-config/category-tree.json，失败回退默认种子

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_CATEGORY_TREE, sanitize } from "@/lib/category-tree";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "app-config";
const FILE_PATH = "category-tree.json";

export async function GET(req: NextRequest) {
  const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
  if (error || !data) {
    return NextResponse.json({ success: true, data: DEFAULT_CATEGORY_TREE });
  }
  try {
    const text = await data.text();
    const parsed = JSON.parse(text);
    return NextResponse.json({ success: true, data: sanitize(parsed) });
  } catch {
    return NextResponse.json({ success: true, data: DEFAULT_CATEGORY_TREE });
  }
}
