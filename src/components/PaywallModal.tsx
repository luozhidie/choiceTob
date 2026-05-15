"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { X, CheckCircle2, Copy, Phone, MessageCircle } from "lucide-react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  type?: "annual" | "single" | "course" | "subscription" | "trend" | "style_test";
}

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
    service: "风格测试套餐",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  if (!isOpen) return null;

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
          notes: `邮箱: ${formData.email || "无"} | 补充: ${formData.message || "无"}`,
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
      case "annual": return "开通年度会员";
      default: return "此内容为付费内容";
    }
  };

  const getDefaultDescription = () => {
    switch (type) {
      case "course": return "购买后即可无限次观看此课程";
      case "subscription": return "订阅后可查看所有付费文章";
      case "trend": return "购买后即可查看完整的趋势报告";
      case "style_test": return "购买后即可获得2次测试机会，30天有效";
      case "annual": return "开通会员后即可查看所有内容";
      default: return "登录后购买会员或单次付费即可查看完整内容";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 套餐选择 */}
        {!contactForm && !submitted && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-primary">
                {title || getDefaultTitle()}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {description || getDefaultDescription()}
              </p>
            </div>

            <div className="space-y-3">
              {/* 风格测试套餐 */}
              <button
                onClick={() => {
                  setFormData({ ...formData, service: "风格测试套餐" });
                  setContactForm(true);
                }}
                className="w-full p-4 rounded-xl border-2 border-accent bg-accent/5 hover:bg-accent/10 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-primary">🎨 风格测试套餐</span>
                  <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">热门</span>
                </div>
                <div className="text-2xl font-bold text-accent">¥99</div>
                <ul className="mt-3 space-y-1.5">
                  {["可测2次（男士+女士）", "30天有效期内使用", "AI智能分析风格类型", "专属风格建议报告"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-center text-sm text-accent font-medium">立即购买 →</div>
              </button>

              {/* 年度会员 */}
              <button
                onClick={() => {
                  setFormData({ ...formData, service: "年度会员" });
                  setContactForm(true);
                }}
                className="w-full p-4 rounded-xl border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-primary">🌟 年度会员</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">最划算</span>
                </div>
                <div className="text-2xl font-bold text-primary">¥9,800<span className="text-sm font-normal">/年</span></div>
                <p className="mt-2 text-xs text-muted-foreground">
                  全站内容无限查看，AI企划报告，爆款货盘，陈列方案等全部解锁
                </p>
                <div className="mt-3 text-sm text-primary font-medium">联系客服开通 →</div>
              </button>

              <Link
                href="/admin/login"
                className="block w-full p-3 rounded-xl bg-primary text-white text-center text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                管理员/会员登录
              </Link>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              支付渠道陆续开通中，当前请联系客服完成付费
            </p>
          </>
        )}

        {/* 购买表单 */}
        {contactForm && !submitted && (
          <>
            <div className="mb-6">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-lg font-bold text-primary">购买{formData.service}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {formData.service === "风格测试套餐" ? "¥99 / 2次测试机会，30天有效" : "¥9,800 / 年，全站内容无限查看"}
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
                  {saving ? "提交中..." : "提交购买"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* 支付引导 */}
        {submitted && (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="text-lg font-bold text-primary">订单已提交！</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              请通过以下方式完成支付，支付后客服将发送测试码给您
            </p>

            <div className="mt-6 space-y-4">
              {/* 微信支付 */}
              <div className="bg-green-50 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💚</span>
                  <span className="font-bold text-green-700 text-sm">微信支付</span>
                </div>
                <p className="text-xs text-green-600 mb-2">
                  添加微信：luozhidie666，转账 ¥99
                </p>
                <button
                  onClick={handleCopyWechat}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "已复制" : "复制微信号"}
                </button>
              </div>

              {/* 支付宝 */}
              <div className="bg-blue-50 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💙</span>
                  <span className="font-bold text-blue-700 text-sm">支付宝</span>
                </div>
                <p className="text-xs text-blue-600">
                  手机号：13925997776，转账 ¥99
                </p>
              </div>

              {/* 电话 */}
              <div className="bg-gray-50 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="font-bold text-primary text-sm">电话咨询</span>
                </div>
                <p className="text-xs text-gray-600">13925997776</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 px-8 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
