"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Package, SlidersHorizontal, X } from "lucide-react";

interface ProductGridProps {
  products: any[];
  loading?: boolean;
  title?: string;
  emptyText?: string;
  showSearch?: boolean;
  showSortTabs?: boolean;
  showSubCategories?: boolean;
  showCount?: boolean;
  /** 默认显示的排序 Tab */
  defaultSort?: "综合" | "销量" | "上新" | "批发价";
}

const SORT_TABS = ["综合", "销量", "上新", "批发价", "筛选"] as const;
type SortTab = typeof SORT_TABS[number];

function formatPrice(price: number | null | undefined): string {
  if (!price) return "0";
  const p = Number(price);
  const yuan = p >= 100 ? Math.round(p / 100) : p;
  return "¥" + (yuan % 1 === 0 ? yuan.toString() : yuan.toFixed(2));
}

export default function ProductGrid({
  products,
  loading = false,
  title,
  emptyText = "暂无商品",
  showSearch = true,
  showSortTabs = true,
  showSubCategories = true,
  showCount = true,
  defaultSort = "综合",
}: ProductGridProps) {
  const [keyword, setKeyword] = useState("");
  const [activeSort, setActiveSort] = useState<SortTab>(defaultSort);
  const [subCategory, setSubCategory] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const subCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.subcategory) set.add(p.subcategory);
      if (p.sub_category) set.add(p.sub_category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // 关键词搜索
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || p.name || "").toLowerCase().includes(kw) ||
          (p.description || "").toLowerCase().includes(kw) ||
          (p.tags || []).some((t: string) => t.toLowerCase().includes(kw))
      );
    }

    // 子分类筛选
    if (subCategory) {
      list = list.filter((p) => p.subcategory === subCategory || p.sub_category === subCategory);
    }

    // 价格区间筛选
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    if (min !== null || max !== null) {
      list = list.filter((p) => {
        const price = p.price || 0;
        if (min !== null && price < min) return false;
        if (max !== null && price > max) return false;
        return true;
      });
    }

    // 排序
    switch (activeSort) {
      case "销量":
        list.sort((a, b) => (b.sales || 0) - (a.sales || 0));
        break;
      case "上新":
        list.sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        });
        break;
      case "批发价":
        list.sort((a, b) => {
          const aPrice = a.wholesale_price || a.price || 0;
          const bPrice = b.wholesale_price || b.price || 0;
          return aPrice - bPrice;
        });
        break;
      case "综合":
      default:
        // 保持默认顺序
        break;
    }

    return list;
  }, [products, activeSort, keyword, subCategory, minPrice, maxPrice]);

  if (loading) {
    return (
      <div className="px-4 py-4">
        {title && <h2 className="font-bold text-lg mb-4">{title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-100 rounded-xl aspect-[3/4] mb-2"></div>
              <div className="bg-gray-100 h-3 rounded w-3/4 mb-1.5"></div>
              <div className="bg-gray-100 h-3 rounded w-2/5"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* 搜索框 */}
      {showSearch && (
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
      )}

      {/* 排序 Tab */}
      {showSortTabs && (
        <div className="border-b sticky top-0 bg-white z-10">
          <div className="flex items-center px-4 gap-5 overflow-x-auto scrollbar-hide">
            {SORT_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === "筛选") {
                    setShowFilter((s) => !s);
                  } else {
                    setActiveSort(tab);
                    setShowFilter(false);
                  }
                }}
                className={`py-2.5 text-sm whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeSort === tab && tab !== "筛选"
                    ? "text-gray-900 font-semibold"
                    : "text-gray-500"
                }`}
              >
                {tab === "筛选" && <SlidersHorizontal className="w-3.5 h-3.5" />}
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 筛选面板 */}
      {showSortTabs && showFilter && (
        <div className="px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">筛选</span>
            <button
              onClick={() => {
                setShowFilter(false);
                setMinPrice("");
                setMaxPrice("");
                setSubCategory("");
              }}
              className="text-xs text-gray-500 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> 重置
            </button>
          </div>
          {showSubCategories && subCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setSubCategory("")}
                className={`px-3 py-1 rounded-full text-xs ${
                  subCategory === ""
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                全部
              </button>
              {subCategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSubCategory(sub)}
                  className={`px-3 py-1 rounded-full text-xs ${
                    subCategory === sub
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="最低价"
              className="w-24 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="最高价"
              className="w-24 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none"
            />
            <span className="text-xs text-gray-500">单位：分</span>
          </div>
        </div>
      )}

      {/* 非筛选面板状态下的子分类标签 */}
      {showSubCategories && !showFilter && subCategories.length > 0 && (
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

      {/* 商品计数 */}
      {showCount && (
        <div className="px-4 pt-3 pb-1">
          <span className="text-xs text-gray-500">共 {filteredProducts.length} 件</span>
        </div>
      )}

      {/* 商品网格 */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Package className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-400 text-base">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 py-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/shop/${product.id}`}
              className="group block"
            >
              <div className="relative overflow-hidden rounded-xl bg-gray-100 mb-2 aspect-[3/4]">
                {product.cover_image || product.image_url ? (
                  <img
                    src={product.cover_image || product.image_url}
                    alt={product.title || product.name || "商品"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                    暂无图片
                  </div>
                )}
              </div>
              <h4 className="font-medium text-gray-900 group-hover:text-pink-500 transition-colors leading-snug text-[13px] line-clamp-2">
                {product.title || product.name || "商品"}
              </h4>
              <p className="text-red-500 font-bold mt-1 text-[15px]">
                {formatPrice(product.price)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
