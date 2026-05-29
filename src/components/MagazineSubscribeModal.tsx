"use client";

import { useState, useMemo } from "react";
import { X, CheckCircle2, Copy, MessageCircle, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MagazineSubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MagazineSubscribeModal({ isOpen, onClose }: MagazineSubscribeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly" | null>(null);
  const [contactForm, setContactForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", wechat: "" });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("请填写姓名和联系电话");
      return;
    }
    setSaving(true);
    try {
      const planName = selectedPlan === "monthly" ? "月费会员" : "年费会员";
      const planPrice = selectedPlan === "monthly" ? 13800 : 138000;
      await supabase.from("leads").insert([{
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        wechat: formData.wechat.trim() || null,
        source: "magazine_subscription",
        interest: planName,
        notes: `价格: ¥${planPrice / 100}/${selectedPlan === "monthly" ? "月" : "年"}`,
      }]);
      setSubmitted(true);
    } catch (err) {
      console.error("提交失败:", err);
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
        {!selectedPlan && !contactForm && !submitted && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">📰</div>
              <h3 className="text-xl font-bold text-primary">订阅时尚博主</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                解锁全部杂志文章与趋势报告
              </p>
            </div>

            <div className="space-y-3">
              {/* 月费 */}
              <button
                onClick={() => setSelectedPlan("monthly")}
                className="w-full p-4 rounded-xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-primary">📅 月费订阅</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">灵活</span>
                </div>
                <div className="text-2xl font-bold text-primary">¥138<span className="text-sm font-normal">/月</span></div>
                <ul className="mt-3 space-y-1.5">
                  {["全站文章无限阅读", "趋势报告完整查看", "30天有效期", "优先客服响应"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-center text-sm text-primary font-medium">选择此方案 →</div>
              </button>

              {/* 年费 */}
              <button
                onClick={() => setSelectedPlan("yearly")}
                className="w-full p-4 rounded-xl border-2 border-accent bg-accent/5 hover:bg-accent/10 transition-colors text-left relative"
              >
                <div className="absolute -top-2 right-4 px-2 py-0.5 bg-accent text-white text-[10px] font-bold rounded-full">推荐</div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-primary">🎁 年费订阅</span>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">最划算</span>
                </div>
                <div className="text-2xl font-bold text-accent">¥1,380<span className="text-sm font-normal">/年</span></div>
                <p className="mt-1 text-xs text-muted-foreground line-through">原价 ¥1,656/年</p>
                <ul className="mt-2 space-y-1.5">
                  {["全站文章无限阅读", "趋势报告完整查看", "365天有效期", "专属顾问1对1", "免费参加线上沙龙"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-center text-sm text-accent font-medium">选择此方案 →</div>
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              支付渠道陆续开通中，当前请联系客服完成订阅
            </p>
          </>
        )}

        {/* 确认订单 - 填写联系方式 */}
        {selectedPlan && !contactForm && !submitted && (
          <>
            <div className="mb-6">
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-xs text-gray-400 hover:text-gray-600 mb-3 inline-flex items-center gap-1"
              >
                ← 返回选择套餐
              </button>
              <div className="text-4xl mb-3">
                {selectedPlan === "yearly" ? "🎁" : "📅"}
              </div>
              <h3 className="text-lg font-bold text-primary">
                {selectedPlan === "yearly" ? "年费订阅" : "月费订阅"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedPlan === "yearly" ? "¥1,380 / 年，全站内容无限查看" : "¥138 / 月，30天有效"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {selectedPlan === "yearly" ? "年费会员" : "月费会员"}
                </span>
                <span className="font-bold text-primary">
                  ¥{selectedPlan === "yearly" ? "1,380" : "138"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setContactForm(true)}
              className="w-full py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              联系客服完成支付
            </button>
            <p className="mt-2 text-xs text-center text-muted-foreground">
              点击后将引导您添加客服微信
            </p>
          </>
        )}

        {/* 填写联系表单 */}
        {contactForm && !submitted && (
          <>
            <div className="mb-6">
              <button
                onClick={() => setContactForm(false)}
                className="text-xs text-gray-400 hover:text-gray-600 mb-3 inline-flex items-center gap-1"
              >
                ← 返回
              </button>
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-lg font-bold text-primary">
                填写联系信息
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedPlan === "yearly" ? "年费会员 ¥1,380/年（订10个月送2个月）" : "月费会员 ¥138/月"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                  placeholder="请输入您的姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号 *</label>
                <input
                  type="tel" required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                  placeholder="请输入联系电话"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">微信号</label>
                <input
                  type="text"
                  value={formData.wechat}
                  onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                  placeholder="选填，方便客服联系您"
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
                  {saving ? "提交中..." : "提交订单"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* 提交成功 - 支付引导 */}
        {submitted && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-primary">订单已提交！</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              请通过以下方式联系客服完成支付，支付后即刻开通
            </p>

            <div className="mt-6 space-y-3">
              {/* 微信 */}
              <div className="bg-green-50 rounded-xl p-4 text-left border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="font-bold text-green-700 text-sm">微信支付</span>
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
                  添加微信：<span className="font-mono font-medium">luozhidie666</span>，备注"订阅"
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
                    onClick={() => navigator.clipboard.writeText("13925997776")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white text-xs rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    复制
                  </button>
                </div>
                <p className="text-xs text-gray-600 font-mono">13925997776</p>
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
