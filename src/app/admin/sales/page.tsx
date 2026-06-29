"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Store { id: string; name: string; business_goals?: Record<string, any>; }

export default function AdminSalesPlanPage() {
  const router = useRouter();

  // ── 所有 hooks 必须在任何条件 return 之前 ──
  const [mounted, setMounted] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [season, setSeason] = useState("夏季");
  const [serviceCategory, setServiceCategory] = useState("综合销售策略");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (typeof document !== "undefined") {
      const hasCookie = document.cookie.includes("admin_logged_in=true");
      if (!hasCookie) {
        router.replace("/admin/login");
      }
      // 加载店铺列表（使用 dummy client 即可）
      import("@/lib/supabase/client").then(({ createClient }) => {
        const sb = createClient();
        sb.from("stores").select("id, name").order("name").then(({ data }) => {
          if (data) setStores(data);
        });
      });
    }
  }, [mounted, router]);

  // SSR 安全：未挂载时显示占位
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

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
