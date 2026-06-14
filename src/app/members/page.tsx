"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Award, Gem, Check, X, ChevronRight,
  TrendingUp, Gift, Shield, Star, Lock, Eye, CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

// ────────── A. 查看价格会员 ──────────
const VIEW_PRICE_PACKAGES = [
  {
    id: "trial",
    name: "14天体验卡",
    price: 1990,     // ¥19.9
    originalPrice: 9900,
    period: "14天",
    tag: "新人推荐",
    tagColor: "bg-red-500",
    desc: "14天内可查看所有商品批发价",
  },
  {
    id: "year1",
    name: "1年查看权限",
    price: 39900,    // ¥399
    originalPrice: 59900,
    period: "1年",
    desc: "1年内无限查看批发价",
  },
  {
    id: "year2",
    name: "2年查看权限",
    price: 59900,    // ¥599
    originalPrice: 119900,
    period: "2年",
    desc: "2年内无限查看批发价",
  },
  {
    id: "year3",
    name: "3年查看权限",
    price: 69900,    // ¥699
    originalPrice: 179900,
    period: "3年",
    desc: "3年内无限查看批发价",
  },
];

// ────────── B. 充值货款折扣会员 ──────────
const DEPOSIT_TIERS = [
  {
    amount: "5万",
    discount: "2.8折",
    ret: "退换5%",
    extra: "基础退换服务",
    color: "from-blue-400 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    amount: "10万",
    discount: "2.8折",
    ret: "退换10%",
    extra: "优先退换 + 专属顾问",
    color: "from-purple-400 to-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    amount: "30万",
    discount: "2.6折",
    ret: "退换20%",
    extra: "1对1企划顾问 + 免费课程",
    color: "from-amber-400 to-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    recommended: true,
  },
];

function formatPrice(price: number) {
  return `¥${(price / 100).toFixed(0)}`;
}

export default function MembersPage() {
  const [selectedPkg, setSelectedPkg] = useState<typeof VIEW_PRICE_PACKAGES[0] | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<typeof DEPOSIT_TIERS[0] | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMode, setPayMode] = useState<"view_price" | "deposit">("view_price");
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  const handleBuy = (pkg: typeof VIEW_PRICE_PACKAGES[0]) => {
    setSelectedPkg(pkg);
    setSelectedDeposit(null);
    setPayMode("view_price");
    setShowPayModal(true);
    setPaySuccess(false);
  };

  const handleDepositBuy = (tier: typeof DEPOSIT_TIERS[0]) => {
    setSelectedDeposit(tier);
    setSelectedPkg(null);
    setPayMode("deposit");
    setShowPayModal(true);
    setPaySuccess(false);
  };

  const handleClose = () => {
    setShowPayModal(false);
    setSelectedPkg(null);
    setSelectedDeposit(null);
    setPaySuccess(false);
    setPaying(false);
  };

  // 发起微信支付
  const handleWechatPay = async () => {
    if (!user) {
      alert('请先登录');
      window.location.href = '/login?redirect=/members';
      return;
    }

    setPaying(true);
    try {
      const productId = payMode === 'view_price' && selectedPkg
        ? `view_price_${selectedPkg.id}`
        : payMode === 'deposit' && selectedDeposit
        ? `deposit_${selectedDeposit.amount}`
        : '';

      const totalFee = payMode === 'view_price' && selectedPkg
        ? selectedPkg.price
        : payMode === 'deposit' && selectedDeposit
        ? parseInt(selectedDeposit.amount) * 100 // "5万" -> 50000 -> 5000000分
        : 0;

      const response = await fetch('/api/wechat-pay/unified-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          total_fee: totalFee,
          platform: 'mp', // 网站用公众号JSAPI
          openid: user.id || ''
        })
      });

      const result = await response.json();
      if (result.prepay_id) {
        // 调起微信支付
        if (typeof window !== 'undefined' && (window as any).WeixinJSBridge) {
          (window as any).WeixinJSBridge.invoke('getBrandWCPayRequest', {
            appId: result.appId,
            timeStamp: result.timeStamp,
            nonceStr: result.nonceStr,
            package: result.package,
            signType: result.signType,
            paySign: result.paySign
          }, async function(res: any) {
            if (res.err_msg === "get_brand_wcpay_request:ok") {
              // 支付成功，记录订单
              await supabase.from('membership_orders').insert([{
                user_id: user.id,
                plan_id: productId,
                amount: totalFee,
                status: 'paid',
                paid_at: new Date().toISOString()
              }]);
              setPaySuccess(true);
            } else if (res.err_msg === "get_brand_wcpay_request:cancel") {
              alert('支付已取消');
            } else {
              alert('支付失败：' + res.err_msg);
            }
            setPaying(false);
          });
        } else {
          alert('请在微信中打开此页面进行支付');
          setPaying(false);
        }
      } else {
        alert('支付发起失败：' + (result.error || '未知错误'));
        setPaying(false);
      }
    } catch (error) {
      console.error('[wechat pay]', error);
      alert('支付发起失败，请稍后重试');
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Hero ─── */}
      <div className="bg-primary text-white py-10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">VIP会员中心</h1>
          <p className="text-white/80 text-sm mb-4">查看批发价 · 享受折扣拿货 · 专属顾问服务</p>
          <a
            href="/my-reports"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
          >
            我的报告
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

        {/* ════════════════════════════════════════
            B. 充值货款折扣会员（预存折扣）
           ════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">充值货款折扣会员</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            预存货款到账户，享受<strong>更低折扣拿货</strong> + <strong>退换优惠</strong>。预存款可用于抵扣后续采购。
          </p>

          <div className="space-y-3">
            {DEPOSIT_TIERS.map((tier) => (
              <div
                key={tier.amount}
                onClick={() => handleDepositBuy(tier)}
                className={`relative bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                  tier.recommended ? "border-amber-300" : "border-gray-100"
                }`}
              >
                {tier.recommended && (
                  <span className="absolute -top-2.5 right-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    最划算
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shrink-0`}>
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold text-gray-900">{tier.amount}</span>
                      <span className="text-sm text-gray-500">预存款</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-bold text-amber-600">{tier.discount}拿货</span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-blue-600">{tier.ret}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{tier.extra}</p>
                  </div>
                </div>
                {/* 价格对比 */}
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <span className="line-through">原价¥100</span>
                    <span className="ml-2 font-bold text-accent">
                      → {tier.discount === "2.6折" ? "¥26" : "¥28"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDepositBuy(tier); }}
                    className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-medium"
                  >
                    去充值
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════
            A. 查看价格会员（付费开通）
           ════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">查看价格会员</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            付费开通后，可查看平台所有商品的<strong>批发底价</strong>。不含拿货折扣，仅解锁价格查看权限。
          </p>

          <div className="space-y-3">
            {VIEW_PRICE_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => handleBuy(pkg)}
                className={`relative bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                  pkg.tag ? "border-amber-300" : "border-gray-100 hover:border-primary/30"
                }`}
              >
                {pkg.tag && (
                  <span className={`absolute -top-2.5 right-4 ${pkg.tagColor} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
                    {pkg.tag}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{pkg.desc}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-bold text-amber-600">{formatPrice(pkg.price)}</span>
                      {pkg.originalPrice > pkg.price && (
                        <span className="text-sm text-gray-400 line-through">{formatPrice(pkg.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 区别说明 ─── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">两种会员有什么区别？</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="font-bold text-blue-800 mb-1.5">查看价格会员</p>
              <ul className="space-y-1 text-blue-700">
                <li>· 付费开通</li>
                <li>· 仅解锁价格查看</li>
                <li>· 按原价采购</li>
                <li>· 适合先了解价格</li>
              </ul>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <p className="font-bold text-amber-800 mb-1.5">货款折扣会员</p>
              <ul className="space-y-1 text-amber-700">
                <li>· 预存货款</li>
                <li>· 享受折扣拿货</li>
                <li>· 2.6-2.8折采购</li>
                <li>· 适合大量采购</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── 联系客服 ─── */}
        <div className="text-center pb-8">
          <p className="text-sm text-gray-500 mb-2">大额充值或企业合作请联系客服</p>
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg">Luozhidie-Buyer</span>
            <button
              onClick={() => navigator.clipboard?.writeText("Luozhidie-Buyer").then(() => alert("微信号已复制"))}
              className="text-xs text-green-700 underline"
            >复制</button>
          </div>
        </div>
      </div>

      {/* ─── 支付弹窗 ─── */}
      <AnimatePresence>
        {showPayModal && (selectedPkg || selectedDeposit) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {paySuccess ? "支付成功" : payMode === "deposit" ? "充值货款" : "开通查看价格会员"}
                </h3>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>

              {paySuccess ? (
                <div className="text-center py-4">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium">支付成功！</p>
                  <p className="text-sm text-gray-500 mt-1">会员已开通，即将刷新页面...</p>
                  <button onClick={handleClose} className="mt-4 px-6 py-2 bg-accent text-white text-sm font-medium rounded-xl">完成</button>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    {payMode === "deposit" && selectedDeposit ? (
                      <>
                        <p className="text-sm text-gray-600">预存{selectedDeposit.amount}货款</p>
                        <p className="text-2xl font-bold text-accent">¥{selectedDeposit.amount}</p>
                        <p className="text-xs text-gray-500 mt-1">{selectedDeposit.discount}拿货 · {selectedDeposit.ret} · {selectedDeposit.extra}</p>
                      </>
                    ) : selectedPkg ? (
                      <>
                        <p className="text-sm text-gray-600">{selectedPkg.name}</p>
                        <p className="text-2xl font-bold text-accent">{formatPrice(selectedPkg.price)}</p>
                        <p className="text-xs text-gray-500 mt-1">{selectedPkg.desc}</p>
                      </>
                    ) : null}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">支付方式</p>
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">微信</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">微信支付</p>
                        <p className="text-xs text-gray-500">推荐使用，支付后立即开通</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleWechatPay}
                    disabled={paying}
                    className="w-full py-3 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {paying ? '支付处理中...' : `微信支付 ${selectedPkg ? formatPrice(selectedPkg.price) : selectedDeposit ? `¥${selectedDeposit.amount}` : ''}`}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
