"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  ArrowRight,
  LayoutGrid,
  Eye,
  Shirt,
  Palette,
  Ruler,
  Lightbulb,
  CheckCircle2,
  Home,
  Sparkles,
  Layers,
  Grid3X3,
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
const styleZones = [
  { name: "少女型", zone: "A1", desc: "甜美俏皮风格区，马卡龙色调陈列", color: "bg-pink-200" },
  { name: "优雅型", zone: "A2", desc: "精致柔美风格区，莫兰迪色系为主", color: "bg-purple-200" },
  { name: "浪漫型", zone: "B1", desc: "华丽性感风格区，酒红金色调", color: "bg-rose-200" },
  { name: "少年型", zone: "B2", desc: "利落中性风格区，黑白灰极简", color: "bg-slate-200" },
  { name: "时尚型", zone: "C1", desc: "个性前卫风格区，撞色潮流陈列", color: "bg-orange-200" },
  { name: "古典型", zone: "C2", desc: "端庄高贵风格区，深色高级感", color: "bg-indigo-200" },
  { name: "自然型", zone: "D1", desc: "随性质朴风格区，大地色棉麻", color: "bg-amber-200" },
  { name: "戏剧型", zone: "D2", desc: "夸张夺目风格区，亮色大廓形", color: "bg-red-200" },
];

const outfitPlans = [
  {
    scene: "职场通勤",
    items: [
      { name: "优雅型真丝衬衫", price: 328 },
      { name: "高腰西装阔腿裤", price: 258 },
      { name: "古典型珍珠项链", price: 168 },
      { name: "简约手提包", price: 198 },
    ],
    total: 952,
    tag: "优雅型",
  },
  {
    scene: "周末约会",
    items: [
      { name: "浪漫型荷叶边连衣裙", price: 358 },
      { name: "少女型蝴蝶结高跟鞋", price: 268 },
      { name: "精致链条包", price: 228 },
      { name: "珍珠耳饰", price: 88 },
    ],
    total: 942,
    tag: "浪漫型",
  },
  {
    scene: "休闲出行",
    items: [
      { name: "自然型棉麻衬衫", price: 228 },
      { name: "宽松直筒裤", price: 198 },
      { name: "帆布托特包", price: 158 },
      { name: "编织平底鞋", price: 168 },
    ],
    total: 752,
    tag: "自然型",
  },
  {
    scene: "晚宴社交",
    items: [
      { name: "戏剧型亮片上衣", price: 498 },
      { name: "丝绒半裙", price: 358 },
      { name: "夸张耳饰", price: 128 },
      { name: "晚宴手拿包", price: 258 },
    ],
    total: 1242,
    tag: "戏剧型",
  },
];

const optimizeSteps = [
  {
    step: 1,
    title: "数据采集",
    desc: "收集门店面积、客流动线、商品结构等基础数据",
    icon: Ruler,
  },
  {
    step: 2,
    title: "风格分区",
    desc: "根据八大风格体系，规划门店陈列分区与动线走向",
    icon: LayoutGrid,
  },
  {
    step: 3,
    title: "搭配方案",
    desc: "按风格分区设计搭配方案，提升连带率与客单价",
    icon: Shirt,
  },
  {
    step: 4,
    title: "视觉陈列",
    desc: "运用色彩、灯光、道具打造视觉焦点与场景化陈列",
    icon: Palette,
  },
  {
    step: 5,
    title: "数据复盘",
    desc: "追踪陈列效果数据，持续优化陈列方案与搭配策略",
    icon: Eye,
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function DisplayPage() {
  return (
    <>
      {/* Breadcrumb */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">陈列搭配</span>
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
              <LayoutGrid className="w-4 h-4" />
              智能陈列，提升连带
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              陈列搭配
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              基于八大风格体系的陈列分区与搭配方案，让每一寸空间都产生价值，
              提升门店视觉体验与连带销售率。
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== Display System ====== */}
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
              陈列体系
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              八大风格分区陈列
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              按风格基因分区陈列，让顾客一目了然找到心仪风格，提升购物效率与体验
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {styleZones.map((zone, i) => (
              <motion.div key={zone.name} variants={fadeUp} custom={i}>
                <div className="group flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className={`w-14 h-14 rounded-2xl ${zone.color} flex items-center justify-center mb-4`}>
                    <span className="text-lg font-bold text-primary/60">{zone.zone}</span>
                  </div>
                  <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">
                    {zone.name}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{zone.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Store Layout ====== */}
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
              空间规划
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              50㎡门店布局示意
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              科学规划门店功能分区，让每一寸空间都高效产出
            </p>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
              {/* Store layout - CSS grid representation */}
              <div className="relative bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300">
                <h3 className="text-center text-sm font-semibold text-muted-foreground mb-4">50㎡ 门店平面布局图</h3>

                {/* Layout grid */}
                <div className="grid grid-cols-6 grid-rows-5 gap-2 aspect-[6/5]">
                  {/* Row 1: Window display */}
                  <div className="col-span-6 bg-primary/10 border-2 border-primary/30 rounded-lg flex items-center justify-center p-2">
                    <span className="text-xs sm:text-sm font-semibold text-primary text-center">橱窗展示区</span>
                  </div>

                  {/* Row 2-3: Left style zone A */}
                  <div className="col-span-2 row-span-2 bg-pink-100 border border-pink-300 rounded-lg flex flex-col items-center justify-center p-2">
                    <Layers className="w-5 h-5 text-pink-500 mb-1" />
                    <span className="text-xs font-semibold text-pink-700 text-center">A区 少女/优雅</span>
                  </div>

                  {/* Row 2-3: Center feature */}
                  <div className="col-span-2 row-span-1 bg-accent/10 border border-accent/30 rounded-lg flex flex-col items-center justify-center p-2">
                    <Sparkles className="w-5 h-5 text-accent mb-1" />
                    <span className="text-xs font-semibold text-primary text-center">主题展示台</span>
                  </div>

                  {/* Row 2-3: Right style zone B */}
                  <div className="col-span-2 row-span-2 bg-rose-100 border border-rose-300 rounded-lg flex flex-col items-center justify-center p-2">
                    <Layers className="w-5 h-5 text-rose-500 mb-1" />
                    <span className="text-xs font-semibold text-rose-700 text-center">B区 浪漫/少年</span>
                  </div>

                  {/* Row 3 center: fitting */}
                  <div className="col-span-2 bg-purple-100 border border-purple-300 rounded-lg flex flex-col items-center justify-center p-2">
                    <Grid3X3 className="w-5 h-5 text-purple-500 mb-1" />
                    <span className="text-xs font-semibold text-purple-700 text-center">试衣间</span>
                  </div>

                  {/* Row 4: Style zone C & D */}
                  <div className="col-span-3 bg-orange-100 border border-orange-300 rounded-lg flex flex-col items-center justify-center p-2">
                    <Layers className="w-5 h-5 text-orange-500 mb-1" />
                    <span className="text-xs font-semibold text-orange-700 text-center">C区 时尚/古典</span>
                  </div>
                  <div className="col-span-3 bg-amber-100 border border-amber-300 rounded-lg flex flex-col items-center justify-center p-2">
                    <Layers className="w-5 h-5 text-amber-500 mb-1" />
                    <span className="text-xs font-semibold text-amber-700 text-center">D区 自然/戏剧</span>
                  </div>

                  {/* Row 5: Checkout & accessories */}
                  <div className="col-span-2 bg-gray-200 border border-gray-300 rounded-lg flex flex-col items-center justify-center p-2">
                    <span className="text-xs font-semibold text-gray-600 text-center">收银区</span>
                  </div>
                  <div className="col-span-2 bg-accent/10 border border-accent/30 rounded-lg flex flex-col items-center justify-center p-2">
                    <span className="text-xs font-semibold text-primary text-center">配饰区</span>
                  </div>
                  <div className="col-span-2 bg-emerald-100 border border-emerald-300 rounded-lg flex flex-col items-center justify-center p-2">
                    <span className="text-xs font-semibold text-emerald-700 text-center">VIP区</span>
                  </div>
                </div>

                {/* Entry indicator */}
                <div className="mt-3 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="w-4 h-4" />
                    <span>入口</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "陈列区 65%", color: "bg-pink-100 border-pink-300" },
                  { label: "试衣区 10%", color: "bg-purple-100 border-purple-300" },
                  { label: "收银/配饰 15%", color: "bg-accent/10 border-accent/30" },
                  { label: "VIP区 10%", color: "bg-emerald-100 border-emerald-300" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`w-4 h-4 rounded border ${item.color}`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== Outfit Plans ====== */}
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
              搭配方案
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              场景化搭配方案
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从场景出发的搭配推荐，让顾客一键购齐整套造型，提升连带率
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {outfitPlans.map((plan, i) => (
              <motion.div key={plan.scene} variants={fadeUp} custom={i}>
                <div className="flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                        <Shirt className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-primary">{plan.scene}</h3>
                        <span className="text-xs text-muted-foreground">{plan.tag}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {plan.tag}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3">
                    {plan.items.map((item) => (
                      <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                        <span className="text-sm font-medium text-primary">&yen;{item.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">整套搭配</span>
                    <span className="text-2xl font-bold text-accent">&yen;{plan.total}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 5-Step Optimization ====== */}
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
              优化方法
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              陈列优化五步法
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              系统化的陈列优化方法论，从数据到执行形成完整闭环
            </p>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {optimizeSteps.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <div className="group flex items-start gap-6 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">
                      {item.step}
                    </div>
                    {i < optimizeSteps.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200" />
                    )}
                  </div>
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Benefits ====== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
            >
              <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                陈列成效
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                科学陈列，数据说话
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                专业的陈列方案不仅提升视觉体验，更直接推动销售增长。数据是最好的证明。
              </p>
              <ul className="mt-8 flex flex-col gap-4">
                {[
                  "连带率提升35%，顾客从买1件到买3件",
                  "客均停留时间延长40%，深度浏览提升转化",
                  "滞销款周转提升50%，库存结构持续优化",
                  "新客进店转化率提升25%，首单金额显著增长",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
            >
              {[
                { num: "35%", sub: "连带率提升" },
                { num: "40%", sub: "停留时间延长" },
                { num: "50%", sub: "滞销款周转提升" },
                { num: "25%", sub: "新客转化率提升" },
              ].map((item, i) => (
                <motion.div
                  key={item.sub}
                  className="flex flex-col items-center justify-center p-8 rounded-2xl bg-muted"
                  variants={fadeUp}
                  custom={i}
                >
                  <span className="text-3xl font-bold text-accent">{item.num}</span>
                  <span className="mt-2 text-sm text-muted-foreground text-center">
                    {item.sub}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-16 lg:py-24 bg-muted">
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
                预约陈列诊断
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                专业陈列顾问团队上门诊断，针对您的门店定制陈列优化方案。限时预约免费诊断，让数据驱动陈列升级。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  预约陈列诊断
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
          </motion.div>
        </div>
      </section>
    </>
  );
}
