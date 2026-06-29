"use client";

import { useRouter } from "next/navigation";

/**
 * 销售服务页面 - 简化版（与 dashboard 保持一致的模式）
 * 不使用 Supabase client，不检查 cookie，避免 SSR/hydration 问题
 */
export default function AdminSalesPlanPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">销售服务</h1>
            <p className="text-sm text-gray-500 mt-1">为门店生成定制化销售方案</p>
          </div>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            返回后台 →
          </button>
        </div>
      </header>

      {/* 内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600">销售服务页面内容（待完善）</p>
          <p className="text-sm text-gray-400 mt-2">功能包括：销售策略生成、话术培训、VIP服务方案、连带提升建议</p>
        </div>
      </div>
    </div>
  );
}
