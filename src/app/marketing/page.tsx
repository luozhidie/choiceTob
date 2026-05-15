"use client";
import { useState, useEffect } from "react";
import { PaywallModal } from "@/components/PaywallModal";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  Megaphone,
  Users,
  Clock,
  Crown,
  Presentation,
  Share2,
  Target,
  Eye,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  Home,
  Repeat,
  Loader2,
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
/*  Interfaces                                                         */
/* ------------------------------------------------------------------ */
interface MarketingImage {
  id: string;
  sort_order: number;
  title: string;
  label: string;
  image_url: string;
  section: string;
  is_published: boolean;
}

/* ------------------------------------------------------------------ */
/*  Static Data                                                        */
/* ------------------------------------------------------------------ */
const activityTypes = [
  {
    icon: Crown,
    title: "VIP专场日",
    desc: "每月固定2-3场VIP专场，提前购、专属折扣、限量款优先选，强化尊贵感与归属感。",
    metrics: "转化效果显著",
  },
  {
    icon: Presentation,
    title: "主题搭配课",
    desc: "围绕季节/场合/风格开展线上搭配教学，输出专业内容的同时带动商品销售。",
    metrics: "课程转化优异",
  },
  {
    icon: Users,
    title: "老带新裂变",
    desc: "老客户推荐新客户双方享优惠，三级裂变机制，低成本高效获客。",
    metrics: "获客效率出众",
  },
  {
    icon: Clock,
    title: "线上限时企划",
    desc: "48小时限时主题活动，制造紧迫感，快速引爆销量，适合清库存与推新品。",
    metrics: "GMV提升明显",
  },
  {
    icon: Target,
    title: "B端选品会",
    desc: "定期组织线上/线下选品会，集中展示新品，高效促成批量采购决策。",
    metrics: "成交表现突出",
  },
  {
    icon: Share2,
    title: "行业分享会",
    desc: "邀请行业专家与成功客户分享经验，建立品牌专业形象，吸引潜在客户。",
    metrics: "参与规模可观",
  },
];

const trackingMetrics = [
  { icon: Eye, label: "曝光量", desc: "衡量品牌触达范围" },
  { icon: MousePointerClick, label: "点击率", desc: "评估内容吸引力" },
  { icon: ShoppingCart, label: "转化率", desc: "衡量销售转化效率" },
  { icon: TrendingUp, label: "客单价", desc: "评估活动价值提升" },
  { icon: Repeat, label: "复购率", desc: "衡量客户粘性" },
  { icon: TrendingUp, label: "ROI", desc: "综合评估营销效果" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function MarketingPage() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [calendarImages, setCalendarImages] = useState<MarketingImage[]>([]);
  const [contentImages, setContentImages] = useState<MarketingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketing_images")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching marketing images:", error);
    } else {
      const all = data || [];
      setCalendarImages(all.filter((img) => img.section === "calendar"));
      setContentImages(all.filter((img) => img.section === "content"));
    }
    setLoading(false);
  };

  const renderImageCard = (item: MarketingImage, i: number) => (
    <motion.div
      key={item.id}
      variants={fadeUp}
      custom={i}
      className="group cursor-pointer"
      onClick={() => setShowPaywall(true)}
    >
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
        <Image
          src={item.image_url}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="px-5 py-2.5 bg-white/90 text-primary text-sm font-semibold rounded-lg backdrop-blur-sm">
            查看详情
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h4 className="text-xl font-bold text-white">{item.title}</h4>
        </div>
      </div>
    </motion.div>
  );

  const renderLoading = () => (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-accent mr-3" />
      <span className="text-muted-foreground">加载中...</span>
    </div>
  );

  const renderEmpty = (sectionName: string) => (
    <div className="text-center py-12 col-span-full">
      <p className="text-muted-foreground">暂无{sectionName}数据</p>
    </div>
  );

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
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> 首页
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary">营销策划</span>
        </div>
      </nav>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-6">
              <Megaphone className="w-4 h-4" />
              精准营销，高效转化
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            营销策划<span className="text-accent">全案服务</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-white/80 leading-relaxed max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            从年度营销规划到单场活动落地，以数据驱动营销策略，全渠道精准触达目标客户，实现流量与转化的双增长。
          </motion.p>
        </div>
      </section>

      {/* ====== 年度营销日历 ====== */}
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
              Annual Calendar
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              年度营销日历
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              按季度规划营销节奏，每一季都有核心主题与活动方案。
            </p>
          </motion.div>

          {loading ? (
            renderLoading()
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {calendarImages.length > 0 ? (
                calendarImages.map((item, i) => renderImageCard(item, i))
              ) : (
                renderEmpty("年度营销日历")
              )}
            </motion.div>
          )}

          <div className="mt-10 text-center">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              查看完整日历
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== 六种核心活动类型 ====== */}
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
              Core Activities
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              六种核心活动类型
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从获客到转化到留存，覆盖营销全场景的活动矩阵。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {activityTypes.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <div className="group flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-primary">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                    {item.desc}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm font-medium text-accent">{item.metrics}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 内容营销矩阵 ====== */}
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
              Content Matrix
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              内容营销矩阵
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              多平台精准分发，内容驱动流量，流量带动转化。
            </p>
          </motion.div>

          {loading ? (
            renderLoading()
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {contentImages.length > 0 ? (
                contentImages.map((item, i) => renderImageCard(item, i))
              ) : (
                renderEmpty("内容营销矩阵")
              )}
            </motion.div>
          )}

          <div className="mt-10 text-center">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              查看完整方案
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== 营销效果追踪指标 ====== */}
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
              Tracking Metrics
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              营销效果追踪指标
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              数据驱动决策，每一个营销动作都可衡量、可优化。
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {trackingMetrics.map((item, i) => (
              <motion.div key={item.label} variants={fadeUp} custom={i}>
                <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-accent/10 text-accent shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary">{item.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
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
              <button
                onClick={() => setShowPaywall(true)}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                立即解锁
                <ChevronRight className="w-4 h-4" />
              </button>
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
              <h2 className="text-3xl sm:text-4xl font-bold">定制您的专属营销方案</h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                基于您的品牌定位与客户画像，量身定制年度营销策略与执行方案，让每一分营销投入都产生最大价值。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  定制营销方案
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/sales"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  了解销售服务
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
