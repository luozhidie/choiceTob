"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, ChevronRight, ShoppingBag, Clock, Star, Diamond, Crown, Gem, Check, Info } from "lucide-react";

/* ============ 买手爆款样衣套餐 ============ */
const buyerPackages = [
  {
    season: "春夏",
    name: "买手爆款样衣·春夏套餐",
    price: 39000,
    count: 50,
    unitPrice: 780,
    period: "不超过12个月",
    features: [
      "买手总监亲自对接风格品类需求",
      "3天内可看版选样衣",
      "国内外加广杭两地市场流行趋势",
      "每周定期提供最新爆款选择",
      "前两季销售数据分析",
      "相当于拥有50人以上的专业买手团队淘爆款",
      "多·快·好·省",
    ],
    tag: "春夏特惠",
  },
  {
    season: "秋冬",
    name: "买手爆款样衣·秋冬套餐",
    price: 69000,
    count: 50,
    unitPrice: 1380,
    period: "不超过12个月",
    features: [
      "买手总监亲自对接风格品类需求",
      "3天内可看版选样衣",
      "国内外加广杭两地市场流行趋势",
      "每周定期提供最新爆款选择",
      "前两季销售数据分析",
      "相当于拥有50人以上的专业买手团队淘爆款",
      "多·快·好·省",
    ],
    tag: "秋冬特惠",
  },
];

/* ============ 样衣租赁套餐 ============ */
const rentalPackages = [
  {
    name: "体验套餐",
    price: 54800,
    count: 220,
    period: "12个月",
    periodMonths: 12,
    icon: Star,
    highlight: false,
  },
  {
    name: "黄金套餐",
    price: 88000,
    count: 400,
    period: "24个月",
    periodMonths: 24,
    icon: Diamond,
    highlight: false,
  },
  {
    name: "钻石套餐",
    price: 168000,
    count: 840,
    period: "36个月",
    periodMonths: 36,
    icon: Gem,
    highlight: true,
  },
  {
    name: "至尊套餐",
    price: 388000,
    count: 2580,
    period: "48个月",
    periodMonths: 48,
    icon: Crown,
    highlight: false,
  },
];

/* ============ 主页面 ============ */
export default function HotPicksPage() {
  const [activeTab, setActiveTab] = useState<"buyer" | "rental">("buyer");

  return (
    <div className="min-h-screen bg-white">
      {/* ====== Breadcrumb ====== */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> 首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">爆款样衣</span>
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
              <ShoppingBag className="w-4 h-4" />
              专业爆款样衣
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              爆款样衣
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              大数据选款 + 专业买手团队，为您提供市场最新爆款样衣
            </p>
          </div>
        </div>
      </section>

      {/* ====== Tab切换 ====== */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 justify-center">
            <button
              onClick={() => setActiveTab("buyer")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "buyer"
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              买手爆款样衣
            </button>
            <button
              onClick={() => setActiveTab("rental")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "rental"
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              样衣租赁
            </button>
          </div>
        </div>
      </section>

      {/* ====== 买手爆款样衣 ====== */}
      {activeTab === "buyer" && (
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                Buyer Sample
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                买手爆款样衣套餐
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                50人+专业买手团队，为您淘遍全网爆款
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {buyerPackages.map((pkg, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-2xl border-2 p-8 transition-shadow hover:shadow-lg ${
                    pkg.season === "春夏"
                      ? "border-green-200 bg-green-50/30"
                      : "border-orange-200 bg-orange-50/30"
                  }`}
                >
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full ${
                    pkg.season === "春夏" ? "bg-green-500" : "bg-orange-500"
                  }`}>
                    {pkg.tag}
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-primary mb-2">{pkg.name}</h3>
                    <div className="text-4xl font-bold text-accent mb-1">
                      ¥{pkg.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pkg.count}款 · 平均¥{pkg.unitPrice}/款 · {pkg.period}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button className="w-full py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 transition-colors">
                    立即咨询
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== 样衣租赁 ====== */}
      {activeTab === "rental" && (
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                Sample Rental
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                样衣租赁套餐
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                海量爆款样衣库，随时挑选最新款，保持展厅不低于1000款样衣在线
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {rentalPackages.map((pkg, idx) => {
                const Icon = pkg.icon;
                return (
                  <div
                    key={idx}
                    className={`relative rounded-2xl border-2 p-6 transition-shadow hover:shadow-lg ${
                      pkg.highlight
                        ? "border-accent bg-white shadow-md"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {pkg.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                        推荐
                      </div>
                    )}

                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 ${
                        pkg.highlight ? "bg-accent/10" : "bg-gray-100"
                      }`}>
                        <Icon className={`w-6 h-6 ${pkg.highlight ? "text-accent" : "text-gray-500"}`} />
                      </div>
                      <h3 className="font-bold text-primary text-lg mb-2">{pkg.name}</h3>
                      <div className={`text-3xl font-bold mb-1 ${pkg.highlight ? "text-accent" : "text-primary"}`}>
                        ¥{pkg.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 mb-6">
                        {pkg.count}款 · 有效期{pkg.period}
                      </div>
                    </div>

                    <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      pkg.highlight
                        ? "bg-accent text-white hover:bg-accent/90"
                        : "bg-gray-100 text-primary hover:bg-gray-200"
                    }`}>
                      立即咨询
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 样衣来源说明 */}
            <div className="mt-12 bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-primary">样衣来源</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
                <div>
                  <div className="font-semibold text-primary mb-2">1. 设计款样衣</div>
                  <p>根据时尚资讯、最新资源、自主研发的新品样衣</p>
                </div>
                <div>
                  <div className="font-semibold text-primary mb-2">2. 数据样衣</div>
                  <p>智能科技大数据分析 + 人为筛选的全网爆款、潜在爆款、爆款微调款</p>
                </div>
                <div>
                  <div className="font-semibold text-primary mb-2">3. 线下批发市场爆款样衣</div>
                  <p>通过国内外知名买手全球采购，实时收集批发市场、买手店、小众品牌、轻奢品牌的爆款、设计师款和原创款</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====== CTA ====== */}
      <section className="py-12 md:py-16 bg-primary text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            需要爆款样衣服务？
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            联系我们的买手团队，为您挑选最适合的爆款样衣
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
