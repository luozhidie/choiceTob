"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Award, Gem, Check, X, ChevronRight,
  TrendingUp, Gift, Shield, Star, Lock, Eye,
} from "lucide-react";
import Link from "next/link";

const VIP_PACKAGES = [
  {
    id: "trial",
    name: "14天超值VIP体验卡",
    price: 990,
    originalPrice: 9900,
    period: "14天",
    tag: "超值推荐",
    tagColor: "bg-red-500",
    benefits: ["体验14天尊享VIP特权", "批发价查看权限", "专属选品顾问1对1"],
    highlight: true,
  },
  {
    id: "year1",
    name: "1年VIP",
    price: 39900,
    originalPrice: 59900,
    period: "1年",
    daily: "低至每天1.10元",
    benefits: ["尊享VIP特权", "批发价采购", "专属买手顾问", "季度选品报告"],
    highlight: false,
  },
  {
    id: "year2",
    name: "2年VIP",
    price: 59900,
    originalPrice: 119900,
    period: "2年",
    daily: "低至每天0.82元",
    benefits: ["尊享VIP特权", "批发价采购", "专属买手顾问", "季度选品报告", "年度品牌课程"],
    highlight: false,
  },
  {
    id: "year3",
    name: "3年VIP",
    price: 69900,
    originalPrice: 179900,
    period: "3年",
    daily: "低至每天0.64元",
    benefits: ["尊享VIP特权", "批发价采购", "专属买手顾问", "季度选品报告", "年度品牌课程", "1对1企划顾问"],
    highlight: false,
  },
];

const VIP_LEVELS = [
  {
    level: "V1", name: "银卡会员", icon: Award,
    annualSpend: "0 - 5万", color: "from-gray-300 to-gray-400",
    textColor: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200",
    coreBenefits: ["批发价采购", "基础退换服务", "新品优先通知"],
  },
  {
    level: "V2", name: "金卡会员", icon: Crown,
    annualSpend: "5万 - 30万", color: "from-yellow-400 to-yellow-600",
    textColor: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-200",
    coreBenefits: ["折扣价采购(9.5折)", "优先退换服务", "专属买手顾问", "季度选品报告"],
  },
  {
    level: "V3", name: "黑卡会员", icon: Gem,
    annualSpend: "30万以上", color: "from-gray-700 to-gray-900",
    textColor: "text-gray-900", bgColor: "bg-gray-100", borderColor: "border-gray-300",
    coreBenefits: ["最优折扣价(9折)", "无理由退换", "1对1企划顾问", "新品首发体验", "年度品牌赋能课程"],
  },
];

const BENEFITS_TABLE = [
  { benefit: "批发价采购", v1: true, v2: true, v3: true },
  { benefit: "折扣优惠", v1: false, v2: true, v3: true },
  { benefit: "基础退换服务", v1: true, v2: true, v3: true },
  { benefit: "优先退换服务", v1: false, v2: true, v3: true },
  { benefit: "无理由退换", v1: false, v2: false, v3: true },
  { benefit: "新品优先通知", v1: true, v2: true, v3: true },
  { benefit: "专属买手顾问", v1: false, v2: true, v3: true },
  { benefit: "1对1企划顾问", v1: false, v2: false, v3: true },
  { benefit: "季度选品报告", v1: false, v2: true, v3: true },
  { benefit: "年度品牌赋能课程", v1: false, v2: false, v3: true },
];

function formatPrice(price: number) {
  return `¥${(price / 100).toFixed(0)}`;
}

export default function MembersPage() {
  const [selectedPkg, setSelectedPkg] = useState<typeof VIP_PACKAGES[0] | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleBuy = (pkg: typeof VIP_PACKAGES[0]) => {
    setSelectedPkg(pkg);
    setShowPayModal(true);
    setSubmitted(false);
    setContact("");
  };

  const handleClose = () => {
    setShowPayModal(false);
    setSelectedPkg(null);
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">VIP会员中心</h1>
          <p className="text-white/80 text-lg">尊享专属权益，开启精准选品之旅</p>
        </div>
      </div>

      {/* 会员权益说明 */}
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">会员权益说明</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            个人企业采购版会员含国内外供应商会员底价（全品类服装），
            快捷的极致采购体验。
          </p>
        </div>
      </div>

      {/* 充值套餐 */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">选择会员套餐</h2>
        <div className="space-y-4">
          {VIP_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => handleBuy(pkg)}
              className={`relative bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg ${
                pkg.highlight
                  ? "border-amber-300 bg-amber-50/30"
                  : "border-gray-100 hover:border-primary/30"
              }`}
            >
              {pkg.tag && (
                <span className={`absolute -top-3 right-4 ${pkg.tagColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  {pkg.tag}
                </span>
              )}

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-amber-600">{formatPrice(pkg.price)}</span>
                    {pkg.originalPrice > pkg.price && (
                      <span className="text-sm text-gray-400 line-through">{formatPrice(pkg.originalPrice)}</span>
                    )}
                  </div>
                  {pkg.daily && (
                    <p className="text-sm text-amber-600 mt-1">{pkg.daily}</p>
                  )}
                  {pkg.period === "14天" && (
                    <p className="text-sm text-amber-600 mt-1">体验14天尊享VIP特权</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VIP等级卡片 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">会员等级体系</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VIP_LEVELS.map((lvl) => {
            const Icon = lvl.icon;
            return (
              <div key={lvl.level} className={`bg-white rounded-2xl border ${lvl.borderColor} p-5`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lvl.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-xl font-bold ${lvl.textColor}`}>{lvl.level}</span>
                  <span className="font-semibold text-gray-900">{lvl.name}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">年消费 {lvl.annualSpend}</p>
                <ul className="space-y-1.5">
                  {lvl.coreBenefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* 权益对比表 */}
      <div className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-6">会员权益对比</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-3 font-semibold">权益项目</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-500">V1 银卡</th>
                  <th className="text-center py-3 px-3 font-semibold text-yellow-700">V2 金卡</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-900">V3 黑卡</th>
                </tr>
              </thead>
              <tbody>
                {BENEFITS_TABLE.map((row) => (
                  <tr key={row.benefit} className="border-b border-gray-100">
                    <td className="py-3 px-3">{row.benefit}</td>
                    <td className="py-3 px-3 text-center">
                      {row.v1 ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.v2 ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.v3 ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 联系客服 */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">企业采购大额充值请联系客服</p>
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg">Luozhidie-Buyer</span>
            <button
              onClick={() => navigator.clipboard?.writeText("Luozhidie-Buyer").then(() => alert("微信号已复制"))}
              className="text-xs text-green-700 underline"
            >
              复制
            </button>
          </div>
        </div>
      </div>

      {/* 支付弹窗 */}
      <AnimatePresence>
        {showPayModal && selectedPkg && (
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
                  {submitted ? "提交成功" : "开通会员"}
                </h3>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitted ? (
                <div className="text-center py-4">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium">已提交开通申请！</p>
                  <p className="text-sm text-gray-500 mt-1">客服将在24小时内联系您确认</p>
                  <button onClick={handleClose}
                    className="mt-4 px-6 py-2 bg-accent text-white text-sm font-medium rounded-xl">
                    完成
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">{selectedPkg.name}</p>
                    <p className="text-2xl font-bold text-accent">{formatPrice(selectedPkg.price)}</p>
                  </div>

                  {/* 微信收款码 */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">微信扫码付款</p>
                    <div className="flex justify-center">
                      <img src="/images/wechat-pay-qr.png" alt="微信收款码" className="w-48 h-auto rounded-xl border" />
                    </div>
                  </div>

                  {/* 银行转账 */}
                  <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-left">
                    <p className="text-sm font-medium text-gray-700 mb-1">或银行转账</p>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <p>户名：吴川市樟铺骆芷蝶教你好看穿搭小店</p>
                      <p>开户行：中国工商银行（吴川支行）</p>
                      <p>账号：2015021309200280877</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="您的手机号/微信号（方便客服联系）"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent outline-none"
                    />
                    <button
                      onClick={() => {
                        if (!contact) { alert("请填写联系方式"); return; }
                        setSubmitted(true);
                      }}
                      className="w-full py-3 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90"
                    >
                      我已付款，提交凭证
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
