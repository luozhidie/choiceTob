import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("daily_looks")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[public/daily-looks] 查询失败:", error.message);
      // 表可能不存在，返回空数组而非报错
      return NextResponse.json({ success: true, data: [] });
    }

    const looks = (data || []).map((d: any) => ({
      ...d,
      colors: Array.isArray(d.colors) ? d.colors : (typeof d.colors === "string" ? JSON.parse(d.colors || "[]") : []),
    }));

    return NextResponse.json({ success: true, data: looks });
  } catch (err: any) {
    console.error("[public/daily-looks] 错误:", err);
    return NextResponse.json({ success: true, data: [] });
  }
}
