import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 公开接口：获取首页行业标签（小程序首页分类 tab 使用） */
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("home_categories")
    .select("id, label, icon, link")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 数据库为空时返回默认列表
  if (!data || data.length === 0) {
    return NextResponse.json([
      { id: "default-0", label: "全部" },
      { id: "default-1", label: "穿搭" },
      { id: "default-2", label: "护肤" },
      { id: "default-3", label: "彩妆" },
      { id: "default-4", label: "养生" },
      { id: "default-5", label: "食品" },
      { id: "default-6", label: "家居" },
      { id: "default-7", label: "文创" },
      { id: "default-8", label: "艺术" },
    ]);
  }

  return NextResponse.json(data);
}
