// shop/[id]/testing/page.tsx - 测款专用商品预览页
// 访问方式：/shop/商品ID/testing?campaign_id=任务ID
// 自动记录 view/click/add_cart/inquire 行为
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  stock: number;
  source?: string;
}

// 获取或创建 visitor_id（存在 localStorage，标识同一访客）
function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("visitor_id");
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem("visitor_id", id);
  }
  return id;
}

// 上报行为事件
async function trackEvent(campaignId: string, productId: string, eventType: string) {
  try {
    const visitorId = getVisitorId();
    await fetch("/api/product-test/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaign_id: campaignId,
        product_id: productId,
        event_type: eventType,
        visitor_id: visitorId,
      }),
    });
  } catch (e) {
    console.error("[测款追踪] 上报失败:", e);
  }
}

export default function ProductTestingPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const campaignId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("campaign_id")
    : null;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  // 读取商品数据
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
        const res = await fetch(
          `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=*`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0 && !cancelled) {
            setProduct({
              id: data[0].id,
              title: data[0].title || "商品",
              description: data[0].description,
              cover_image: data[0].cover_image || null,
              price: data[0].price || 0,
              stock: data[0].stock || 0,
              source: "platform",
            });
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 再查 buyer_products 表
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/buyer_products?id=eq.${encodeURIComponent(productId)}&select=*`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0 && !cancelled) {
            setProduct({
              id: data[0].id,
              title: data[0].title || data[0].name || "选品商品",
              description: data[0].description,
              cover_image: data[0].cover_image || null,
              price: data[0].price || 0,
              stock: data[0].stock || 0,
              supplier_name: data[0].supplier_name || null,
              source: data[0].source || "buyer",
            });
          }
        }
      } catch {}

      if (!cancelled) setLoading(false);
    };

    fetchProduct();
    return () => { cancelled = true; };
  }, [productId]);

  // 上报 view 事件（进入页面时）
  useEffect(() => {
    if (product && campaignId) {
      trackEvent(campaignId, product.id, "view");
    }
  }, [product, campaignId]);

  const handleAddCart = () => {
    setAddedToCart(true);
    if (campaignId) {
      trackEvent(campaignId, productId, "add_cart");
    }
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleInquire = () => {
    if (campaignId) {
      trackEvent(campaignId, productId, "inquire");
    }
    alert("✅ 已记录询价意向！\n商家会尽快联系您～");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-lg text-gray-400">商品不存在</div>
        <Link href="/buyer" className="text-sm text-primary hover:underline">返回买手选品 →</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 测款模式提示栏 */}
      {campaignId && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-2 text-center text-sm font-medium">
          📊 测款模式已启动 — 您的浏览行为将帮助商家优化选品
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="md:flex gap-8">
            {/* 商品图片 */}
            <div className="md:w-1/2 mb-6 md:mb-0">
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center overflow-hidden">
                {product.cover_image ? (
                  <img
                    src={product.cover_image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onClick={() => {
                      // 点击图片上报 click 事件
                      if (campaignId) trackEvent(campaignId, product.id, "click");
                    }}
                  />
                ) : (
                  <ShoppingCart className="w-16 h-16 text-primary/30" />
                )}
              </div>
            </div>

            {/* 商品信息 */}
            <div className="md:w-1/2">
              <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                {product.title}
              </h1>

              {product.description && (
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* 价格 */}
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  ¥{Math.round(product.price).toLocaleString()}
                </span>
                <span className="text-sm text-gray-400 ml-2">零售价</span>
              </div>

              {/* 库存 */}
              <div className="mb-6">
                <span className={`text-sm font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                  {product.stock > 0 ? `库存 ${product.stock} 件` : "暂时缺货"}
                </span>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddCart}
                  className={`flex-1 py-3 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-colors ${
                    addedToCart
                      ? "bg-green-500 text-white"
                      : "border-2 border-accent text-accent hover:bg-accent/5"
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addedToCart ? "✅ 已加购" : "加入购物车"}
                </button>

                <button
                  onClick={handleInquire}
                  className="flex-1 py-3 bg-accent text-white text-base font-bold rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  询价/下单
                </button>
              </div>

              {campaignId && (
                <p className="mt-4 text-xs text-gray-400 text-center">
                  💡 点击"加入购物车"或"询价/下单"会帮助商家统计测款数据
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
