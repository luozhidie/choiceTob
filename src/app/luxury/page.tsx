"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Gem, Scissors, Shirt, Heart } from "lucide-react";

const BRAND_DATA = [
  {
    key: "chanel",
    name_cn: "香奈儿",
    name_en: "Chanel",
    year: 1910,
    country: "法国",
    profile: "以简约优雅、斜纹软呢、珍珠元素著称，现代女性时尚的奠基者。",
    color: "from-black to-gray-800",
    icon: "👜",
    elements: ["斜纹软呢", "双色鞋", "珍珠项链", "山茶花", "CC扣"],
  },
  {
    key: "dior",
    name_cn: "迪奥",
    name_en: "Dior",
    year: 1946,
    country: "法国",
    profile: "新风貌（New Look）开创者，优雅奢华的代名词。",
    color: "from-gray-900 to-blue-900",
    icon: "💎",
    elements: ["Bar Jacket", "Lady Dior", "Oblique 老花", "CD扣", "藤格纹"],
  },
  {
    key: "ysl",
    name_cn: "圣罗兰",
    name_en: "Saint Laurent",
    year: 1961,
    country: "法国",
    profile: "颠覆传统，倡导女性西装与中性风，摇滚优雅并存。",
    color: "from-black to-red-900",
    icon: "👠",
    elements: ["Le Smoking", "Sac de Jour", "YSL金扣", "漆皮红唇", "中性风"],
  },
  {
    key: "loewe",
    name_cn: "罗意威",
    name_en: "Loewe",
    year: 1846,
    country: "西班牙",
    profile: "百年皮具世家，Jonathan Anderson 注入艺术先锋感。",
    color: "from-amber-900 to-yellow-800",
    icon: "👜",
    elements: ["Puzzle 拼图包", "Flamenco 软包", "Anagram 扣", "皮革编织", "解构主义"],
  },
  {
    key: "valentino",
    name_cn: "华伦天奴",
    name_en: "Valentino",
    year: 1960,
    country: "意大利",
    profile: "以 Valentino Red 正红和仙女裙著称，意大利奢华的旗帜。",
    color: "from-red-900 to-rose-900",
    icon: "👗",
    elements: ["Valentino Red", "Rockstud 铆钉", "VLogo", "高定仙女裙", "正红礼服"],
  },
];

export default function LuxuryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <span className="text-primary font-medium">奢品参考库</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary via-primary/90 to-accent/80 text-white py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm mb-4">
            <Gem className="w-4 h-4" /> 国际一线奢品品牌参考库
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">探索经典，洞察趋势</h1>
          <p className="text-white/80 max-w-xl mx-auto">
            收录香奈儿、迪奥、圣罗兰、罗意威、华伦天奴等国际一线奢品的经典款式、
            品牌设计元素、历年走秀数据，为您的商品开发提供高端参考。
          </p>
        </div>
      </section>

      {/* 品牌网格 */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-primary mb-8 text-center">
            选择品牌，查看经典参考
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {BRAND_DATA.map((brand, idx) => (
              <motion.div
                key={brand.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link href={`/luxury/${brand.key}`}>
                  <div className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group`}>
                    {/* 顶部色块 */}
                    <div className={`bg-gradient-to-br ${brand.color} h-32 flex items-center justify-center`}>
                      <span className="text-6xl">{brand.icon}</span>
                    </div>
                    {/* 信息区 */}
                    <div className="p-5 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-primary">{brand.name_cn}</h3>
                        <span className="text-xs text-gray-400">{brand.name_en}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{brand.profile}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {brand.elements.slice(0, 3).map((el) => (
                          <span key={el} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {el}
                          </span>
                        ))}
                        {brand.elements.length > 3 && (
                          <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                            +{brand.elements.length - 3}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{brand.country} · {brand.year}年创立</span>
                        <span className="flex items-center gap-1 text-accent font-medium">
                          查看详情 <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 使用说明 */}
      <section className="pb-12 md:pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-primary mb-4">💡 如何使用奢品参考库</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">1</div>
                <div>
                  <p className="font-medium text-primary">选择品牌</p>
                  <p className="text-xs text-gray-500 mt-1">点击上方品牌卡片，进入品牌详情页</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">2</div>
                <div>
                  <p className="font-medium text-primary">查看经典元素</p>
                  <p className="text-xs text-gray-500 mt-1">了解该品牌的设计语言和标志性元素</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">3</div>
                <div>
                  <p className="font-medium text-primary">参考开发方向</p>
                  <p className="text-xs text-gray-500 mt-1">结合爆款预测，确定您的商品开发方向</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
