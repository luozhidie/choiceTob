"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import PaymentQRCode from "@/components/PaymentQRCode";
import {
  Home, X, Loader2, Palette, CheckCircle2, Lock, Unlock,
  ChevronRight, ArrowRight, Layers, Eye, Users, Tag,
  MessageCircle, Smartphone, Copy, Check, Clock, CreditCard, Crown,
  Shirt, Gem, PenTool, Scissors,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PaywallModal } from "@/components/PaywallModal";

/* ==================== 动画 ==================== */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ==================== 接口 ==================== */
interface DesignerPackage {
  id: string;
  name: string;
  description: string;
  features: string;
  price_individual: number;
  price_group: number;
  image_url: string;
  is_published: boolean;
  sort_order: number;
}

// 设计师作品接口
interface DesignerWork {
  id: string;
  title: string;
  designer: string;
  category: WorkCategory;
  cover_url: string;
  tags: string[];
}

// 作品分类类型
type WorkCategory = "womenswear" | "menswear" | "accessories" | "custom";

// 分类配置
const categories: { key: WorkCategory; label: string; icon: any }[] = [
  { key: "womenswear", label: "女装系列", icon: Shirt },
  { key: "menswear", label: "男装系列", icon: PenTool },
  { key: "accessories", label: "配饰系列", icon: Gem },
  { key: "custom", label: "定制系列", icon: Scissors },
];

// Mock 作品数据（designer_works 表不存在时使用）
const mockWorks: DesignerWork[] = [
  // 女装系列
  { id: "w1", title: "春色满园连衣裙", designer: "林小棠", category: "womenswear", cover_url: "/images/designer/womenswear-1.jpg", tags: ["2025春季", "碎花", "优雅"] },
  { id: "w2", title: "都市通勤西装套装", designer: "陈瑛", category: "womenswear", cover_url: "/images/designer/womenswear-2.jpg", tags: ["通勤", "极简", "高端"] },
  { id: "w3", title: "新中式水墨旗袍", designer: "林小棠", category: "womenswear", cover_url: "/images/designer/womenswear-3.jpg", tags: ["新中式", "水墨", "定制"] },
  { id: "w4", title: "法式茶歇裙", designer: "梁安琪", category: "womenswear", cover_url: "/images/designer/womenswear-4.jpg", tags: ["法式", "复古", "日常"] },
  // 男装系列
  { id: "m1", title: "轻商务休闲夹克", designer: "何俊杰", category: "menswear", cover_url: "/images/designer/menswear-1.jpg", tags: ["轻商务", "休闲", "百搭"] },
  { id: "m2", title: "国潮立领中山装", designer: "何俊杰", category: "menswear", cover_url: "/images/designer/menswear-2.jpg", tags: ["国潮", "中山装", "正式"] },
  { id: "m3", title: "高定婚庆西服", designer: "张铭远", category: "menswear", cover_url: "/images/designer/menswear-3.jpg", tags: ["婚庆", "高定", "西服"] },
  { id: "m4", title: "机能风户外外套", designer: "张铭远", category: "menswear", cover_url: "/images/designer/menswear-4.jpg", tags: ["机能", "户外", "科技"] },
  // 配饰系列
  { id: "a1", title: "丝巾印花设计系列", designer: "梁安琪", category: "accessories", cover_url: "/images/designer/accessories-1.jpg", tags: ["丝巾", "印花", "艺术"] },
  { id: "a2", title: "手工皮具腰带", designer: "刘工艺", category: "accessories", cover_url: "/images/designer/accessories-2.jpg", tags: ["皮具", "手工", "腰带"] },
  { id: "a3", title: "925银镶钻耳饰", designer: "刘工艺", category: "accessories", cover_url: "/images/designer/accessories-3.jpg", tags: ["银饰", "镶钻", "轻奢"] },
  { id: "a4", title: "羊绒围巾设计", designer: "梁安琪", category: "accessories", cover_url: "/images/designer/accessories-4.jpg", tags: ["羊绒", "围巾", "冬季"] },
  // 定制系列
  { id: "c1", title: "明星红毯高定礼服", designer: "林小棠", category: "custom", cover_url: "/images/designer/custom-1.jpg", tags: ["红毯", "高定", "礼服"] },
  { id: "c2", title: "品牌VI制服定制", designer: "陈瑛", category: "custom", cover_url: "/images/designer/custom-2.jpg", tags: ["品牌", "制服", "VI"] },
  { id: "c3", title: "婚纱量身定制", designer: "林小棠", category: "custom", cover_url: "/images/designer/custom-3.jpg", tags: ["婚纱", "定制", "专属"] },
];

// 设计作品订阅价格（单位：分）
const DESIGN_WORKS_MONTHLY_PRICE = 99900;  // ¥999/月
const DESIGN_WORKS_YEARLY_PRICE = 998000;  // ¥9,980/年
const DESIGN_WORKS_PLAN_ID = "design_works";

/* ── 支付步骤 ── */
type PayStep = "confirm" | "scan" | "pending";

/* ==================== 页面 ==================== */
export default function DesignerPage() {
  const [packages, setPackages] = useState<DesignerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<DesignerPackage | null>(null);
  const supabase = createClient();

  // 作品集相关状态
  const [works, setWorks] = useState<DesignerWork[]>(mockWorks);
  const [worksLoading, setWorksLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<WorkCategory>("womenswear");
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null);

  // 付费状态
  const [hasDesignWorksAccess, setHasDesignWorksAccess] = useState(false);
  const [designAccessLoading, setDesignAccessLoading] = useState(true);

  // 支付弹窗
  const [showDesignPayModal, setShowDesignPayModal] = useState(false);
  const [designPayStep, setDesignPayStep] = useState<PayStep>("confirm");
  const [payMethod, setPayMethod] = useState<"wechat" | "alipay">("wechat");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [designPaySubmitting, setDesignPaySubmitting] = useState(false);
  const [selectedDesignPlan, setSelectedDesignPlan] = useState<"monthly" | "yearly">("yearly");

  const router = useRouter();
  const { user, isMember } = useAuth();
  const autoPayShown = useRef(false);

  useEffect(() => { fetchPackages(); }, []);

  // 加载作品数据（尝试从 designer_works 表读取，失败则用 mock 数据）
  useEffect(() => {
    fetchDesignWorks();
  }, []);

  // 检查用户是否已购买设计作品权限
  useEffect(() => {
    if (user) {
      checkDesignWorksAccess();
    } else {
      setDesignAccessLoading(false);
    }
  }, [user]);

  // 已登录非付费用户自动弹窗
  useEffect(() => {
    if (user && !hasDesignWorksAccess && !designAccessLoading && !autoPayShown.current) {
      const timer = setTimeout(() => {
        setShowDesignPayModal(true);
        setDesignPayStep("confirm");
        autoPayShown.current = true;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, hasDesignWorksAccess, designAccessLoading]);

  const fetchPackages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("designer_packages")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (!error && data) setPackages(data as DesignerPackage[]);
    setLoading(false);
  };

  // 从 designer_works 表加载作品，失败则用 mock 数据
  const fetchDesignWorks = async () => {
    setWorksLoading(true);
    try {
      const { data, error } = await supabase
        .from("designer_works")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        // designer_works 表存在且有数据
        setWorks(data as DesignerWork[]);
      }
      // 否则保持 mock 数据
    } catch {
      // 表不存在，使用 mock 数据
    }
    setWorksLoading(false);
  };

  // 检查用户是否已购买设计作品查看权限
  const checkDesignWorksAccess = async () => {
    if (!user) return;
    setDesignAccessLoading(true);
    try {
      const { data, error } = await supabase
        .from("membership_orders")
        .select("*")
        .eq("user_id", user.id)
        .eq("plan_id", DESIGN_WORKS_PLAN_ID)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        // 检查是否在一个月有效期内
        const orderDate = new Date(data[0].created_at);
        const now = new Date();
        const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
        if (now.getTime() - orderDate.getTime() < oneMonthMs) {
          setHasDesignWorksAccess(true);
        }
      }
    } catch {
      // 忽略错误
    }
    setDesignAccessLoading(false);
  };

  const handlePurchase = (pkg: DesignerPackage, type: "individual" | "group") => {
    setSelectedPkg(pkg);
    setShowPaywall(true);
  };

  // 用户点击购买设计作品查看权限
  const handleDesignPurchase = () => {
    if (!user) {
      router.push(`/login?redirect=/designer`);
      return;
    }
    setShowDesignPayModal(true);
    setDesignPayStep("confirm");
  };

  // 关闭设计作品支付弹窗
  const handleCloseDesignPayModal = () => {
    setShowDesignPayModal(false);
    setDesignPayStep("confirm");
    setPayMethod("wechat");
  };

  // 用户确认已支付，创建订单
  const handleSubmitDesignPaid = async () => {
    if (!user) return;
    setDesignPaySubmitting(true);
    try {
      const { error } = await supabase.from("membership_orders").insert([
        {
          user_id: user.id,
          plan_id: DESIGN_WORKS_PLAN_ID,
          plan_name: selectedDesignPlan === "yearly" ? "原创设计·年度订阅" : "原创设计·月度订阅",
          price: selectedDesignPlan === "yearly" ? DESIGN_WORKS_YEARLY_PRICE : DESIGN_WORKS_MONTHLY_PRICE,
          payment_method: payMethod,
          status: "pending",
        },
      ]);
      if (error) throw error;
      setDesignPayStep("pending");
    } catch (err: any) {
      alert("提交失败：" + err.message);
    } finally {
      setDesignPaySubmitting(false);
    }
  };

  // 格式化价格
  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  // 当前分类的作品
  const filteredWorks = works.filter((w) => w.category === activeCategory);

  // 判断当前用户是否可以看到作品
  const canViewWorks = isMember || hasDesignWorksAccess;

  // 获取封面渐变背景色（无图片时的占位）
  const getCoverPlaceholder = (category: WorkCategory) => {
    switch (category) {
      case "womenswear": return "from-pink-100 to-rose-200";
      case "menswear": return "from-blue-100 to-indigo-200";
      case "accessories": return "from-amber-100 to-yellow-200";
      case "custom": return "from-purple-100 to-violet-200";
    }
  };

  return (
    <>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title={`购买"${selectedPkg?.name}"套餐`}
        description="联系客服完成购买后即可享受原创设计服务"
        type="single"
      />

      {/* Breadcrumb */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> 首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">原创设计</span>
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
              <Palette className="w-4 h-4" />
              专业原创设计
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              原创设计
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              专业设计师团队为您量身定制，从品牌定位到款式开发一站式解决
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== 设计套餐 ====== */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Design Service</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              选择设计套餐
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              从单款设计到整季开发，灵活满足不同品牌需求
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无套餐，敬请期待</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {packages.map((pkg, i) => (
                <motion.div
                  key={pkg.id}
                  variants={fadeUp}
                  custom={i}
                  className={`relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${
                    i === 1 ? "border-accent" : "border-transparent hover:border-accent/30"
                  }`}
                >
                  {i === 1 && (
                    <div className="absolute top-0 left-0 right-0 bg-accent text-white text-center text-sm font-bold py-1">
                      推荐
                    </div>
                  )}

                  {/* 套餐封面 */}
                  <div className={`relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden ${i === 1 ? "mt-7" : ""}`}>
                    {pkg.image_url ? (
                      <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Palette className="w-12 h-12 text-primary/30" />
                      </div>
                    )}
                  </div>

                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-primary">{pkg.name}</h3>
                    </div>

                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{pkg.description}</p>

                    {pkg.features && (
                      <ul className="space-y-2 mb-6">
                        {pkg.features.split("\n").filter(f => f.trim()).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                            {feature.trim()}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* 价格与购买 */}
                    <div className="space-y-3 pt-5 border-t border-gray-100">
                      <button
                        onClick={() => handlePurchase(pkg, "individual")}
                        className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        <span className="font-bold">¥{(pkg.price_individual / 100).toFixed(0)}</span>
                        <span className="text-xs ml-1 font-normal">/单款</span>
                      </button>
                      {pkg.price_group > 0 && (
                        <button
                          onClick={() => handlePurchase(pkg, "group")}
                          className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          团体 ¥{(pkg.price_group / 100).toFixed(0)}
                          <span className="text-xs font-normal">/3款起</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ====== 设计师作品集 ====== */}
      <section className="py-12 md:py-16 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* 标题 */}
          <motion.div
            className="text-center max-w-2xl mx-auto mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Portfolio</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              设计师作品集
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              精选原创作品，涵盖女装、男装、配饰及定制系列
            </p>
          </motion.div>

          {/* 付费状态横幅 */}
          {user && !canViewWorks && !designAccessLoading && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white rounded-2xl border border-accent/20 p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">解锁全部设计师作品</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      付费后即可查看高清大图、设计细节与设计师资料
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDesignPurchase}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all shadow-md shadow-accent/20 shrink-0"
                >
                  <Unlock className="w-4 h-4" />
                  ¥999/月 · ¥9,980/年 解锁全部作品
                </button>
              </div>
            </motion.div>
          )}

          {/* 非登录用户 */}
          {!user && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">登录后查看设计师作品</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      注册/登录即可浏览作品预览
                    </p>
                  </div>
                </div>
                <Link
                  href={`/login?redirect=/designer`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md shrink-0"
                >
                  登录后查看
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* 分类标签 */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-8">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <motion.button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </motion.button>
              );
            })}
          </div>

          {/* 作品网格 */}
          {worksLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
              <p className="text-muted-foreground">加载作品...</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
              key={activeCategory}
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {filteredWorks.map((work, i) => {
                const isBlurred = !canViewWorks;
                const Icon = categories.find((c) => c.key === work.category)?.icon || Tag;

                return (
                  <motion.div
                    key={work.id}
                    variants={fadeUp}
                    custom={i}
                    className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                    onMouseEnter={() => setHoveredWorkId(work.id)}
                    onMouseLeave={() => setHoveredWorkId(null)}
                  >
                    {/* 作品封面 */}
                    <div className={`relative aspect-[3/4] overflow-hidden bg-gradient-to-br ${getCoverPlaceholder(work.category)}`}>
                      {/* 图片占位 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="w-12 h-12 text-black/10" />
                      </div>

                      {/* 模糊效果 */}
                      {isBlurred && (
                        <div className="absolute inset-0 backdrop-blur-xl bg-white/40 z-10 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                              <Lock className="w-5 h-5 text-primary/60" />
                            </div>
                            <p className="text-xs text-primary/60 font-medium">
                              {user ? "付费解锁" : "登录查看"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 悬停信息层 */}
                      {canViewWorks && (
                        <AnimatePresence>
                          {hoveredWorkId === work.id && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10 flex flex-col justify-end p-4"
                            >
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {work.tags.map((tag) => (
                                  <span key={tag} className="text-[10px] bg-white/90 text-primary px-2 py-0.5 rounded-full font-medium">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-white/80">
                                设计师：{work.designer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>

                    {/* 作品信息 */}
                    <div className="p-4">
                      <div className="flex items-start gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          <Tag className="w-3 h-3" />
                          {categories.find((c) => c.key === work.category)?.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-primary truncate">{work.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {work.designer}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ====== 设计流程 ====== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">Workflow</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">
              原创设计流程
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {[
              { step: 1, title: "需求沟通", desc: "深入了解品牌定位与风格偏好" },
              { step: 2, title: "方案设计", desc: "设计师输出初稿，含款式图与面料建议" },
              { step: 3, title: "修改确认", desc: "根据反馈调整，直至满意确认" },
              { step: 4, title: "交付源码", desc: "提供可生产的完整技术文件" },
            ].map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <div className="relative p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="font-bold text-primary">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
                开启专属设计之旅
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                从品牌 DNA 出发，打造无可替代的产品竞争力
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  预约设计咨询
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

      {/* ====== 设计作品付费弹窗（复用VIP支付模式） ====== */}
      <AnimatePresence>
        {showDesignPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseDesignPayModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <button onClick={handleCloseDesignPayModal}
                className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>

              {/* ── Step 1: 确认 ── */}
              {designPayStep === "confirm" && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                      <Unlock className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">解锁设计师作品集</h3>
                    <p className="mt-2 text-sm text-muted-foreground">高阶VIP免费，基础VIP及非VIP需订阅</p>
                  </div>

                  {/* 月/年选择 */}
                  <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
                    <button onClick={() => setSelectedDesignPlan("yearly")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${selectedDesignPlan==="yearly"?"bg-white text-accent shadow-sm font-bold":"text-gray-500"}`}>年费 ¥9,980/年</button>
                    <button onClick={() => setSelectedDesignPlan("monthly")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${selectedDesignPlan==="monthly"?"bg-white text-accent shadow-sm font-bold":"text-gray-500"}`}>月费 ¥999/月</button>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">套餐</span>
                      <span className="text-sm font-bold text-primary">{selectedDesignPlan==="yearly"?"原创设计·年度订阅":"原创设计·月度订阅"}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">有效期</span>
                      <span className="text-sm text-gray-700">{selectedDesignPlan==="yearly"?"自开通起 1 年":"自开通起 30 天"}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">应付金额</span>
                      <span className="text-2xl font-black text-accent">{selectedDesignPlan==="yearly"?"¥9,980":"¥999"}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-6">
                    {[
                      "查看全部设计师原创作品高清大图",
                      "浏览设计师资料与风格标签",
                      "按风格/品类分类筛选作品",
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> {f}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleCloseDesignPayModal}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                      取消
                    </button>
                    <button onClick={() => setDesignPayStep("scan")}
                      className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:brightness-110 transition-all shadow-md">
                      去支付
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: 扫码支付 ── */}
              {designPayStep === "scan" && (
                <div>
                  <div className="text-center mb-5">
                    <h3 className="text-lg font-bold text-primary">扫码支付</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      应付金额 <span className="text-xl font-black text-accent">{selectedDesignPlan==="yearly"?"¥9,980":"¥999"}</span>
                    </p>
                  </div>

                  {/* 支付方式切换 */}
                  <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
                    <button
                      onClick={() => setPayMethod("wechat")}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${payMethod === "wechat" ? "bg-white text-green-600 shadow-sm" : "text-gray-500"}`}
                    >
                      <MessageCircle className="w-4 h-4" /> 微信支付
                    </button>
                    <button
                      onClick={() => setPayMethod("alipay")}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${payMethod === "alipay" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
                    >
                      <Smartphone className="w-4 h-4" /> 支付宝
                    </button>
                  </div>

                  {/* 收款信息 */}
                  <div className="bg-gray-50 rounded-xl p-5 text-center mb-5">
                    {payMethod === "wechat" ? (
                      <>
                        <div className="w-44 h-44 mx-auto mb-3">
                          <PaymentQRCode type="wechat" className="w-full h-full" />
                        </div>
                        <p className="text-sm font-bold text-gray-700 mb-1">微信扫码支付</p>
                        <p className="text-xs text-muted-foreground mb-2">打开微信扫一扫 → 确认金额 → 支付</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-mono font-bold text-green-700">luozhidie666</span>
                          <button onClick={() => { navigator.clipboard.writeText("luozhidie666"); setCopiedAccount(true); setTimeout(() => setCopiedAccount(false), 2000); }}
                            className="text-gray-400 hover:text-green-600 transition-colors">
                            {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-44 h-44 mx-auto mb-3">
                          <PaymentQRCode type="alipay" className="w-full h-full" />
                        </div>
                        <p className="text-sm font-bold text-gray-700 mb-1">支付宝扫码支付</p>
                        <p className="text-xs text-muted-foreground mb-2">打开支付宝扫一扫 → 确认金额 → 支付</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-mono font-bold text-blue-700">13925997776</span>
                          <button onClick={() => { navigator.clipboard.writeText("13925997776"); setCopiedAccount(true); setTimeout(() => setCopiedAccount(false), 2000); }}
                            className="text-gray-400 hover:text-blue-600 transition-colors">
                            {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setDesignPayStep("confirm")}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                      上一步
                    </button>
                    <button
                      onClick={handleSubmitDesignPaid}
                      disabled={designPaySubmitting}
                      className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:brightness-110 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {designPaySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      我已支付
                    </button>
                  </div>

                  <p className="mt-4 text-[11px] text-gray-400 text-center">
                    支付完成后请点击"我已支付"提交审核，我们将在24小时内确认并开通
                  </p>
                </div>
              )}

              {/* ── Step 3: 待确认 ── */}
              {designPayStep === "pending" && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">支付已提交</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    您的原创设计作品解锁订单已创建，等待后台确认
                  </p>

                  <div className="mt-5 bg-gray-50 rounded-xl p-4 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">套餐</span>
                      <span className="text-sm font-bold text-primary">原创设计作品解锁</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">支付金额</span>
                      <span className="text-sm font-bold text-accent">{selectedDesignPlan==="yearly"?"¥9,980":"¥999"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">订单状态</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> 待确认
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <button onClick={() => { setShowDesignPayModal(false); window.location.reload(); }}
                      className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                      知道了，去逛逛
                    </button>
                    <Link href="/" className="block w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors text-center">
                      返回首页
                    </Link>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400 mb-2">如有疑问请联系客服</p>
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-xs text-green-600">微信: luozhidie666</span>
                      <span className="text-xs text-blue-600">支付宝: 13925997776</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
