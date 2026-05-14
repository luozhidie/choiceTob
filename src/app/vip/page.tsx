"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  Crown,
  Award,
  Gem,
  ShoppingBag,
  Sparkles,
  Palette,
  CalendarDays,
  RefreshCw,
  Shirt,
  UserCheck,
  Star,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Home,
  Users,
  AlertTriangle,
  HeartHandshake,
  Gift,
  UserPlus,
  Clock,
  BarChart3,
  Bell,
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
    textColor: "text-gray-600",
    benefits: ["购物折扣95折", "新品优先选购", "季度搭配推荐", "生日专属礼遇"],
  },
  {
    icon: Crown,
    name: "V2 金卡会员",
    range: "年消费3-5万",
    color: "from-yellow-400 to-yellow-600",
    textColor: "text-yellow-700",
    benefits: ["购物折扣9折", "新品试穿优先", "专属搭配服务", "季度企划参与", "30天无忧包换", "衣橱整理服务"],
  },
  {
    icon: Gem,
    name: "V3 黑卡会员",
    range: "年消费5万+",
    color: "from-gray-800 to-gray-950",
    textColor: "text-gray-900",
    benefits: ["购物折扣85折", "新品首发试穿", "一对一搭配顾问", "季度企划定制", "60天无忧包换", "衣橱深度整理", "场合着装方案", "专属顾问1对1"],
  },
];

const rightsComparison = [
  { right: "购物折扣", v1: "95折", v2: "9折", v3: "85折" },
  { right: "新品试穿", v1: "—", v2: "优先", v3: "首发" },
  { right: "搭配服务", v1: "季度推荐", v2: "专属搭配", v3: "1对1顾问" },
  { right: "季度企划", v1: "—", v2: "参与", v3: "定制" },
  { right: "无忧包换", v1: "7天", v2: "30天", v3: "60天" },
  { right: "衣橱整理", v1: "—", v2: "基础", v3: "深度" },
  { right: "场合着装", v1: "—", v2: "—", v3: "完整方案" },
  { right: "专属顾问", v1: "—", v2: "群组", v3: "1对1" },
  { right: "生日礼遇", v1: "优惠券", v2: "专属礼品", v3: "限量定制礼" },
  { right: "活动参与", v1: "普通", v2: "优先", v3: "VVIP专属" },
];

const annualTiers = [
  {
    amount: "5万",
    returnRate: "退换5%",
    discount: "2.8折",
    extra: "季度搭配方案+优先选品",
  },
  {
    amount: "10万",
    returnRate: "退换10%",
    discount: "2.8折",
    extra: "年度衣橱整理+专属顾问",
  },
  {
    amount: "30万",
    returnRate: "退换20%",
    discount: "2.6折",
    extra: "全年度定制企划+买手陪跑",
  },
];

const operationRhythm = [
  {
    period: "年度",
    icon: CalendarDays,
    items: [
      "年初VIP等级评定与升级",
      "年度VIP答谢会策划执行",
      "年度消费数据复盘与权益优化",
      "新年礼盒与专属年历寄送",
    ],
  },
  {
    period: "月度",
    icon: Clock,
    items: [
      "月初：上月消费数据统计与积分结算",
      "月中：新品预览+VIP专场日",
      "月末：生日会员关怀+流失预警",
      "每月2次搭配内容推送",
    ],
  },
  {
    period: "每日",
    icon: Bell,
    items: [
      "早安问候+当日穿搭建议",
      "到店/线上咨询即时响应",
      "会员动态关注与互动",
      "消费记录与积分实时更新",
    ],
  },
];

const referralIncentives = [
  { role: "推荐人", reward: "获200元无门槛券+次月双倍积分", condition: "被推荐人首次消费满1000元" },
  { role: "被推荐人", reward: "首单9折+专属新人搭配服务", condition: "注册即享" },
  { role: "双重达标奖", reward: "双方各获500元服务抵扣券", condition: "被推荐人3个月内消费满5000元" },
];

const churnStrategies = [
  {
    level: "预警期",
    icon: AlertTriangle,
    color: "text-yellow-600 bg-yellow-50",
    trigger: "90天未消费",
    action: "专属顾问主动联系，了解原因，发送专属优惠",
  },
  {
    level: "流失期",
    icon: UserCheck,
    color: "text-orange-600 bg-orange-50",
    trigger: "180天未消费",
    action: "VIP总监亲自跟进，提供免费诊断+专属回归礼包",
  },
  {
    level: "挽回期",
    icon: HeartHandshake,
    color: "text-red-600 bg-red-50",
    trigger: "365天未消费",
    action: "线下拜访+定制方案+超值回归套餐，全力挽回",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function VipPage() {
  return (
    <>
      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
            <Link href="/" className="hover:text-white/80 transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" /> 首页
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white/90">VIP管理</span>
          </nav>

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
                  <div className="p-6 flex-1">
                    <ul className="space-y-3">
                      {tier.benefits.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 权益对比详表 ====== */}
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
              权益对比详表
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              一目了然的权益对比，让客户清楚每一级的差异与价值。
            </p>
          </motion.div>

          <motion.div
            className="overflow-x-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeUp}
          >
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-6 py-4 text-left font-semibold text-sm rounded-tl-xl">权益项目</th>
                  <th className="px-6 py-4 text-center font-semibold text-sm">
                    <span className="flex items-center justify-center gap-1"><Award className="w-4 h-4" /> V1银卡</span>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-sm">
                    <span className="flex items-center justify-center gap-1"><Crown className="w-4 h-4" /> V2金卡</span>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-sm rounded-tr-xl">
                    <span className="flex items-center justify-center gap-1"><Gem className="w-4 h-4" /> V3黑卡</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rightsComparison.map((row, i) => (
                  <tr
                    key={row.right}
                    className={`border-b border-gray-100 hover:bg-accent/5 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-muted/50"
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{row.right}</td>
                    <td className="px-6 py-4 text-center text-sm text-muted-foreground">{row.v1}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">{row.v2}</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-accent">{row.v3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ====== 年度VIP货款阶梯 ====== */}
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
              年度VIP货款阶梯
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
            {annualTiers.map((tier, i) => (
              <motion.div key={tier.amount} variants={fadeUp} custom={i}>
                <div className="relative flex flex-col h-full p-8 rounded-2xl bg-white border-2 border-gray-100 shadow-sm hover:border-accent/40 transition-all duration-300">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-accent text-white text-sm font-bold">
                      年消费{tier.amount}
                    </span>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
                      <RefreshCw className="w-5 h-5 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">退换货额度</p>
                        <p className="font-bold text-primary">{tier.returnRate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
                      <ShoppingBag className="w-5 h-5 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">专属折扣</p>
                        <p className="font-bold text-primary">{tier.discount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
                      <Star className="w-5 h-5 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">额外权益</p>
                        <p className="font-bold text-primary text-sm">{tier.extra}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 text-primary">
                      <rhythm.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">{rhythm.period}清单</h3>
                  </div>
                  <ul className="space-y-3 flex-1">
                    {rhythm.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 转介绍激励方案 ====== */}
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
              转介绍激励方案
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              以老带新，双向激励。让每一位VIP客户都成为品牌传播者。
            </p>
          </motion.div>

          <motion.div
            className="overflow-x-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeUp}
          >
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-6 py-4 text-left font-semibold text-sm rounded-tl-xl">角色</th>
                  <th className="px-6 py-4 text-left font-semibold text-sm">奖励内容</th>
                  <th className="px-6 py-4 text-left font-semibold text-sm rounded-tr-xl">触发条件</th>
                </tr>
              </thead>
              <tbody>
                {referralIncentives.map((row, i) => (
                  <tr
                    key={row.role}
                    className={`border-b border-gray-100 hover:bg-accent/5 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-muted/50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 font-semibold text-primary">
                        <Gift className="w-4 h-4 text-accent" />
                        {row.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{row.reward}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{row.condition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ====== 流失预警与挽回 ====== */}
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
              流失预警与挽回
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
                  <div className="mb-4">
                    <span className="text-sm text-muted-foreground">触发条件：</span>
                    <span className="font-medium text-gray-900 ml-1">{strategy.trigger}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">{strategy.action}</p>
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
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-bold text-primary">完整数据与深度分析</h3>
              <p className="mt-2 text-sm text-muted-foreground">详细商业数据、供应链信息与专业分析报告，仅对授权用户开放</p>
              <a href="/admin/login" className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                登录管理后台
              </a>
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
