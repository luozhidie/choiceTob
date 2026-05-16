"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, X, Loader2, Palette, CheckCircle2,
  ChevronRight, ArrowRight, Layers, Eye,
} from "lucide-react";
import Link from "next/link";
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

/* ==================== 页面 ==================== */
export default function DesignerPage() {
  const [packages, setPackages] = useState<DesignerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<DesignerPackage | null>(null);
  const supabase = createClient();

  useEffect(() => { fetchPackages(); }, []);

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

  const handlePurchase = (pkg: DesignerPackage, type: "individual" | "group") => {
    setSelectedPkg(pkg);
    setShowPaywall(true);
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

      {/* ====== 设计流程 ====== */}
      <section className="py-16 lg:py-24 bg-muted/50">
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
    </>
  );
}
