"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Home, ChevronRight, Info, Layers, Star, Diamond } from "lucide-react";

/* ============ 搭配稿春夏价格 ============ */
const springSummer = {
  collocation: [
    { name: "搭配稿尊享包", desc: "100套搭配", price: 30000, count: 100, unitPrice: 300, period: "不超过12个月" },
    { name: "搭配稿尊享特惠包", desc: "100套搭配+20款爆款样衣", price: 74600, count: 120, unitPrice: 622, period: "不超过12个月" },
    { name: "搭配稿至尊包", desc: "200个设计稿", price: 100000, count: 200, unitPrice: 500, period: "不超过24个月" },
    { name: "纸样体验包", desc: "68个设计稿+8款纸样", price: 66600, count: 68, unitPrice: 980, period: "不超过6个月" },
    { name: "纸样VIP包", desc: "100个设计稿+100款纸样", price: 93000, count: 100, unitPrice: 930, period: "不超过12个月" },
    { name: "胚样体验包", desc: "68款胚样", price: 93800, count: 68, unitPrice: 1380, period: "不超过6个月" },
    { name: "胚样钻石包", desc: "100个设计稿+100款纸样+100款胚样", price: 128000, count: 100, unitPrice: 1280, period: "不超过12个月" },
  ],
  sample: [
    { name: "样衣体验包", desc: "30款样衣", price: 78000, count: 30, unitPrice: 2600, period: "不超过3个月" },
    { name: "样衣黄金包", desc: "68款样衣", price: 170000, count: 68, unitPrice: 2500, period: "不超过6个月" },
    { name: "样衣钻石包", desc: "100款样衣", price: 238000, count: 100, unitPrice: 2380, period: "不超过12个月" },
  ],
};

/* ============ 搭配稿秋冬价格 ============ */
const autumnWinter = {
  collocation: [
    { name: "搭配稿尊享包", desc: "100套搭配", price: 35000, count: 100, unitPrice: 350, period: "不超过12个月" },
    { name: "搭配稿尊享特惠包", desc: "100套搭配+20款爆款样衣", price: 85000, count: 120, unitPrice: 708, period: "不超过12个月" },
    { name: "搭配稿至尊包", desc: "200个设计稿", price: 120000, count: 200, unitPrice: 600, period: "不超过24个月" },
    { name: "纸样体验包", desc: "68个设计稿+8款纸样", price: 75000, count: 68, unitPrice: 1103, period: "不超过6个月" },
    { name: "纸样VIP包", desc: "100个设计稿+100款纸样", price: 110000, count: 100, unitPrice: 1100, period: "不超过12个月" },
    { name: "胚样体验包", desc: "68款胚样", price: 105000, count: 68, unitPrice: 1544, period: "不超过6个月" },
    { name: "胚样钻石包", desc: "100个设计稿+100款纸样+100款胚样", price: 145000, count: 100, unitPrice: 1450, period: "不超过12个月" },
  ],
  sample: [
    { name: "样衣体验包", desc: "30款样衣", price: 88000, count: 30, unitPrice: 2933, period: "不超过3个月" },
    { name: "样衣黄金包", desc: "68款样衣", price: 195000, count: 68, unitPrice: 2868, period: "不超过6个月" },
    { name: "样衣钻石包", desc: "100款样衣", price: 275000, count: 100, unitPrice: 2750, period: "不超过12个月" },
  ],
};

/* ============ 主页面 ============ */
export default function CollocationPage() {
  const [activeSeason, setActiveSeason] = useState<"ss" | "aw">("ss");
  const data = activeSeason === "ss" ? springSummer : autumnWinter;

  return (
    <div className="min-h-screen bg-white">
      {/* ====== Breadcrumb ====== */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> 首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">搭配稿</span>
        </div>
      </nav>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <Layers className="w-4 h-4" />
              专业搭配服务
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              搭配稿设计
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              从搭配方案到样衣成品，为您的品牌打造完整的产品线
            </p>
          </div>
        </div>
      </section>

      {/* ====== 季节切换 ====== */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 justify-center">
            <button
              onClick={() => setActiveSeason("ss")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeSeason === "ss"
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              春夏款
            </button>
            <button
              onClick={() => setActiveSeason("aw")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeSeason === "aw"
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              秋冬款
            </button>
          </div>
        </div>
      </section>

      {/* ====== 搭配稿套餐 ====== */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Collocation Draft
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              搭配稿套餐
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              从搭配方案到设计稿、纸样、胚样，灵活选择服务内容
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.collocation.map((pkg, idx) => (
              <div key={idx} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-primary text-lg">{pkg.name}</h3>
                </div>
                <p className="text-gray-500 text-sm mb-6">{pkg.desc}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-accent">¥{pkg.price.toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-400 mb-6">
                  共{pkg.count}款 · 平均¥{pkg.unitPrice}/款 · {pkg.period}
                </div>
                <Link href="/contact" className="block w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors text-center">
                  立即咨询
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 样衣套餐 ====== */}
      <section className="py-12 md:py-16 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Sample Package
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              样衣套餐
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              从设计稿到成品样衣，一站式解决您的产品开发需求
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.sample.map((pkg, idx) => (
              <div key={idx} className="border-2 border-accent/20 rounded-2xl p-6 hover:shadow-lg transition-shadow bg-white relative">
                <div className="absolute -top-3 right-4 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                  样衣
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Diamond className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-primary text-lg">{pkg.name}</h3>
                </div>
                <p className="text-gray-500 text-sm mb-6">{pkg.desc}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-accent">¥{pkg.price.toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-400 mb-6">
                  共{pkg.count}款 · 平均¥{pkg.unitPrice}/款 · {pkg.period}
                </div>
                <Link href="/contact" className="block w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors text-center">
                  立即咨询
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 备注 ====== */}
      <section className="py-8 bg-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-primary">购买须知</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                客人如选用数量大于以上任意一款套餐，则超出适用套餐部分产品的价格按所适用套餐的平均单价计算
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                所有合同期限均为选款无期限，实际选款周期不超过标注时间
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                样衣套餐均为工艺、航管产品，具体工艺要求可咨询客服
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-12 md:py-16 bg-primary text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            需要定制搭配方案？
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            联系我们的设计顾问，为您量身定制最适合的搭配方案
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/contact"
              className="px-8 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
            >
              立即咨询
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
