"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Search, Sparkles, ShoppingBag, ArrowRight } from "lucide-react";

const HOT_CELEBRITIES = [
  { name: "杨幂", avatar: "👩" },
  { name: "迪丽热巴", avatar: "👩🏻" },
  { name: "刘亦菲", avatar: "🧜♀️" },
  { name: "赵丽颖", avatar: "👩🦰" },
  { name: "杨紫", avatar: "👩🦱" },
  { name: "唐嫣", avatar: "👩🏼" },
  { name: "迪奥", avatar: "💎", isBrand: true },
  { name: "香奈儿", avatar: "👜", isBrand: true },
];

export default function CelebrityPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // 登录检查
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/celebrity");
        return;
      }
      setChecking(false);
    };
    checkAuth();
  }, []);

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (kw?: string) => {
    const searchKey = kw || keyword;
    if (!searchKey.trim()) return;
    setLoading(true);
    setSearched(true);
    setError("");
    try {
      const res = await fetch("/api/celebrity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: searchKey }),
      });
      const data = await res.json();
      if (data.items) {
        setResults(data.items);
      } else if (data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      setError(err.message || "搜索失败");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (p: string | number) => {
    const n = typeof p === "string" ? parseFloat(p) : p;
    return `¥${(n / 100).toFixed(0)}`;
  };

  // 登录检查中
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">正在检查登录状态...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <span className="text-primary font-medium">明星同款</span>
          </nav>
        </div>
      </div>

      {/* Hero 搜索区 */}
      <section className="bg-gradient-to-r from-primary to-accent text-white py-12 md:py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm mb-4">
            <Sparkles className="w-4 h-4" /> 明星同款搜索
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">找到明星同款货源</h1>
          <p className="text-white/70 text-sm mb-6">输入明星名称，搜索淘宝同款商品，快速找货、选品、比价。</p>

          {/* 搜索框 */}
          <div className="flex gap-2 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="输入明星名称，如：杨幂、迪丽热巴..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-gray-900 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? "搜索中..." : "搜索"}
            </button>
          </div>

          {/* 热门明星快捷入口 */}
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {HOT_CELEBRITIES.map((c) => (
              <button
                key={c.name}
                onClick={() => { setKeyword(c.name); handleSearch(c.name); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors"
              >
                <span>{c.avatar}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 搜索结果 */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-red-500 mb-2">{error}</p>
              <p className="text-xs text-gray-400">请检查 /api/celebrity 接口配置</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-2">未找到相关同款商品</p>
              <p className="text-xs text-gray-500">请尝试其他明星名称，或检查 API 配置</p>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-primary">
                  找到 {results.length} 件同款商品
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.map((item, idx) => (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-primary/30" />
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-medium text-primary line-clamp-2 mb-1">{item.name}</h4>
                      <p className="text-sm text-accent font-bold">{item.price_range || (item.zk_final_price ? formatPrice(item.zk_final_price) : "")}</p>
                      {item.sales_volume && (
                        <p className="text-[10px] text-gray-400 mt-0.5">销量 {item.sales_volume}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {!searched && !loading && (
            <div className="text-center py-16">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">输入明星名称开始搜索</p>
              <p className="text-xs text-gray-500 mt-1">支持任意明星名称，系统将搜索淘宝同款商品</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
