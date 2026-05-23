"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Check, Building2, Truck, X, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  source?: "platform" | "buyer" | "supplier_submit" | null;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  // ✅ 所有 hooks 必须在组件顶层，不能在条件/return 之后
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  // 采购意向 / 下单支付
  const [showPurchaseIntent, setShowPurchaseIntent] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseNote, setPurchaseNote] = useState("");
  const [purchaseContact, setPurchaseContact] = useState("");
  const [purchaseAddress, setPurchaseAddress] = useState("");
  const [purchaseSubmitted, setPurchaseSubmitted] = useState(false);
  const [paymentType, setPaymentType] = useState<"wechat" | "alipay">("wechat");
  const [orderCreating, setOrderCreating] = useState(false);
  const [paymentQR, setPaymentQR] = useState<{ url_qrcode: string; url: string } | null>(null);
  const [currentOrderNo, setCurrentOrderNo] = useState("");
  const [paymentChecking, setPaymentChecking] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // 获取商品数据
  useEffect(() => {
    setVisible(true);
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

      // 先查 products 表（原生 fetch 绕过 schema cache）
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
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("查询 products 表失败:", e);
      }

      // 再查 buyer_products 表（供应商上传的商品）
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
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("查询 buyer_products 表失败:", e);
      }

      // 两个表都查不到
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

  // 创建订单并发起支付
  const handleCreateOrder = async () => {
    if (!product || !purchaseContact) return;
    setOrderCreating(true);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          product_title: product.title,
          product_price: product.price,
          quantity: purchaseQuantity,
          contact: purchaseContact,
          address: purchaseAddress,
          note: purchaseNote,
          payment_type: paymentType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '创建订单失败');

      if (data.payment) {
        setPaymentQR(data.payment);
        setCurrentOrderNo(data.order.order_no);
      } else {
        setPurchaseSubmitted(true);
        setCurrentOrderNo(data.order.order_no);
      }
    } catch (err: any) {
      alert(err.message || '创建订单失败，请稍后重试');
    } finally {
      setOrderCreating(false);
    }
  };

  // 轮询支付状态
  useEffect(() => {
    if (!currentOrderNo || !paymentQR || paymentSuccess) return;
    const interval = setInterval(async () => {
      try {
        setPaymentChecking(true);
        const res = await fetch(`/api/orders/status?order_no=${currentOrderNo}`);
        const data = await res.json();
        if (data.is_paid) {
          setPaymentSuccess(true);
          setPaymentChecking(false);
          clearInterval(interval);
        }
      } catch {
        // 忽略轮询错误
      }
    }, 3000);
    return () => { clearInterval(interval); setPaymentChecking(false); };
  }, [currentOrderNo, paymentQR, paymentSuccess]);

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
                      currentImage === i
                        ? "border-accent"
                        : "border-transparent hover:border-gray-300"
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

              {/* ⚡ Lightbox 放大查看 */}
              <AnimatePresence>
                {lightboxOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setLightboxOpen(false)}
                  >
                    {/* 关闭按钮 */}
                    <button
                      onClick={() => setLightboxOpen(false)}
                      className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>

                    {/* 左箭头 */}
                    {allImages.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImage(i => (i - 1 + allImages.length) % allImages.length); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                    )}

                    {/* 右箭头 */}
                    {allImages.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImage(i => (i + 1) % allImages.length); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                    )}

                    {/* 放大后的图片 */}
                    <motion.img
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                      src={allImages[currentImage]!}
                      alt={product.title}
                      className="max-w-[90vw] max-h-[90vh] object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* 图片计数器 */}
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

              {/* 价格 */}
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
                    💎 会员价，立省 ¥{((product.original_price - product.price) / 100).toFixed(0)}
                  </div>
                )}
              </div>

              {/* 会员开通入口 */}
              <div className="mb-6 p-3 bg-gradient-to-r from-accent/5 to-primary/5 rounded-xl border border-accent/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-primary">开通会员享折扣拿货</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">充值5万享2.8折 · 充值30万享2.6折</p>
                  </div>
                  <Link href="/members" className="btn-accent text-xs px-3 py-1.5 rounded-lg font-medium">
                    开通会员
                  </Link>
                </div>
              </div>

              {/* 库存 */}
              <div className="mb-6">
                <span
                  className={`text-xs font-medium ${
                    product.stock > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {product.stock > 0 ? `库存 ${product.stock} 件` : "暂时缺货"}
                </span>
              </div>

              {/* 标签 */}
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

              {/* 供应商信息 */}
              {product.supplier_name && (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="text-sm text-gray-600">供应商：</span>
                  <span className="text-sm font-medium text-primary">{product.supplier_name}</span>
                </div>
              )}

              {/* 采购意向按钮 */}
              <button
                onClick={() => setShowPurchaseIntent(true)}
                disabled={product.stock === 0}
                className="w-full btn-accent py-3.5 rounded-xl text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-5 h-5" />
                立即下单
              </button>
              <p className="mt-2 text-xs text-center text-muted-foreground">
                微信/支付宝扫码支付，安全便捷
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

      {/* 下单支付弹窗 */}
      <AnimatePresence>
        {showPurchaseIntent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!paymentQR && !paymentSuccess) setShowPurchaseIntent(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {paymentSuccess ? "支付成功" : paymentQR ? "请付款" : "确认订单"}
                </h3>
                <button onClick={() => setShowPurchaseIntent(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 支付成功 */}
              {paymentSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-bold text-gray-800">支付成功！</p>
                  <p className="text-sm text-gray-500 mt-2">订单号：{currentOrderNo}</p>
                  <p className="text-sm text-gray-500 mt-1">我们将尽快安排发货，请保持联系方式畅通。</p>
                  <button onClick={() => setShowPurchaseIntent(false)}
                    className="mt-6 px-8 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/90 transition-colors">
                    完成
                  </button>
                </div>
              ) : paymentQR ? (
                /* 线下付款 */
                <div className="text-center">
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">{product.title}</p>
                    <p className="text-2xl font-bold text-accent">
                      ¥{((product.price * purchaseQuantity) / 100).toFixed(0)}
                      <span className="text-sm font-normal text-gray-400 ml-1">× {purchaseQuantity}件</span>
                    </p>
                  </div>

                  {/* 微信收款码 */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">1. 微信扫码付款</p>
                    <div className="flex justify-center">
                      <img src="/images/wechat-pay-qr.png" alt="微信收款码" className="w-52 h-auto rounded-xl border border-gray-100" />
                    </div>
                  </div>

                  {/* 银行转账 */}
                  <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-left">
                    <p className="text-sm font-medium text-gray-700 mb-1">2. 银行对公转账</p>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <p>户名：骆芷蝶（待补充）</p>
                      <p>开户行：（待补充）</p>
                      <p>账号：（待补充）</p>
                    </div>
                    <p className="text-[10px] text-amber-600 mt-1">转账时请备注订单号：{currentOrderNo}</p>
                  </div>

                  <div className="relative flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">付款完成后</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <button onClick={() => setPurchaseSubmitted(true)}
                    className="w-full py-3 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">
                    我已付款，提交凭证
                  </button>
                  <p className="text-xs text-gray-400 mt-2">付款后请截图发给客服确认</p>
                </div>
              ) : (
                /* 订单确认表单 */
                <form onSubmit={(e) => { e.preventDefault(); handleCreateOrder(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">商品</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                      {product.title} · {formatPrice(product.price)}/件
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">采购数量 *</label>
                    <input type="number" min={1} value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                      required />
                    <p className="text-xs text-accent mt-1">
                      合计：¥{((product.price * purchaseQuantity) / 100).toFixed(0)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">联系方式 *</label>
                    <input type="text" value={purchaseContact} onChange={(e) => setPurchaseContact(e.target.value)}
                      placeholder="手机号/微信号"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                      required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">收货地址</label>
                    <input type="text" value={purchaseAddress} onChange={(e) => setPurchaseAddress(e.target.value)}
                      placeholder="省/市/区/详细地址"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                    <textarea value={purchaseNote} onChange={(e) => setPurchaseNote(e.target.value)}
                      placeholder="尺码、颜色等要求" rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none resize-none" />
                  </div>

                  {/* 支付方式选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">支付方式</label>
                    <div className="flex gap-3">
                      <button type="button"
                        onClick={() => setPaymentType("wechat")}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                          paymentType === "wechat" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600"
                        }`}>
                        微信支付
                      </button>
                      <button type="button"
                        onClick={() => setPaymentType("alipay")}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                          paymentType === "alipay" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                        }`}>
                        支付宝
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={orderCreating}
                    className="w-full py-3 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50">
                    {orderCreating ? "正在创建订单..." : `确认支付 ¥${((product.price * purchaseQuantity) / 100).toFixed(0)}`}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
