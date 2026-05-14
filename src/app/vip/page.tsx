"use client";
import { useState } from "react";
import { PaywallModal } from "@/components/PaywallModal";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  Crown,
  Award,
  Gem,
  CalendarDays,
  Clock,
  Bell,
  AlertTriangle,
  UserCheck,
  HeartHandshake,
  Home,
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
const vipTiers = [
  {
    icon: Award,
    name: "V1 银卡会员",
    range: "年消费1-3万",
    color: "from-gray-300 to-gray-500",
  },
  {
    icon: Crown,
    name: "V2 金卡会员",
    range: "年消费3-5万",
    color: "from-yellow-400 to-yellow-600",
  },
  {
    icon: Gem,
    name: "V3 黑卡会员",
    range: "年消费5万+",
    color: "from-gray-800 to-gray-950",
  },
];

const operationRhythm = [
  {
    period: "年度",
    icon: CalendarDays,
    summary: "等级评定、答谢会、数据复盘与权益优化",
  },
  {
    period: "月度",
    icon: Clock,
    summary: "数据统计、VIP专场、生日关怀与内容推送",
  },
  {
    period: "每日",
    icon: Bell,
    summary: "穿搭建议、即时响应、会员互动与积分更新",
  },
];

const churnStrategies = [
  {
    level: "预警期",
    icon: AlertTriangle,
    color: "text-yellow-600 bg-yellow-50",
    summary: "主动关怀，了解客户动态与需求",
  },
  {
    level: "流失期",
    icon: UserCheck,
    color: "text-orange-600 bg-orange-50",
    summary: "深度跟进，提供专属回归支持",
  },
  {
    level: "挽回期",
    icon: HeartHandshake,
    color: "text-red-600 bg-red-50",
    summary: "全力挽回，定制化解决方案",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function VipPage() {
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
      <nav className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary/80 transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" /> 首页
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-primary font-medium">VIP管理</span>
          </div>
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
              <Crown className="w-4 h-4" />
              尊享权益，精细运营
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            VIP会员<span className="text-accent">管理体系</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-white/80 leading-relaxed max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            客户分层精细运营，三级VIP权益体系，从日常关怀到专属服务，深度挖掘高价值客户终身价值。
          </motion.p>
        </div>
      </section>

      {/* ====== VIP三级体系 ====== */}
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
              VIP Tiers
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              VIP三级体系
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              消费越多，权益越尊享。三级体系层层递进，激励客户持续升级。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {vipTiers.map((tier, i) => (
              <motion.div key={tier.name} variants={fadeUp} custom={i}>
                <div className="group flex flex-col h-full rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className={`bg-gradient-to-r ${tier.color} p-6 text-white`}>
                    <div className="flex items-center gap-3">
                      <tier.icon className="w-8 h-8" />
                      <div>
                        <h3 className="text-xl font-bold">{tier.name}</h3>
                        <p className="text-white/80 text-sm">{tier.range}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                    <p className="text-muted-foreground text-sm">解锁更多尊享权益</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 权益对比案例展示 ====== */}
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
              Benefits Comparison
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              权益对比案例展示
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              各等级VIP权益对比一目了然，点击查看详细权益方案。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {[
              { style: "银卡权益案例", label: "入门尊享·基础折扣", color: "from-gray-100 to-gray-50" },
              { style: "金卡权益案例", label: "进阶尊享·专属服务", color: "from-yellow-100 to-yellow-50" },
              { style: "黑卡权益案例", label: "顶级尊享·一对一顾问", color: "from-slate-200 to-slate-100" },
            ].map((item, i) => (
              <motion.div
                key={item.style}
                variants={fadeUp}
                custom={i}
                className="group cursor-pointer"
                onClick={() => setShowPaywall(true)}
              >
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-40">&#x1F451;</div>
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

          <div className="text-center mt-10">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              查看完整权益方案
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== 年度阶梯案例展示 ====== */}
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
              Annual Tiers
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              年度VIP货款阶梯案例
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              消费越高，回报越丰厚。阶梯式激励机制，驱动客户持续向上。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {[
              { style: "5万阶梯案例", label: "基础激励·季度搭配方案", color: "from-blue-50 to-blue-25" },
              { style: "10万阶梯案例", label: "进阶激励·专属顾问服务", color: "from-indigo-50 to-indigo-25" },
              { style: "30万阶梯案例", label: "顶级激励·买手陪跑计划", color: "from-purple-50 to-purple-25" },
            ].map((item, i) => (
              <motion.div
                key={item.style}
                variants={fadeUp}
                custom={i}
                className="group cursor-pointer"
                onClick={() => setShowPaywall(true)}
              >
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-40">&#x1F4C8;</div>
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

          <div className="text-center mt-10">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              查看完整阶梯方案
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== VIP运营节奏 ====== */}
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
              Operation Rhythm
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              VIP运营节奏
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              年度、月度、每日三级运营清单，确保VIP服务不缺位、关怀不断线。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {operationRhythm.map((rhythm, i) => (
              <motion.div key={rhythm.period} variants={fadeUp} custom={i}>
                <div className="flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 text-primary">
                      <rhythm.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">{rhythm.period}清单</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{rhythm.summary}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 转介绍激励案例 ====== */}
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
              Referral Program
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              转介绍激励案例
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              以老带新，双向激励。让每一位VIP客户都成为品牌传播者。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {[
              { style: "推荐人激励案例", label: "推荐有礼·专属奖励", color: "from-green-50 to-green-25" },
              { style: "被推荐人案例", label: "新人专享·首单优惠", color: "from-teal-50 to-teal-25" },
              { style: "双重达标案例", label: "双向激励·共赢回馈", color: "from-emerald-50 to-emerald-25" },
            ].map((item, i) => (
              <motion.div
                key={item.style}
                variants={fadeUp}
                custom={i}
                className="group cursor-pointer"
                onClick={() => setShowPaywall(true)}
              >
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-40">&#x1F381;</div>
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

          <div className="text-center mt-10">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              查看完整激励方案
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== 流失预警概述 ====== */}
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
              Churn Prevention
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              流失预警概述
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              三级预警机制，从预警到挽回，不放弃每一位VIP客户。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {churnStrategies.map((strategy, i) => (
              <motion.div key={strategy.level} variants={fadeUp} custom={i}>
                <div className="flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${strategy.color} text-sm font-bold w-fit mb-4`}>
                    <strategy.icon className="w-4 h-4" />
                    {strategy.level}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{strategy.summary}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Login Prompt ====== */}
      <section className="py-20 lg:py-28 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl text-center">
            <div className="max-w-xl mx-auto px-6">
              <div className="text-3xl mb-3">&#x1F512;</div>
              <h3 className="text-lg font-bold text-primary">完整数据与深度分析</h3>
              <p className="mt-2 text-sm text-muted-foreground">详细商业数据、供应链信息与专业分析报告，仅对授权用户开放</p>
              <button
                onClick={() => setShowPaywall(true)}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                解锁完整内容
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-20 lg:py-28 bg-white">
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
              <h2 className="text-3xl sm:text-4xl font-bold">升级VIP会员</h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                从银卡到黑卡，每一级都是身份的象征，更是价值的跃升。立即升级，开启尊享之旅。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  升级VIP会员
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/education"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  学习运营课程
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
