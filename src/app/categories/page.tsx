"use client";

import Link from "next/link";
import {
  Shirt, Droplets, Palette, Heart, UtensilsCrossed,
  Home as HomeIcon, PenTool, Brush, ArrowRight,
} from "lucide-react";
import TabBar from "@/components/TabBar";

const categories = [
  { name: "穿搭", href: "/buyer", icon: Shirt, color: "from-pink-50 to-rose-50", iconColor: "text-pink-500", desc: "上装·下装·外套·连衣裙" },
  { name: "护肤", href: "/category/护肤", icon: Droplets, color: "from-blue-50 to-cyan-50", iconColor: "text-blue-500", desc: "洁面·精华·面霜·防晒" },
  { name: "彩妆", href: "/category/彩妆", icon: Palette, color: "from-purple-50 to-pink-50", iconColor: "text-purple-500", desc: "底妆·唇妆·眼妆·工具" },
  { name: "养生", href: "/category/养生", icon: Heart, color: "from-green-50 to-emerald-50", iconColor: "text-green-500", desc: "茶饮·滋补·保健" },
  { name: "食品", href: "/category/食品", icon: UtensilsCrossed, color: "from-amber-50 to-yellow-50", iconColor: "text-amber-500", desc: "零食·特产·饮品" },
  { name: "家居", href: "/category/家居", icon: HomeIcon, color: "from-indigo-50 to-blue-50", iconColor: "text-indigo-500", desc: "家纺·收纳·装饰" },
  { name: "文创", href: "/category/文创", icon: PenTool, color: "from-orange-50 to-amber-50", iconColor: "text-orange-500", desc: "文具·手作·礼品" },
  { name: "艺术", href: "/category/艺术", icon: Brush, color: "from-violet-50 to-purple-50", iconColor: "text-violet-500", desc: "画作·摆件·收藏" },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题 */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-xl font-bold text-gray-900">全部分类</h1>
          <p className="text-sm text-gray-500 mt-1">选择行业板块，发现更多好物</p>
        </div>
      </div>

      {/* 分类网格 */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                href={cat.href}
                className={`bg-gradient-to-br ${cat.color} rounded-2xl p-5 border border-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${cat.iconColor}`} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{cat.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <TabBar />
    </div>
  );
}
