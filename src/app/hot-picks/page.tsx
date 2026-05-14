"use client";
import { useState } from "react";
import { PaywallModal } from "@/components/PaywallModal";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  ArrowRight,
  TrendingUp,
  ShoppingCart,
  Repeat,
  ThumbsUp,
  Home,
  Flame,
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
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function HotPicksPage() {
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
      {/* Breadcrumb */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">爆款货盘</span>
        </div>
      </nav>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <Flame className="w-4 h-4" />
              爆款直供，抢占先机
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              爆款货盘
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              实时追踪全网热销数据，精选当季爆款货源。从选品到上架一站式搞定，让您的店铺永远走在潮流前沿。
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== Hot Style Cases ====== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              本季推荐
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              爆款风格案例展示
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              严选当季热销风格，覆盖多元风格体系，每一款都经过市场验证
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
              { style: "法式优雅", label: "真丝衬衫 · 莫兰迪色", color: "from-teal-100 to-teal-50" },
              { style: "少女甜美", label: "泡泡袖 · 马卡龙色系", color: "from-pink-100 to-pink-50" },
              { style: "都市通勤", label: "西装裤 · 黑白灰", color: "from-slate-100 to-slate-50" },
              { style: "浪漫约会", label: "荷叶边 · 酒红色系", color: "from-rose-100 to-rose-50" },
            ].map((item, i) => (
              <motion.div
                key={item.style}
                variants={fadeUp}
                custom={i}
                className="group cursor-pointer"
                onClick={() => setShowPaywall(true)}
              >
                <div className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-40">👗</div>
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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              查看完整数据
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== Data Overview (Blurred) ====== */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              数据看板
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              爆品数据看板
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              实时监控核心运营指标，用数据验证每一个选品决策
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {[
              { icon: ShoppingCart, num: "行业领先", sub: "动销率" },
              { icon: ThumbsUp, num: "显著优于同行", sub: "好评率" },
              { icon: Repeat, num: "持续攀升", sub: "复购率" },
              { icon: TrendingUp, num: "高速增长", sub: "同比增速" },
            ].map((stat, i) => (
              <motion.div key={stat.sub} variants={fadeUp} custom={i}>
                <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.num}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{stat.sub}</div>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                    <TrendingUp className="w-3 h-3" />
                    持续向好
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              查看完整数据
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== New Trend Preview ====== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              新品趋势
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              新品趋势预览
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              提前锁定下一季趋势，抢先布局新品赛道
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
              { style: "秋冬质感", label: "羊绒大衣 · 大地色系", color: "from-amber-100 to-amber-50" },
              { style: "国潮联名", label: "胶囊系列 · 东方美学", color: "from-red-100 to-red-50" },
              { style: "轻户外风", label: "机能系列 · 中性色调", color: "from-emerald-100 to-emerald-50" },
            ].map((item, i) => (
              <motion.div
                key={item.style}
                variants={fadeUp}
                custom={i}
                className="group cursor-pointer"
                onClick={() => setShowPaywall(true)}
              >
                <div className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-40">🧥</div>
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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              查看完整数据
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== Login Prompt ====== */}
      <section className="py-16 lg:py-24 bg-white">
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
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====== Supplier CTA ====== */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 sm:px-12 lg:px-20 py-14 sm:py-20 text-white"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="relative">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold">
                    优质供应商入驻
                  </h2>
                  <p className="mt-4 text-white/80 leading-relaxed">
                    我们正在寻找优质供应商合作伙伴。加入骆芷蝶智选供应商体系，触达众多品牌买手，
                    共享平台流量与数据赋能，实现产销高效协同。
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                    >
                      申请入驻
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                    <Link
                      href="/buyer"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                    >
                      了解选品服务
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "入驻品牌数", value: "众多" },
                    { label: "月均订单量", value: "持续增长" },
                    { label: "平均结算周期", value: "高效周转" },
                    { label: "供应商满意度", value: "口碑优良" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <span className="text-white/70 text-sm">{item.label}</span>
                      <span className="text-xl font-bold text-accent">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
