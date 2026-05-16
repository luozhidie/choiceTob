"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, TrendingUp, Check } from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";
import { motion } from "framer-motion";
import { CATEGORY_MAP, SUBCATEGORY_MAP } from "@/lib/categories";

interface BuyerProduct {
  id: string;
  title?: string;
  name?: string;
  description?: string | null;
  cover_image?: string | null;
  image_url?: string;
  images?: string[] | null;
  price: number;
  original_price?: number | null;
  category?: string | null;
  subcategory?: string | null;
  color_season?: string | null;
  style_type?: string | null;
  stock?: number;
  tags?: string[] | null;
  is_published: boolean;
}

export default function BuyerProductDetailPage() {
  const [product, setProduct] = useState<BuyerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [visible, setVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const supabase = createClient();

  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const productId = pathname.split("/").pop();

  useEffect(() => {
    setVisible(true);
    if (productId) fetchProduct(productId);
  }, [productId]);

  const fetchProduct = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("buyer_products")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      window.location.href = "/buyer";
      return;
    }
    setProduct(data as BuyerProduct);
    setLoading(false);
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const getImage = () => {
    if (product.images?.length) return [product.cover_image || product.image_url, ...product.images].filter(Boolean)[currentImage] || null;
    return product.cover_image || product.image_url || null;
  };

  const getName = () => product.title || product.name || "选品商品";

  const categoryLink = product.category ? `/buyer?category=${product.category}` : "/buyer";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <Link href="/buyer" className="hover:text-primary">买手选品</Link>
            {product.category && (
              <>
                <span>/</span>
                <Link href={categoryLink} className="hover:text-primary">
                  {CATEGORY_MAP[product.category] || product.category}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-primary font-medium line-clamp-1 max-w-[200px]">
              {getName()}
            </span>
          </nav>
        </div>
      </div>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12"
          >
            {/* Image */}
            <div>
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl overflow-hidden flex items-center justify-center">
                {getImage() ? (
                  <img src={getImage()!} alt={getName()} className="w-full h-full object-cover" />
                ) : (
                  <TrendingUp className="w-16 h-16 text-primary/30" />
                )}
              </div>
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {product.category && (
                  <Link href={categoryLink}>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20">
                      {CATEGORY_MAP[product.category] || product.category}
                    </span>
                  </Link>
                )}
                {product.subcategory && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium">
                    {SUBCATEGORY_MAP[product.subcategory] || product.subcategory}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                {getName()}
              </h1>

              {product.description && (
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Color season & style tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {product.color_season && (
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    色彩：{product.color_season}
                  </span>
                )}
                {product.style_type && (
                  <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                    风格：{product.style_type}
                  </span>
                )}
                {product.tags?.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Price */}
              <div className="flex items-end gap-2 mb-6">
                <span className="text-3xl font-bold text-accent">
                  ¥{(product.price / 100).toFixed(0)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-lg text-gray-400 line-through mb-1">
                    ¥{(product.original_price / 100).toFixed(0)}
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowPaywall(true)}
                className="w-full btn-accent py-3.5 rounded-xl text-base font-semibold flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                联系采购
              </button>
              <p className="mt-2 text-xs text-center text-muted-foreground">
                B端用户充值后享专属拿货折扣
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          type="product"
          title={getName()}
          description="买手选品采购 - 请联系客服确认折扣价"
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}
