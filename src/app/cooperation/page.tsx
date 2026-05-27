"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, ChevronRight, Check, ArrowRight, MessageCircle } from "lucide-react";

/* ============ L1-L5 合作模式 ============ */
const cooperationModes = [
  {
    level: "L1",
    name: "原创设计图稿",
    price: "¥550-880/件",
    desc: "纯设计图，适合有板房/工厂配合打板的客户",
    features: [
      "原创设计图稿（含款式图+工艺说明+面料建议）",
      "1轮修改",
      "源文件交付",
    ],
    suitable: "有自设板房或有工厂配合打板、车板的客户，比较节省成本",
    color: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-500",
  },
  {
    level: "L2",
    name: "设计图稿 + 纸样",
    price: "¥650-1500/件",
    desc: "适合有板房或工厂的客户",
    features: [
      "L1全部内容",
      "工业纸样（含放码）",
      "纸样审核",
    ],
    suitable: "适合只有车板师的或有工厂配合车板车板的客户，比较节省成本",
    color: "bg-green-50 border-green-200",
    badgeColor: "bg-green-500",
  },
  {
    level: "L3",
    name: "设计图稿 + 纸样 + 成品样衣",
    price: "¥750-2000/件",
    desc: "适合没有供应链配合的客户",
    features: [
      "L2全部内容",
      "白胚样衣制作",
      "成品样衣制作",
      "样衣瑕疵修复",
    ],
    suitable: "适合没有供应链协助打板车板的客户，直接看到样衣比较直观",
    color: "bg-orange-50 border-orange-200",
    badgeColor: "bg-orange-500",
  },
  {
    level: "L4",
    name: "原创样衣设计 + FOB生产供货",
    price: "面议",
    desc: "适合没有供应链的电商/外省客户",
    features: [
      "L3全部内容",
      "FOB生产供货",
      "大货跟单",
      "质检服务",
    ],
    suitable: "适合没有供应链协助的、如电商、外省供应链缺乏的客户，对生产速度和品质有要求的客户",
    color: "bg-purple-50 border-purple-200",
    badgeColor: "bg-purple-500",
  },
  {
    level: "L5",
    name: "产品顾问（外聘设计总监）",
    price: "面议",
    desc: "适合自有设计团队但能力弱的客户",
    features: [
      "L4全部内容",
      "外聘设计总监1v1服务",
      "季度商品企划",
      "设计团队培训",
    ],
    suitable: "适合自有设计团队，但研发能力比较弱、部门配合度不够默契、管理不好、浪费严重的客户",
    color: "bg-red-50 border-red-200",
    badgeColor: "bg-red-500",
  },
];

/* ============ 合作流程 ============ */
const flowSteps = [
  { title: "客户需求", desc: "明确风格定位、品类需求、预算范围" },
  { title: "清晰沟通", desc: "一对一沟通，确认设计方向和服务内容" },
  { title: "签约合作", desc: "签订合同，明确交付标准和时间节点" },
  { title: "确认无忧", desc: "支付定金，正式启动设计项目" },
  { title: "研发方案", desc: "设计师团队制定详细设计方案" },
  { title: "定向设计", desc: "根据方案进行原创设计开发" },
  { title: "满意交付", desc: "客户确认，交付最终设计成果" },
  { title: "客户选款", desc: "从设计方案中挑选满意款式" },
];

/* ============ 主页面 ============ */
export default function CooperationPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ====== Breadcrumb ====== */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> 首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">合作模式</span>
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
              <MessageCircle className="w-4 h-4" />
              专业合作模式
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              合作模式
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              从纯设计图稿到全案服务，5种合作模式满足不同阶段客户需求
            </p>
          </div>
        </div>
      </section>

      {/* ====== L1-L5 合作模式 ====== */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Service Tiers
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              五大合作模式
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              根据您的供应链能力和需求阶段，选择最适合的合作方式
            </p>
          </div>

          <div className="space-y-6">
            {cooperationModes.map((mode, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border-2 p-6 md:p-8 ${mode.color} transition-shadow hover:shadow-lg`}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* 左侧：等级+价格 */}
                  <div className="md:w-48 flex-shrink-0">
                    <div className={`inline-block ${mode.badgeColor} text-white text-sm font-bold px-3 py-1 rounded-full mb-3`}>
                      {mode.level}
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-2">{mode.name}</h3>
                    <div className="text-2xl font-bold text-accent mb-2">{mode.price}</div>
                    <div className="text-sm text-gray-500">{mode.desc}</div>
                  </div>

                  {/* 中间：服务内容 */}
                  <div className="flex-1">
                    <div className="font-semibold text-primary mb-3">服务内容</div>
                    <ul className="space-y-2">
                      {mode.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 右侧：适合客户 */}
                  <div className="md:w-64 flex-shrink-0">
                    <div className="font-semibold text-primary mb-3">适合客户</div>
                    <div className="text-sm text-gray-600 bg-white/60 rounded-xl p-4">
                      {mode.suitable}
                    </div>
                    <button className="w-full mt-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                      立即咨询
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 合作流程 ====== */}
      <section className="py-12 md:py-16 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Cooperation Process
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              合作流程
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              简单、高效、专业、省心的设计服务合作流程
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {flowSteps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white border border-gray-200 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 mx-auto rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-lg mb-3">
                    {idx + 1}
                  </div>
                  <h4 className="font-semibold text-primary mb-1">{step.title}</h4>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
                {idx < flowSteps.length - 1 && idx % 4 !== 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-12 md:py-16 bg-primary text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            不知道选哪种合作模式？
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            联系我们的顾问，根据您的实际情况推荐最适合的合作方案
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/contact"
              className="px-8 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
            >
              免费咨询
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
