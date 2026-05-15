"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
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
  Loader2,
  Lock,
  Eye,
  Flame,
  Star,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface BuyerProduct {
  id: string;
  name: string;
  style: string;
  color: string;
  price: number;
  score: number;
  market_heat: string;
  image_url: string;
  is_published: boolean;
  created_at: string;
}

interface BuyerStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  image_url: string;
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
/*  Static Data                                                        */
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
    desc: "将客户需求与风格基因深度匹配，精准锁定目标品类",
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
  const [paywallTitle, setPaywallTitle] = useState("");
  const [products, setProducts] = useState<BuyerProduct[]>([]);
  const [steps, setSteps] = useState<BuyerStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<BuyerProduct | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedStep, setSelectedStep] = useState<BuyerStep | null>(null);
  const [showStepDetail, setShowStepDetail] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
    fetchSteps();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("buyer_products")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchSteps = async () => {
    const { data, error } = await supabase
      .from("buyer_steps")
      .select("*")
      .eq("is_published", true)
      .order("step_number", { ascending: true });

    if (error) {
      console.error("Error fetching steps:", error);
    } else {
      setSteps(data || []);
    }
  };

  const handleProductClick = (product: BuyerProduct) => {
    setSelectedProduct(product);
    setPaywallTitle(product.name);
    setShowPaywall(true);
  };

  const handleStepClick = (step: BuyerStep) => {
    setSelectedStep(step);
    if (step.detail_content) {
      setShowStepDetail(true);
    }
  };

  const getHeatColor = (heat: string) => {
    switch (heat) {
      case "高":
        return "bg-red-100 text-red-700 border-red-200";
      case "中":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 80) return "text-accent";
    if (score >= 70) return "text-amber-600";
    return "text-gray-500";
  };

  return (
    <>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title={paywallTitle || "精选选品案例"}
        description="购买会员或单次付费即可查看完整选品数据、案例详情与供应链信息"
        type="single"
      />

      {/* Preview Modal - shows blurred preview before paywall */}
      {showPreview && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
          >
            <div className="relative aspect-[4/3]">
              {selectedProduct.image_url ? (
                <Image
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white">{selectedProduct.name}</h3>
                <p className="text-white/80 text-sm mt-1">{selectedProduct.style} · {selectedProduct.color}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-90" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getHeatColor(selectedProduct.market_heat)}`}>
                  <Flame className="w-3 h-3 inline mr-1" />
                  热度 {selectedProduct.market_heat}
                </div>
                <div className={`text-sm font-medium ${getScoreColor(selectedProduct.score)}`}>
                  <Star className="w-3.5 h-3.5 inline mr-1" />
                  评分 {selectedProduct.score}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                完整案例详情、供应商信息、价格分析与搭配建议仅对付费会员开放
              </p>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setShowPaywall(true);
                }}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                解锁查看完整内容
              </button>
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
              数据驱动的智能选品方案，帮助买手精准匹配客户需求与供应商资源，
              从源头提升爆款命中率，降低库存风险，实现选品决策的科学化升级。
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== Case Study Gallery (Dynamic from Supabase) ====== */}
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
              精选案例
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              选品案例模板库
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              海量精选选品案例，覆盖多风格多品类。购买会员后即可查看完整数据与供应链信息
            </p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-accent mr-3" />
              <span className="text-muted-foreground">加载案例中...</span>
            </div>
          ) : products.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  variants={fadeUp}
                  custom={i}
                  className="group cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-3 shadow-sm group-hover:shadow-xl transition-all duration-300">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full">
                          <Eye className="w-3 h-3 inline mr-1" />
                          点击查看
                        </span>
                      </div>
                    </div>
                    {/* Lock badge */}
                    <div className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Lock className="w-4 h-4" />
                    </div>
                    {/* Heat badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getHeatColor(product.market_heat)} backdrop-blur-sm bg-opacity-90`}>
                        <Flame className="w-3 h-3 mr-0.5" />
                        {product.market_heat}热度
                      </span>
                    </div>
                  </div>
                  <div className="px-1">
                    <h4 className="font-semibold text-primary group-hover:text-accent transition-colors line-clamp-1">
                      {product.name}
                    </h4>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        {product.style} · {product.color}
                      </span>
                      <span className={`text-xs font-medium ${getScoreColor(product.score)}`}>
                        {product.score}分
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-primary">
                        ¥{product.price}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        会员专享
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-gray-200">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">案例模板库准备中</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                精选选品案例正在整理上传中，敬请期待。您也可以联系客服了解最新选品动态。
              </p>
            </div>
          )}

          {products.length > 0 && (
            <motion.div
              className="text-center mt-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
            >
              <button
                onClick={() => {
                  setPaywallTitle("完整选品案例库");
                  setShowPaywall(true);
                }}
                className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                查看更多选品案例
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ====== Step Detail Modal ====== */}
      {showStepDetail && selectedStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowStepDetail(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white text-sm font-bold">
                  {selectedStep.step_number}
                </span>
                <h3 className="text-lg font-bold text-primary">{selectedStep.title}</h3>
              </div>
              <button onClick={() => setShowStepDetail(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {selectedStep.image_url && (
                <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-6">
                  <Image
                    src={selectedStep.image_url}
                    alt={selectedStep.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {selectedStep.detail_content}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* ====== Selection Flow (Dynamic Image Cards) ====== */}
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
              选品流程
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              四步精准选品
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从客户需求到精准推荐，数据驱动每一步选品决策
            </p>
          </motion.div>

          {steps.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {steps.map((step, i) => (
                <motion.div
                  key={step.id}
                  variants={fadeUp}
                  custom={i}
                  className="relative group cursor-pointer"
                  onClick={() => handleStepClick(step)}
                >
                  <div className="flex flex-col h-full rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-accent/30 transition-all duration-300 overflow-hidden">
                    {/* Step image */}
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {step.image_url ? (
                        <Image
                          src={step.image_url}
                          alt={step.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Search className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      {/* Step number badge */}
                      <div className="absolute -top-3 -right-1 md:static md:absolute md:top-3 md:left-3 w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center z-10">
                        {step.step_number}
                      </div>
                    </div>
                    {/* Text content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                        {step.description}
                      </p>
                      {step.detail_content && (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs text-accent font-medium">
                          查看详情 <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Arrow between steps (md+) */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-accent" />
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">选品流程图片准备中，敬请期待</p>
            </div>
          )}
        </div>
      </section>

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
                  "首单成功率提升60%，选品胜率显著高于行业平均",
                  "库存周转天数缩短30%，资金利用效率大幅提升",
                  "供应商匹配效率提升3倍，从3天缩短至1天",
                  "退换货率降低40%，客户满意度持续攀升",
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
                { num: "60%", sub: "首单成功率提升" },
                { num: "30%", sub: "库存周转天数缩短" },
                { num: "3x", sub: "供应商匹配效率" },
                { num: "40%", sub: "退换货率降低" },
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
