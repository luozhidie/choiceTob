"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Crown, Eye, CreditCard, CheckCircle2, X, Clock, Star,
  MessageCircle, Smartphone, Copy, Check, Loader2, ArrowRight,
  ShieldCheck, Zap, Gift, HeadphonesIcon, AlertCircle, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PaymentQRCode from "@/components/PaymentQRCode";

interface Plan {
  id: string;
  name: string;
  price: number; // 标准售价（分）
  newCustomerPrice?: number; // 新客优惠价（分）
  originalPrice?: number;
  priceLabel: string;
  discountLabel?: string;
  newCustomerLabel?: string;
  membershipType: "view_price" | "deposit_discount" | "pro";
  icon: any;
  features: string[];
  highlight: boolean;
}

const plans: Plan[] = [
  {
    id: "trial",
    name: "体验会员",
    price: 1990, // 19.9元（单位：分）
    originalPrice: 0,
    priceLabel: "¥19.9",
    discountLabel: "限时体验价",
    newCustomerLabel: "体验全部基础功能",
    membershipType: "view_price",
    icon: Sparkles,
    highlight: false,
    features: [
      "7天体验期",
      "查看所有商品批发价格",
      "每日搭配灵感查看",
      "线上风格测试工具（限3次）",
      "加入会员交流群",
      "享受会员专属折扣",
    ],
  },
  {
    id: "annual",
    name: "年度会员",
    price: 39900, // 399元
    originalPrice: 59900,
    priceLabel: "¥399/年",
    discountLabel: "省¥200",
    newCustomerLabel: "最畅销套餐",
    membershipType: "deposit_discount",
    icon: Star,
    highlight: true,
    features: [
      "全年无限次查看批发价",
      "所有商品享受会员折扣",
      "每日搭配灵感免费获取",
      "线上风格测试工具不限次使用",
      "爆款样衣优先选购权",
      "杂志内容免费阅读",
      "社群交流 + 月度直播",
      "新品上架通知推送",
    ],
  },
  {
    id: "two_year",
    name: "两年会员",
    price: 59900, // 599元
    originalPrice: 79800,
    priceLabel: "¥599/2年",
    discountLabel: "立省¥199，日均不到1元",
    membershipType: "pro",
    icon: Crown,
    highlight: false,
    features: [
      "包含年度会员全部权益",
      "额外赠送2个月使用时长",
      "商品企划资料95折优惠",
      "专属客服通道",
      "季度经营数据分析报告",
      "线下活动优先参与权",
      "生日专属礼品",
    ],
  },
  {
    id: "three_year",
    name: "三年会员",
    price: 69900, // 699元
    originalPrice: 119700,
    priceLabel: "¥699/3年",
    discountLabel: "超值！省¥498，日均仅0.64元",
    membershipType: "deposit_discount",
    icon: Crown,
    highlight: false,
    features: [
      "包含两年会员全部权益",
      "额外赠送4个月使用时长（共40个月）",
      "商品企划资料9折优惠",
      "爆款样衣7折特权",
      "专属1v1客服支持",
      "月度经营数据分析报告",
      "线下到店诊断服务（2次/年）",
      "新品优先拿货权",
      "VIP私密直播 + 高端社群",
    ],
  },
];

/* ── 支付步骤 ── */
type PayStep = "confirm" | "scan" | "pending" | "success";

export default function VIPPage() {
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [payStep, setPayStep] = useState<PayStep>("confirm");
  const [payMethod, setPayMethod] = useState<"wechat" | "alipay">("wechat");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const autoPayShown = useRef(false);

  const supabase = createClient();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => { setVisible(true); }, []);

  // 登录后非会员自动弹窗
  useEffect(() => {
    if (!authLoading && user && profile && profile.membership_type === "none" && !autoPayShown.current) {
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
    if (!user) { router.push(`/login?redirect=/vip`); return; }
    setSelectedPlan(plan);
    setShowPayModal(true);
    setPayStep("confirm");
  };

  const handleClosePayModal = () => {
    setShowPayModal(false);
    setPayStep("confirm");
    setPayMethod("wechat");
  };

  // 用户确认已支付，创建订单
  const handleSubmitPaid = async () => {
    if (!selectedPlan || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("membership_orders").insert([
        {
          user_id: user.id,
          plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
          price: selectedPlan.price,
          payment_method: payMethod,
          status: "pending",
        },
      ]);
      if (error) throw error;
      setPayStep("pending");
    } catch (err: any) {
      alert("提交失败：" + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  const isCurrentlyMember =
    profile && profile.membership_type !== "none" &&
    profile.membership_expires_at &&
    new Date(profile.membership_expires_at) > new Date();

  const currentLabel =
    (profile?.membership_type as string) === "view_price" ? "基础VIP" :
    (profile?.membership_type as string) === "pro" ? "进阶VIP" :
    (profile?.membership_type as string) === "deposit_discount" ? "高阶VIP" : "会员";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="hero-gradient text-white py-16 md:py-20">
        <div className={`container mx-auto px-4 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-5">
            <Crown className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">骆芷蝶 · VIP会员</h1>
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
                您已是{currentLabel} · 有效期至{" "}
                {new Date(profile!.membership_expires_at!).toLocaleDateString("zh-CN")}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 货款折扣会员入口 */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link href="/members" className="block bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 md:p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-primary text-base">充值货款折扣会员</h3>
                  <p className="text-sm text-gray-600 mt-0.5">预存货款享2.6-2.8折拿货 · 5万/10万/30万三档可选</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-accent font-semibold text-sm shrink-0">
                去了解 <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-12 md:pb-16 pt-2">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-6">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className={`relative bg-white rounded-2xl border-2 overflow-hidden ${plan.highlight ? "border-accent shadow-lg shadow-accent/10" : "border-gray-100 shadow-sm"}`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> 推荐
                  </div>
                )}
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${plan.highlight ? "bg-accent" : "bg-blue-500"} flex items-center justify-center`}>
                      <plan.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-primary">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">适合单店/连锁/品牌</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    {plan.originalPrice ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-400 line-through">
                          原价 ¥{(plan.originalPrice / 100).toLocaleString()}/年
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-primary">{plan.priceLabel}</span>
                          <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full font-bold">
                            {plan.discountLabel}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-3xl font-black text-primary">{plan.priceLabel}</span>
                    )}
                    {plan.id === "premium" && (
                      <span className="ml-2 text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full font-medium">日均仅 ¥82</span>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrentlyMember && profile?.membership_type === plan.membershipType ? (
                    <button disabled className="w-full py-3 rounded-xl bg-green-50 text-green-600 text-sm font-semibold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> 当前套餐
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchaseClick(plan)}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${plan.highlight ? "bg-accent text-white hover:brightness-110" : "bg-primary text-white hover:bg-primary/90"}`}
                    >
                      <CreditCard className="w-4 h-4" />
                      {user ? "立即开通" : "登录后开通"}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Perks */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, title: "年度服务", desc: "付费后1年内有效" },
              { icon: Zap, title: "极速开通", desc: "支付确认后即刻生效" },
              { icon: Gift, title: "升级优惠", desc: "基础升级高阶仅补差价" },
              { icon: HeadphonesIcon, title: "专属客服", desc: "工作日 9:00-21:00" },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClosePayModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <button onClick={handleClosePayModal}
                className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>

              {/* ── Step 1: Confirm ── */}
              {payStep === "confirm" && (
                <div>
                  <div className="text-center mb-6">
                    <div className={`w-14 h-14 rounded-full ${selectedPlan.highlight ? "bg-accent" : "bg-blue-500"} flex items-center justify-center mx-auto mb-4`}>
                      <selectedPlan.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">确认开通 {selectedPlan.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">开通后1年内有效，到期前可续费</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">套餐</span>
                      <span className="text-sm font-bold text-primary">{selectedPlan.name}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">有效期</span>
                      <span className="text-sm text-gray-700">自开通起 1 年</span>
                    </div>
                    {selectedPlan.originalPrice && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">原价</span>
                        <span className="text-sm text-gray-400 line-through">¥{(selectedPlan.originalPrice / 100).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedPlan.discountLabel && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">优惠</span>
                        <span className="text-sm font-bold text-accent">-{selectedPlan.discountLabel.replace("首年", "")}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3 mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">应付金额</span>
                      <span className="text-2xl font-black text-accent">{selectedPlan.priceLabel}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-6">
                    {selectedPlan.features.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> {f}
                      </div>
                    ))}
                    {selectedPlan.features.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-5">...等共 {selectedPlan.features.length} 项权益</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleClosePayModal}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                      取消
                    </button>
                    <button onClick={() => setPayStep("scan")}
                      className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:brightness-110 transition-all shadow-md">
                      去支付
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Scan QR ── */}
              {payStep === "scan" && (
                <div>
                  <div className="text-center mb-5">
                    <h3 className="text-lg font-bold text-primary">扫码支付</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      应付金额 <span className="text-xl font-black text-accent">{formatPrice(selectedPlan.price)}</span>
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
                        {/* 微信收款二维码 */}
                        <div className="w-44 h-44 mx-auto mb-3">
                          <PaymentQRCode type="wechat" className="w-full h-full" />
                        </div>
                        <p className="text-sm font-bold text-gray-700 mb-1">微信扫码支付</p>
                        <p className="text-xs text-muted-foreground mb-2">打开微信扫一扫 → 确认金额 → 支付</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-mono font-bold text-green-700">luozhidie666</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText("luozhidie666");
                              setCopiedAccount(true);
                              setTimeout(() => setCopiedAccount(false), 2000);
                            }}
                            className="text-gray-400 hover:text-green-600 transition-colors"
                          >
                            {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">
                          也可保存二维码后用微信扫一扫识别
                        </p>
                      </>
                    ) : (
                      <>
                        {/* 支付宝收款二维码 */}
                        <div className="w-44 h-44 mx-auto mb-3">
                          <PaymentQRCode type="alipay" className="w-full h-full" />
                        </div>
                        <p className="text-sm font-bold text-gray-700 mb-1">支付宝扫码支付</p>
                        <p className="text-xs text-muted-foreground mb-2">打开支付宝扫一扫 → 确认金额 → 支付</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-mono font-bold text-blue-700">13925997776</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText("13925997776");
                              setCopiedAccount(true);
                              setTimeout(() => setCopiedAccount(false), 2000);
                            }}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">
                          也可保存二维码后用支付宝扫一扫识别
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setPayStep("confirm")}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                      上一步
                    </button>
                    <button
                      onClick={handleSubmitPaid}
                      disabled={submitting}
                      className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:brightness-110 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      我已支付
                    </button>
                  </div>

                  <p className="mt-4 text-[11px] text-gray-400 text-center">
                    支付完成后请点击"我已支付"提交审核，我们将在24小时内确认并开通会员
                  </p>
                </div>
              )}

              {/* ── Step 3: Pending ── */}
              {payStep === "pending" && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">支付已提交</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    您的 {selectedPlan.name} 订单已创建，等待后台确认
                  </p>

                  <div className="mt-5 bg-gray-50 rounded-xl p-4 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">套餐</span>
                      <span className="text-sm font-bold text-primary">{selectedPlan.name}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">支付金额</span>
                      <span className="text-sm font-bold text-accent">{selectedPlan.priceLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">订单状态</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> 待确认
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <button onClick={() => { setShowPayModal(false); window.location.reload(); }}
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

              {/* ── Step 4: Success (由后台确认后触发) ── */}
              {payStep === "success" && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">开通成功！</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    您已是{selectedPlan.name}，有效期至{" "}
                    {(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toLocaleDateString("zh-CN"); })()}
                  </p>
                  <div className="mt-6 space-y-3">
                    <button onClick={() => { setShowPayModal(false); window.location.reload(); }}
                      className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" /> 开始使用VIP权益
                    </button>
                    <Link href="/" className="block w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors text-center">
                      返回首页
                    </Link>
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
