"use client";
import { useState } from "react";
import { PaywallModal } from "@/components/PaywallModal";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Star,
  ShoppingCart,
  Repeat,
  ThumbsUp,
  Package,
  Clock,
  BadgeCheck,
  Flame,
  Home,
  Store,
  Sparkles,
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
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */
const hotProducts = [
  {
    id: 1,
    name: "法式优雅真丝衬衫",
    style: "优雅型",
    price: 328,
    originalPrice: 458,
    stock: "充足",
    tag: "热卖",
    color: "米白/雾霾蓝",
  },
  {
    id: 2,
    name: "少女感泡泡袖连衣裙",
    style: "少女型",
    price: 268,
    originalPrice: 398,
    stock: "紧张",
    tag: "爆款",
    color: "樱花粉/薄荷绿",
  },
  {
    id: 3,
    name: "高腰阔腿西装裤",
    style: "少年型",
    price: 258,
    originalPrice: 358,
    stock: "充足",
    tag: "新品",
    color: "黑色/卡其",
  },
  {
    id: 4,
    name: "浪漫荷叶边半裙",
    style: "浪漫型",
    price: 298,
    originalPrice: 428,
    stock: "充足",
    tag: "热卖",
    color: "酒红/藏蓝",
  },
  {
    id: 5,
    name: "不规则设计感上衣",
    style: "时尚型",
    price: 358,
    originalPrice: 498,
    stock: "紧张",
    tag: "限量",
    color: "黑白撞色",
  },
  {
    id: 6,
    name: "经典双排扣风衣",
    style: "古典型",
    price: 598,
    originalPrice: 828,
    stock: "充足",
    tag: "经典",
    color: "卡其/藏蓝",
  },
  {
    id: 7,
    name: "棉麻宽松直筒裤",
    style: "自然型",
    price: 198,
    originalPrice: 288,
    stock: "充足",
    tag: "热卖",
    color: "杏色/军绿",
  },
  {
    id: 8,
    name: "夸张廓形拼接外套",
    style: "戏剧型",
    price: 698,
    originalPrice: 998,
    stock: "少量",
    tag: "限量",
    color: "红黑拼接",
  },
];

const dashboardStats = [
  { icon: ShoppingCart, label: "动销率", value: "92.3%", trend: "+5.2%" },
  { icon: ThumbsUp, label: "好评率", value: "98.6%", trend: "+1.8%" },
  { icon: Repeat, label: "复购率", value: "45.2%", trend: "+8.7%" },
  { icon: TrendingUp, label: "同比增速", value: "67.8%", trend: "+12.3%" },
];

const newArrivals = [
  { name: "秋冬羊绒大衣系列", date: "8月中旬上市", styles: "优雅型/古典型" },
  { name: "国潮联名胶囊系列", date: "9月初上市", styles: "时尚型/戏剧型" },
  { name: "轻户外机能系列", date: "9月中旬上市", styles: "自然型/少年型" },
];

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

      {/* ====== Hot Products Grid ====== */}
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
              本季爆款推荐
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              严选当季热销单品，覆盖八大风格体系，每一款都经过市场验证
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {hotProducts.map((product, i) => (
              <motion.div key={product.id} variants={fadeUp} custom={i}>
                <div className="group flex flex-col h-full rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 overflow-hidden">
                  {/* Image placeholder */}
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                    {/* Tag */}
                    <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${
                      product.tag === "爆款" ? "bg-red-500" :
                      product.tag === "热卖" ? "bg-orange-500" :
                      product.tag === "限量" ? "bg-primary" :
                      product.tag === "新品" ? "bg-emerald-500" :
                      "bg-accent"
                    }`}>
                      {product.tag}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="font-semibold text-primary group-hover:text-accent transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {product.style}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{product.color}</div>
                    <div className="mt-auto pt-4 flex items-end justify-between">
                      <div>
                        <span className="text-xl font-bold text-accent">&yen;{product.price}</span>
                        <span className="ml-2 text-xs text-muted-foreground line-through">&yen;{product.originalPrice}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs ${
                        product.stock === "充足" ? "text-emerald-600" :
                        product.stock === "紧张" ? "text-orange-500" :
                        "text-red-500"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          product.stock === "充足" ? "bg-emerald-500" :
                          product.stock === "紧张" ? "bg-orange-500" :
                          "bg-red-500"
                        }`} />
                        {product.stock}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Data Dashboard ====== */}
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
            {dashboardStats.map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i}>
                <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Additional dashboard metrics */}
          <motion.div
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {[
              { label: "平均发货时效", value: "48h", icon: Clock, desc: "从下单到发货" },
              { label: "品质合格率", value: "99.2%", icon: BadgeCheck, desc: "入库质检通过率" },
              { label: "供应商响应率", value: "96.5%", icon: Store, desc: "24h内响应占比" },
            ].map((item, i) => (
              <motion.div key={item.label} variants={fadeUp} custom={i}>
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{item.value}</div>
                    <div className="text-xs text-muted-foreground">{item.label} · {item.desc}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== New Arrivals ====== */}
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
              新品预告
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              新品预告区
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              提前锁定下一季趋势，抢先布局新品赛道
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {newArrivals.map((item, i) => (
              <motion.div key={item.name} variants={fadeUp} custom={i}>
                <div className="group flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary mb-6">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">
                    {item.name}
                  </h3>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      {item.date}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    适配风格：{item.styles}
                  </p>
                  <div className="mt-auto pt-4">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:gap-2 transition-all">
                      预约提醒 <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
              <a href="/admin/login" className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                登录管理后台
              </a>
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
                    我们正在寻找优质供应商合作伙伴。加入骆芷蝶智选供应商体系，触达5000+品牌买手，
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
                    { label: "入驻品牌数", value: "5000+" },
                    { label: "月均订单量", value: "10万+" },
                    { label: "平均结算周期", value: "7天" },
                    { label: "供应商满意度", value: "98.5%" },
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
