"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Check } from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";
import { motion } from "framer-motion";
import {
  CATEGORY_MAP,
  SUBCATEGORY_MAP,
  getCategoryPath,
} from "@/lib/categories";

interface Product {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  images: string[] | null;
  price: number;
  original_price: number | null;
  category: string | null;
  subcategory: string | null;
  tags: string[] | null;
  is_published: boolean;
  stock: number;
  supplier_name?: string | null;
}

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [visible, setVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const supabase = createClient();
  const router = useRouter();

  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const productId = pathname.split("/").pop();

  useEffect(() => {
    setVisible(true);
    if (productId) fetchProduct(productId);
  }, [productId]);

  const fetchProduct = async (id: string) => {
    setLoading(true);
    /* 先查 products 表 */
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (!error && data) {
      setProduct(data as Product);
      setLoading(false);
      return;
    }
    /* 再查 buyer_products 表（供应商上传的商品）*/
    const { data: bData, error: bError } = await supabase
      .from("buyer_products")
      .select("*")
      .eq("id", id)
      .single();
    if (!bError && bData) {
      /* 映射到 Product 接口 */
      setProduct({
        id: bData.id,
        title: bData.title || bData.name || "选品商品",
        description: bData.description,
        cover_image: bData.cover_image || null,
        images: bData.images || null,
        price: bData.price || 0,
        original_price: bData.original_price || null,
        category: bData.category || null,
        subcategory: bData.subcategory || null,
        tags: bData.tags || null,
        is_published: bData.is_published,
        stock: bData.stock || 0,
        supplier_name: bData.supplier_name || null,
      } as Product);
      setLoading(false);
      return;
    }
    router.push("/shop");
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const allImages = product.images?.length
    ? [product.cover_image, ...product.images].filter(Boolean)
    : [product.cover_image];

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  /* 同供应商商品 */
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  useEffect(() => {
    if (!product?.supplier_name) { setSupplierProducts([]); return; }
    const q = product.source === "platform" ? "products" : "buyer_products";
    (async () => {
      const { data } = await supabase
        .from(q)
        .select("*")
        .eq("supplier_name", product.supplier_name)
        .neq("id", product.id)
        .eq("is_published", true)
        .limit(8);
      setSupplierProducts((data as Product[] | null) || []);
    })();
  }, [product]);

  // 品类面包屑链接
  const categoryLink = product.category
    ? `/shop?category=${product.category}`
    : "/shop";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb - 带品类路径 */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-primary">
              首页
            </Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-primary">
              精选好物
            </Link>
            {product.category && (
              <>
                <span>/</span>
                <Link href={categoryLink} className="hover:text-primary">
                  {CATEGORY_MAP[product.category] || product.category}
                </Link>
              </>
            )}
            {product.subcategory && (
              <>
                <span>/</span>
                <span className="text-gray-400">
                  {SUBCATEGORY_MAP[product.subcategory] ||
                    product.subcategory}
                </span>
              </>
            )}
            <span className="hidden sm:inline">/</span>
            <span className="text-primary font-medium hidden sm:inline line-clamp-1 max-w-[200px]">
              {product.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12"
          >
            {/* Images */}
            <div>
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl overflow-hidden flex items-center justify-center">
                {allImages[currentImage] ? (
                  <img
                    src={allImages[currentImage]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="w-16 h-16 text-primary/30" />
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-3">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        currentImage === i
                          ? "border-accent"
                          : "border-transparent"
                      }`}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              {/* 品类标签 */}
              <div className="flex items-center gap-2 mb-3">
                {product.category && (
                  <Link href={categoryLink}>
                    <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
                      {CATEGORY_MAP[product.category] || product.category}
                    </span>
                  </Link>
                )}
                {product.subcategory && (
                  <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium">
                    {SUBCATEGORY_MAP[product.subcategory] ||
                      product.subcategory}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                {product.title}
              </h1>
              {product.description && (
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Price */}
              <div className="flex items-end gap-2 mb-6">
                <span className="text-3xl font-bold text-accent">
                  {formatPrice(product.price)}
                </span>
                {product.original_price &&
                  product.original_price > product.price && (
                    <span className="text-lg text-gray-400 line-through mb-1">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
              </div>

              {/* Stock */}
              <div className="mb-6">
                <span
                  className={`text-xs font-medium ${
                    product.stock > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {product.stock > 0
                    ? `库存 ${product.stock} 件`
                    : "暂时缺货"}
                </span>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Buy Button */}
              <button
                onClick={() => setShowPaywall(true)}
                disabled={product.stock === 0}
                className="w-full btn-accent py-3.5 rounded-xl text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-5 h-5" />
                立即购买
              </button>
              <p className="mt-2 text-xs text-center text-muted-foreground">
                支付安全便捷，付款后安排发货
              </p>

              {/* 同品类推荐入口 */}
              {product.category && (
                <Link
                  href={categoryLink}
                  className="mt-6 block text-center text-sm text-primary hover:text-accent transition-colors font-medium"
                >
                  查看更多「{CATEGORY_MAP[product.category]}」商品 →
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 该供应商其他商品 */}
      {supplierProducts.length > 0 && (
        <section className="py-12 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-primary">
                该供应商其他商品
              </h2>
              <span className="text-xs text-gray-400 ml-2">
                {product.supplier_name}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {supplierProducts.map((p) => (
                <Link key={p.id} href={`/shop/${p.id}`}>
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      {p.cover_image ? (
                        <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-primary/30" />
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-primary line-clamp-2">{p.title}</h4>
                      <p className="text-sm text-accent font-bold mt-1">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          type="product"
          title={product.title}
          description={`¥${(product.price / 100).toFixed(0)} - 付款后安排发货`}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}
