"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Store, MapPin, TrendingUp,
  ChevronLeft, Search, Filter, Download,
  Loader2, Calendar, User, Tag,
} from "lucide-react";

interface CertifiedStore {
  id: string;
  user_id: string;
  user_email?: string;
  quiz_passed: boolean;
  style: string | null;
  monthly_sales: number | null;
  region: string | null;
  certified_at: string;
}

interface CertifiedProfile {
  id: string;
  email: string | null;
  store_owner_certified: boolean;
  certified_at: string | null;
  certified_style: string | null;
  certified_monthly_sales: number | null;
}

export default function AdminCertifiedStoresPage() {
  const [stores, setStores] = useState<CertifiedStore[]>([]);
  const [profiles, setProfiles] = useState<CertifiedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/certified-stores")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setStores(json.certifications || []);
        setProfiles(json.certified_profiles || []);
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // 合并数据：以 certifications 为主，profiles 补充
  const filtered = stores.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.user_email || "").toLowerCase().includes(q) ||
      (s.style || "").toLowerCase().includes(q) ||
      (s.region || "").toLowerCase().includes(q)
    );
  });

  const totalSales =
    (stores || []).reduce(
      (sum, s) => sum + ((s.monthly_sales || 0) as number),
      0
    ) / 100; // 分 → 元

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-500 hover:text-primary transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-primary">认证店铺</h1>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              数据积累 · 店铺管理
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            共 {stores.length} 家认证店主
          </span>
        </div>

        {/* 搜索 */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索邮箱、风格、地区..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {!error && !loading && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "认证总数",
                value: stores.length,
                icon: ShieldCheck,
                color: "text-green-600 bg-green-50",
              },
              {
                label: "累计月销",
                value: `¥${totalSales.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`,
                icon: TrendingUp,
                color: "text-blue-600 bg-blue-50",
              },
              {
                label: "已填风格",
                value: stores.filter((s) => s.style).length,
                icon: Tag,
                color: "text-purple-600 bg-purple-50",
              },
              {
                label: "已填销售额",
                value: stores.filter((s) => s.monthly_sales).length,
                icon: Store,
                color: "text-amber-600 bg-amber-50",
              },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl p-3 ${stat.color}`}>
                <stat.icon className="w-4.5 h-4.5 mb-1" />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[11px] opacity-70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{searchQuery ? "没有匹配的认证记录" : "暂无认证店主数据"}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">用户</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">常拿风格</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs hidden sm:table-cell">上月销售额</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs hidden md:table-cell">地区</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">认证时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 truncate max-w-[160px]">
                          {store.user_email || store.user_id.slice(0, 8)}
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-medium shrink-0">
                          <ShieldCheck className="w-3 h-3" /> 已认证
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {store.style ? (
                        <div className="flex flex-wrap gap-1">
                          {store.style.split(",").map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] rounded-full">
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">未填写</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {store.monthly_sales != null ? (
                        <span className="font-mono text-blue-600">
                          ¥{Math.round(store.monthly_sales / 100).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {store.region ? (
                        <span className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" /> {store.region}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-gray-500 text-xs whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(store.certified_at).toLocaleDateString("zh-CN")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
