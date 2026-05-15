"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { PaywallModal } from "@/components/PaywallModal";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronRight,
  ArrowRight,
  Database,
  FileOutput,
  Activity,
  PieChart,
  FileText,
  CheckCircle2,
  Home,
  X,
  Loader2,
} from "lucide-react";

interface PlanningStep {
  id: string;
  step_number: number;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  items: string[];
  detail_content: string;
  is_published: boolean;
  created_at: string;
}

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
const fallbackSteps = [
  {
    icon: Database,
    title: "数据输入",
    items: ["历史销售数据", "市场趋势数据", "客户画像数据", "库存结构数据"],
  },
  {
    icon: FileOutput,
    title: "企划输出",
    items: ["商品结构规划", "色彩企划方案", "价格带分布", "季度企划书"],
  },
  {
    icon: Activity,
    title: "执行跟踪",
    items: ["到货进度跟踪", "销售数据监控", "库存预警提醒", "方案动态调整"],
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function PlanningPage() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [steps, setSteps] = useState<PlanningStep[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(true);
  const [selectedStep, setSelectedStep] = useState<PlanningStep | null>(null);
  const [showStepDetail, setShowStepDetail] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchSteps();
  }, []);

  const fetchSteps = async () => {
    setLoadingSteps(true);
    const { data, error } = await supabase
      .from("planning_steps")
      .select("*")
      .eq("is_published", true)
      .order("step_number", { ascending: true });

    if (error) {
      console.error("Error fetching steps:", error);
    } else {
      setSteps(data || []);
    }
    setLoadingSteps(false);
  };

  const handleStepClick = (step: PlanningStep) => {
    setSelectedStep(step);
    if (step.detail_content) {
      setShowStepDetail(true);
    }
  };

  return (
    <>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="完整数据与深度分析"
        description="登录后购买会员或单次付费即可查看完整内容"
        type="single"
      />

      {/* Step Detail Modal */}
      {showStepDetail && selectedStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStepDetail(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white text-sm font-bold">{selectedStep.step_number}</span>
                <h3 className="text-lg font-bold text-primary">{selectedStep.title}</h3>
              </div>
              <button onClick={() => setShowStepDetail(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {selectedStep.image_url && (
                <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-6">
                  <Image src={selectedStep.image_url} alt={selectedStep.title} fill className="object-cover" />
                </div>
              )}
              {selectedStep.items && selectedStep.items.length > 0 && (
                <ul className="flex flex-col gap-2 mb-4">
                  {selectedStep.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedStep.detail_content}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">商品企划</span>
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
              <PieChart className="w-4 h-4" />
              科学企划，利润最大化
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              商品企划
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              从数据输入到企划输出再到执行跟踪，全流程科学规划商品结构、色彩、价格与节奏，
              帮助品牌实现利润最大化与库存最优化。
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== Full Flow ====== */}
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
              企划全流程
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              商品企划全流程
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从数据到决策，从规划到执行，形成闭环的企划管理体系
            </p>
          </motion.div>

          {loadingSteps ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent mr-3" />
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : steps.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {steps.map((step, i) => (
                <motion.div key={step.id} variants={fadeUp} custom={i} className="group cursor-pointer" onClick={() => handleStepClick(step)}>
                  <div className="flex flex-col h-full rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-accent/30 transition-all duration-300 overflow-hidden">
                    {/* Step image */}
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                      {step.image_url ? (
                        <Image src={step.image_url} alt={step.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Database className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-2.5 py-1 bg-accent text-white text-xs font-bold rounded-full">STEP {step.step_number}</span>
                      </div>
                    </div>
                    {/* Text content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">{step.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                      {step.items && step.items.length > 0 && (
                        <ul className="mt-4 flex flex-col gap-2 flex-1">
                          {step.items.slice(0, 4).map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                      {step.detail_content && (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs text-accent font-medium">
                          查看详情 <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {fallbackSteps.map((step, i) => (
                <motion.div key={step.title} variants={fadeUp} custom={i}>
                  <div className="flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                        <step.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs text-accent font-semibold">STEP {i + 1}</span>
                        <h3 className="text-lg font-bold text-primary">{step.title}</h3>
                      </div>
                    </div>
                    <ul className="flex flex-col gap-3">
                      {step.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ====== 商品结构规划 - 案例展示 ====== */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              案例展示
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              商品结构规划案例
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              以下为部分案例展示，完整数据与深度分析仅对会员开放
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "快时尚品牌结构案例", desc: "少女+优雅型为主，引流款占比20%，利润款45%", color: "from-blue-100 to-blue-50" },
              { title: "高端女装结构案例", desc: "优雅+古典型为主，形象款占比30%，提升品牌溢价", color: "from-green-100 to-green-50" },
              { title: "潮牌结构案例", desc: "时尚+戏剧型为主，限量款策略，稀缺性驱动高毛利", color: "from-purple-100 to-purple-50" },
            ].map((item, i) => (
              <div
                key={item.title}
                onClick={() => setShowPaywall(true)}
                className="group cursor-pointer"
              >
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-30">🖼️</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold text-primary">{item.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              查看完整数据
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== 八大风格企划 - 案例展示 ====== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              案例展示
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              八大风格企划案例
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              以下为部分案例展示，完整数据与深度分析仅对会员开放
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "少淑风格企划案例", desc: "少女+优雅型融合，20-35岁客群，均价300-500元", color: "from-pink-100 to-pink-50" },
              { title: "职场风格企划案例", desc: "古典型为主，30-45岁客群，均价500-800元", color: "from-indigo-100 to-indigo-50" },
              { title: "潮流风格企划案例", desc: "时尚+戏剧型融合，18-30岁客群，均价200-400元", color: "from-orange-100 to-orange-50" },
            ].map((item, i) => (
              <div
                key={item.title}
                onClick={() => setShowPaywall(true)}
                className="group cursor-pointer"
              >
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-30">🖼️</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold text-primary">{item.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              查看完整数据
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== 色彩企划 - 案例展示 ====== */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              案例展示
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              色彩企划案例
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              以下为部分案例展示，完整数据与深度分析仅对会员开放
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "春季色彩案例", desc: "莫兰迪色系为主，基础色40%，主题色35%", color: "from-green-100 to-green-50" },
              { title: "夏季色彩案例", desc: "高饱和亮色为主，点缀色25%，流行色15%", color: "from-blue-100 to-blue-50" },
              { title: "秋冬色彩案例", desc: "深色系为主，基础色50%，形象色30%", color: "from-purple-100 to-purple-50" },
            ].map((item, i) => (
              <div
                key={item.title}
                onClick={() => setShowPaywall(true)}
                className="group cursor-pointer"
              >
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-30">🖼️</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold text-primary">{item.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              查看完整数据
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== 价格带企划 - 案例展示 ====== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              案例展示
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              价格带企划案例
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              以下为部分案例展示，完整数据与深度分析仅对会员开放
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "快时尚价格案例", desc: "入门款30%，主销款40%，均价200-400元", color: "from-yellow-100 to-yellow-50" },
              { title: "高端女装价格案例", desc: "品质款40%，旗舰款20%，均价500-1000元", color: "from-red-100 to-red-50" },
              { title: "潮牌价格案例", desc: "限量款策略，高溢价，均价300-600元", color: "from-teal-100 to-teal-50" },
            ].map((item, i) => (
              <div
                key={item.title}
                onClick={() => setShowPaywall(true)}
                className="group cursor-pointer"
              >
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-30">🖼️</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold text-primary">{item.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              查看完整数据
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== 季度企划书 - 案例展示 ====== */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">
              案例展示
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              季度企划书案例
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              以下为部分案例展示，完整数据与深度分析仅对会员开放
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Q1企划书案例", desc: "春季新品企划，少淑风格为主，均价300-500元", color: "from-blue-100 to-blue-50" },
              { title: "Q2企划书案例", desc: "夏季新品企划，时尚浪漫为主，均价200-400元", color: "from-green-100 to-green-50" },
              { title: "Q3企划书案例", desc: "秋冬新品企划，优雅古典型为主，均价500-800元", color: "from-purple-100 to-purple-50" },
            ].map((item, i) => (
              <div
                key={item.title}
                onClick={() => setShowPaywall(true)}
                className="group cursor-pointer"
              >
                <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow overflow-hidden relative`}>
                  <div className="text-6xl opacity-30">🖼️</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold text-primary">{item.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              查看完整数据
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== Login Prompt ====== */}
      <section className="py-12 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl text-center">
        <div className="max-w-xl mx-auto px-6">
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="text-lg font-bold text-primary">完整数据与深度分析</h3>
          <p className="mt-2 text-sm text-muted-foreground">详细商业数据、供应链信息与专业分析报告，仅对授权用户开放</p>
          <button
            onClick={() => setShowPaywall(true)}
            className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            登录查看完整内容
          </button>
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
                获取商品企划工具
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                从经验企划到数据企划，一键生成季度企划书。立即获取专业商品企划工具，开启科学企划之旅。
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  获取企划工具
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/hot-picks"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  查看爆款货盘
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
