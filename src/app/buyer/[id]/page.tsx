"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Package, Truck, Star, Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_MAP, SUBCATEGORY_MAP } from "@/lib/categories";

/* ==================== 类型 ==================== */
interface SupplierProduct {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  original_price: number | null;
  category: string | null;
  subcategory: string | null;
  stock: number;
}

interface Supplier {
  id: string;
  name: string;
  level: string;
  rating: number;
  description: string;
}

/* ==================== 页面 ==================== */
export default function SupplierDetailPage() {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("sort_order");
  const [activeCategory, setActiveCategory] = useState("");
  const router = useRouter();

  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const supplierId = pathname.split("/").pop();

  const supabase = createClient();

  useEffect(() => {
    if (supplierId) {
      fetchSupplier(supplierId);
    }
  }, [supplierId]);

  const fetchSupplier = async (id: string) => {
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .single();
    if (data) {
      setSupplier(data as Supplier);
      /* 拿到供应商名称后再查该供应商的商品 */
      fetchProducts(data.name);
    }
  };

  const fetchProducts = async (supplierName: string) => {
    setLoading(true);
    /* 按 supplier_name 过滤，只取该供应商的商品 */
    const { data, error } = await supabase
      .from("buyer_products")
      .select("*")
      .eq("source", "supplier_submit")
      .eq("is_published", true)
      .eq("supplier_name", supplierName)
      .order("sort_order", { ascending: true });
    if (!error && data) setProducts(data as SupplierProduct[]);
    setLoading(false);
  };

  /* 分类筛选 */
  const categoryOptions = useMemo(() => {
    const keys = new Set<string>();
    const opts: { value: string; label: string }[] = [];
    for (const p of products) {
      if (p.category && !keys.has(p.category)) {
        keys.add(p.category);
        opts.push({
          value: p.category,
          label: CATEGORY_MAP[p.category] || p.category,
        });
      }
    }
    return opts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (activeCategory) {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (sortBy === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, activeCategory, sortBy]);

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ====== 顶部导航 ====== */}
      <section className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => router.push("/buyer")}
            className="p-2 rounded-lg hover:bg-gray-50 text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">
              {supplier?.name || "供应商详情"}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(supplier?.rating || 0)
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">
              {supplier?.rating || "-"}
            </span>
          </div>
        </div>
      </section>

      {/* ====== 供应商信息 ====== */}
      {supplier && (
        <section className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">{supplier.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {supplier.description}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    supplier.level === "A" ? "bg-green-50 text-green-700" :
                    supplier.level === "B" ? "bg-blue-50 text-blue-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {supplier.level}级供应商
                  </span>
                  <span className="text-xs text-gray-400">
                    {products.length} 件商品
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====== 筛选栏 ====== */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory("")}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !activeCategory ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            全部
          </button>
          {categoryOptions.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(activeCategory === cat.value ? "" : cat.value)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat.value ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
          <div className="ml-auto shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none"
            >
              <option value="sort_order">默认排序</option>
              <option value="price_asc">价格从低到高</option>
              <option value="price_desc">价格从高到低</option>
            </select>
          </div>
        </div>
      </section>

      {/* ====== 商品列表 ====== */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {activeCategory ? "该分类下暂无商品" : "该供应商暂无上架商品"}
              </p>
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
                  <Link
                    href={`/shop/${product.id}`}
                    className="group block bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30 h-full flex flex-col"
                  >
                    <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden relative">
                      {product.cover_image ? (
                        <img
                          src={product.cover_image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-primary/30" />
                      )}
                    </div>
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-primary group-hover:text-accent transition-colors mt-1.5 line-clamp-2 text-sm md:text-base">
                        {product.title}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 flex-1 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                        <span className="text-base md:text-lg font-bold text-accent">
                          {formatPrice(product.price)}
                        </span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-[10px] text-gray-400 line-through">
                            {formatPrice(product.original_price)}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <span className="inline-block text-[11px] px-2 py-0.5 bg-primary/5 text-primary rounded-full">查看详情 →</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
