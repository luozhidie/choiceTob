"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag, Building2, Truck, X,
  ChevronLeft, ChevronRight, Layers, Star,
  Clock, ShoppingCart, Share2, Copy, Check,
  Image as ImageIcon, MessageCircle,
  Lock, BookOpen, Lightbulb, Tag, Shirt,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CATEGORY_MAP,
  SUBCATEGORY_MAP,
} from "@/lib/categories";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import MembershipCard from "@/components/product/MembershipCard";
import CouponClaim, { CouponTemplate } from "@/components/product/CouponClaim";
import SizeChart from "@/components/product/SizeChart";
import { WHOLESALE_GUIDE, WHOLESALE_TIPS } from "@/lib/wholesale-content";

interface Product {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  images: string[] | null;
  price: number;
  original_price: number | null;
  wholesale_price: number | null;   // 批发价
  sales_count?: number | null;      // 销量（已拼件数）
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
  /* 商品详情（HTML） */
  detail?: string | null;
  /* 新增媒体字段 */
  video_url?: string | null;
  model_images?: string[] | null;
  size_chart_image?: string | null;
  /* 参数 */
  material?: string | null;
  sizes?: string | null;
  origin?: string | null;
  brand?: string | null;
  weight?: string | null;
  care_instructions?: string | null;
  /* 详细参数 JSONB（含套装拆分价 set_items） */
  params?: Record<string, any> | null;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { user: authUser, canViewWholesale, isCertifiedStoreOwner, profile } = useAuth();

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
  // 优惠券
  const [couponTemplates, setCouponTemplates] = useState<CouponTemplate[]>([]);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const { addItem } = useCart();

  // 店铺推荐位（对标一手：档口最新款 / 档口大爆款 / 新人推荐）
  const [shopRecLatest, setShopRecLatest] = useState<Product[]>([]);
  const [shopRecHot, setShopRecHot] = useState<Product[]>([]);
  const [shopRecNewbie, setShopRecNewbie] = useState<Product[]>([]);

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
        const res = await fetch(url);
        const json = await res.json();
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
            sales_count: p.sales_count || null,
            category: p.category || null,
            subcategory: p.subcategory || null,
            tags: p.tags || null,
            is_published: p.is_published ?? true,
            stock: p.stock || 0,
            source: "platform",
            is_preorder: false,
            preorder_days: null,
            detail: p.detail || null,
            video_url: p.video_url || null,
            model_images: p.model_images || null,
            size_chart_image: p.size_chart_image || null,
            material: p.material || null,
            sizes: p.sizes || null,
            origin: p.origin || null,
            brand: p.brand || null,
            weight: p.weight || null,
            care_instructions: p.care_instructions || null,
            params: p.params || null,
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

  // 获取可领优惠券模板（公开）
  useEffect(() => {
    fetch("/api/coupons/templates")
      .then((r) => r.json())
      .then((j) => { if (j.success) setCouponTemplates(j.data || []); })
      .catch(() => {});
  }, []);

  // 获取店铺可编辑内容（拿货指南/技巧/面料洗护/发货，后台 store-content 编辑）
  useEffect(() => {
    fetch("/api/public/store-content")
      .then((r) => r.json())
      .then((j) => { if (j.success && j.data) setStoreContent(j.data); })
      .catch(() => {});
  }, []);

  // 店铺推荐位：最新款 / 大爆款(按销量) / 新人推荐
  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    const cat = product.category;
    const base = `/api/public/products?limit=10${cat ? `&category=${encodeURIComponent(cat)}` : ""}`;
    fetch(base).then((r) => r.json()).then((j: any) => {
      if (!j.success) return;
      const list: any[] = (j.data || []).filter((p: any) => p.id !== product.id);
      if (cancelled) return;
      setShopRecLatest(list.slice(0, 8));
      const hot = [...list].sort((a: any, b: any) => (b.sales || 0) - (a.sales || 0)).slice(0, 8);
      setShopRecHot(hot);
    }).catch(() => {});
    fetch(`/api/public/products?limit=10`).then((r) => r.json()).then((j: any) => {
      if (!j.success || cancelled) return;
      const list2: any[] = (j.data || []).filter((p: any) => p.id !== product.id);
      setShopRecNewbie(list2.slice(0, 8));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [product?.category, product?.id]);

  // 已登录用户：标记已领取的券
  useEffect(() => {
    if (!authUser) { setClaimedIds([]); return; }
    fetch(`/api/coupons?user_id=${authUser.id}&status=unused`)
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          const ids = j.data.filter((c: any) => c.template_id).map((c: any) => c.template_id);
          setClaimedIds(ids);
        }
      })
      .catch(() => {});
  }, [authUser]);

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  // 商品标签：自定义 tags + 自动（会员 / 货源 / 今日新款）
  const tagColor = (t: string) => {
    if (t === "会员") return "bg-red-50 text-red-500";
    if (t.includes("货源")) return "bg-blue-50 text-blue-500";
    if (t === "今日新款") return "bg-green-50 text-green-600";
    return "bg-gray-100 text-gray-600";
  };
  const displayTags = (() => {
    const auto: string[] = [];
    if (isPriceMember || canViewWholesale) auto.push("会员");
    return Array.from(new Set([...(product?.tags || []), ...auto]));
  })();

  // 推荐位卡片
  const renderRecCard = (p: any) => (
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
  );

  // 领取优惠券
  const handleClaim = async (templateId: string) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return { ok: false, error: "请先登录" };
    try {
      const res = await fetch("/api/coupons/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ template_id: templateId }),
      });
      const j = await res.json();
      if (j.success) {
        setClaimedIds((prev) => [...prev, templateId]);
        return { ok: true };
      }
      if (j.code === "already_claimed") return { ok: false, already: true };
      return { ok: false, error: j.error || "领取失败" };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  };

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

  // ---- 媒体资源 ----
  const allImages = product.images?.length
    ? [product.cover_image, ...product.images].filter(Boolean)
    : [product.cover_image];
  const modelImages = (product.model_images || []).filter(Boolean) as string[];
  const paramRows = [
    product.material && { label: "材质", value: product.material },
    product.sizes && { label: "尺码", value: product.sizes },
    product.origin && { label: "产地", value: product.origin },
    product.brand && { label: "品牌", value: product.brand },
    product.weight && { label: "重量", value: product.weight },
    product.care_instructions && { label: "洗涤说明", value: product.care_instructions },
  ].filter(Boolean) as { label: string; value: string }[];

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
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
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
          <button
            onClick={() => setShareOpen(true)}
            className="ml-3 p-2 rounded-full hover:bg-gray-100 active:scale-90 transition-all shrink-0"
            title="分享商品"
          >
            <Share2 className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl pb-16">
        {/* ====== 1. 视频 ====== */}
        {product.video_url && (
          <section className="pt-4">
            <video
              src={product.video_url}
              controls
              playsInline
              className="w-full rounded-2xl bg-black aspect-video object-contain"
            />
          </section>
        )}

        {/* ====== 2-3. 实拍图主图 + 模特图横滑 ====== */}
        <section className="pt-4">
          {/* 主图轮播 */}
          <div className="relative">
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
            {/* 缩略图 */}
            {allImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentImage(i); }}
                    className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImage === i ? "border-accent" : "border-transparent"
                    }`}
                  >
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
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

          {/* 模特图横滑条 */}
          {modelImages.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-1.5 mb-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-gray-700">模特图</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {modelImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`模特图${i + 1}`}
                    className="w-24 h-32 shrink-0 rounded-lg object-cover border border-gray-100"
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ====== 4-5. 标题 / 价格 / 购买 ====== */}
        <section className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
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

          <h1 className="text-2xl font-bold text-primary mb-2">
            {product.title}
          </h1>
          {product.description && (
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              {product.description}
            </p>
          )}

          {product.is_preorder && (
            <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600">
                预售{product.preorder_days ? `，${product.preorder_days}天内发货` : ""}
              </span>
            </div>
          )}

          {/* 价格 */}
          <div className="mb-2">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-lg text-gray-400 line-through mb-1">原价 {formatPrice(product.original_price)}</span>
              )}
              <span className="text-sm text-gray-400 mb-1">零售价</span>
            </div>

            {product.wholesale_price && (
              <div className="flex items-center gap-2 mt-1.5 text-sm">
                <span className="text-gray-400">动力预估价</span>
                <span className="text-orange-500 font-semibold">
                  {canViewWholesale ? formatPrice(product.wholesale_price) : "开通会员看预估价"}
                </span>
              </div>
            )}
            {product.sales_count ? (
              <div className="text-xs text-gray-400 mt-1">今日已拼 {product.sales_count} 件</div>
            ) : null}

            {/* 套装拆分价明细（上下装 / 两件套 / 三件套） */}
            {Array.isArray(product.params?.set_items) && product.params!.set_items.length > 0 && (() => {
              const items: any[] = product.params!.set_items;
              return (
                <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <div className="text-xs font-semibold text-amber-800 mb-2">套装包含（拆分价）</div>
                  <div className="space-y-1">
                    {items.map((it: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{it.name || `部件${i + 1}`}</span>
                        <span className="text-gray-900 font-medium">
                          {it.retail != null ? formatPrice(it.retail) : "—"}
                          {it.wholesale != null && canViewWholesale ? (
                            <span className="text-xs text-gray-400 ml-2 line-through">{formatPrice(it.wholesale)}</span>
                          ) : null}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200 text-sm">
                    <span className="text-gray-600">合计（零售）</span>
                    <span className="text-base font-bold text-gray-900">
                      {formatPrice(items.reduce((a: number, b: any) => a + (b.retail || 0), 0))}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div
              className={`mt-2 flex items-center gap-2 p-[10px] rounded-lg border transition-all cursor-pointer ${canViewWholesale && product.wholesale_price ? "bg-green-50 border-green-200 hover:bg-green-100" : "bg-blue-50 border-blue-200 hover:border-blue-300"}`}
              onClick={() => {
                if (!authUser) { router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`); return; }
                if (!canViewWholesale) setShowWholesalePrompt(true);
              }}
            >
              <Lock className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-sm font-medium text-blue-700">批发价</span>
              {!authUser ? (
                <span className="text-lg font-bold text-blue-600 ml-auto">登录可见</span>
              ) : canViewWholesale && product.wholesale_price ? (
                <span className="text-lg font-bold text-green-600 ml-auto">{formatPrice(product.wholesale_price)}</span>
              ) : canViewWholesale ? (
                <span className="text-lg font-bold text-blue-600 ml-auto">¥???</span>
              ) : (
                <span className="text-lg font-bold text-blue-600 ml-auto">认证/会员可见</span>
              )}
              <span className="text-[10px] text-blue-400 ml-1">{
                !authUser ? "去登录" : canViewWholesale ? "批发价" : isCertifiedStoreOwner ? "批发价" : "认证/开通"
              }</span>
            </div>
          </div>

          {/* 数量 */}
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
          <div className="mb-3">
            <span className={`text-xs font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
              {product.stock > 0 ? `库存 ${product.stock} 件` : "暂时缺货"}
            </span>
          </div>

          {/* 标签 */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {displayTags.map((tag) => (
                <span key={tag} className={`px-2.5 py-1 rounded-full text-xs ${tagColor(tag)}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 供应商信息 */}
          {product.supplier_name && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
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

          <button
            onClick={() => setShareOpen(true)}
            className="mt-3 w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 border border-dashed border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <Share2 className="w-4 h-4" />
            分享给好友
          </button>

          {product.category && (
            <Link
              href={categoryLink}
              className="mt-4 block text-center text-sm text-primary hover:text-accent transition-colors font-medium"
            >
              查看更多「{CATEGORY_MAP[product.category]}」商品 →
            </Link>
          )}
        </section>

        {/* ====== 6. 会员权益 ====== */}
        <section className="mt-4">
          <MembershipCard
            membershipType={profile?.membership_type}
            expiresAt={profile?.membership_expires_at}
          />
        </section>

        {/* ====== 7. 优惠券（可领取） ====== */}
        <section className="mt-4">
          <CouponClaim
            templates={couponTemplates}
            claimedIds={claimedIds}
            loggedIn={!!authUser}
            onClaim={handleClaim}
          />
        </section>

        {/* ====== 8. 尺码 ====== */}
        <section className="mt-4">
          <SizeChart image={product.size_chart_image} sizesText={product.sizes} />
        </section>

        {/* ====== 9. 商品参数 ====== */}
        {paramRows.length > 0 && (
          <section className="mt-4 bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-primary">商品参数</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {paramRows.map((row) => (
                <div key={row.label} className="flex py-2.5 text-sm">
                  <span className="w-20 shrink-0 text-gray-400">{row.label}</span>
                  <span className="flex-1 text-gray-700">{row.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ====== 10. 商品详情（HTML，支持图文） ====== */}
        {product.detail && (
          <section className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-primary">商品详情</h2>
            </div>
            <div
              className="leading-relaxed text-gray-700 [&_img]:w-full [&_img]:rounded-lg [&_div]:my-4"
              dangerouslySetInnerHTML={{ __html: product.detail }}
            />
          </section>
        )}

        {/* ====== 11. 拿货指南（后台 store-content 可编辑） ====== */}
        <section className="mt-4 bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-primary">拿货指南</h2>
          </div>
          <div className="space-y-3">
            {(storeContent?.wholesale_guide && storeContent.wholesale_guide.length > 0
              ? storeContent.wholesale_guide
              : WHOLESALE_GUIDE
            ).map((g: any, i: number) => (
              <div key={i}>
                <p className="text-sm font-semibold text-gray-800">{g.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed mt-0.5">{g.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ====== 12. 拿货技巧 + 面料洗护（后台 store-content 可编辑） ====== */}
        <section className="mt-4 bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-primary">拿货技巧</h2>
          </div>
          <div className="space-y-3">
            {(storeContent?.seller_tips && storeContent.seller_tips.length > 0
              ? storeContent.seller_tips
              : WHOLESALE_TIPS
            ).map((t: any, i: number) => (
              <div key={i}>
                <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed mt-0.5">{t.desc}</p>
              </div>
            ))}
          </div>
          {storeContent?.fabric_care && (
            <div className="mt-4 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Shirt className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-primary">面料洗护</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{storeContent.fabric_care}</p>
            </div>
          )}
        </section>

        {/* ====== 一品三搭：搭配方案展示 ====== */}
        <section className="mt-4 bg-gradient-to-b from-white to-gray-50/50 border border-gray-100 rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-primary">一品三搭 · 搭配灵感</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">一件单品，三种风格，提升连带率</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </section>

        {/* ====== 13. 同款式 / 相似推荐 ====== */}
        {supplierProducts.length > 0 && (
          <section className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-primary">同款式 · 相似推荐</h2>
              {product.supplier_name && (
                <span className="text-xs text-gray-400 ml-2">{product.supplier_name}</span>
              )}
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
          </section>
        )}

        {/* ====== 14-16. 店铺推荐位（对标一手） ====== */}
        {shopRecLatest.length > 0 && (
          <section className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 md:p-6">
            <h2 className="text-base font-bold text-primary mb-6">🆕 档口最新款</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {shopRecLatest.map(renderRecCard)}
            </div>
          </section>
        )}
        {shopRecHot.length > 0 && (
          <section className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 md:p-6">
            <h2 className="text-base font-bold text-primary mb-6">🔥 档口大爆款</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {shopRecHot.map(renderRecCard)}
            </div>
          </section>
        )}
        {shopRecNewbie.length > 0 && (
          <section className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 md:p-6">
            <h2 className="text-base font-bold text-primary mb-6">👤 新人推荐</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {shopRecNewbie.map(renderRecCard)}
            </div>
          </section>
        )}

      </div>

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
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
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
                    <p className="text-red-500 font-bold mt-1.5">{formatPrice(product.price)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      骆芷蝶智选 · 不自用不分享
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-3">
                  <button
                    onClick={copyShareLink}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${copied ? "bg-green-100" : "bg-blue-100"}`}>
                      {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-blue-600" />}
                    </div>
                    <span className="text-[11px] font-medium text-gray-700">{copied ? "已复制" : "复制链接"}</span>
                  </button>
                  <button
                    onClick={handleNativeShare}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-700">系统分享</span>
                  </button>
                  <button
                    onClick={() => { if (product.cover_image) window.open(product.cover_image, "_blank"); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-700">分享图片</span>
                  </button>
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

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-[11px] text-gray-400 mb-1.5">商品链接</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-gray-600 truncate bg-white px-3 py-2 rounded border">
                      {shareUrl}
                    </code>
                    <button
                      onClick={copyShareLink}
                      className={`shrink-0 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${copied ? "bg-green-500 text-white" : "bg-gray-800 text-white hover:bg-gray-700"}`}
                    >
                      {copied ? "✓ 已复制" : "复制"}
                    </button>
                  </div>
                </div>

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
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-gray-900">解锁批发价</h3>
                </div>
                <button
                  onClick={() => setShowWholesalePrompt(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="px-6 py-5">
                <p className="text-sm text-gray-500 mb-4">
                  查看所有商品批发价，享受专属采购权益
                </p>

                {!isCertifiedStoreOwner && (
                  <Link
                    href="/certify"
                    onClick={() => setShowWholesalePrompt(false)}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5 hover:border-accent/50 transition-all group mb-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">认证店主 · 免费看批发价</div>
                        <div className="text-xs text-gray-400 mt-0.5">通过行业知识答题即可解锁</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-accent">免费</div>
                      <div className="text-[10px] text-accent font-medium group-hover:underline">去认证 →</div>
                    </div>
                  </Link>
                )}

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
                        <div className="text-[10px] text-primary font-medium group-hover:text-accent transition-colors">立即开通 →</div>
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
