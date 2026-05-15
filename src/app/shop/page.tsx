"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, Filter, Grid, List } from "lucide-react";
import { motion } from "framer-motion";
import { PaywallModal } from "@/components/PaywallModal";

interface Product {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  original_price: number | null;
  category: string | null;
  tags: string[] | null;
  is_published: boolean;
  stock: number;
}

const categoryMap: Record<string, string> = {
  accessory: "配饰",
  clothing: "服装",
  tool: "工具",
  book: "书籍",
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState("sort_order");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setVisible(true);
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = [...allProducts];
    if (filterCategory) filtered = filtered.filter((p) => p.category === filterCategory);
    if (sortBy === "price_asc") filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") filtered.sort((a, b) => b.price - a.price);
    setProducts(filtered);
  }, [filterCategory, sortBy, allProducts]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (!error && data) {
      setAllProducts(data as Product[]);
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  const handleBuy = (product: Product) => {
    setSelectedProduct(product);
    setShowPaywall(true);
  };

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16 md:py-20">
        <div className={`container mx-auto px-4 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">精选好物</h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            色彩顾问推荐好物，助力你的风格提升之路
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部分类</option>
              <option value="accessory">配饰</option>
              <option value="clothing">服装</option>
              <option value="tool">工具</option>
              <option value="book">书籍</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="sort_order">默认排序</option>
              <option value="price_asc">价格从低到高</option>
              <option value="price_desc">价格从高到低</option>
            </select>
            <div className="ml-auto flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              暂无商品，敬请期待
            </div>
          ) : (
            <div className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                >
                  {viewMode === "grid" ? (
                    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30">
                      <Link href={`/shop/${product.id}`}>
                        <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
                          {product.cover_image ? (
                            <img src={product.cover_image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <ShoppingBag className="w-12 h-12 text-primary/30" />
                          )}
                        </div>
                      </Link>
                      <div className="p-4">
                        {product.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {categoryMap[product.category] || product.category}
                          </span>
                        )}
                        <Link href={`/shop/${product.id}`}>
                          <h3 className="font-bold text-primary group-hover:text-accent transition-colors mt-2 line-clamp-2">
                            {product.title}
                          </h3>
                        </Link>
                        {product.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg font-bold text-accent">{formatPrice(product.price)}</span>
                            {product.original_price && product.original_price > product.price && (
                              <span className="text-xs text-gray-400 line-through">{formatPrice(product.original_price)}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleBuy(product)}
                            className="btn-accent text-xs px-3 py-1.5 rounded-lg font-medium"
                          >
                            购买
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex gap-4 bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-all border border-transparent hover:border-accent/30">
                      <Link href={`/shop/${product.id}`} className="shrink-0">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center overflow-hidden">
                          {product.cover_image ? (
                            <img src={product.cover_image} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-primary/30" />
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        {product.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {categoryMap[product.category] || product.category}
                          </span>
                        )}
                        <Link href={`/shop/${product.id}`}>
                          <h3 className="font-bold text-primary group-hover:text-accent transition-colors mt-1">
                            {product.title}
                          </h3>
                        </Link>
                        {product.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg font-bold text-accent">{formatPrice(product.price)}</span>
                            {product.original_price && product.original_price > product.price && (
                              <span className="text-xs text-gray-400 line-through">{formatPrice(product.original_price)}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleBuy(product)}
                            className="btn-accent text-xs px-3 py-1.5 rounded-lg font-medium"
                          >
                            购买
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
          onClose={() => { setShowPaywall(false); setSelectedProduct(null); }}
        />
      )}
    </div>
  );
}
