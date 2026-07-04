import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** 公开接口：获取首页分类标签（小程序首页使用） */
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, code, label, sort_order")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 如果数据库为空，返回默认列表
  if (!data || data.length === 0) {
    const defaults = [
      { id: "default-0", code: "ALL", label: "全部", sort_order: 0 },
      { id: "default-1", code: "FASHION", label: "穿搭", sort_order: 1 },
      { id: "default-2", code: "SKINCARE", label: "护肤", sort_order: 2 },
      { id: "default-3", code: "MAKEUP", label: "彩妆", sort_order: 3 },
      { id: "default-4", code: "WELLNESS", label: "养生", sort_order: 4 },
      { id: "default-5", code: "FOOD", label: "食品", sort_order: 5 },
      { id: "default-6", code: "HOME", label: "家居", sort_order: 6 },
      { id: "default-7", code: "CREATIVE", label: "文创", sort_order: 7 },
      { id: "default-8", code: "ART", label: "艺术", sort_order: 8 },
    ];
    return NextResponse.json(defaults);
  }

  // 确保第一个是「全部」
  if (data.length > 0 && data[0].label !== "全部") {
    data.unshift({ id: "all-default", code: "ALL", label: "全部", sort_order: -1 });
  }

  return NextResponse.json(data);
}
