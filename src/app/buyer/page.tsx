"use client";
import { useState } from "react";

import { motion } from "framer-motion";
import Link from "next/link";
import { PaywallModal } from "@/components/PaywallModal";
import {
  ChevronRight,
  Search,
  Sparkles,
  Users,
  Target,
  Package,
  Store,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
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
const steps = [
  {
    icon: Search,
    title: "客户需求",
    desc: "通过数据画像精准捕捉终端客户风格偏好与消费习惯",
  },
  {
    icon: Sparkles,
    title: "风格匹配",
    desc: "基于八大风格体系，将客户需求与风格基因深度匹配",
  },
  {
    icon: Users,
    title: "供应商匹配",
    desc: "智能筛选最优供应商资源，品质与价格双重保障",
  },
  {
    icon: Target,
    title: "精准推荐",
    desc: "生成个性化选品方案，从源头提升爆款命中率",
  },
];

const styleTable = [
  {
    name: "少女型",
    traits: "甜美、俏皮、轻盈",
    direction: "蓬蓬裙、蝴蝶结、马卡龙色系",
    ratio: "中",
  },
  {
    name: "优雅型",
    traits: "精致、柔美、知性",
    direction: "真丝衬衫、A字裙、莫兰迪色系",
    ratio: "高",
  },
  {
    name: "浪漫型",
    traits: "华丽、性感、丰盈",
    direction: "蕾丝、荷叶边、酒红色系",
    ratio: "中",
  },
  {
    name: "少年型",
    traits: "利落、干练、中性",
    direction: "西装外套、直筒裤、黑白灰",
    ratio: "中",
  },
  {
    name: "时尚型",
    traits: "个性、前卫、多变",
    direction: "不规则剪裁、撞色、潮流款",
    ratio: "高",
  },
  {
    name: "古典型",
    traits: "端庄、稳重、高贵",
    direction: "套装、珍珠饰品、藏蓝色系",
    ratio: "中",
  },
  {
    name: "自然型",
    traits: "随性、洒脱、质朴",
    direction: "棉麻材质、宽松版型、大地色系",
    ratio: "中",
  },
  {
    name: "戏剧型",
    traits: "夸张、夺目、气场",
    direction: "大廓形、撞色拼接、亮面材质",
    ratio: "低",
  },
];

const features = [
  {
    icon: Package,
    title: "款式库",
    desc: "海量SKU实时更新，覆盖全品类全风格，支持多维度筛选与智能推荐。",
  },
  {
    icon: Store,
    title: "供应商库",
    desc: "众多优质供应商入驻，资质认证体系保障品质，产地直达降本增效。",
  },
  {
    icon: TrendingUp,
    title: "爆品推荐",
    desc: "AI驱动爆品预测模型，提前预判趋势，首单成功率显著提升。",
  },
  {
    icon: Search,
    title: "比价系统",
    desc: "全网实时比价，一键对比同款不同供应商报价，确保最优采购性价比。",
  },
  {
    icon: Target,
    title: "预销匹配",
    desc: "基于历史销售数据与客户画像，智能预测各款预售表现，降低库存风险。",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function BuyerPage() {
  const [showPaywall, setShowPaywall] = useState(false);

  return (
    <>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="完整选品数据与八大风格体系"
        description="登录后购买年度会员或单次付费即可查看完整选品数据、风格体系与供应链信息"
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
          <span className="text-primary font-medium">买手选品</span>
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
              <Search className="w-4 h-4" />
              精准选品，从源头制胜
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              买手选品
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              基于八大风格体系与数据驱动的智能选品方案，帮助买手精准匹配客户需求与供应商资源，
              从源头提升爆款命中率，降低库存风险，实现选品决策的科学化升级。
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== Selection Flow ====== */}
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
              选品流程
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              四步精准选品
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从客户需求到精准推荐，数据驱动每一步选品决策
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {steps.map((step, i) => (
              <motion.div key={step.title} variants={fadeUp} custom={i} className="relative">
                <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4">
                    <step.icon className="w-7 h-7" />
                  </div>
                  <div className="absolute -top-3 -right-1 md:static md:mb-2 w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <h3 className="text-lg font-bold text-primary mt-2">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-accent" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Style Case Studies ====== */}
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
              风格体系案例
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              八大风格选品案例展示
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              科学分类，精准匹配。以下是部分风格选品案例展示，完整数据与选品体系仅对会员开放
            </p>
          </motion.div>

          {/* Case Study Grid - Image Placeholders */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {[
              { style: "少女型", label: "蓬蓬裙·马卡龙色系", color: "from-pink-100 to-pink-50" },
              { style: "优雅型", label: "真丝衬衫·莫兰迪色", color: "from-teal-100 to-teal-50" },
              { style: "时尚型", label: "不规则剪裁·撞色", color: "from-purple-100 to-purple-50" },
              { style: "自然型", label: "棉麻材质·大地色", color: "from-amber-100 to-amber-50" },
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

          <motion.div
            className="text-center mt-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              查看完整风格体系与选品数据
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>
      {/* ====== Original Eight Styles Table REMOVED, replaced by case studies above ====== */}

      {/* ====== Platform Features ====== */}
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
              智能工具
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              平台选品功能
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              五大选品利器，让选品从经验判断升级为数据决策
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="group flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-primary group-hover:text-accent transition-colors">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Highlights ====== */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
            >
              <span className="text-accent font-semibold text-sm tracking-widest uppercase">
                选品优势
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                数据驱动的选品新范式
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                告别凭感觉选品的时代，用数据与体系化方法论，让每一次选品都有据可依。
              </p>
              <ul className="mt-8 flex flex-col gap-4">
                {[
                  "首单成功率大幅提升，选品胜率显著高于行业平均",
                  "库存周转天数显著缩短，资金利用效率大幅提升",
                  "供应商匹配效率大幅提升，响应更加迅速",
                  "退换货率显著降低，客户满意度持续攀升",
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
                { num: "大幅提升", sub: "首单成功率" },
                { num: "显著缩短", sub: "库存周转天数" },
                { num: "大幅提升", sub: "供应商匹配效率" },
                { num: "显著降低", sub: "退换货率" },
              ].map((item, i) => (
                <motion.div
                  key={item.sub}
                  className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white border border-gray-100 shadow-sm"
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

      {/* ====== Login Prompt ====== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl text-center">
            <div className="max-w-xl mx-auto px-6">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-bold text-primary">完整选品数据与分析报告</h3>
              <p className="mt-2 text-sm text-muted-foreground">详细商业数据、供应链信息与专业分析报告，仅对授权用户开放</p>
              <a href="/admin/login" className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                登录管理后台
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-16 lg:py-24 bg-white">
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
                立即体验1000元在线诊断
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                专业买手顾问团队，为您的选品策略量身定制优化方案。限时免费体验价值1000元的在线选品诊断服务。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  立即体验
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/planning"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  了解商品企划
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
