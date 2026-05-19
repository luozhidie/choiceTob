"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PaywallModal } from "@/components/PaywallModal";
import {
  CATEGORIES,
  CATEGORY_MAP,
  SUBCATEGORY_MAP,
  getSubcategories,
  getCategoryPath,
} from "@/lib/categories";

interface Product {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  original_price: number | null;
  category: string | null;
  subcategory: string | null;
  tags: string[] | null;
  is_published: boolean;
  stock: number;
  supplier_name?: string | null;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(""); // "" = 全部
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("sort_order");
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [visible, setVisible] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const supabase = createClient();

  // 当前主分类的子分类列表
  const currentSubcategories = useMemo(
    () => (activeCategory ? getSubcategories(activeCategory) : []),
    [activeCategory]
  );

  useEffect(() => {
    setVisible(true);
    fetchProducts();
  }, []);

  // 切换主分类时重置子分类
  useEffect(() => {
    setActiveSubcategory("");
  }, [activeCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    /* 同时查 products + buyer_products（source=supplier_submit） */
    const { data: platformData, error: platformErr } = await supabase
      .from("products")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    const { data: buyerData, error: buyerErr } = await supabase
      .from("buyer_products")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    const merged: Product[] = [];
    if (!platformErr && platformData) {
      platformData.forEach((p: any) => merged.push({
        id: p.id, title: p.title || "平台商品", description: p.description,
        cover_image: p.cover_image || null, price: p.price || 0,
        original_price: p.original_price || null, category: p.category || null,
        subcategory: p.subcategory || null, tags: p.tags || null,
        is_published: p.is_published, stock: p.stock || 0,
      }));
    }
    if (!buyerErr && buyerData) {
      buyerData.forEach((p: any) => merged.push({
        id: p.id, title: p.title || p.name || "选品商品", description: p.description,
        cover_image: p.cover_image || null, price: p.price || 0,
        original_price: p.original_price || null, category: p.category || null,
        subcategory: p.subcategory || null, tags: p.tags || null,
        is_published: p.is_published, stock: p.stock || 0,
      }));
    }
    setProducts(merged);
    setLoading(false);
  };

  // 客户端筛选 + 排序
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // 关键词搜索
    if (searchTerm.trim()) {
      const kw = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(kw) ||
          p.description?.toLowerCase().includes(kw) ||
          p.tags?.some((t) => t.toLowerCase().includes(kw))
      );
    }

    // 主分类
    if (activeCategory) {
      list = list.filter((p) => p.category === activeCategory);
    }

    // 子分类
    if (activeSubcategory) {
      list = list.filter((p) => p.subcategory === activeSubcategory);
    }

    // 排序
    if (sortBy === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sortBy === "newest")
      list.sort(
        (a, b) =>
          new Date(b.id).getTime() - new Date(a.id).getTime()
      );

    return list;
  }, [products, searchTerm, activeCategory, activeSubcategory, sortBy]);

  const handleBuy = (product: Product) => {
    setSelectedProduct(product);
    setShowPaywall(true);
  };

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  // 每个主分类的商品数量
  const categoryCounts = useMemo(() => {
    const base = searchTerm.trim()
      ? products.filter((p) => {
          const kw = searchTerm.toLowerCase();
          return (
            p.title.toLowerCase().includes(kw) ||
            p.description?.toLowerCase().includes(kw) ||
            p.tags?.some((t) => t.toLowerCase().includes(kw))
          );
        })
      : products;
    const counts: Record<string, number> = { "": base.length };
    CATEGORIES.forEach((c) => {
      counts[c.key] = base.filter((p) => p.category === c.key).length;
    });
    return counts;
  }, [products, searchTerm]);

  const clearFilters = () => {
    setSearchTerm("");
    setActiveCategory("");
    setActiveSubcategory("");
    setSortBy("sort_order");
  };

  const hasActiveFilter = searchTerm || activeCategory || activeSubcategory || sortBy !== "sort_order";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-12 md:py-16">
        <div
          className={`container mx-auto px-4 text-center transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3">精选好物</h1>
          <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto">
            色彩顾问推荐好物，助力你的风格提升之路
          </p>
          {/* 搜索框 */}
          <div className="mt-6 max-w-lg mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索商品名称、描述、标签..."
              className="w-full pl-11 pr-10 py-3 bg-white/15 border border-white/25 rounded-xl text-sm text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 品类 Tab 导航 */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="container mx-auto px-4">
          {/* 主分类 Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => setActiveCategory("")}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !activeCategory
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-primary"
              }`}
            >
              全部
              <span className="ml-1 text-xs opacity-70">{categoryCounts[""]}</span>
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat.key
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                }`}
              >
                {cat.label}
                <span className="ml-1 text-xs opacity-70">{categoryCounts[cat.key] || 0}</span>
              </button>
            ))}

            {/* 排序 & 移动端筛选 */}
            <div className="ml-auto shrink-0 flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="sort_order">默认排序</option>
                <option value="price_asc">价格从低到高</option>
                <option value="price_desc">价格从高到低</option>
                <option value="newest">最新上架</option>
              </select>
              <button
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className="lg:hidden p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 子分类 Pills（选中主分类后显示） */}
          <AnimatePresence>
            {activeCategory && currentSubcategories.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-gray-50"
              >
                <div className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-hide">
                  <span className="text-xs text-gray-400 shrink-0 mr-1">子分类：</span>
                  <button
                    onClick={() => setActiveSubcategory("")}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      !activeSubcategory
                        ? "bg-accent text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    全部
                  </button>
                  {currentSubcategories.map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => setActiveSubcategory(sub.key)}
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        activeSubcategory === sub.key
                          ? "bg-accent text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 激活筛选提示 */}
      {hasActiveFilter && (
        <div className="bg-amber-50 border-b border-amber-100">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <p className="text-xs text-amber-700">
              已筛选：{activeCategory && CATEGORY_MAP[activeCategory]}
              {activeSubcategory && ` > ${SUBCATEGORY_MAP[activeSubcategory]}`}
              {searchTerm && ` · 关键词"${searchTerm}"`}
              {sortBy !== "sort_order" && ` · ${sortBy === "price_asc" ? "价格从低到高" : sortBy === "price_desc" ? "价格从高到低" : "最新上架"}`}
              <span className="ml-1 font-medium">（{filteredProducts.length} 件）</span>
            </p>
            <button
              onClick={clearFilters}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" /> 清除筛选
            </button>
          </div>
        </div>
      )}

      {/* 商品列表 */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {hasActiveFilter ? "没有匹配的商品，试试调整筛选条件" : "暂无商品，敬请期待"}
              </p>
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-primary hover:text-accent font-medium"
                >
                  清除筛选
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                >
                  <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30 h-full flex flex-col">
                    <Link href={`/shop/${product.id}`} className="block">
                      <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
                        {product.cover_image ? (
                          <img
                            src={product.cover_image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <ShoppingBag className="w-10 h-10 text-primary/30" />
                        )}
                      </div>
                    </Link>
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      {/* 分类标签 */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {product.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {CATEGORY_MAP[product.category] || product.category}
                          </span>
                        )}
                        {product.subcategory && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                            {SUBCATEGORY_MAP[product.subcategory] || product.subcategory}
                          </span>
                        )}
                      </div>
                      <Link href={`/shop/${product.id}`} className="block">
                        <h3 className="font-bold text-primary group-hover:text-accent transition-colors mt-1.5 line-clamp-2 text-sm md:text-base">
                          {product.title}
                        </h3>
                      </Link>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base md:text-lg font-bold text-accent">
                            {formatPrice(product.price)}
                          </span>
                          {product.original_price &&
                            product.original_price > product.price && (
                              <span className="text-[10px] text-gray-400 line-through">
                                {formatPrice(product.original_price)}
                              </span>
                            )}
                        </div>
                        <button
                          onClick={() => handleBuy(product)}
                          className="btn-accent text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-medium"
                        >
                          购买
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Paywall Modal */}
      {showPaywall && selectedProduct && (
        <PaywallModal
          isOpen={showPaywall}
          type="product"
          title={selectedProduct.title}
          description={`¥${(selectedProduct.price / 100).toFixed(0)} - 购买后安排发货`}
          onClose={() => {
            setShowPaywall(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}
