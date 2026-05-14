"use client";
import { useState } from "react";
import { PaywallModal } from "@/components/PaywallModal";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  Handshake,
  Stethoscope,
  PenTool,
  ShoppingCart,
  RefreshCw,
  HeartHandshake,
  Video,
  Package,
  Crown,
  ArrowRight,
  Home,
  Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const salesSteps = [
  {
    icon: Handshake,
    title: "建立信任",
    desc: "通过专业形象展示与真实案例背书，快速建立客户信任感。",
  },
  {
    icon: Stethoscope,
    title: "诊断需求",
    desc: "深入分析客户现状，精准定位问题与机会。",
  },
  {
    icon: PenTool,
    title: "方案设计",
    desc: "根据诊断结果，定制可落地可衡量的综合解决方案。",
  },
  {
    icon: ShoppingCart,
    title: "体验成交",
    desc: "提供体验方案降低决策门槛，通过实际效果推动合作。",
  },
  {
    icon: RefreshCw,
    title: "持续跟进",
    desc: "建立跟进节奏，持续关注效果并及时调整优化。",
  },
  {
    icon: HeartHandshake,
    title: "长期服务",
    desc: "从单次交易升级为长期伙伴，实现客户终身价值最大化。",
  },
];

const funnelItems = [
  {
    icon: Video,
    title: "直播引流",
    desc: "专业搭配直播+行业干货分享",
    tier: "免费",
    color: "from-blue-400 to-blue-600",
    width: "100%",
  },
  {
    icon: Stethoscope,
    title: "在线诊断",
    desc: "专业买手诊断店铺问题",
    tier: "体验级 · 起步价",
    color: "from-primary to-primary/80",
    width: "80%",
  },
  {
    icon: Package,
    title: "店铺服务包",
    desc: "全链路店铺运营解决方案",
    tier: "专业级 · 投资级",
    color: "from-accent to-accent/80",
    width: "60%",
  },
  {
    icon: Crown,
    title: "年度VIP",
    desc: "专属顾问+全年度运营陪伴",
    tier: "尊享级 · 定制级",
    color: "from-yellow-600 to-yellow-800",
    width: "40%",
  },
];

const diagnosisDimensions = [
  { title: "商品结构", desc: "品类与价格带分析" },
  { title: "客户画像", desc: "核心客群与消费偏好" },
  { title: "陈列效果", desc: "视觉呈现与连带率" },
  { title: "营销节奏", desc: "促销策略与渠道覆盖" },
  { title: "库存健康", desc: "周转与补货效率" },
  { title: "竞品对比", desc: "差异化定位建议" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SalesPage() {
  const [showPaywall, setShowPaywall] = useState(false);

  return (
    <>
      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="完整数据与深度分析"
        description="登录后购买会员或单次付费即可查看完整内容"
        type="single"
      />

      {/* ====== Breadcrumb ====== */}
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> 首页
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary">销售服务</span>
        </div>
      </nav>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-6">
              <Users className="w-4 h-4" />
              顾问式销售，价值驱动成交
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            销售服务<span className="text-accent">体系</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-white/80 leading-relaxed max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            以顾问式销售方法论为核心，从建立信任到长期服务全流程赋能，让每一次客户接触都成为价值传递的契机。
          </motion.p>
        </div>
      </section>

      {/* ====== 顾问式销售六步法 ====== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Consultative Sales
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              顾问式销售六步法
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              以客户需求为中心，以专业价值为驱动，六步闭环打造高转化销售体系。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {salesSteps.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <div className="group relative flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="absolute top-6 right-6 text-5xl font-bold text-gray-100 group-hover:text-accent/10 transition-colors">
                    0{i + 1}
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-primary">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 产品体系 - 漏斗展示 ====== */}
      <section className="py-20 lg:py-28 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Product Funnel
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              产品体系展示
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              四层漏斗式产品体系，从免费引流到深度服务，层层递进，层层转化。
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {funnelItems.map((item, i) => (
              <motion.div
                key={item.title}
                className="mx-auto"
                style={{ width: item.width }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                custom={i}
              >
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${item.color} text-white p-6 sm:p-8`}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 shrink-0">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="mt-1 text-white/80 text-sm">{item.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold">{item.tier}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 在线诊断概述 ====== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Online Diagnosis
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              店铺在线诊断
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              专业买手连麦诊断，快速定位店铺核心问题，出具可执行的改善建议。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {diagnosisDimensions.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <div className="p-5 rounded-xl bg-muted border border-gray-100 hover:border-accent/30 transition-colors">
                  <h4 className="font-bold text-primary text-sm">{item.title}</h4>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 服务包案例展示 ====== */}
      <section className="py-20 lg:py-28 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Service Package
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              店铺诊断服务包
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从诊断到落地的完整解决方案，季度陪伴式运营赋能。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {[
              { style: "诊断报告案例", label: "6大维度全面分析", color: "from-blue-100 to-blue-50" },
              { style: "选品方案案例", label: "数据驱动精准选品", color: "from-green-100 to-green-50" },
              { style: "运营陪跑案例", label: "持续优化与落地支持", color: "from-purple-100 to-purple-50" },
            ].map((item, i) => (
              <motion.div
                key={item.style}
                variants={fadeUp}
                custom={i}
                className="group cursor-pointer"
                onClick={() => setShowPaywall(true)}
              >
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-40">📋</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold text-primary">{item.style}</h4>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              查看完整服务方案 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== 销售话术案例展示 ====== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              Sales Scripts
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              销售话术库
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              四大高频场景实战话术，从异议处理到价值传递，每一句都经过实战验证。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {[
              { style: "价格异议处理", label: "价值重构策略", color: "from-yellow-100 to-yellow-50" },
              { style: "犹豫不决应对", label: "降低门槛策略", color: "from-blue-100 to-blue-50" },
              { style: "连带推荐技巧", label: "提升客单价策略", color: "from-green-100 to-green-50" },
              { style: "服务包推荐", label: "系统思维策略", color: "from-purple-100 to-purple-50" },
            ].map((item, i) => (
              <motion.div
                key={item.style}
                variants={fadeUp}
                custom={i}
                className="group cursor-pointer"
                onClick={() => setShowPaywall(true)}
              >
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-40">💬</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold text-primary">{item.style}</h4>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              查看完整话术库 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== Login Prompt ====== */}
      <section className="py-20 lg:py-28 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl text-center">
            <div className="max-w-xl mx-auto px-6">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-bold text-primary">完整数据与深度分析</h3>
              <p className="mt-2 text-sm text-muted-foreground">详细商业数据、供应链信息与专业分析报告，仅对授权用户开放</p>
              <button
                onClick={() => setShowPaywall(true)}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                解锁完整内容
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-20 lg:py-28 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 sm:px-12 lg:px-20 py-14 sm:py-20 text-center text-white"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold">
                预约在线诊断
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                专业买手连麦，6大维度精准诊断，3条可执行改善建议。让数据说话，让专业做主。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  预约在线诊断
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/vip"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  了解VIP服务
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
