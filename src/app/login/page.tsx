"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Shield } from "lucide-react";
import { motion } from "framer-motion";

/* ── 前台用户登录 ── */
function UserLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, error: authError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/buyer";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "邮箱或密码错误，请重试" : error.message);
      setLoading(false);
      return;
    }
    router.push(redirect);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h3 className="text-lg font-bold text-[#0f4c3a] mb-1">会员登录</h3>
        <p className="text-xs text-gray-500 mb-5">登录后查看批发价、享受会员权益</p>

        {(error || authError) && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" required
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">登录密码</label>
              <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80">忘记密码？</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required
                className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#0f4c3a] text-white font-semibold rounded-xl hover:bg-[#0f4c3a]/90 shadow-lg disabled:opacity-50 text-sm"
          >
            {loading ? "登录中..." : "立即登录"}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <Link href="/register" className="text-primary hover:text-primary font-medium">还没有账号？去注册</Link>
          <Link href="/" className="text-gray-400 hover:text-gray-600">← 返回首页</Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ── 后台管理员登录（完全独立，不共享 session） ── */
function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 使用 fetch 直接调 login API，不依赖 supabase auth state
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error || "登录失败，请重试");
        setLoading(false);
        return;
      }

      // 登录成功，硬跳转后台（绕过所有客户端检查）
      window.location.replace("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "网络错误，请重试");
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
      <div className="bg-gradient-to-br from-[#0f4c3a] to-[#1a3a52] rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-amber-300" />
          <h3 className="text-lg font-bold">管理员登录</h3>
        </div>
        <p className="text-xs text-white/60 mb-5">仅限授权管理员访问管理后台</p>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-400/30 text-red-200 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">管理员邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入管理员邮箱" required
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/30 focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/20 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">管理员密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required
                className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/30 focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/20 outline-none text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-amber-400 text-[#0f4c3a] font-bold rounded-xl hover:bg-amber-300 shadow-lg shadow-amber-400/30 disabled:opacity-50 text-sm"
          >
            {loading ? "登录中..." : "进入管理后台"}
          </button>
        </form>

        <div className="mt-3 pt-3 border-t border-white/10 text-center">
          <Link href="/" className="text-xs text-white/40 hover:text-white/60">← 返回网站首页</Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ── 页面 ── */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        {/* Logo */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary group-hover:bg-accent transition-colors">
              <span className="text-white font-bold text-sm tracking-wider">骆</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-primary font-bold text-base tracking-wide">骆芷蝶智选</span>
              <span className="text-[9px] text-muted-foreground tracking-[0.15em] uppercase">CHOICETOB</span>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-md space-y-6 mt-16">
          {/* 标题 */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#0f4c3a]">欢迎回来</h1>
            <p className="text-sm text-gray-500 mt-1">请选择登录方式</p>
          </div>

          {/* 上：前台登录 */}
          <UserLoginForm />

          {/* 分隔线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center"><span className="px-3 bg-gray-50 text-xs text-gray-400">管理员入口</span></div>
          </div>

          {/* 下：后台登录 */}
          <AdminLoginForm />
        </div>
      </div>
    </Suspense>
  );
}
