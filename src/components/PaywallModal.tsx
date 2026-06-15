"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { X, CheckCircle2, Copy, Phone, MessageCircle, Star, Crown } from "lucide-react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  type?: "annual" | "single" | "course" | "subscription" | "trend" | "style_test" | "product";
}

/* ── 套餐配置 ── */
const PACKAGES = [
  {
    id: "trial",
    name: "体验会员",
    price: 29900,       // ¥299
    period: "14天",
    highlight: false,
    tag: "尝鲜",
    tagColor: "bg-green-100 text-green-700",
    features: [
      "查看所有买手选品供货价",
      "爆款货盘基础查看",
      "社群交流",
    ],
  },
  {
    id: "year1",
    name: "1年会员",
    price: 398000,      // ¥3,980
    period: "1年",
    highlight: false,
    tag: "推荐",
    tagColor: "bg-blue-100 text-blue-700",
    features: [
      "查看所有买手选品供货价",
      "每日搭配灵感9折",
      "线上风格测试不限次（非会员¥2980/次）",
      "线上课程8折",
      "爆款样衣9折",
      "杂志订阅9折",
      "社群交流 + 月度直播",
    ],
  },
  {
    id: "year2",
    name: "2年会员",
    price: 696000,      // ¥6,960（约8.7折）
    period: "2年",
    highlight: true,
    tag: "最划算",
    tagColor: "bg-amber-100 text-amber-700",
    features: [
      "1年会员全部权益",
      "总价相当于8.7折",
      "课程/样衣/杂志额外95折",
    ],
  },
  {
    id: "year3",
    name: "3年会员",
    price: 996000,      // ¥9,960（约8.3折）
    period: "3年",
    highlight: false,
    tag: "尊享",
    tagColor: "bg-purple-100 text-purple-700",
    features: [
      "2年会员全部权益",
      "总价相当于8.3折",
      "专属1v1客服",
      "门店经营数据分析报告",
    ],
  },
];

export function PaywallModal({
  isOpen,
  onClose,
  title,
  description,
  type = "single",
}: PaywallModalProps) {
  const [contactForm, setContactForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "体验会员",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[1]); // 默认选1年会员

  const supabase = useMemo(() => createClient(), []);

  if (!isOpen) return null;

  // 如果是年度会员类型，直接跳转到 VIP 页面（显示基础/进阶/高阶三个套餐）
  if (type === "annual") {
    if (typeof window !== "undefined") {
      window.location.href = "/vip";
    }
    return null;
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("请填写姓名和联系电话");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("leads").insert([
        {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          source: "paywall_purchase",
          interest: formData.service,
          notes: `邮箱: ${formData.email || "无"} | 套餐: ${selectedPackage.name} ¥${(selectedPackage.price / 100).toFixed(0)} | 补充: ${formData.message || "无"}`,
        },
      ]);
      if (error) {
        console.error("保存失败:", error);
      }
      setSubmitted(true);
    } catch (err) {
      console.error("提交错误:", err);
      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyWechat = () => {
    navigator.clipboard.writeText("luozhidie666");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDefaultTitle = () => {
    switch (type) {
      case "course": return "此课程为付费内容";
      case "subscription": return "订阅流行资讯";
      case "trend": return "此趋势报告为付费内容";
      case "style_test": return "风格测试付费";
      case "product": return "商品购买";
      case "annual": return "开通会员";
      default: return "此内容为付费内容";
    }
  };

  const getDefaultDescription = () => {
    switch (type) {
      case "course": return "购买后即可无限次观看此课程";
      case "subscription": return "订阅后可查看所有付费文章";
      case "trend": return "购买后即可查看完整的趋势报告";
      case "style_test": return "购买后即可获得2次测试机会，30天有效";
      case "product": return "购买后安排发货";
      case "annual": return "开通会员后即可查看所有内容";
      default: return "登录后购买会员或单次付费即可查看完整内容";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 标题 */}
        {!contactForm && !submitted && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">👑</div>
              <h3 className="text-xl font-bold text-primary">
                {title || getDefaultTitle()}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {description || getDefaultDescription()}
              </p>
            </div>

            {/* 套餐选择 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPackage.id === pkg.id
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  {/* 标签 */}
                  {pkg.tag && (
                    <span className={`absolute -top-2 left-4 px-2 py-0.5 rounded-full text-xs font-bold ${pkg.tagColor}`}>
                      {pkg.tag}
                    </span>
                  )}

                  <div className="font-bold text-primary mb-1">{pkg.name}</div>
                  <div className="text-2xl font-bold text-accent mb-2">
                    ¥{(pkg.price / 100).toLocaleString()}
                    <span className="text-sm font-normal text-gray-400">/{pkg.period}</span>
                  </div>
                  <ul className="space-y-1">
                    {pkg.features.slice(0, 3).map((item) => (
                      <li key={item} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                    {pkg.features.length > 3 && (
                      <li className="text-xs text-gray-400">+{pkg.features.length - 3}项权益...</li>
                    )}
                  </ul>

                  {selectedPackage.id === pkg.id && (
                    <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* 购买按钮 */}
            <button
              onClick={() => {
                setFormData({ ...formData, service: selectedPackage.name });
                setContactForm(true);
              }}
              className="w-full py-3 bg-accent text-white text-base font-bold rounded-xl hover:bg-accent/90 transition-colors shadow-lg shadow-accent/30"
            >
              立即开通 · {selectedPackage.name} · ¥{(selectedPackage.price / 100).toLocaleString()}
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              支付渠道陆续开通中，当前请联系客服完成开通
            </p>
          </>
        )}

        {/* 购买表单 */}
        {contactForm && !submitted && (
          <>
            <div className="mb-6">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-lg font-bold text-primary">开通{formData.service}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                ¥{(selectedPackage.price / 100).toLocaleString()} / {selectedPackage.period}
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">您的姓名 *</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                  placeholder="请输入您的姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
                <input
                  type="tel" required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                  placeholder="请输入联系电话"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                  placeholder="请输入邮箱（选填）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">补充说明</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm resize-none"
                  placeholder="请描述您的具体需求（选填）"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setContactForm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  返回
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-60"
                >
                  {saving ? "提交中..." : "提交开通申请"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* 支付引导 */}
        {submitted && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-primary">申请已提交！</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              请通过以下方式联系客服完成开通，开通后客服将发送测试码给您
            </p>

            <div className="mt-6 space-y-3">
              {/* 微信支付 */}
              <div className="bg-green-50 rounded-xl p-4 text-left border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="font-bold text-green-700 text-sm">微信开通</span>
                  </div>
                  <button
                    onClick={handleCopyWechat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "已复制" : "复制微信号"}
                  </button>
                </div>
                <p className="text-xs text-green-600">
                  添加微信：<span className="font-mono font-medium">luozhidie666</span>，备注"开通会员"
                </p>
              </div>

              {/* 电话 */}
              <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="font-bold text-primary text-sm">电话咨询</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("13925997776");
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-xs rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    复制
                  </button>
                </div>
                <p className="text-xs text-gray-600 font-mono">139-2599-7776</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 px-8 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
