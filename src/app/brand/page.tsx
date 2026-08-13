"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  Palette,
  Type,
  Crown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Eye,
  Layers,
} from "lucide-react";
import { COLOR_SEASONS_PRO, COLOR_SEASON_COLORS, FEMALE_STYLES, MALE_STYLES } from "@/lib/styles";

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
const brandColors = [
  { name: "深蓝主色", hex: "#1a365d", usage: "品牌主色调，用于标题、按钮、导航" },
  { name: "金色强调", hex: "#c9a84c", usage: "品牌强调色，用于CTA、高亮、点缀" },
  { name: "背景白", hex: "#ffffff", usage: "页面背景、卡片底色" },
  { name: "浅灰底", hex: "#f7f8fa", usage: "区块背景、辅助底色" },
  { name: "文字深色", hex: "#1a1a2e", usage: "正文文字、标题文字" },
  { name: "文字辅色", hex: "#64748b", usage: "辅助说明文字、次要信息" },
];

const colorSeasonSystem = ["春", "夏", "秋", "冬"].map(group => {
  const seasonNames: Record<string, string> = { 春: "春季型", 夏: "夏季型", 秋: "秋季型", 冬: "冬季型" };
  const seasonDescs: Record<string, string> = {
    春: "明亮、清新、温暖，如春日花园般的色彩",
    夏: "柔和、淡雅、清凉，如盛夏海滨般的色彩",
    秋: "浓郁、醇厚、温暖，如秋日森林般的色彩",
    冬: "鲜明、冷艳、强烈，如冬日雪原般的色彩",
  };
  return {
    season: seasonNames[group],
    desc: seasonDescs[group],
    types: COLOR_SEASONS_PRO.filter(c => c.group === group).map(c => ({
      name: c.marketLabel,
      color: COLOR_SEASON_COLORS[c.value] || "#ccc",
      desc: `${c.label}，${c.marketLabel}色系`,
    })),
  };
});

const styleDisplayInfo: Record<string, { traits: string; direction: string; icon?: string }> = {
  // Female
  shao_nv: { traits: "甜美、俏皮、轻盈", direction: "蓬蓬裙、蝴蝶结、马卡龙色系", icon: "🎀" },
  you_ya: { traits: "精致、柔美、知性", direction: "真丝衬衫、A字裙、莫兰迪色系", icon: "🌸" },
  lang_man_f: { traits: "华丽、性感、丰盈", direction: "蕾丝、荷叶边、酒红色系", icon: "🌹" },
  shao_nian_f: { traits: "利落、干练、中性", direction: "西装外套、直筒裤、黑白灰", icon: "⚡" },
  shi_shang_f: { traits: "个性、前卫、多变", direction: "不规则剪裁、撞色、潮流款", icon: "✨" },
  gu_dian_f: { traits: "端庄、稳重、高贵", direction: "套装、珍珠饰品、藏蓝色系", icon: "💎" },
  zi_ran_f: { traits: "随性、洒脱、质朴", direction: "棉麻材质、宽松版型、大地色系", icon: "🌿" },
  xi_ju_f: { traits: "夸张、夺目、气场", direction: "大廓形、撞色拼接、亮面材质", icon: "🎭" },
  // Male
  xi_ju_m: { traits: "强烈、醒目、气场强大", direction: "大格纹、深色系、醒目配饰" },
  zi_ran_m: { traits: "随性、洒脱、质朴", direction: "棉麻质地、大地色系、宽松舒适" },
  gu_dian_m: { traits: "端庄、稳重、严谨", direction: "精纺西装、深色系、品质感" },
  lang_man_m: { traits: "精致、温和、优雅", direction: "丝绒材质、暖色系、精致剪裁" },
  shi_shang_m: { traits: "前卫、个性、潮流", direction: "设计感单品、撞色搭配、潮流元素" },
};

const femaleStyles = FEMALE_STYLES.map(s => {
  const info = styleDisplayInfo[s.value];
  return {
    name: s.label,
    traits: info?.traits ?? "",
    direction: info?.direction ?? "",
    ...(info?.icon ? { icon: info.icon } : {}),
  };
});

const maleStyles = MALE_STYLES.map(s => {
  const info = styleDisplayInfo[s.value];
  return {
    name: s.label,
    traits: info?.traits ?? "",
    direction: info?.direction ?? "",
  };
});

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function BrandPage() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-muted border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-medium">品牌形象</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-6">
              <Crown className="w-4 h-4" />
              品牌形象设计定位
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              骆芷蝶<span className="text-accent">智选</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 leading-relaxed">
              以科学色彩体系与风格定位为基石，构建数据驱动的服装供应链智选平台，
              让每一件商品都能精准匹配品牌与消费者需求。
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== Brand Story ====== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
            >
              <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                品牌故事
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                愿景与使命
              </h2>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                <strong className="text-primary">骆芷蝶智选</strong>，取"芷"之芬芳高洁、"蝶"之灵动蜕变之意，
                寓意以专业的色彩与风格体系，帮助品牌在服装行业完成从经验决策到数据决策的华丽蜕变。
              </p>
              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">愿景</h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      成为全球服装行业最具影响力的数据驱动供应链智选平台，
                      让每一件商品都精准匹配消费者需求。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">使命</h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      以科学色彩体系与风格定位为基石，以数据智能为引擎，
                      重构服装供应链的选品、企划与营销全链路。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">价值观</h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      专业精准、数据驱动、开放协同、持续创新
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { num: "12", sub: "色彩季型体系" },
                  { num: "8+5", sub: "男女风格体系" },
                  { num: "50万+", sub: "SKU精准标签" },
                  { num: "95%", sub: "选品匹配准确率" },
                ].map((item, i) => (
                  <motion.div
                    key={item.sub}
                    className="flex flex-col items-center justify-center p-8 rounded-2xl bg-muted"
                    variants={fadeUp}
                    custom={i}
                  >
                    <span className="text-3xl sm:text-4xl font-bold text-primary">
                      {item.num}
                    </span>
                    <span className="mt-2 text-sm text-muted-foreground text-center">
                      {item.sub}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====== Brand VI ====== */}
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
              品牌VI体系
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              视觉识别体系
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              统一的视觉语言传达品牌专业、精准、可信赖的核心特质。
            </p>
          </motion.div>

          {/* Logo Concept */}
          <motion.div
            className="mb-12 p-8 sm:p-12 rounded-2xl bg-white border border-gray-100 shadow-sm"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-accent" />
              Logo理念
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="flex items-center justify-center w-32 h-32 rounded-2xl bg-primary shrink-0">
                <span className="text-accent font-bold text-2xl tracking-wider">
                  骆芷蝶
                </span>
              </div>
              <div>
                <p className="text-muted-foreground leading-relaxed">
                  Logo以品牌中文名"骆芷蝶"为核心，深蓝底色象征专业与信赖，
                  金色字体传递品质与尊贵。"芷"代表高洁芬芳，"蝶"象征灵动蜕变，
                  整体传达品牌以专业驱动变革的核心理念。
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "深蓝底色 — 专业的供应链管理能力",
                    "金色字体 — 高品质的服务承诺",
                    "整体构图 — 稳重中蕴含灵动",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Color System */}
          <motion.div
            className="mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-accent" />
              色彩体系
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {brandColors.map((c, i) => (
                <motion.div
                  key={c.hex}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm"
                >
                  <div
                    className="h-20"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="p-3">
                    <p className="text-xs font-bold text-primary">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.hex}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1 leading-tight">
                      {c.usage}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Typography */}
          <motion.div
            className="p-8 sm:p-12 rounded-2xl bg-white border border-gray-100 shadow-sm"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Type className="w-5 h-5 text-accent" />
              字体规范
            </h3>
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">
                  标题字体
                </p>
                <p className="text-4xl font-bold text-primary leading-tight">
                  骆芷蝶智选
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Geist Sans Bold / 系统默认中文字体
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  用于所有页面标题、模块标题
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">
                  正文字体
                </p>
                <p className="text-4xl text-foreground leading-tight">
                  服装供应链平台
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Geist Sans Regular / 系统默认中文字体
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  用于正文段落、说明文字、表单标签
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== 12 Color Seasons ====== */}
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
              核心体系
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              十二色彩季型体系
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              基于"四季色彩理论"，将色彩细分为春、夏、秋、冬四大季型，
              每季型再分3种亚型，共12种色彩季型，精准匹配个人色彩基因。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {colorSeasonSystem.map((season, i) => (
              <motion.div
                key={season.season}
                variants={fadeUp}
                custom={i}
                className="p-6 sm:p-8 rounded-2xl bg-muted border border-gray-100"
              >
                <h3 className="text-xl font-bold text-primary mb-1">
                  {season.season}
                </h3>
                <p className="text-sm text-muted-foreground">{season.desc}</p>
                <div className="mt-6 space-y-4">
                  {season.types.map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100"
                    >
                      <div
                        className="w-14 h-14 rounded-xl shrink-0 shadow-sm border border-white"
                        style={{ backgroundColor: t.color }}
                      />
                      <div>
                        <p className="font-bold text-primary">{t.name}</p>
                        <p className="text-sm text-muted-foreground">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Style Systems ====== */}
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
              风格体系
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              风格定位体系
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              基于人体型特征与气质基因，建立女士八大风格与男士五大风格体系，
              实现人衣精准匹配。
            </p>
          </motion.div>

          {/* Female 8 Styles */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-primary mb-8 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold">
                女
              </span>
              女士八大风格
            </h3>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {femaleStyles.map((s, i) => (
                <motion.div
                  key={s.name}
                  variants={fadeUp}
                  custom={i}
                  className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300"
                >
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h4 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">
                    {s.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {s.traits}
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-muted-foreground">{s.direction}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Male 5 Styles */}
          <div>
            <h3 className="text-2xl font-bold text-primary mb-8 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-white text-sm font-bold">
                男
              </span>
              男士五大风格
            </h3>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {maleStyles.map((s, i) => (
                <motion.div
                  key={s.name}
                  variants={fadeUp}
                  custom={i}
                  className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 text-center"
                >
                  <h4 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">
                    {s.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {s.traits}
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-muted-foreground">{s.direction}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====== Brand Positioning Matrix ====== */}
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
              品牌定位
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              品牌定位矩阵
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              骆芷蝶智选在服装供应链行业的精准定位——数据驱动的全链路智选平台。
            </p>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="relative p-8 sm:p-12 rounded-2xl bg-muted border border-gray-100">
              {/* Axes */}
              <div className="flex flex-col items-center">
                <p className="text-sm font-semibold text-primary mb-4">
                  数据驱动程度
                </p>
                <div className="w-full relative" style={{ minHeight: "320px" }}>
                  {/* Y-axis label */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-semibold text-primary whitespace-nowrap">
                    供应链协同深度
                  </div>

                  {/* Grid */}
                  <div className="ml-8 mr-4 grid grid-cols-3 grid-rows-3 gap-2 h-72">
                    {/* Top row */}
                    <div className="flex items-center justify-center p-4 rounded-xl bg-white border border-gray-100">
                      <p className="text-xs text-muted-foreground text-center">传统批发<br/>低协同</p>
                    </div>
                    <div className="flex items-center justify-center p-4 rounded-xl bg-white border border-gray-100">
                      <p className="text-xs text-muted-foreground text-center">数据选品<br/>平台</p>
                    </div>
                    <div className="flex items-center justify-center p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                      <p className="text-xs text-primary text-center font-bold">骆芷蝶<br/>智选</p>
                    </div>
                    {/* Middle row */}
                    <div className="flex items-center justify-center p-4 rounded-xl bg-white border border-gray-100">
                      <p className="text-xs text-muted-foreground text-center">传统供应链<br/>服务商</p>
                    </div>
                    <div className="flex items-center justify-center p-4 rounded-xl bg-white border border-gray-100">
                      <p className="text-xs text-muted-foreground text-center">企划咨询<br/>公司</p>
                    </div>
                    <div className="flex items-center justify-center p-4 rounded-xl bg-white border border-gray-100">
                      <p className="text-xs text-muted-foreground text-center">全链路<br/>SaaS</p>
                    </div>
                    {/* Bottom row */}
                    <div className="flex items-center justify-center p-4 rounded-xl bg-white border border-gray-100">
                      <p className="text-xs text-muted-foreground text-center">工厂直供<br/>平台</p>
                    </div>
                    <div className="flex items-center justify-center p-4 rounded-xl bg-white border border-gray-100">
                      <p className="text-xs text-muted-foreground text-center">B2B电商<br/>平台</p>
                    </div>
                    <div className="flex items-center justify-center p-4 rounded-xl bg-white border border-gray-100">
                      <p className="text-xs text-muted-foreground text-center">ERP软件<br/>厂商</p>
                    </div>
                  </div>

                  {/* X-axis labels */}
                  <div className="ml-8 mr-4 flex justify-between mt-4">
                    <span className="text-xs text-muted-foreground">经验驱动</span>
                    <span className="text-xs text-muted-foreground">混合驱动</span>
                    <span className="text-xs text-muted-foreground font-semibold text-primary">数据驱动</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== Login Prompt ====== */}
      <section className="py-20 lg:py-28 bg-white">
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
                获取骆芷蝶智选品牌授权
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                加入品牌授权体系，共享科学色彩体系与风格定位方法论，赋能您的品牌精准运营。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  获取品牌授权
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/supplier"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  成为供应商
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
