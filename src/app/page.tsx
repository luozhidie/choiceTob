"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import AdBanner, { PopupAd } from "@/components/AdBanner";
import {
  ChevronRight,
  TrendingUp,
  BarChart3,
  Lightbulb,
  LayoutGrid,
  Megaphone,
  Headphones,
  Crown,
  Truck,
  GraduationCap,
  ArrowRight,
  Quote,
  CheckCircle2,
  FileText,
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
const coreServices = [
  {
    icon: TrendingUp,
    title: "买手选品",
    desc: "基于大数据趋势分析与市场洞察，精准锁定爆款基因，从源头提升选品胜率。",
    href: "/buyer",
  },
  {
    icon: Lightbulb,
    title: "商品企划",
    desc: "科学规划商品结构与节奏，融合品类规划与生命周期管理，实现利润最大化。",
    href: "/planning",
  },
  {
    icon: FileText,
    title: "企划工具",
    desc: "智能生成个性化商品企划报告，输入关键信息即可获取完整企划方案。",
    href: "/planning-tool",
  },
  {
    icon: BarChart3,
    title: "爆款货盘",
    desc: "实时追踪全网热销数据，一键获取高转化爆款货源，抢占市场先机。",
    href: "/hot-picks",
  },
  {
    icon: LayoutGrid,
    title: "陈列搭配",
    desc: "智能化陈列方案与搭配推荐，提升店铺视觉体验与连带销售率。",
    href: "/display",
  },
];

const dataTools = [
  {
    icon: Megaphone,
    title: "营销策划",
    desc: "全渠道营销方案智能生成，活动策略一键落地，流量与转化双提升。",
    href: "/marketing",
  },
  {
    icon: Headphones,
    title: "销售服务",
    desc: "从培训到工具的全方位销售赋能体系，提升团队战斗力与客户满意度。",
    href: "/sales",
  },
  {
    icon: Crown,
    title: "VIP管理",
    desc: "客户分层精细运营，智能推荐与专属权益体系，深度挖掘高价值客户终身价值。",
    href: "/vip",
  },
  {
    icon: Truck,
    title: "一手货源",
    desc: "优质供应商资源整合，全链路协同管理，从源头保障品质与交期。",
    href: "/supplier",
  },
  {
    icon: GraduationCap,
    title: "知识付费",
    desc: "行业顶尖专家实战课程与案例解析，系统提升团队专业能力。",
    href: "/education",
  },
];

const stats = [
  { value: "5000+", label: "合作品牌" },
  { value: "98%", label: "客户续约率" },
  { value: "3x", label: "选品效率提升" },
  { value: "50万+", label: "SKU覆盖" },
];

const testimonials = [
  {
    quote: "骆芷蝶智选的数据驱动选品方案，让我们的首单成功率提升了60%，库存周转天数缩短了30%，真正实现了从经验选品到科学选品的跨越。",
    name: "李晓燕",
    role: "某知名女装品牌 商品总监",
  },
  {
    quote: "接入爆款货盘后，我们的上新速度提升了3倍，爆款命中率从15%提升到45%，供应链协同效率大幅提升。",
    name: "王志强",
    role: "某快时尚品牌 供应链负责人",
  },
  {
    quote: "VIP管理模块帮助我们精准识别高价值客户，复购率提升了80%，会员贡献占比从35%增长到62%，效果远超预期。",
    name: "陈美琪",
    role: "某高端女装品牌 运营总监",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Home() {
  return (
    <>
      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        {/* Decorative bg elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-6">
                <TrendingUp className="w-4 h-4" />
                数据驱动，智选未来
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              服装供应链
              <span className="text-accent">智选</span>
              平台
            </motion.h1>

            <motion.p
              className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              从选品企划到营销落地，以数据智能驱动服装行业全链路高效运营。
              帮助品牌精准选品、科学企划、高效营销，实现从经验决策到数据决策的全面升级。
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1ab3a4] text-white font-semibold rounded-lg hover:bg-[#159e91] transition-colors shadow-lg shadow-[#1ab3a4]/20"
              >
                预约演示
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/buyer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
              >
                了解更多
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {stats.map((s) => (
              <motion.div
                key={s.label}
                className="text-center"
                variants={fadeUp}
              >
                <div className="text-3xl sm:text-4xl font-bold text-accent">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-white">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Top Ad Banner ====== */}
      <AdBanner position="top" />

      {/* ====== Core Business ====== */}
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
              核心业务
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              全链路数据驱动服务
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              覆盖服装行业从选品到销售的核心业务场景，以数据智能赋能每一个关键决策节点。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {coreServices.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <Link
                  href={item.href}
                  className="group flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-primary group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                    {item.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    了解详情 <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Data Tools ====== */}
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
              增值工具
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              数据工具与专业服务
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              以数据为引擎，以服务为纽带，构建服装行业全场景赋能体系。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {dataTools.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <Link
                  href={item.href}
                  className="group flex items-start gap-5 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-accent/10 text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-primary group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Why Choose Us ====== */}
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
                为什么选择我们
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
                行业深耕，数据驱动
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                十年服装行业深耕，结合前沿数据智能技术，打造真正懂行业的供应链智选平台。
              </p>
              <ul className="mt-8 flex flex-col gap-4">
                {[
                  "全网实时数据监测，覆盖主流电商平台与社交渠道",
                  "AI驱动的趋势预测模型，提前30天预判爆款走向",
                  "100+资深行业顾问，提供从策略到落地的全程陪伴",
                  "与5000+优质供应商深度合作，源头资源直达",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="mt-10 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                立即咨询 <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
            >
              {[
                { num: "10+", sub: "年行业深耕" },
                { num: "50万+", sub: "SKU数据覆盖" },
                { num: "200+", sub: "行业专家顾问" },
                { num: "99.9%", sub: "系统可用性" },
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====== Magazine Preview ====== */}
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
              时尚前沿
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              骆芷蝶时尚杂志
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              对标Vogue，汇聚全球时尚资讯、流行趋势与搭配灵感
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
              {
                tag: "流行趋势",
                title: "2026春夏十大流行色：从数字薰衣草到珊瑚粉",
                desc: "全球权威色彩机构发布最新流行色报告，提前掌握下一季色彩风向标",
                date: "2026-05-10",
              },
              {
                tag: "搭配灵感",
                title: "法式慵懒风回归：如何穿出不费力的时髦感",
                desc: "从巴黎街头到小红书爆款，法式风格持续霸榜，掌握核心搭配逻辑",
                date: "2026-05-08",
              },
              {
                tag: "行业洞察",
                title: "可持续时尚崛起：环保面料成消费者新宠",
                desc: "Z世代消费观念转变，环保认证成品牌溢价新支点，供应链如何应变",
                date: "2026-05-05",
              },
            ].map((article, i) => (
              <motion.div
                key={article.title}
                variants={fadeUp}
                custom={i}
                className="group cursor-pointer"
                onClick={() => (window.location.href = "/magazine")}
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 aspect-[4/3] flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow">
                  <span className="text-6xl opacity-20">📖</span>
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold">
                    {article.tag}
                  </span>
                </div>
                <h3 className="font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {article.desc}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <span>📅</span>
                  <span>{article.date}</span>
                </div>
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
            <Link
              href="/magazine"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              浏览完整杂志
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ====== Testimonials ====== */}
      <section className="py-20 lg:py-28 bg-primary text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              客户证言
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
              他们正在使用骆芷蝶智选
            </h2>
            <p className="mt-4 text-white/70 leading-relaxed">
              众多知名服装品牌的选择与信赖，数据驱动成效看得见。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                className="flex flex-col p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                variants={fadeUp}
                custom={i}
              >
                <Quote className="w-8 h-8 text-accent/60 mb-4 shrink-0" />
                <p className="text-white/80 leading-relaxed flex-1 text-sm">
                  {t.quote}
                </p>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-white/50 text-xs mt-1">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold">
                开启数据驱动的智选之旅
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                立即预约演示，了解骆芷蝶智选如何助力您的品牌实现精准运营与高效增长。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  预约免费演示
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/buyer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  探索产品功能
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== Popup Ad ====== */}
      <PopupAd />

      {/* ====== Footer ====== */}
      <footer className="py-6 bg-muted/60 border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} 骆芷蝶智选</p>
          <Link href="/admin/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            管理员登录
          </Link>
        </div>
      </footer>
    </>
  );
}
