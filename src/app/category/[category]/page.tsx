"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Search, ArrowRight, ShoppingCart } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  分类中文名映射                                                   */
/* ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<string, string> = {
  "护肤": "护肤",
  "彩妆": "彩妆",
  "养生": "养生",
  "食品": "食品",
  "家居": "家居",
  "文创": "文创",
  "艺术": "艺术",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const category = decodeURIComponent(params.category as string);
  const subCategoryParam = searchParams.get("subCategory");

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("综合");
  const [keyword, setKeyword] = useState("");
  const [subCategory, setSubCategory] = useState(subCategoryParam || "");

  const supabase = createClient();

  // 加载商品
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, title, price, cover_image, category, subcategory, created_at")
          .eq("category", category)
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
          .limit(50);
        if (!error && data) setProducts(data);
      } catch (err) {
        console.error("加载商品失败:", err);
      }
      setLoading(false);
    };
    if (category) fetchProducts();
  }, [category]);

  // Tab 筛选逻辑
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // 子分类筛选
    if (subCategory) {
      list = list.filter((p) => p.subcategory === subCategory);
    }

    // 关键词搜索
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(kw) ||
          (p.description || "").toLowerCase().includes(kw)
      );
    }

    // Tab 排序
    switch (activeTab) {
      case "销量":
        // 如果有sales字段就按销量排序，否则按默认
        if (list[0]?.hasOwnProperty("sales")) {
          list.sort((a: any, b: any) => (b.sales || 0) - (a.sales || 0));
        }
        break;
      case "价格":
        list.sort((a, b) => a.price - b.price);
        break;
      case "上新":
        // 按创建时间排序
        list.sort((a: any, b: any) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        });
        break;
      case "综合":
      default:
        // 综合：保持默认顺序（按 sort_order）
        break;
    }

    return list;
  }, [products, activeTab, keyword, subCategory]);

  // 获取子分类列表
  const subCategories = useMemo(() => {
    const subs = new Set<string>();
    products.forEach((p) => {
      if (p.subcategory) subs.add(p.subcategory);
    });
    return Array.from(subs);
  }, [products]);

  const tabs = ["综合", "销量", "价格", "上新"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ====== 顶部区域 ====== */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {CATEGORY_LABELS[category] || category} · 精选
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            骆芷蝶智选 · 不自用 · 不分享
          </p>

          {/* 搜索栏 */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-3 max-w-2xl"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={`搜索${category}商品...`}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-100 text-sm"
              />
            </div>
            <Link
              href="/"
              className="px-5 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
            >
              返回首页 <ArrowRight className="w-4 h-4" />
            </Link>
          </form>
        </div>
      </section>

      {/* ====== 子分类标签 ====== */}
      {subCategories.length > 0 && (
        <section className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 py-3 overflow-x-auto">
              <button
                onClick={() => setSubCategory("")}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  subCategory === ""
                    ? "bg-gray-900 text-white font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                全部
              </button>
              {subCategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSubCategory(sub)}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                    subCategory === sub
                      ? "bg-gray-900 text-white font-medium"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== Tab 切换 ====== */}
      <section className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="ml-auto text-sm text-gray-400">
              {filteredProducts.length} 件商品
            </div>
          </div>
        </div>
      </section>

      {/* ====== 商品列表 ====== */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl aspect-[3/4] mb-2.5"></div>
                <div className="bg-gray-200 h-3.5 rounded w-3/4 mb-1.5"></div>
                <div className="bg-gray-200 h-3.5 rounded w-2/5"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-base">暂无商品</p>
            <p className="text-gray-300 text-sm mt-1">
              该分类下还没有上架商品，去看看其他分类吧
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.id}`}
                className="group block"
              >
                <div className="relative overflow-hidden rounded-xl bg-gray-100 mb-2.5 aspect-[3/4]">
                  {product.cover_image ? (
                    <img
                      src={product.cover_image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      暂无图片
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 group-hover:text-pink-500 transition-colors leading-snug text-[13px] line-clamp-2">
                  {product.title}
                </h4>
                <p className="text-red-500 font-bold mt-1 text-[15px]">
                  ¥{product.price}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
