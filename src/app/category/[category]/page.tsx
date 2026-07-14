"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Home } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";

export default function CategoryPage() {
  const params = useParams();
  const category = decodeURIComponent(params.category as string);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select(
            "id, title, price, cover_image, category, subcategory, created_at, wholesale_price, sales"
          )
          .eq("category", category)
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
          .limit(200);
        if (!error && data) setProducts(data);
      } catch (err) {
        console.error("加载商品失败:", err);
      }
      setLoading(false);
    };
    if (category) fetchProducts();
  }, [category, supabase]);

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航栏（返回 + 首页） */}
      <div className="flex items-center gap-4 px-4 py-3 border-b sticky top-0 bg-white z-20">
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          <Home className="w-5 h-5" />
        </Link>
        <h1 className="text-sm font-medium text-gray-900 truncate flex-1">{category}</h1>
      </div>

      <ProductGrid
        products={products}
        loading={loading}
        title={category}
        emptyText="该分类暂无商品"
      />
    </div>
  );
}
