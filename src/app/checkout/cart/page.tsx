"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ShoppingCart, Trash2, Plus, Minus,
  Truck, Package, AlertCircle, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CartItem {
  id: string;
  productId: string;
  title: string;
  cover_image: string | null;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  source: "platform" | "buyer";
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWholesaleTip, setShowWholesaleTip] = useState(false);

  // 加载购物车
  useEffect(() => {
    const loadCart = () => {
      try {
        const saved = localStorage.getItem("cart_items");
        if (saved) {
          const items = JSON.parse(saved) as CartItem[];
          setCartItems(items);
          // 检查是否有3件以上的商品
          const hasWholesale = items.some(item => item.quantity >= 3);
          if (hasWholesale) {
            setShowWholesaleTip(true);
          }
        }
      } catch (e) {
        console.error("加载购物车失败:", e);
      }
      setLoading(false);
    };
    loadCart();
  }, []);

  // 保存购物车
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("cart_items", JSON.stringify(items));
  };

  // 更新数量
  const updateQuantity = (index: number, delta: number) => {
    const newItems = [...cartItems];
    const newQty = newItems[index].quantity + delta;
    if (newQty < 1) {
      removeItem(index);
      return;
    }
    newItems[index].quantity = newQty;
    saveCart(newItems);
    // 检查是否需要显示拿货提示
    const hasWholesale = newItems.some(item => item.quantity >= 3);
    setShowWholesaleTip(hasWholesale);
  };

  // 移除商品
  const removeItem = (index: number) => {
    const newItems = cartItems.filter((_, i) => i !== index);
    saveCart(newItems);
  };

  // 计算总价
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // 去结算
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    // 构建商品参数
    const itemsParam = encodeURIComponent(JSON.stringify(
      cartItems.map(item => ({
        id: item.productId,
        qty: item.quantity,
        color: item.color,
        size: item.size,
        source: item.source,
      }))
    ));
    router.push(`/checkout?items=${itemsParam}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-primary">购物车</h1>
          {cartItems.length > 0 && (
            <span className="ml-auto text-sm text-gray-500">
              {totalItems} 件
            </span>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {cartItems.length === 0 ? (
          /* 空购物车 */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 text-lg mb-2">购物车是空的</p>
            <p className="text-sm text-gray-400 mb-6">快去挑选喜欢的商品吧</p>
            <Link
              href="/buyer"
              className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              去逛逛
            </Link>
          </div>
        ) : (
          <>
            {/* 拿货会员提示 */}
            <AnimatePresence>
              {showWholesaleTip && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
                >
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-800">
                        购物车中有商品满足拿货条件
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        同色同款3件起可享批发价，开通拿货会员可享折扣和返点
                      </p>
                      <Link
                        href="/vip"
                        className="inline-block mt-2 text-xs font-medium text-amber-700 hover:text-amber-800 underline"
                      >
                        了解拿货会员优惠 →
                      </Link>
                    </div>
                    <button
                      onClick={() => setShowWholesaleTip(false)}
                      className="text-amber-400 hover:text-amber-600"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 购物车列表 */}
            <div className="space-y-3 mb-6">
              {cartItems.map((item, index) => (
                <motion.div
                  key={`${item.productId}-${item.color}-${item.size}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-4 flex gap-4 shadow-sm"
                >
                  {/* 商品图片 */}
                  <Link href={`/shop/${item.productId}`} className="shrink-0">
                    <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden">
                      {item.cover_image ? (
                        <img
                          src={item.cover_image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* 商品信息 */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/shop/${item.productId}`}>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                        {item.title}
                      </h3>
                    </Link>
                    {(item.color || item.size) && (
                      <p className="text-xs text-gray-500 mb-2">
                        {item.color && `颜色：${item.color}`}
                        {item.color && item.size && " / "}
                        {item.size && `尺寸：${item.size}`}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-accent">
                        ¥{(item.price / 100).toFixed(0)}
                      </span>
                      {/* 数量控制 */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(index, -1)}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-300"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(index, 1)}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-300"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => removeItem(index)}
                    className="self-start p-1 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* 结算栏 */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
              <div className="container mx-auto flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">合计</p>
                  <p className="text-xl font-bold text-accent">
                    ¥{(totalPrice / 100).toFixed(0)}
                  </p>
                </div>
                <button
                  onClick={handleCheckout}
                  className="px-8 py-3 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent/90 transition-colors"
                >
                  去结算 ({totalItems})
                </button>
              </div>
            </div>

            {/* 底部占位 */}
            <div className="h-20" />
          </>
        )}
      </div>
    </div>
  );
}
