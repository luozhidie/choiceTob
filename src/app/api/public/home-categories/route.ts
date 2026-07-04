import { NextResponse } from "next/server";

/** 公开接口：获取首页行业标签（小程序首页分类 tab 使用） */
export async function GET() {
  // 直接返回默认数据，不依赖数据库构建
  // 数据库建好后可以切换为从 home_categories 表读取
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
