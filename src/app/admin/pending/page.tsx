"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Clock, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function PendingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      router.push("/admin/login");
      return;
    }
    // 如果已经被批准了，跳转到后台
    if (profile?.approval_status === "approved") {
      router.push("/admin/dashboard");
      return;
    }
    setChecking(false);
  }, [user, profile]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f4c3a]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f4c3a] mb-3">等待管理员审批</h1>
          <p className="text-gray-500 text-sm mb-2 leading-relaxed">
            您的账号注册申请已提交，需要管理员审批通过后才能登录使用后台系统。
          </p>
          <p className="text-gray-400 text-xs mb-8 leading-relaxed">
            审批结果将发送至您的邮箱 <span className="font-medium text-gray-600">{user?.email}</span>，
            <br />通常处理时间为 <span className="font-medium text-gray-600">1-2 个工作日</span>。
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-gray-500" />
              审批流程说明
            </h3>
            <ol className="text-xs text-gray-500 space-y-1.5 pl-4 list-decimal">
              <li>管理员收到您的审批申请通知</li>
              <li>管理员审核您的注册信息</li>
              <li>审批通过后，您会收到邮件通知</li>
              <li>之后即可使用注册邮箱登录后台</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/admin/login"
              className="flex-1 text-center px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              返回登录页
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              退出
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回网站首页
          </Link>
        </div>
      </div>
    </div>
  );
}
