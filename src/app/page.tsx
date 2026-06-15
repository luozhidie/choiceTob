"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  Sparkles,
  CheckCircle2,
  FileText,
  Palette,
  BookOpen,
  ShoppingBag,
  User,
  Star,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  站点图片类型
/* ------------------------------------------------------------------ */
interface SiteImageMap {
  hero_bg: string | null;
  magazine_1: string | null;
  magazine_2: string | null;
  magazine_3: string | null;
  cta_bg: string | null;
}

const defaultSiteImages: SiteImageMap = {
  hero_bg: null,
  magazine_1: null,
  magazine_2: null,
  magazine_3: null,
  cta_bg: null,
};

async function fetchSiteImages(): Promise<SiteImageMap> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("site_assets")
      .select("key, image_url")
      .in("key", ["hero_bg", "magazine_1", "magazine_2", "magazine_3", "cta_bg"]);
    if (error || !data) return defaultSiteImages;
    const map: SiteImageMap = { ...defaultSiteImages };
    (data as any[]).forEach((a) => { if (a.key in map) (map as any)[a.key] = a.image_url; });
    return map;
  } catch { return defaultSiteImages; }
}

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const coreServices = [
  {
    icon: TrendingUp,
    title: "买手选品",
    desc: "大数据趋势洞察 × 爆款基因锁定，源头提升选品胜率",
    href: "/buyer",
  },
  {
    icon: Lightbulb,
    title: "商品企划",
    desc: "科学品类规划 × 生命周期管理，最大化单品利润",
    href: "/planning",
    needVip: true,
  },
  {
    icon: FileText,
    title: "企划工具",
    desc: "输入关键词 → 智能生成完整企划方案",
    href: "/planning-tool",
    needVip: true,
  },
  {
    icon: BarChart3,
    title: "爆款货盘",
    desc: "全网热销实时追踪，一键锁定高转化货源",
    href: "/hot-picks",
    needVip: true,
  },
  {
    icon: LayoutGrid,
    title: "陈列搭配",
    desc: "智能陈列 × 场景搭配，拉动连带销售",
    href: "/display",
    needVip: true,
  },
];

const dataTools = [
  {
    icon: Megaphone,
    title: "营销策划",
    desc: "全渠道方案智能生成，流量转化双提升",
    href: "/marketing",
    needVip: true,
  },
  {
    icon: Headphones,
    title: "销售服务",
    desc: "培训+工具全方位赋能，提升团队战斗力",
    href: "/sales",
    needVip: true,
  },
  {
    icon: Crown,
    title: "VIP管理",
    desc: "客户分层精细运营，挖掘高价值客户终身价值",
    href: "/vip",
  },
  {
    icon: Truck,
    title: "一手货源",
    desc: "优质供应商整合，源头保障品质与交期",
    href: "/supplier",
  },
  {
    icon: GraduationCap,
    title: "知识付费",
    desc: "行业专家实战课程，系统提升专业能力",
    href: "/education",
  },
];

const stats = [
  { value: "5,000+", label: "合作品牌" },
  { value: "98%", label: "客户续约率" },
  { value: "3×", label: "选品效率提升" },
  { value: "50万+", label: "SKU覆盖" },
];

const testimonials = [
  {
    quote: "数据驱动选品让首单成功率提升了60%，库存周转缩短30天。从经验到科学的跨越，远超预期。",
    name: "李晓燕",
    role: "知名女装品牌 商品总监",
  },
  {
    quote: "接入爆款货盘后，上新速度提升3倍，爆款命中率从15%飙升至45%，供应链效率质的飞跃。",
    name: "王志强",
    role: "快时尚品牌 供应链负责人",
  },
  {
    quote: "VIP管理模块精准识别高价值客户，复购率提升80%，会员贡献占比从35%增长到62%。",
    name: "陈美琪",
    role: "高端女装品牌 运营总监",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Home() {
  const [siteImages, setSiteImages] = useState<SiteImageMap>(defaultSiteImages);
  const [isMember, setIsMember] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchSiteImages().then(setSiteImages);
  }, []);

  // 检查会员状态
  useEffect(() => {
    const checkMember = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("membership_type").eq("id", user.id).single();
      if (p?.membership_type && p.membership_type !== "") setIsMember(true);
    };
    checkMember();
  }, []);

  // VIP 功能点击处理
  const handleVipLink = (href: string) => {
    if (isMember) window.location.href = href;
    else window.location.href = `/vip?redirect=${encodeURIComponent(href)}`;
  };
  return (
    <>
      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden hero-gradient text-white">
        {/* 背景图片 */}
        {siteImages.hero_bg && (
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={siteImages.hero_bg}
              alt="Hero Background"
              className="w-full h-full object-cover opacity-30"
            />
          </div>
        )}

        {/* Decorative (only show when no bg image) */}
        {!siteImages.hero_bg && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-accent/8 blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gold/5 blur-3xl" />
          </div>
        )}

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-8 text-[13px] font-medium tracking-wide text-white/90">
                ✨ 数据驱动 · 智选未来
              </span>
            </motion.div>

            <motion.h1
              className="text-[2.5rem] leading-[1.15] sm:text-[3.5rem] sm:leading-[1.12] lg:text-[4.5rem] lg:leading-[1.08] font-black tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              服装供应链
              <br className="sm:hidden" />
              <span className="text-accent">智选</span>平台
            </motion.h1>

            <motion.p
              className="mt-6 text-base sm:text-lg text-white/60 leading-relaxed max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              从选品企划到营销落地，以数据智能驱动服装行业全链路高效运营，助力品牌精准选品、科学决策。
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link
                href="/contact"
                className="btn-fashion btn-fashion-accent shadow-lg shadow-accent/25"
              >
                预约演示
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/buyer"
                className="btn-fashion border-1.5 border-white/25 text-white hover:bg-white/10"
              >
                探索产品
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
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
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {s.value}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-white/40 font-medium tracking-wider">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Top Ad Banner ====== */}
      <AdBanner position="top" />

      {/* ====== Hot Services ====== */}
      <section className="py-20 lg:py-28 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="accent-line mx-auto mb-5" />
            <span className="text-accent font-semibold text-xs tracking-[0.2em] uppercase">
              热门服务
            </span>
            <h2 className="mt-4 text-[1.75rem] sm:text-[2.25rem] lg:text-[2.5rem] font-black tracking-tight text-primary leading-tight">
              专业服务，一站赋能
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                href: "/style-test/female",
                title: "女性风格测试",
                desc: "优雅自信或浪漫灵动？AI分析30个维度，定位你的专属风格美学密码",
                price: "¥99",
                originPrice: "¥199",
                tag: "可测2次",
                btnText: "女生测试",
                ctaColor: "text-pink-500",
                bg: "from-pink-50 to-rose-50/40",
                border: "border-pink-200/50 hover:border-pink-300/60",
                iconBg: "bg-pink-100 text-pink-500 group-hover:bg-pink-500 group-hover:text-white",
                icon: Sparkles,
              },
              {
                href: "/style-test/male",
                title: "男性风格测试",
                desc: "精致雅痞或硬朗型格？AI读懂男生审美密码，打造高智感个人形象",
                price: "¥99",
                originPrice: "¥199",
                tag: "可测2次",
                btnText: "男生测试",
                ctaColor: "text-blue-500",
                bg: "from-blue-50 to-indigo-50/40",
                border: "border-blue-200/50 hover:border-blue-300/60",
                iconBg: "bg-blue-100 text-blue-500 group-hover:bg-blue-500 group-hover:text-white",
                icon: Sparkles,
              },
              {
                href: "/courses",
                bg: "from-muted to-muted/40",
                border: "border-border hover:border-primary/30",
                iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
                icon: BookOpen,
                title: "线上课程",
                desc: "专业色彩形象课程，从入门到精通",
                extInfo: (
                  <>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      免费+付费
                    </span>
                    <span className="text-xs text-muted-foreground">多门课程可选</span>
                  </>
                ),
                cta: "浏览课程",
                ctaColor: "text-primary",
              },
              {
                href: "/buyer",
                bg: "from-pink-50 to-pink-50/40",
                border: "border-pink-200/50 hover:border-pink-300/60",
                iconBg: "bg-pink-100 text-pink-500 group-hover:bg-pink-500 group-hover:text-white",
                icon: ShoppingBag,
                title: "买手选品",
                desc: "精选优质货源，按风格色系精准筛选",
                extInfo: (
                  <>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-pink-100 text-pink-500 font-medium">
                      精选推荐
                    </span>
                    <span className="text-xs text-muted-foreground">品质保障</span>
                  </>
                ),
                cta: "去逛逛",
                ctaColor: "text-pink-500",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={`group block p-8 rounded-2xl bg-gradient-to-br ${item.bg} border ${item.border} hover:shadow-lg transition-all duration-300`}
                >
                  <div
                    className={`flex items-center justify-center w-14 h-14 rounded-xl ${item.iconBg} mb-6 transition-colors duration-300`}
                  >
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    {item.price && (
                      <>
                        <span className="text-2xl font-bold text-accent">{item.price}</span>
                        <span className="text-sm text-gray-300 line-through">{item.originPrice}</span>
                        <span className="text-xs px-2 py-0.5 bg-accent text-white rounded-full">{item.tag}</span>
                      </>
                    )}
                    {item.extInfo && (
                      <div className="flex items-center gap-2">{item.extInfo}</div>
                    )}
                  </div>
                  <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${item.ctaColor}`}>
                    {item.btnText || item.cta} <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Core Business ====== */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="gold-line mx-auto mb-5" />
            <span className="text-gold font-semibold text-xs tracking-[0.2em] uppercase">
              核心业务
            </span>
            <h2 className="mt-4 text-[1.75rem] sm:text-[2.25rem] lg:text-[2.5rem] font-black tracking-tight text-primary leading-tight">
              全链路数据驱动服务
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed text-sm max-w-md mx-auto">
              覆盖从选品到销售的核心场景，以数据智能赋能每一个决策节点
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {coreServices.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                {item.needVip && !isMember ? (
                  <div onClick={() => handleVipLink(item.href)} className="fashion-card group flex flex-col h-full p-8 cursor-pointer">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary group-hover:bg-accent group-hover:text-white transition-all duration-300">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-primary group-hover:text-accent transition-colors">
                      {item.title}
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-accent/10 text-[10px] text-accent">🔒 VIP</span>
                    </h3>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                      {item.desc}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                      开通VIP <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                ) : (
                  <Link href={item.href} className="fashion-card group flex flex-col h-full p-8">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary group-hover:bg-accent group-hover:text-white transition-all duration-300">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-primary group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                      {item.desc}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                      了解详情 <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Data Tools ====== */}
      <section className="py-20 lg:py-28 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="accent-line mx-auto mb-5" />
            <span className="text-accent font-semibold text-xs tracking-[0.2em] uppercase">
              增值工具
            </span>
            <h2 className="mt-4 text-[1.75rem] sm:text-[2.25rem] lg:text-[2.5rem] font-black tracking-tight text-primary leading-tight">
              数据工具与专业服务
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed text-sm max-w-md mx-auto">
              以数据为引擎，以服务为纽带，构建全场景赋能体系
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {dataTools.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                {item.needVip && !isMember ? (
                  <div
                    onClick={() => handleVipLink(item.href)}
                    className="fashion-card group flex items-start gap-5 p-6 cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-accent-light text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-all duration-300">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-primary group-hover:text-accent transition-colors">
                        {item.title}
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-accent/10 text-[10px] text-accent">🔒 VIP</span>
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="fashion-card group flex items-start gap-5 p-6"
                  >
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-accent-light text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-all duration-300">
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
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== Why Choose Us ====== */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
            >
              <div className="gold-line mb-5" />
              <span className="text-gold font-semibold text-xs tracking-[0.2em] uppercase">
                为什么选择我们
              </span>
              <h2 className="mt-4 text-[1.75rem] sm:text-[2.25rem] lg:text-[2.5rem] font-black tracking-tight text-primary leading-tight leading-tight">
                行业深耕
                <br />
                数据驱动
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                十年服装行业深耕，结合前沿数据智能技术，打造真正懂行业的供应链智选平台。
              </p>
              <ul className="mt-8 flex flex-col gap-4">
                {[
                  "全网实时数据监测，覆盖主流电商平台与社交渠道",
                  "AI驱动的趋势预测模型，提前30天预判爆款走向",
                  "100+资深行业顾问，提供策略到落地的全程陪伴",
                  "5,000+优质供应商深度合作，源头资源直达",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80 leading-relaxed">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="btn-fashion btn-fashion-accent mt-10"
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
                  className="fashion-card flex flex-col items-center justify-center p-8"
                  variants={fadeUp}
                  custom={i}
                >
                  <span className="text-[1.75rem] sm:text-[2.25rem] font-black tracking-tight text-primary">
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
      <section className="py-20 lg:py-28 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="accent-line mx-auto mb-5" />
            <span className="text-accent font-semibold text-xs tracking-[0.2em] uppercase">
              时尚前沿
            </span>
            <h2 className="mt-4 text-[1.75rem] sm:text-[2.25rem] lg:text-[2.5rem] font-black tracking-tight text-primary leading-tight">
              骆芷蝶时尚杂志
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed text-sm max-w-md mx-auto">
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
                imageKey: "magazine_1" as const,
              },
              {
                tag: "搭配灵感",
                title: "法式慵懒风回归：如何穿出不费力的时髦感",
                desc: "从巴黎街头到小红书爆款，法式风格持续霸榜，掌握核心搭配逻辑",
                date: "2026-05-08",
                imageKey: "magazine_2" as const,
              },
              {
                tag: "行业洞察",
                title: "可持续时尚崛起：环保面料成消费者新宠",
                desc: "Z世代消费观念转变，环保认证成品牌溢价新支点",
                date: "2026-05-05",
                imageKey: "magazine_3" as const,
              },
            ].map((article, i) => (
              <motion.div
                key={article.title}
                variants={fadeUp}
                custom={i}
                className="group cursor-pointer"
                onClick={() => (window.location.href = "/magazine")}
              >
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 aspect-[4/3] flex items-center justify-center mb-5 group-hover:shadow-md transition-shadow border border-border ${!siteImages[article.imageKey] ? '' : 'p-0'}`}>
                  {siteImages[article.imageKey] ? (
                    <img
                      src={siteImages[article.imageKey]!}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="fashion-heading text-7xl text-primary/10 select-none">M</span>
                  )}
                  <span className="absolute top-4 left-4 fashion-tag bg-accent text-white text-[10px]">
                    {article.tag}
                  </span>
                </div>
                <h3 className="font-bold text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {article.desc}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-gold" />
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
              className="btn-fashion btn-fashion-outline"
            >
              浏览完整杂志
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ====== Testimonials ====== */}
      <section className="py-20 lg:py-28 hero-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="w-12 h-[2px] bg-gold/60 mx-auto mb-5" />
            <span className="text-gold font-semibold text-xs tracking-[0.2em] uppercase">
              客户证言
            </span>
            <h2 className="mt-4 text-[1.75rem] sm:text-[2.25rem] lg:text-[2.5rem] font-black tracking-tight">
              他们正在使用骆芷蝶智选
            </h2>
            <p className="mt-5 text-white/60 leading-relaxed text-sm max-w-md mx-auto">
              众多知名服装品牌的选择与信赖
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
                className="flex flex-col p-8 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/10 hover:bg-white/[0.09] transition-colors"
                variants={fadeUp}
                custom={i}
              >
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-white/80 leading-relaxed flex-1 text-sm">
                  "{t.quote}"
                </p>
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-white/40 text-xs mt-1">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className={`relative overflow-hidden rounded-3xl hero-gradient px-8 sm:px-12 lg:px-20 py-16 sm:py-20 text-center text-white ${siteImages.cta_bg ? '' : ''}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            {siteImages.cta_bg && (
              <div className="absolute inset-0 pointer-events-none">
                <img src={siteImages.cta_bg!} alt="" className="w-full h-full object-cover opacity-20" />
              </div>
            )}
            {/* Decorative (only show when no bg image) */}
            {!siteImages.cta_bg && (
              <>
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/8 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
              </>
            )}

            <div className="relative">
              <h2 className="text-[1.75rem] sm:text-[2.25rem] lg:text-[2.5rem] font-black tracking-tight">
                开启数据驱动的智选之旅
              </h2>
              <p className="mt-5 text-white/70 max-w-lg mx-auto leading-relaxed text-sm">
                立即预约演示，了解骆芷蝶智选如何助力您的门店实现精准运营与高效增长
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="btn-fashion btn-fashion-accent shadow-lg shadow-accent/20"
                >
                  预约免费演示
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/buyer"
                  className="btn-fashion border-1.5 border-white/25 text-white hover:bg-white/10"
                >
                  探索产品功能
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== Popup Ad + Admin Link ====== */}
      <PopupAd />

      <div className="py-4 bg-background border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-end">
          <Link href="/admin/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            管理员登录
          </Link>
        </div>
      </div>
    </>
  );
}
