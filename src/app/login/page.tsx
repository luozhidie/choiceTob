"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/buyer";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await signIn(email, password);

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "邮箱或密码错误，请重试"
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

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
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1ab3a4]">
              <span className="text-white font-bold text-xl">骆</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-xl tracking-wide text-[#0f4c3a]">骆芷蝶智选</span>
              <span className="text-[10px] text-gray-400 tracking-widest">LUOZHDIE ZHIXUAN</span>
            </div>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-[#0f4c3a]">用户登录</h1>
          <p className="mt-2 text-gray-500 text-sm">登录后查看批发价、享受会员权益</p>
        </div>

        {/* Login Card */}
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
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1ab3a4] focus:ring-2 focus:ring-[#1ab3a4]/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                登录密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 focus:border-[#1ab3a4] focus:ring-2 focus:ring-[#1ab3a4]/20 outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0f4c3a] text-white font-semibold rounded-xl hover:bg-[#0f4c3a]/90 transition-colors shadow-lg shadow-[#0f4c3a]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "登录中..." : "立即登录"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
            <Link
              href="/register"
              className="text-sm text-[#1ab3a4] hover:text-[#159e91] font-medium transition-colors"
            >
              还没有账号？去注册
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← 返回首页
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#1ab3a4] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
