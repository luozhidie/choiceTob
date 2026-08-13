"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Shirt, PenTool, Gem, Scissors,
  ChevronDown, ChevronUp, Check, X, Info,
} from "lucide-react";
import Link from "next/link";

/* ============ 品类价格表 ============ */
const categoryPrices = [
  { category: "T恤/卫衣/毛衣", unit: "件", basePrice: 550, withPattern: 650, withSample: 750 },
  { category: "衬衫/针织衫", unit: "件", basePrice: 550, withPattern: 650, withSample: 800 },
  { category: "连衣裙/半裙/裤装", unit: "件", basePrice: 550, withPattern: 700, withSample: 850 },
  { category: "外套/风衣/大衣", unit: "件", basePrice: 650, withPattern: 800, withSample: 1000 },
  { category: "羽绒服/棉服", unit: "件", basePrice: 880, withPattern: 680, withSample: 800 },
  { category: "礼服/高定", unit: "件", basePrice: 880, withPattern: 1500, withSample: 2000 },
];

/* ============ L1-L5 套餐 ============ */
const serviceTiers = [
  {
    level: "L1",
    name: "原创设计图稿",
    desc: "纯设计图，适合有板房/工厂配合打板的客户",
    price: "¥550-880/件",
    features: [
      "原创设计图稿（含款式图+工艺说明+面料建议）",
      "1轮修改",
      "源文件交付",
    ],
    highlight: false,
  },
  {
    level: "L2",
    name: "设计图稿 + 纸样",
    desc: "适合有板房或工厂的客户",
    price: "¥650-1500/件",
    features: [
      "L1全部内容",
      "工业纸样（含放码）",
      "纸样审核",
    ],
    highlight: false,
  },
  {
    level: "L3",
    name: "设计图稿 + 纸样 + 成品样衣",
    desc: "适合没有供应链配合的客户",
    price: "¥750-2000/件",
    features: [
      "L2全部内容",
      "白胚样衣制作",
      "成品样衣制作",
      "样衣瑕疵修复",
    ],
    highlight: true,
  },
  {
    level: "L4",
    name: "原创样衣设计 + FOB生产供货",
    desc: "适合没有供应链的电商/外省客户",
    price: "面议",
    features: [
      "L3全部内容",
      "FOB生产供货",
      "大货跟单",
      "质检服务",
    ],
    highlight: false,
  },
  {
    level: "L5",
    name: "产品顾问（外聘设计总监）",
    desc: "适合自有设计团队但能力弱的客户",
    price: "面议",
    features: [
      "L4全部内容",
      "外聘设计总监1v1服务",
      "季度商品企划",
      "设计团队培训",
    ],
    highlight: false,
  },
];

/* ============ 主页面 ============ */
export default function DesignerPage() {
  const [activeTab, setActiveTab] = useState<"pricing" | "tiers">("pricing");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <Layers className="w-4 h-4" />
              原创设计师平台
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              专业设计团队
              <br />
              按需定制
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              从设计图稿到成品样衣，从单款设计到季度企划，专业设计师团队为您提供一站式服务
            </p>
          </div>
        </div>
      </section>

      {/* ====== Tab切换 ====== */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("pricing")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "pricing"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              按品类定价
            </button>
            <button
              onClick={() => setActiveTab("tiers")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "tiers"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              套餐服务 L1-L5
            </button>
          </div>
        </div>
      </section>

      {/* ====== 按品类定价 ====== */}
      {activeTab === "pricing" && (
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                Category Pricing
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                按品类定价
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                根据服装品类复杂度定价，支持灵活选择服务内容
              </p>
            </div>

            {/* 移动端：卡片列表 */}
            <div className="block md:hidden space-y-4">
              {categoryPrices.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-primary">{item.category}</div>
                      <div className="text-xs text-gray-400 mt-1">单位：{item.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">¥{item.basePrice}</div>
                      <div className="text-xs text-gray-400">起/件</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-gray-500">仅设计稿</div>
                      <div className="font-semibold text-primary mt-1">¥{item.basePrice}</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-blue-600">+纸样</div>
                      <div className="font-semibold text-blue-600 mt-1">¥{item.withPattern}</div>
                    </div>
                    <div className="text-center p-2 bg-accent/10 rounded">
                      <div className="text-accent">+样衣</div>
                      <div className="font-semibold text-accent mt-1">¥{item.withSample}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 桌面端：表格 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">品类</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">单位</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">仅设计稿</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">+纸样</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">+样衣</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryPrices.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-4 font-medium text-primary">{item.category}</td>
                      <td className="px-4 py-4 text-center text-gray-600">{item.unit}</td>
                      <td className="px-4 py-4 text-center font-semibold text-primary">¥{item.basePrice}</td>
                      <td className="px-4 py-4 text-center font-semibold text-blue-600">¥{item.withPattern}</td>
                      <td className="px-4 py-4 text-center font-semibold text-accent">¥{item.withSample}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 text-center text-sm text-gray-400">
              <Info className="w-4 h-4 inline mr-1" />
              价格仅供参考，具体以设计师报价为准。大货订单可享设计费减免。
            </div>
          </div>
        </section>
      )}

      {/* ====== 套餐服务 L1-L5 ====== */}
      {activeTab === "tiers" && (
        <section className="py-12 md:py-16 bg-gray-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                Service Tiers
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                套餐服务 L1-L5
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                从纯设计稿到产品顾问，覆盖不同客户的不同需求阶段
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {serviceTiers.map((tier) => (
                <div
                  key={tier.level}
                  className={`relative rounded-2xl border-2 p-6 transition-shadow hover:shadow-lg ${
                    tier.highlight
                      ? "border-accent bg-white shadow-md"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                      推荐
                    </div>
                  )}
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      tier.highlight ? "text-accent" : "text-primary"
                    }`}>
                      {tier.level}
                    </div>
                    <div className="font-semibold text-primary mb-1">{tier.name}</div>
                    <div className="text-sm text-gray-500 mb-4">{tier.desc}</div>
                    <div className={`text-2xl font-bold mb-6 ${
                      tier.highlight ? "text-accent" : "text-primary"
                    }`}>
                      {tier.price}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/contact"
                    className={`block w-full py-2.5 rounded-xl text-sm font-semibold transition-colors text-center ${
                      tier.highlight
                        ? "bg-accent text-white hover:bg-accent/90"
                        : "bg-gray-100 text-primary hover:bg-gray-200"
                    }`}
                  >
                    咨询详情
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== CTA ====== */}
      <section className="py-12 md:py-16 bg-primary text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            需要定制化设计服务？
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            联系我们的设计顾问，为您量身定制最适合的设计方案
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/contact" className="px-8 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors">
              立即咨询
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              联系我们
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
