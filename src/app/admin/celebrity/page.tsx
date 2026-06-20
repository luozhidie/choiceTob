"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Star, Loader2, AlertCircle,
  Search, Sparkles, Users, ChevronDown,
} from "lucide-react";

interface CelebrityItem {
  id: string;
  title: string;
  price_range: string;
  image_url: string;
  sales_volume: number;
  shop_name: string;
  styleTag?: string;
  matchTip?: string;
}

const CELEBRITIES = [
  "杨幂", "迪丽热巴", "刘亦菲", "Angelababy",
  "赵丽颖", "唐嫣", "刘诗诗", "倪妮", "宋茜", "杨紫",
];

export default function AdminCelebrityPage() {
  const router = useRouter();
  // 管理员权限检查
  useEffect(() => {
    const check = async () => {

    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 text-sm">
            <ArrowLeft className="w-4 h-4" /> 返回控制台
          </Link>
          <h1 className="text-base font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-pink-400" /> 明星同款搜索
            <span className="text-xs font-normal text-emerald-400 ml-2">● 管理后台</span>
          </h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* 搜索区 */}
        <section>
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="输入明星名称，如：杨幂"
              className="flex-1 min-w-[200px] rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm focus:border-pink-500 outline-none"
            />
            <button disabled={loading} onClick={searchCelebrity}
              className="px-5 py-2.5 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-sm font-medium flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              搜索
            </button>
          </div>

          {/* 快速选择 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CELEBRITIES.map(name => (
              <button key={name} onClick={() => { setKeyword(name); }}
                className={`px-3 py-1 rounded-full text-xs transition ${
                  keyword === name
                    ? "bg-pink-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}>
                {name}
              </button>
            ))}
          </div>

          {error && (
            <p className="mb-4 text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}

          {source && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">
              数据来源: {source === "taobao" ? "淘宝联盟" : source === "ai" ? "AI 分析" : source}
            </span>
          )}
        </section>

        {/* 结果列表 */}
        {items.length > 0 && (
          <section className="border-t border-gray-800 pt-10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              「{keyword}」同款推荐
              <span className="text-sm font-normal text-gray-500">({items.length})</span>
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map(item => (
                <div key={item.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-pink-500/50 transition group">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-pink-900/20 to-purple-900/20 flex items-center justify-center">
                      <Star className="w-12 h-12 text-gray-700" />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-medium text-sm mb-1.5 line-clamp-2">{item.title}</h4>
                    {item.price_range && (
                      <div className="text-pink-400 font-bold text-sm mb-1">{item.price_range}</div>
                    )}
                    {item.shop_name && (
                      <div className="text-xs text-gray-500 truncate">{item.shop_name}</div>
                    )}
                    {item.sales_volume > 0 && (
                      <div className="text-xs text-gray-600 mt-1">已售 {item.sales_volume}</div>
                    )}
                    {(item.styleTag || item.matchTip) && (
                      <div className="mt-2 pt-2 border-t border-gray-800">
                        {item.styleTag && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-pink-900/30 text-pink-300 mr-1">
                            {item.styleTag}
                          </span>
                        )}
                        {item.matchTip && (
                          <p className="text-xs text-gray-400 mt-1">{item.matchTip}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
