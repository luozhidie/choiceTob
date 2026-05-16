"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Search, X, TrendingUp, Truck, Star, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PaywallModal } from "@/components/PaywallModal";
import { CATEGORY_MAP, SUBCATEGORY_MAP } from "@/lib/categories";

const STYLE_OPTIONS = [
  { value: "shao_nv", label: "少女型" },
  { value: "you_ya", label: "优雅型" },
  { value: "lang_man_f", label: "浪漫型" },
  { value: "shao_nian_f", label: "少年型" },
  { value: "shi_shang_f", label: "时尚型" },
  { value: "gu_dian_f", label: "古典型" },
  { value: "zi_ran_f", label: "自然型" },
  { value: "xi_ju_f", label: "戏剧型" },
];

const COLOR_SEASONS = [
  { value: "light_warm", label: "浅暖型" },
  { value: "warm_bright", label: "暖亮型" },
  { value: "clear_warm", label: "净暖型" },
  { value: "light_cool", label: "浅冷型" },
  { value: "soft_cool", label: "柔冷型" },
  { value: "cool_soft", label: "冷柔型" },
  { value: "warm_soft", label: "暖柔型" },
  { value: "soft_warm", label: "柔暖型" },
  { value: "deep_warm", label: "深暖型" },
  { value: "clear_cool", label: "净冷型" },
  { value: "cool_bright", label: "冷亮型" },
  { value: "deep_cool", label: "深冷型" },
];

const CATEGORY_OPTIONS = [
  { value: "clothing", label: "服装" },
  { value: "accessory", label: "配饰" },
  { value: "color_tools", label: "色彩工具" },
  { value: "book", label: "书籍资料" },
  { value: "pro_tool", label: "专业工具" },
];

// 供应商类型
interface Supplier {
  id: string;
  name: string;
  level: string;
  rating: number;
  description: string;
  is_published: boolean;
}

// 合并后的商品类型
interface MergedProduct {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  original_price: number | null;
  category: string | null;
  subcategory: string | null;
  color_season: string | null;
  style_type: string | null;
  stock: number;
  is_published: boolean;
  source: "platform" | "buyer"; // 平台自营 / 供应商货源
  created_at: string;
}

export default function BuyerPage() {
  const [allProducts, setAllProducts] = useState<MergedProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeStyle, setActiveStyle] = useState("");
  const [activeColor, setActiveColor] = useState("");
  const [sourceFilter, setSourceFilter] = useState(""); // "" = 全部, "platform", "buyer"
  const [sortBy, setSortBy] = useState("sort_order");
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MergedProduct | null>(null);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setVisible(true);
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    // 并行请求：buyer_products + products + suppliers
    const [buyerRes, platformRes, supplierRes] = await Promise.all([
      supabase.from("buyer_products").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
      supabase.from("products").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
      supabase.from("suppliers").select("*").eq("is_published", true).order("rating", { ascending: false }),
    ]);

    const merged: MergedProduct[] = [];

    if (!buyerRes.error && buyerRes.data) {
      buyerRes.data.forEach((p: any) => {
        merged.push({
          id: p.id,
          title: p.title || p.name || "选品商品",
          description: p.description,
          cover_image: p.cover_image || p.image_url || null,
          price: p.price || 0,
          original_price: p.original_price || null,
          category: p.category || null,
          subcategory: p.subcategory || null,
          color_season: p.color_season || null,
          style_type: p.style_type || null,
          stock: p.stock || 0,
          is_published: p.is_published,
          source: "buyer",
          created_at: p.created_at,
        });
      });
    }

    if (!platformRes.error && platformRes.data) {
      platformRes.data.forEach((p: any) => {
        merged.push({
          id: p.id,
          title: p.title || "平台商品",
          description: p.description,
          cover_image: p.cover_image || null,
          price: p.price || 0,
          original_price: p.original_price || null,
          category: p.category || null,
          subcategory: p.subcategory || null,
          color_season: null,
          style_type: null,
          stock: p.stock || 0,
          is_published: p.is_published,
          source: "platform",
          created_at: p.created_at,
        });
      });
    }

    setAllProducts(merged);

    if (!supplierRes.error && supplierRes.data) {
      setSuppliers(supplierRes.data as Supplier[]);
    }

    setLoading(false);
  };

  // 筛选 + 排序
  const filteredProducts = useMemo(() => {
    let list = [...allProducts];

    if (sourceFilter) {
      list = list.filter((p) => p.source === sourceFilter);
    }

    if (searchTerm.trim()) {
      const kw = searchTerm.toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(kw) || (p.description || "").toLowerCase().includes(kw)
      );
    }

    if (activeCategory) {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (activeStyle && sourceFilter !== "platform") {
      // 平台自营商品没有风格字段，仅在供应商货源中筛选
      list = list.filter((p) => p.style_type === activeStyle);
    }

    if (activeColor && sourceFilter !== "platform") {
      list = list.filter((p) => p.color_season === activeColor);
    }

    if (sortBy === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price);

    return list;
  }, [allProducts, searchTerm, activeCategory, activeStyle, activeColor, sourceFilter, sortBy]);

  const handleBuy = (product: MergedProduct) => {
    setSelectedProduct(product);
    setShowPaywall(true);
  };

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;
  const getImage = (p: MergedProduct) => p.cover_image;

  const clearFilters = () => {
    setSearchTerm("");
    setActiveCategory("");
    setActiveStyle("");
    setActiveColor("");
    setSourceFilter("");
    setSortBy("sort_order");
  };

  const hasActiveFilter = activeCategory || activeStyle || activeColor || sourceFilter || sortBy !== "sort_order";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-12 md:py-16">
        <div className={`container mx-auto px-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-6 h-6" />
            <h1 className="text-3xl md:text-4xl font-bold">买手选品</h1>
          </div>
          <p className="text-sm md:text-base text-white/80 max-w-2xl mb-6">
            B端专属选品平台，按品类、风格、色彩精准选品，充值会员享专属拿货折扣
          </p>
          {/* 搜索框 */}
          <div className="max-w-lg relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索商品名称、描述..."
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

      {/* 筛选栏 */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="container mx-auto px-4 py-3">
          {/* 商品来源 + 品类 + 排序 */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {/* 商品来源筛选 */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setSourceFilter("")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  !sourceFilter ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setSourceFilter(sourceFilter === "platform" ? "" : "platform")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  sourceFilter === "platform" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                平台自营
              </button>
              <button
                onClick={() => setSourceFilter(sourceFilter === "buyer" ? "" : "buyer")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  sourceFilter === "buyer" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                供应商货源
              </button>
            </div>

            <div className="w-px h-5 bg-gray-200 shrink-0" />

            {/* 品类 */}
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(activeCategory === cat.value ? "" : cat.value)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === cat.value ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat.label}
              </button>
            ))}

            <div className="ml-auto shrink-0 flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none"
              >
                <option value="sort_order">默认排序</option>
                <option value="price_asc">价格从低到高</option>
                <option value="price_desc">价格从高到低</option>
              </select>
            </div>
          </div>

          {/* 风格筛选 */}
          <AnimatePresence>
            {(!sourceFilter || sourceFilter === "buyer") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 mt-2 overflow-x-auto scrollbar-hide">
                  <span className="text-xs text-gray-400 shrink-0">风格：</span>
                  {STYLE_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setActiveStyle(activeStyle === s.value ? "" : s.value)}
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                        activeStyle === s.value
                          ? "bg-accent text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 色彩季型筛选 */}
          <AnimatePresence>
            {(!sourceFilter || sourceFilter === "buyer") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-hide pb-1">
                  <span className="text-xs text-gray-400 shrink-0">色彩：</span>
                  {COLOR_SEASONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setActiveColor(activeColor === c.value ? "" : c.value)}
                      className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                        activeColor === c.value
                          ? "bg-primary text-white"
                          : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {c.label}
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
              {sourceFilter === "platform" && "平台自营 "}
              {sourceFilter === "buyer" && "供应商货源 "}
              {activeCategory && `品类"${CATEGORY_MAP[activeCategory] || activeCategory}" `}
              {activeStyle && `· 风格"${STYLE_OPTIONS.find(s => s.value === activeStyle)?.label}" `}
              {activeColor && `· 色彩"${COLOR_SEASONS.find(c => c.value === activeColor)?.label}" `}
              <span className="font-medium">（{filteredProducts.length} 件）</span>
            </p>
            <button onClick={clearFilters} className="text-xs text-amber-600 hover:text-amber-800 font-medium">
              清除筛选
            </button>
          </div>
        </div>
      )}

      {/* 充值档位提示 */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <h3 className="text-sm font-bold text-primary mb-3">充值会员专属折扣</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { amount: "5万", discount: "2.8折", ret: "退换5%" },
              { amount: "10万", discount: "2.8折", ret: "退换10%" },
              { amount: "30万", discount: "2.6折", ret: "退换20%" },
            ].map((tier) => (
              <div key={tier.amount} className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4 text-center border border-primary/10">
                <div className="text-2xl font-bold text-primary">{tier.amount}</div>
                <div className="text-xs text-gray-500 mt-1">充值 ¥{tier.amount}</div>
                <div className="mt-2 flex items-center justify-center gap-3 text-xs">
                  <span className="text-accent font-bold">{tier.discount}</span>
                  <span className="text-gray-400">{tier.ret}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 推荐供应商 */}
      {suppliers.length > 0 && (
        <section className="py-8 bg-gray-50 border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-primary">推荐供应商</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {suppliers.map((s) => (
                <div key={s.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      s.level === "A" ? "bg-green-500" : s.level === "B" ? "bg-blue-500" : "bg-gray-400"
                    }`} />
                    <span className="text-xs font-medium text-primary">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.round(s.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{s.rating}</span>
                  </div>
                  {s.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{s.description}</p>
                  )}
                  <div className="mt-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      s.level === "A" ? "bg-green-50 text-green-700" :
                      s.level === "B" ? "bg-blue-50 text-blue-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {s.level}级供应商
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
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
              <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {hasActiveFilter ? "没有匹配的选品，试试调整筛选条件" : "暂无选品，敬请期待"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={`${product.source}-${product.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                >
                  <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30 h-full flex flex-col">
                    <Link href={product.source === "buyer" ? `/buyer/${product.id}` : `/shop/${product.id}`}>
                      <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden relative">
                        {getImage(product) ? (
                          <img src={getImage(product)!} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <TrendingUp className="w-10 h-10 text-primary/30" />
                        )}
                        {/* 来源标签 */}
                        <span className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          product.source === "platform" ? "bg-blue-500/90 text-white" : "bg-amber-500/90 text-white"
                        }`}>
                          {product.source === "platform" ? "自营" : "供应商"}
                        </span>
                      </div>
                    </Link>
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      {/* 分类标签 */}
                      <div className="flex items-center gap-1 flex-wrap">
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
                      <Link href={product.source === "buyer" ? `/buyer/${product.id}` : `/shop/${product.id}`}>
                        <h3 className="font-bold text-primary group-hover:text-accent transition-colors mt-1.5 line-clamp-2 text-sm md:text-base">
                          {product.title}
                        </h3>
                      </Link>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                        <span className="text-base md:text-lg font-bold text-accent">
                          {formatPrice(product.price)}
                        </span>
                        <button
                          onClick={() => handleBuy(product)}
                          className="btn-accent text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-medium"
                        >
                          采购
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
          description={`${selectedProduct.source === "platform" ? "平台自营" : "供应商货源"} · 请联系客服确认折扣价`}
          onClose={() => { setShowPaywall(false); setSelectedProduct(null); }}
        />
      )}
    </div>
  );
}
