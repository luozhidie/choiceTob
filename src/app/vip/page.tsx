"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Crown, ShieldCheck, Sparkles, Eye, FileText, HeadphonesIcon, TrendingUp,
  CreditCard, ShoppingBag, CheckCircle2, X, Clock, Zap, Star, Award, Gift,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Plan {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  membershipType: "view_price" | "deposit_discount";
  icon: any;
  gradient: string;
  features: string[];
  highlight: boolean;
}

const plans: Plan[] = [
  {
    id: "basic",
    name: "基础VIP",
    price: 198000,
    priceLabel: "¥1,980/年",
    membershipType: "view_price",
    icon: Eye,
    gradient: "from-blue-500 to-indigo-600",
    highlight: false,
    features: [
      "查看所有买手选品供货价",
      "每日搭配灵感完整浏览",
      "线上课程8折优惠",
      "企划定品报告 ¥9.9 购买权限",
      "社群交流 + 月度直播",
    ],
  },
  {
    id: "premium",
    name: "高阶VIP",
    price: 980000,
    priceLabel: "¥9,800/年",
    membershipType: "deposit_discount",
    icon: Crown,
    gradient: "from-amber-500 to-orange-600",
    highlight: true,
    features: [
      "基础VIP全部权益",
      "每季度免费企划报告 ×1",
      "专属1v1客服（微信/电话）",
      "货款充值享阶梯折扣",
      "线下到店诊断（1次/年，报销差旅）",
      "新品优先拿货权 + 返点",
      "门店经营数据分析报告",
      "VIP专属社群 + 私密直播",
    ],
  },
];

export default function VIPPage() {
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [payStep, setPayStep] = useState<"confirm" | "paying" | "success">("confirm");
  const [copiedWechat, setCopiedWechat] = useState(false);
  const [copiedAlipay, setCopiedAlipay] = useState(false);
  const [visible, setVisible] = useState(false);
  const autoPayShown = useRef(false);

  const supabase = createClient();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => { setVisible(true); }, []);

  // Auto-show pay modal for non-members (登录后弹窗引导)
  useEffect(() => {
    if (
      !authLoading && user && profile &&
      profile.membership_type === "none" && !autoPayShown.current
    ) {
      const timer = setTimeout(() => {
        setSelectedPlan(plans[0]);
        setShowPayModal(true);
        setPayStep("confirm");
        autoPayShown.current = true;
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, profile]);

  const handlePurchaseClick = (plan: Plan) => {
    if (!user) {
      router.push(`/login?redirect=/vip`);
      return;
    }
    setSelectedPlan(plan);
    setShowPayModal(true);
    setPayStep("confirm");
  };

  const handleConfirmPay = async () => {
    if (!selectedPlan || !user) return;
    setPayStep("paying");

    try {
      // 更新用户会员信息到 profiles 表
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { error } = await supabase
        .from("profiles")
        .update({
          membership_type: selectedPlan.membershipType,
          membership_expires_at: expiresAt.toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("会员开通失败:", error);
        setPayStep("confirm");
        return;
      }

      setPayStep("success");
    } catch (err) {
      console.error("支付错误:", err);
      setPayStep("confirm");
    }
  };

  const handleClosePayModal = () => {
    setShowPayModal(false);
    setPayStep("confirm");
  };

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  const currentMembershipLabel = () => {
    if (!profile || profile.membership_type === "none") return null;
    if (profile.membership_type === "view_price") return "基础VIP";
    if (profile.membership_type === "deposit_discount") return "高阶VIP";
    return "会员";
  };

  const isCurrentlyMember =
    profile &&
    profile.membership_type !== "none" &&
    profile.membership_expires_at &&
    new Date(profile.membership_expires_at) > new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16 md:py-20">
        <div
          className={`container mx-auto px-4 text-center transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-5">
            <Crown className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
            骆芷蝶 · VIP会员
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-xl mx-auto mb-2">
            企划定品控方向，供应链稳货源，落地赋能提业绩
          </p>
          <p className="text-white/60 text-xs md:text-sm max-w-lg mx-auto">
            一站式帮门店管好货、做好店、赚稳钱
          </p>

          {isCurrentlyMember && (
            <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur rounded-full">
              <CheckCircle2 className="w-5 h-5 text-green-300" />
              <span className="text-sm font-medium text-white">
                您已是{currentMembershipLabel()} · 有效期至{" "}
                {new Date(profile!.membership_expires_at!).toLocaleDateString("zh-CN")}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Plans */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className={`relative bg-white rounded-2xl border-2 overflow-hidden ${
                  plan.highlight
                    ? "border-accent shadow-lg shadow-accent/10"
                    : "border-gray-100 shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    推荐
                  </div>
                )}

                <div className="p-6 md:p-8">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}
                    >
                      <plan.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-primary">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">适合单店/小型连锁</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-3xl font-black text-primary">
                      {plan.priceLabel}
                    </span>
                    {plan.id === "premium" && (
                      <span className="ml-2 text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full font-medium">
                        日均仅 ¥27
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrentlyMember &&
                  profile?.membership_type === plan.membershipType ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-green-50 text-green-600 text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      当前套餐
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchaseClick(plan)}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                        plan.highlight
                          ? "bg-gradient-to-r from-accent to-orange-500 text-white hover:opacity-90"
                          : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      {user ? "立即开通" : "登录后开通"}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom: perks grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: ShieldCheck, title: "年度服务", desc: "付费后1年内有效" },
              { icon: Zap, title: "极速开通", desc: "支付确认后即刻生效" },
              { icon: Gift, title: "升级优惠", desc: "基础升级高阶仅补差价" },
              { icon: HeadphonesIcon, title: "专属客服", desc: "工作日 9:00-21:00" },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-4 border border-gray-100 text-center"
              >
                <item.icon className="w-6 h-6 text-primary/60 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-primary">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayModal && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleClosePayModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={handleClosePayModal}
                className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Step 1: Confirm */}
              {payStep === "confirm" && (
                <div>
                  <div className="text-center mb-6">
                    <div
                      className={`w-14 h-14 rounded-full bg-gradient-to-br ${selectedPlan.gradient} flex items-center justify-center mx-auto mb-4`}
                    >
                      <selectedPlan.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">
                      确认开通 {selectedPlan.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      开通后1年内有效，到期前可续费
                    </p>
                  </div>

                  {/* Order summary */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">套餐</span>
                      <span className="text-sm font-bold text-primary">{selectedPlan.name}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">有效期</span>
                      <span className="text-sm text-gray-700">自开通起 1 年</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">应付金额</span>
                      <span className="text-xl font-black text-accent">
                        {selectedPlan.priceLabel}
                      </span>
                    </div>
                  </div>

                  {/* Features preview */}
                  <div className="space-y-1.5 mb-6">
                    {selectedPlan.features.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        {f}
                      </div>
                    ))}
                    {selectedPlan.features.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-5.5">
                        ...等共 {selectedPlan.features.length} 项权益
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleClosePayModal}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmPay}
                      className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors shadow-md"
                    >
                      确认开通
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Paying */}
              {payStep === "paying" && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-accent border-t-transparent mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">正在开通会员...</p>
                </div>
              )}

              {/* Step 3: Success */}
              {payStep === "success" && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">开通成功！</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    您已是{selectedPlan.name}，有效期至{" "}
                    {(() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() + 1);
                      return d.toLocaleDateString("zh-CN");
                    })()}
                  </p>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => {
                        setShowPayModal(false);
                        window.location.reload();
                      }}
                      className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      开始使用VIP权益
                    </button>
                    <Link
                      href="/"
                      className="block w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors text-center"
                    >
                      返回首页
                    </Link>
                  </div>

                  {/* Offline payment */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-3">
                      如需线下支付/对公转账，请联系客服
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-50 rounded-lg p-3 text-left border border-green-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs">💬</span>
                          <span className="text-xs font-bold text-green-700">微信</span>
                        </div>
                        <p className="text-[11px] text-green-600 font-mono">luozhidie666</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("luozhidie666");
                            setCopiedWechat(true);
                            setTimeout(() => setCopiedWechat(false), 2000);
                          }}
                          className="mt-1 text-[10px] px-2 py-0.5 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          {copiedWechat ? "已复制" : "复制"}
                        </button>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-left border border-blue-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs">💙</span>
                          <span className="text-xs font-bold text-blue-700">支付宝</span>
                        </div>
                        <p className="text-[11px] text-blue-600 font-mono">13925997776</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("13925997776");
                            setCopiedAlipay(true);
                            setTimeout(() => setCopiedAlipay(false), 2000);
                          }}
                          className="mt-1 text-[10px] px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          {copiedAlipay ? "已复制" : "复制"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
