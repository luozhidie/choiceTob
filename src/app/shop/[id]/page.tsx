"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ShoppingBag, Building2, Truck, X,
  ChevronLeft, ChevronRight, Layers, Star,
  Clock, ShoppingCart, Share2, Copy, Check,
  Image as ImageIcon, MessageCircle, QrCode,
  Lock, LogIn, UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CATEGORY_MAP,
  SUBCATEGORY_MAP,
} from "@/lib/categories";
import { useCart } from "@/lib/cart-context";

interface Product {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  images: string[] | null;
  price: number;
  original_price: number | null;
  wholesale_price: number | null;   // 批发价
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
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showWholesalePrompt, setShowWholesalePrompt] = useState(false);
  const [user, setUser] = useState<any>(null); // 用户登录状态
  const [isPriceMember, setIsPriceMember] = useState(false); // 是否价格会员
  const { addItem } = useCart();

  // 检查用户登录状态 + 是否价格会员
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u || null);
      if (u) {
        // 查是否有价格会员订单（用 plan_id 判断，status 包含 confirmed/paid/completed）
        supabase.from("membership_orders")
          .select("id, plan_id, status")
          .eq("user_id", u.id)
          .in("status", ["paid", "completed", "confirmed"])
          .in("plan_id", ["price_trial", "price_1y", "price_2y", "price_3y", "view_price_trial", "view_price_year1", "view_price_year2", "view_price_year3",
                        "daily_looks", "daily_looks_monthly", "daily_looks_yearly"])
          .then(({ data }: any) => {
            setIsPriceMember(data && data.length > 0);
          });
      }
    });
  }, []);

  // 获取商品数据（走服务端 API，绕过 RLS）
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const url = `/api/public/products?id=${encodeURIComponent(productId)}`;
        console.log('[ProductDetail] 开始获取商品:', url);
        const res = await fetch(url);
        console.log('[ProductDetail] API响应状态:', res.status);
        const json = await res.json();
        console.log('[ProductDetail] API返回数据:', JSON.stringify(json).slice(0, 200));
        if (json.success && json.data && json.data.length > 0 && !cancelled) {
          const p = json.data[0];
          setProduct({
            id: p.id,
            title: p.title || "平台商品",
            description: p.description || null,
            cover_image: p.cover_image || null,
            images: p.images || null,
            price: p.price || 0,
            original_price: p.original_price || null,
            wholesale_price: p.wholesale_price || null,
            category: p.category || null,
            subcategory: p.subcategory || null,
            tags: p.tags || null,
            is_published: p.is_published ?? true,
            stock: p.stock || 0,
            source: "platform",
            is_preorder: false,
            preorder_days: null,
          });
          setLoading(false);
          return;
        } else {
          console.warn('[ProductDetail] 商品数据为空或格式错误:', json);
        }
      } catch (e) { 
        console.error("查询商品失败:", e); 
      }

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

  // 分享功能
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/shop/${product.id}`
    : "";

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: 选中输入框内容让用户手动复制
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `骆芷蝶智选推荐：${product.title} ¥${product.price}`,
          url: shareUrl,
        });
      } catch { /* 用户取消分享 */ }
    } else {
      copyShareLink();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 面包屑 + 分享按钮 */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap flex-1 min-w-0">
            <Link href="/" className="hover:text-primary shrink-0">首页</Link>
            <span className="shrink-0">/</span>
            <Link href="/buyer" className="hover:text-primary shrink-0">买手选品</Link>
            {product.category && (
              <>
                <span className="shrink-0">/</span>
                <Link href={categoryLink} className="hover:text-primary shrink-0">
                  {CATEGORY_MAP[product.category] || product.category}
                </Link>
              </>
            )}
            {product.subcategory && (
              <>
                <span className="shrink-0">/</span>
                <span className="text-gray-400 line-clamp-1">
                  {SUBCATEGORY_MAP[product.subcategory] || product.subcategory}
                </span>
              </>
            )}
          </nav>
          {/* 分享按钮 */}
          <button
            onClick={() => setShareOpen(true)}
            className="ml-3 p-2 rounded-full hover:bg-gray-100 active:scale-90 transition-all shrink-0"
            title="分享商品"
          >
            <Share2 className="w-5 h-5 text-gray-500" />
          </button>
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

              {/* 价格 - 只显示零售价，批发价隐藏 */}
              <div className="mb-2">
                {/* 价格 - 显示优惠价（与首页一致），原价用删除线 */}
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-lg text-gray-400 line-through mb-1">原价 {formatPrice(product.original_price)}</span>
                  )}
                  <span className="text-sm text-gray-400 mb-1">零售价</span>
                </div>

                {/* 批发价区域 */}
                <div className={`mt-2 flex items-center gap-2 p-[10px] rounded-lg border transition-all cursor-pointer ${isPriceMember && product.wholesale_price ? "bg-green-50 border-green-200 hover:bg-green-100" : "bg-blue-50 border-blue-200 hover:border-blue-300"}`}
                   onClick={() => {
                     if (!user) { router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`); return; }
                     if (!isPriceMember) setShowWholesalePrompt(true);
                   }}
                >
                  <Lock className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-sm font-medium text-blue-700">批发价</span>
                  {!user ? (
                    <span className="text-lg font-bold text-blue-600 ml-auto">登录可见</span>
                  ) : isPriceMember && product.wholesale_price ? (
                    <span className="text-lg font-bold text-green-600 ml-auto">{formatPrice(product.wholesale_price)}</span>
                  ) : isPriceMember ? (
                    <span className="text-lg font-bold text-blue-600 ml-auto">¥???</span>
                  ) : (
                    <span className="text-lg font-bold text-blue-600 ml-auto">会员可见</span>
                  )}
                  <span className="text-[10px] text-blue-400 ml-1">{
                    !user ? "去登录" : isPriceMember ? "批发价" : "开通会员"
                  }</span>
                </div>
              </div>

              {/* 数量选择 */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">数量</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-300 text-lg"
                  >-</button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => {
                      setQuantity(q => Math.min(product.stock, q + 1));
                      if (quantity + 1 >= 3 && !showWholesalePrompt) {
                        setTimeout(() => setShowWholesalePrompt(true), 300);
                      }
                    }}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-300 text-lg"
                  >+</button>
                  <span className="text-xs text-gray-400">库存{product.stock}件</span>
                </div>
                {/* 拿货提示 */}
                {quantity >= 3 && showWholesalePrompt && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <Truck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-amber-800">提示：同色同款3件起可享拿货折扣</p>
                        <Link href="/vip" className="text-[11px] text-amber-700 hover:text-amber-800 mt-1 inline-block">
                          了解拿货会员 →
                        </Link>
                      </div>
                      <button onClick={() => setShowWholesalePrompt(false)} className="text-amber-400 text-xs">✕</button>
                    </div>
                  </motion.div>
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
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!product) return;
                    // 未登录 → 跳转登录
                    if (!user) {
                      router.push(`/login?redirect=/shop/${product.id}`);
                      return;
                    }
                    addItem({
                      id: product.id,
                      title: product.title,
                      image: product.cover_image,
                      price: product.price,
                      originalPrice: null,
                      source: product.source || "buyer",
                    });
                    alert("已加入购物车！");
                  }}
                  className="flex-1 py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 border-2 border-accent text-accent hover:bg-accent/5"
                >
                  <ShoppingCart className="w-5 h-5" /> 加入购物车
                </button>
                <button
                  onClick={() => {
                    // 未登录 → 跳转登录
                    if (!user) {
                      router.push(`/login?redirect=/shop/${product.id}`);
                      return;
                    }
                    if (quantity >= 3 && !showWholesalePrompt) { setShowWholesalePrompt(true); return; }
                    router.push(`/checkout?id=${product.id}&source=${product.source || "buyer"}&qty=${quantity}`);
                  }}
                  disabled={product.stock === 0}
                  className="flex-1 py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 text-white disabled:opacity-50"
                  style={{ backgroundColor: product.is_preorder ? '#F59E0B' : 'var(--color-accent, #C8553D)' }}
                >
                  {product.is_preorder ? (<><Clock className="w-5 h-5" />立即预定</>) : (<><ShoppingBag className="w-5 h-5" />立即下单</>)}
                </button>
              </div>
              <p className="mt-2 text-xs text-center text-muted-foreground">
                {product.is_preorder ? "预售商品，按订单顺序发货" : "支持会员折扣 · 多种支付方式"}
              </p>

              {/* 分享入口 */}
              <button
                onClick={() => setShareOpen(true)}
                className="mt-3 w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 border border-dashed border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <Share2 className="w-4 h-4" />
                分享给好友
              </button>

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

      {/* ====== 分享弹窗 ====== */}
      <AnimatePresence>
        {shareOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
            onClick={() => setShareOpen(false)}
          >
            {/* 遮罩 */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* 弹窗内容 */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* 头部拖拽条（移动端）+ 关闭按钮 */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="text-lg font-bold text-gray-900">分享商品</h3>
                <button
                  onClick={() => setShareOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 商品预览卡片 */}
              <div className="px-5 py-4">
                <div className="flex gap-3 p-3 bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl border border-pink-100">
                  {product.cover_image ? (
                    <img
                      src={product.cover_image}
                      alt={product.title}
                      className="w-20 h-20 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-8 h-8 text-pink-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug">
                      {product.title}
                    </h4>
                    <p className="text-red-500 font-bold mt-1.5">¥{product.price}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      骆芷蝶智选 · 不自用不分享
                    </p>
                  </div>
                </div>

                {/* 分享选项 */}
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {/* 复制链接 */}
                  <button
                    onClick={copyShareLink}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                      copied ? "bg-green-100" : "bg-blue-100"
                    }`}>
                      {copied ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-gray-700">
                      {copied ? "已复制" : "复制链接"}
                    </span>
                  </button>

                  {/* 系统分享 */}
                  <button
                    onClick={handleNativeShare}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-700">系统分享</span>
                  </button>

                  {/* 分享图片（生成海报） */}
                  <button
                    onClick={() => {
                      if (product.cover_image) window.open(product.cover_image, "_blank");
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-700">分享图片</span>
                  </button>

                  {/* 微信好友提示 */}
                  <button
                    onClick={copyShareLink}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-700">微信好友</span>
                  </button>
                </div>

                {/* 分享链接展示区 */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-[11px] text-gray-400 mb-1.5">商品链接</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-gray-600 truncate bg-white px-3 py-2 rounded border">
                      {shareUrl}
                    </code>
                    <button
                      onClick={copyShareLink}
                      className={`shrink-0 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        copied
                          ? "bg-green-500 text-white"
                          : "bg-gray-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {copied ? "✓ 已复制" : "复制"}
                    </button>
                  </div>
                </div>

                {/* 提示文字 */}
                <p className="mt-4 text-center text-xs text-gray-400 leading-relaxed">
                  分享给好友，一起发现好物<br />
                  每次分享都可能获得推荐奖励
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== VIP会员购买弹窗 ====== */}
      <AnimatePresence>
        {showWholesalePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowWholesalePrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-gray-900">开通价格会员</h3>
                </div>
                <button
                  onClick={() => setShowWholesalePrompt(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 内容 */}
              <div className="px-6 py-5">
                <p className="text-sm text-gray-500 mb-4">
                  开通价格会员后，可查看所有商品批发价，享受专属采购权益
                </p>

                {/* 套餐选项 */}
                <div className="space-y-3">
                  {[
                    { id: "price_trial", name: "体验会员", price: "¥19.9", days: "14天", desc: "短期体验批发价查看" },
                    { id: "price_1y", name: "年度会员", price: "¥399", days: "1年", desc: "查看批发价 + 趋势报告" },
                    { id: "price_2y", name: "双年会员", price: "¥599", days: "2年", desc: "省¥199，性价比最高" },
                    { id: "price_3y", name: "三年会员", price: "¥699", days: "3年", desc: "省¥498，长期经营首选" },
                  ].map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/vip?plan=${plan.id}&redirect=${encodeURIComponent(window.location.pathname)}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{plan.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{plan.desc}</div>
                        <div className="text-[10px] text-gray-300 mt-1">有效期：{plan.days}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black">{plan.price}</div>
                        <div className="text-[10px] text-primary font-medium group-hover:text-accent transition-colors">
                          立即开通 →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    href="/vip"
                    className="block w-full py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-primary to-accent rounded-xl hover:shadow-lg transition-all"
                  >
                    查看全部会员套餐 →
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
