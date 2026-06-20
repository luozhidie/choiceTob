"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdBanner, { PopupAd } from "@/components/AdBanner";
import {
  Search, TrendingUp, BarChart3, Lightbulb, LayoutGrid,
  Megaphone, Headphones, Crown, Truck, GraduationCap,
  ArrowRight, Sparkles, CheckCircle2, FileText, Palette,
  BookOpen, ShoppingBag, User, Star, Quote,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  站点图片类型                                                      */
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
    (data as any[]).forEach((a: any) => { if (a.key in map) (map as any)[a.key] = a.image_url; });
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
  const [keyword, setKeyword] = useState("");
  const [searchActive, setSearchActive] = useState(false);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      window.location.href = `/products?keyword=${encodeURIComponent(keyword.trim())}`;
    }
  };

  return (
    <div>
      {/* ====== Hero ====== */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80">
        {/* 背景图 */}
        {siteImages.hero_bg && (
          <div className="absolute inset-0 z-0">
            <img src={siteImages.hero_bg} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-transparent" />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 text-center">
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
            className="text-[2.5rem] leading-[1.15] sm:text-[3.5rem] sm:leading-[1.12] lg:text-[4.5rem] lg:leading-[1.08] font-black tracking-tight text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            骆芷蝶智选
            <br className="sm:hidden" />
            <span className="text-accent">· 好物推荐</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-base sm:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            从选品企划到营销落地，以数据智能驱动服装行业全链路高效运营
          </motion.p>

          {/* 搜索框 */}
          <motion.form
            onSubmit={handleSearch}
            className="mt-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex gap-2 p-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onFocus={() => setSearchActive(true)}
                  onBlur={() => setSearchActive(false)}
                  placeholder="搜索商品、品牌、关键词..."
                  className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder:text-white/40 focus:outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
              >
                搜索
              </button>
            </div>

            {/* 热门标签 */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {["穿搭精选", "爆款推荐", "新品上市", "供应链优选"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setKeyword(tag); }}
                  className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.form>

          <motion.div
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link
              href="/contact"
              className="btn-fashion btn-fashion-accent shadow-lg shadow-accent/25"
            >
              预约演示
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/buyer"
              className="btn-fashion border-1.5 border-white/25 text-white hover:bg-white/10"
            >
              探索买手选品
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ====== 核心服务 ====== */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">核心服务</h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              覆盖服装行业全链路数字化需求，助力品牌精准决策与高效增长
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {coreServices.map((service, i) => (
              <motion.div
                key={service.title}
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
                variants={fadeUp}
                custom={i}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 数据工具 ====== */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">数据工具</h2>
            <p className="mt-4 text-gray-500">AI驱动的数据分析工具，让决策更科学</p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {dataTools.map((tool, i) => (
              <motion.div
                key={tool.title}
                className="bg-white rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
                variants={fadeUp}
                custom={i}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <tool.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{tool.title}</h3>
                <p className="text-sm text-gray-500">{tool.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 数据统计 ====== */}
      <section className="py-20 bg-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                variants={fadeUp}
                custom={i}
              >
                <div className="text-4xl font-black text-white">{stat.value}</div>
                <div className="mt-2 text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 客户证言 ====== */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">客户怎么说</h2>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                className="bg-gray-50 rounded-2xl p-8"
                variants={fadeUp}
                custom={i}
              >
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                <p className="text-gray-600 leading-relaxed mb-6">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <AdBanner />
      <PopupAd />
    </div>
  );
}
