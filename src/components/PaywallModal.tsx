"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Lock, Phone, Mail, CheckCircle2 } from "lucide-react";

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
    service: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  // 根据 type 设置默认标题和描述
  const getDefaultTitle = () => {
    switch (type) {
      case "course":
        return "此课程为付费内容";
      case "subscription":
        return "订阅流行资讯";
      case "trend":
        return "此趋势报告为付费内容";
      case "style_test":
        return "风格测试付费";
      case "annual":
        return "开通年度会员";
      default:
        return "此内容为付费内容";
    }
  };

  const getDefaultDescription = () => {
    switch (type) {
      case "course":
        return "购买后即可无限次观看此课程";
      case "subscription":
        return "订阅后可查看所有付费文章";
      case "trend":
        return "购买后即可查看完整的趋势报告";
      case "style_test":
        return "购买后即可获得2次测试机会，30天有效";
      case "annual":
        return "开通会员后即可查看所有内容";
      default:
        return "登录后购买会员或单次付费即可查看完整内容";
    }
  };

  if (!isOpen) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 这里可以接入Supabase保存客户联系信息
    console.log("Contact form submitted:", formData);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

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
              {/* 年度会员 */}
              <button
                onClick={() => {
                  // 暂时跳转到联系客服
                  window.location.href = "/contact";
                }}
                className="w-full p-4 rounded-xl border-2 border-accent bg-accent/5 hover:bg-accent/10 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-primary">🌟 年度会员</span>
                  <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">
                    最划算
                  </span>
                </div>
                <div className="text-2xl font-bold text-accent">¥9,800<span className="text-sm font-normal">/年</span></div>
                <ul className="mt-3 space-y-1.5">
                  {[
                    "全站内容无限查看",
                    "AI商品企划报告生成",
                    "爆款货盘实时更新",
                    "陈列搭配方案下载",
                    "营销策划模板库",
                    "VIP管理工具",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-center text-sm text-accent font-medium">
                  联系客服开通 →
                </div>
              </button>

              {/* 单次付费 */}
              <button
                onClick={() => setContactForm(true)}
                className="w-full p-4 rounded-xl border border-gray-200 hover:border-accent/30 hover:bg-accent/5 transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-primary">📄 单次付费</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  按需付费，查看单次报告或方案
                </p>
                <p className="mt-2 text-sm text-accent font-medium">
                  留下联系方式，客服将在1小时内联系您
                </p>
              </button>

              {/* 登录/注册 */}
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

        {/* 联系表单 */}
        {contactForm && !submitted && (
          <>
            <div className="mb-6">
              <div className="text-4xl mb-3">📞</div>
              <h3 className="text-lg font-bold text-primary">留下联系方式</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                客服将在1小时内联系您，为您开通服务
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  您的姓名 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                  placeholder="请输入您的姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话 *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                  placeholder="请输入联系电话"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                  placeholder="请输入邮箱（选填）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  感兴趣的服务
                </label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                >
                  <option value="">请选择</option>
                  <option value="企划报告">AI商品企划报告</option>
                  <option value="爆款货盘">爆款货盘查看</option>
                  <option value="陈列方案">陈列搭配方案</option>
                  <option value="营销策划">营销策划方案</option>
                  <option value="年度会员">年度会员咨询</option>
                  <option value="其他">其他服务</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  补充说明
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
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
                  className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
                >
                  提交
                </button>
              </div>
            </form>
          </>
        )}

        {/* 提交成功 */}
        {submitted && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-lg font-bold text-primary">提交成功！</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              客服将在1小时内联系您，请保持电话畅通
            </p>
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
