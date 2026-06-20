"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  ChevronLeft,
  Home,
  LayoutGrid,
  Package,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  分类中文名映射                                                   */
/* ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<string, string> = {
  护肤: "护肤",
  彩妆: "彩妆",
  养生: "养生",
  食品: "食品",
  家居: "家居",
  文创: "文创",
  艺术: "艺术",
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
  const [viewMode, setViewMode] = useState<"list" | "recommend">("list");
  const [keyword, setKeyword] = useState("");
  const [subCategory, setSubCategory] = useState(subCategoryParam || "");

  // 价格排序方向（价格 / 价格↓）
  const [priceAsc, setPriceAsc] = useState(true);

  const supabase = createClient();

  // 加载商品
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select(
            "id, title, price, cover_image, category, subcategory, created_at"
          )
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
        if (list[0]?.hasOwnProperty("sales")) {
          list.sort((a: any, b: any) => (b.sales || 0) - (a.sales || 0));
        }
        break;
      case "价格":
        list.sort((a, b) => a.price - b.price);
        break;
      case "价格↓":
        list.sort((a, b) => b.price - a.price);
        break;
      case "上新":
        list.sort((a: any, b: any) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        });
        break;
      case "综合":
      default:
        // 综合：保持默认顺序
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

  const sortTabs = ["综合", "销量", "价格", "价格↓", "上新"];

  return (
    <div className="min-h-screen bg-white">
      {/* ====== 顶部导航栏（返回 + 首页） ====== */}
      <div className="flex items-center gap-4 px-4 py-3 border-b">
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          <Home className="w-5 h-5" />
        </Link>
      </div>

      {/* ====== 搜索框 ====== */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索商品..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 border-none focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* ====== 第一行Tab：列表 | 推荐 + 网格图标 ====== */}
      <div className="border-b">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setViewMode("list")}
              className={`py-3 text-sm font-medium transition-colors relative ${
                viewMode === "list"
                  ? "text-gray-900 font-semibold"
                  : "text-gray-500"
              }`}
            >
              列表
              {viewMode === "list" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
              )}
            </button>
            <button
              onClick={() => setViewMode("recommend")}
              className={`py-3 text-sm font-medium transition-colors relative ${
                viewMode === "recommend"
                  ? "text-gray-900 font-semibold"
                  : "text-gray-500"
              }`}
            >
              推荐
              {viewMode === "recommend" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
              )}
            </button>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ====== 第二行Tab：综合 | 销量 | 价格 | 价格↓ | 上新 ====== */}
      <div className="border-b sticky top-0 bg-white z-10">
        <div className="flex items-center px-4 gap-5 overflow-x-auto scrollbar-hide">
          {sortTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 text-sm whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "text-gray-900 font-semibold"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ====== 子分类标签（如果有） ====== */}
      {subCategories.length > 0 && (
        <div className="px-4 py-2.5 border-b bg-gray-50">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSubCategory("")}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                subCategory === ""
                  ? "bg-gray-200 text-gray-800 font-medium"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              全部
            </button>
            {subCategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setSubCategory(sub)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                  subCategory === sub
                    ? "bg-gray-200 text-gray-800 font-medium"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ====== 商品计数 ====== */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-xs text-gray-500">共 {filteredProducts.length} 件</span>
      </div>

      {/* ====== 商品列表 ====== */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 py-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-100 rounded aspect-[3/4] mb-2"></div>
              <div className="bg-gray-100 h-3 rounded w-3/4 mb-1.5"></div>
              <div className="bg-gray-100 h-3 rounded w-2/5"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        /* ====== 空状态 ====== */
        <div className="flex flex-col items-center justify-center py-24">
          <Package className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-400 text-base">暂无商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 py-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/shop/${product.id}`}
              className="group block"
            >
              <div className="relative overflow-hidden rounded bg-gray-100 mb-2 aspect-[3/4]">
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
    </div>
  );
}
