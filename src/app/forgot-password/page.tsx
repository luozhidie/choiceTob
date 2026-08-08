"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "发送失败，请稍后重试");
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#0f4c3a] mb-2">重置链接已发送</h2>
            <p className="text-gray-500 text-sm mb-6">
              请前往您的邮箱 <span className="font-semibold text-primary">{email}</span> 查收重置密码邮件，点击链接即可设置新密码。
            </p>
            <p className="text-xs text-gray-400 mb-6">
              如果未收到邮件，请检查垃圾邮件文件夹，或稍后再试。
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#0f4c3a] text-white font-semibold rounded-xl hover:bg-[#0f4c3a]/90 transition-colors"
            >
              返回登录
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
              <span className="text-white font-bold text-xl">骆</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-xl tracking-wide text-[#0f4c3a]">骆芷蝶智选</span>
              <span className="text-[10px] text-gray-400 tracking-widest">LUOZHDIE ZHIXUAN</span>
            </div>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-[#0f4c3a]">找回密码</h1>
          <p className="mt-2 text-gray-500 text-sm">输入注册邮箱，我们将发送重置链接</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {error && (
            <div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                注册邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入注册时使用的邮箱"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0f4c3a] text-white font-semibold rounded-xl hover:bg-[#0f4c3a]/90 transition-colors shadow-lg shadow-[#0f4c3a]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  发送中...
                </>
              ) : (
                "发送重置链接"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回登录
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
