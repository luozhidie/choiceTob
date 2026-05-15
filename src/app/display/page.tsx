"use client";
import { useState, useEffect } from "react";
import { PaywallModal } from "@/components/PaywallModal";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

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
  CheckCircle2,
  Home,
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
interface DisplayImage {
  id: string;
  sort_order: number;
  title: string;
  label: string;
  image_url: string;
  section: string;
  is_published: boolean;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function DisplayPage() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [styleImages, setStyleImages] = useState<DisplayImage[]>([]);
  const [scenarioImages, setScenarioImages] = useState<DisplayImage[]>([]);
  const [layoutImages, setLayoutImages] = useState<DisplayImage[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("display_images")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching display images:", error);
    } else {
      const all = data || [];
      setStyleImages(all.filter((img) => img.section === "styles"));
      setScenarioImages(all.filter((img) => img.section === "scenarios"));
      setLayoutImages(all.filter((img) => img.section === "layouts"));
    }
    setLoading(false);
  };

  const renderImageCard = (item: DisplayImage, i: number) => (
    <motion.div
      key={item.id}
      variants={fadeUp}
      custom={i}
      className="group cursor-pointer"
      onClick={() => setShowPaywall(true)}
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
        <Image
          src={item.image_url}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
              基于科学的陈列体系与搭配方案，让每一寸空间都产生价值，
              提升门店视觉体验与连带销售率。
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== 八大风格陈列案例 ====== */}
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
              陈列案例展示
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              科学分区与场景化陈列，提升门店视觉体验与销售转化
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
              {styleImages.length > 0 ? (
                styleImages.map((item, i) => renderImageCard(item, i))
              ) : (
                renderEmpty("陈列案例")
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

      {/* ====== 场景化搭配案例 ====== */}
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
              搭配方案
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              场景化搭配案例
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从场景出发的搭配推荐，让顾客一键购齐整套造型，提升连带率
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
              {scenarioImages.length > 0 ? (
                scenarioImages.map((item, i) => renderImageCard(item, i))
              ) : (
                renderEmpty("搭配方案")
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

      {/* ====== 门店布局案例 ====== */}
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
              空间规划
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              门店布局案例
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              科学规划门店功能分区，让每一寸空间都高效产出
            </p>
          </motion.div>

          {loading ? (
            renderLoading()
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {layoutImages.length > 0 ? (
                layoutImages.map((item, i) => renderImageCard(item, i))
              ) : (
                renderEmpty("门店布局")
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
            {[
              { step: 1, title: "数据采集", desc: "收集门店基础数据", icon: Ruler },
              { step: 2, title: "风格分区", desc: "规划陈列分区与动线", icon: LayoutGrid },
              { step: 3, title: "搭配方案", desc: "设计场景化搭配方案", icon: Shirt },
              { step: 4, title: "视觉陈列", desc: "打造视觉焦点与场景陈列", icon: Palette },
              { step: 5, title: "数据复盘", desc: "追踪效果并持续优化", icon: Eye },
            ].map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <div className="group flex items-start gap-6 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">
                      {item.step}
                    </div>
                    {i < 4 && (
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
                  "连带率显著提升，顾客从买1件到买多件",
                  "客均停留时间大幅延长，深度浏览提升转化",
                  "滞销款周转明显改善，库存结构持续优化",
                  "新客进店转化率有效提升，首单金额显著增长",
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
                { num: "显著提升", sub: "连带率" },
                { num: "大幅延长", sub: "客均停留时间" },
                { num: "明显改善", sub: "滞销款周转" },
                { num: "有效提升", sub: "新客转化率" },
              ].map((item, i) => (
                <motion.div
                  key={item.sub}
                  className="flex flex-col items-center justify-center p-8 rounded-2xl bg-muted"
                  variants={fadeUp}
                  custom={i}
                >
                  <span className="text-2xl font-bold text-accent">{item.num}</span>
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
              <h3 className="text-lg font-bold text-primary">完整数据与深度分析</h3>
              <p className="mt-2 text-sm text-muted-foreground">详细商业数据、供应链信息与专业分析报告，仅对授权用户开放</p>
              <button
                onClick={() => setShowPaywall(true)}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                查看完整内容
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
