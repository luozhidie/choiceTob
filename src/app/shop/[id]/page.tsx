"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ShoppingBag, Building2, Truck, X,
  ChevronLeft, ChevronRight, Layers, Star,
  Clock, ShoppingCart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CATEGORY_MAP,
  SUBCATEGORY_MAP,
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
  source?: "platform" | "buyer" | "supplier_submit" | null;
  /* 预售字段 */
  is_preorder?: boolean;
  preorder_days?: number | null;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  // ✅ 所有 hooks 必须在组件顶层
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);

  // 获取商品数据
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const headers: Record<string, string> = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      };

      // 先查 products 表
      try {
        const platformRes = await fetch(
          `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=*`,
          { headers }
        );
        if (platformRes.ok) {
          const data = await platformRes.json();
          if (data && data.length > 0 && !cancelled) {
            const p = data[0];
            setProduct({
              id: p.id,
              title: p.title || "平台商品",
              description: p.description,
              cover_image: p.cover_image || null,
              images: p.images || null,
              price: p.price || 0,
              original_price: p.original_price || null,
              category: p.category || null,
              subcategory: p.subcategory || null,
              tags: p.tags || null,
              is_published: p.is_published,
              stock: p.stock || 0,
              source: "platform",
              is_preorder: p.is_preorder || false,
              preorder_days: p.preorder_days || null,
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) { console.error("查询 products 表失败:", e); }

      // 再查 buyer_products 表
      try {
        const buyerRes = await fetch(
          `${supabaseUrl}/rest/v1/buyer_products?id=eq.${encodeURIComponent(productId)}&select=*`,
          { headers }
        );
        if (buyerRes.ok) {
          const data = await buyerRes.json();
          if (data && data.length > 0 && !cancelled) {
            const p = data[0];
            setProduct({
              id: p.id,
              title: p.title || p.name || "选品商品",
              description: p.description,
              cover_image: p.cover_image || null,
              images: p.images || null,
              price: p.price || 0,
              original_price: p.original_price || null,
              category: p.category || null,
              subcategory: p.subcategory || null,
              tags: p.tags || null,
              is_published: p.is_published,
              stock: p.stock || 0,
              supplier_name: p.supplier_name || null,
              source: p.source || "buyer",
              is_preorder: p.is_preorder || false,
              preorder_days: p.preorder_days || null,
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) { console.error("查询 buyer_products 表失败:", e); }

      if (!cancelled) {
        setProduct(null);
        setLoading(false);
      }
    };

    fetchProduct();
    return () => { cancelled = true; };
  }, [productId]);

  // 获取同供应商商品
  useEffect(() => {
    if (!product?.supplier_name) {
      setSupplierProducts([]);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      const tableName = product.source === "platform" ? "products" : "buyer_products";
      const { data } = await supabase
        .from(tableName)
        .select("*")
        .eq("supplier_name", product.supplier_name!)
        .neq("id", product.id)
        .eq("is_published", true)
        .limit(8);
      if (!cancelled) {
        setSupplierProducts((data as Product[] | null) || []);
      }
    })();
    return () => { cancelled = true; };
  }, [product?.supplier_name, product?.id, product?.source]);

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  // ---- 加载中 ----
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ---- 商品不存在 ----
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-lg text-gray-400">商品不存在或已下架</div>
        <button
          onClick={() => router.push("/buyer")}
          className="text-sm text-primary hover:underline"
        >
          返回买手选品 →
        </button>
      </div>
    );
  }

  // ---- 商品详情（1688 风格）----
  const allImages = product.images?.length
    ? [product.cover_image, ...product.images].filter(Boolean)
    : [product.cover_image];

  const categoryLink = product.category
    ? `/buyer?category=${product.category}`
    : "/buyer";

  // 跳转下单页
  const handleBuyNow = () => {
    const source = product.source || "buyer";
    router.push(`/checkout?id=${product.id}&source=${source}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 面包屑 */}
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
            {product.subcategory && (
              <>
                <span>/</span>
                <span className="text-gray-400">
                  {SUBCATEGORY_MAP[product.subcategory] || product.subcategory}
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

      {/* 商品详情 — 1688 风格 */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8"
          >
            {/* 左侧缩略图（竖排）- 仅桌面端 */}
            {allImages.length > 1 && (
              <div className="hidden md:flex md:col-span-2 flex-col gap-2 order-1 md:order-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImage === i ? "border-accent" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 中间大图 */}
            <div className={allImages.length > 1 ? "md:col-span-7" : "md:col-span-9"} style={{ order: 2 }}>
              <div
                className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl overflow-hidden flex items-center justify-center group cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              >
                {allImages[currentImage] ? (
                  <img
                    src={allImages[currentImage]!}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <ShoppingBag className="w-16 h-16 text-primary/30" />
                )}
              </div>
              {/* 移动端横排缩略图 */}
              {allImages.length > 1 && (
                <div className="flex md:hidden gap-2 mt-3">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setCurrentImage(i); }}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                        currentImage === i ? "border-accent" : "border-transparent"
                      }`}
                    >
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Lightbox 放大查看 */}
              <AnimatePresence>
                {lightboxOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setLightboxOpen(false)}
                  >
                    <button
                      onClick={() => setLightboxOpen(false)}
                      className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                    {allImages.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImage(i => (i - 1 + allImages.length) % allImages.length); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                    )}
                    {allImages.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImage(i => (i + 1) % allImages.length); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                    )}
                    <motion.img
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                      src={allImages[currentImage]!}
                      alt={product.title}
                      className="max-w-[90vw] max-h-[90vh] object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {allImages.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                        {currentImage + 1} / {allImages.length}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 右侧商品信息 */}
            <div className="md:col-span-3" style={{ order: 3 }}>
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
                    {SUBCATEGORY_MAP[product.subcategory] || product.subcategory}
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

              {/* 预售标签 */}
              {product.is_preorder && (
                <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-600">
                    预售{product.preorder_days ? `，${product.preorder_days}天内发货` : ""}
                  </span>
                </div>
              )}

              {/* 价格（所有人都能看到批发价） */}
              <div className="mb-2">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-accent">
                    {formatPrice(product.price)}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-lg text-gray-400 line-through mb-1">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
                </div>
                {product.original_price && product.original_price > product.price && (
                  <div className="mt-1 text-xs text-accent">
                    💎 批发价，立省 ¥{((product.original_price - product.price) / 100).toFixed(0)}
                  </div>
                )}
              </div>

              {/* 库存 */}
              <div className="mb-6">
                <span className={`text-xs font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                  {product.stock > 0 ? `库存 ${product.stock} 件` : "暂时缺货"}
                </span>
              </div>

              {/* 标签 */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {product.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 供应商信息 */}
              {product.supplier_name && (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="text-sm text-gray-600">供应商：</span>
                  <span className="text-sm font-medium text-primary">{product.supplier_name}</span>
                </div>
              )}

              {/* 加入购物车 / 立即下单 按钮 */}
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: product.is_preorder ? '#F59E0B' : 'var(--color-accent, #C8553D)' }}
              >
                {product.is_preorder ? (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    加入购物车
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    立即下单
                  </>
                )}
              </button>
              <p className="mt-2 text-xs text-center text-muted-foreground">
                {product.is_preorder ? "预售商品，按订单顺序发货" : "支持会员折扣 · 多种支付方式"}
              </p>

              {/* 同品类推荐 */}
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

      {/* 一品三搭：搭配方案展示 */}
      <section className="py-12 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-primary">一品三搭 · 搭配灵感</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">一件单品，三种风格，提升连带率</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "职场通勤风",
                scene: "上班/商务",
                desc: `将「${product.title}」与简约西装外套、尖头高跟鞋搭配，干练又不失女性柔美。`,
                colors: ["#2c3e50", "#ecf0f1", "#c44569"],
                tips: "搭配金属质感配饰，提升精致度",
              },
              {
                title: "周末休闲风",
                scene: "约会/逛街",
                desc: `「${product.title}」搭配牛仔外套与小白鞋，轻松打造减龄休闲感。`,
                colors: ["#3498db", "#f39c12", "#e74c3c"],
                tips: "叠戴细链项链，增加层次感",
              },
              {
                title: "晚宴优雅风",
                scene: "派对/晚宴",
                desc: `「${product.title}」配上丝绸披肩与精致手包，瞬间提升高级感。`,
                colors: ["#8e44ad", "#d4af37", "#c0392b"],
                tips: "选择同色系耳环，整体更协调",
              },
            ].map((look, idx) => (
              <motion.div
                key={look.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="flex h-24">
                  {look.colors.map((c) => (
                    <div key={c} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {look.scene}
                    </span>
                  </div>
                  <h3 className="font-bold text-primary mb-1">{look.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{look.desc}</p>
                  <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                    <Star className="w-3.5 h-3.5 shrink-0 mt-0.5 fill-amber-500 text-amber-500" />
                    <span>{look.tips}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 同供应商商品 */}
      {supplierProducts.length > 0 && (
        <section className="py-12 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-primary">该供应商其他商品</h2>
              <span className="text-xs text-gray-400 ml-2">{product.supplier_name}</span>
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
                      <p className="text-sm text-accent font-bold mt-1">{formatPrice(p.price)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
