import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

/** 公开接口：获取首页行业标签（小程序首页分类 tab 使用） */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("home_categories")
      .select("id, label, icon, link, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      // 表不存在时返回默认数据
      if (error.code === "42P01") {
        return NextResponse.json([
          { id: "1", label: "全部", sort_order: 0 },
          { id: "2", label: "穿搭", sort_order: 1 },
          { id: "3", label: "护肤", sort_order: 2 },
          { id: "4", label: "彩妆", sort_order: 3 },
          { id: "5", label: "养生", sort_order: 4 },
          { id: "6", label: "食品", sort_order: 5 },
          { id: "7", label: "家居", sort_order: 6 },
          { id: "8", label: "文创", sort_order: 7 },
          { id: "9", label: "艺术", sort_order: 8 },
        ]);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
