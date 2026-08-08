"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Minus, Plus, Trash2, ArrowLeft,
  MessageCircle, CheckCircle2, ShoppingBag, LogIn, UserPlus
} from "lucide-react";
import TabBar from "@/components/TabBar";

// 简化版 CartItem（避免依赖 cart-context）
interface SimpleCartItem {
  id: string;
  title: string;
  image: string | null;
  price: number;
  originalPrice: number | null;
  quantity: number;
}

export default function CartCheckoutPage() {
  const router = useRouter();

  // 直接从 localStorage 读取（带安全检查）
  const [items, setItems] = useState<SimpleCartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 安全读取购物车
  const loadCart = () => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      const stored = localStorage.getItem('lzdzhixuan_cart');
      if (stored) setItems(JSON.parse(stored));
    } catch (e) {
      console.error('加载购物车失败:', e);
    }
    setLoaded(true);
  };

  // 客户端加载
  useState(() => { loadCart(); });

  // 更新数量
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) removeItem(id);
    else {
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
      try {
        if (typeof window !== 'undefined') {
          const updated = items.map(item =>
            item.id === id ? { ...item, quantity } : item
          );
          localStorage.setItem('lzdzhixuan_cart', JSON.stringify(updated));
        }
      } catch {}
    }
  };

  // 删除商品
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    try {
      if (typeof window !== 'undefined') {
        const filtered = items.filter(item => item.id !== id);
        localStorage.setItem('lzdzhixuan_cart', JSON.stringify(filtered));
      }
    } catch {}
  };

  // 清空购物车
  const clearCart = () => {
    setItems([]);
    try { if (typeof window !== 'undefined') localStorage.removeItem('lzdzhixuan_cart'); } catch {}
  };

  // 计算总价（分）
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const formatPrice = (price: number) => `¥${(price / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <header className="bg-white border-b border-gray-200 sticky top-14 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">购物车</h1>
          <span className="ml-auto text-sm text-gray-500">{totalItems}件商品</span>
        </div>
      </header>

      {/* 购物车列表 */}
      <main className="max-w-lg mx-auto p-4 space-y-4">
        {!loaded ? (
          <div className="flex justify-center py-12">
            <ShoppingCart className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="font-bold text-gray-900 text-lg mb-2">购物车是空的</p>
            <p className="text-sm text-gray-500 mb-6">快去挑选心仪的商品吧</p>
            <Link href="/buyer" className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm">
              去选品 →
            </Link>
          </div>
        ) : (
          <>
            {/* 商品列表 */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-4 flex gap-3 shadow-sm">
                  {item.image && (
                    <img src={item.image} alt={item.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.title}</h3>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <p className="text-xs text-gray-400 line-through mt-0.5">{formatPrice(item.originalPrice)}</p>
                    )}
                    <p className="text-primary font-bold mt-1">{formatPrice(item.price)}</p>
                    {/* 数量控制 */}
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="ml-auto p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 底部结算区 */}
            <div className="bg-white rounded-xl p-4 shadow-sm sticky bottom-20 z-30">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">商品金额</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="border-t border-dashed border-gray-200 pt-3 flex items-center justify-between">
                  <span className="font-bold text-base">合计</span>
                  <span className="font-bold text-xl text-primary">{formatPrice(totalPrice)}</span>
                </div>
                <Link href="/checkout/cart" className="block w-full py-3 text-center bg-gradient-to-r from-primary/90 to-primary text-white font-bold rounded-xl hover:shadow-lg transition-all text-sm"
                   onClick={(e) => {
                     e.preventDefault();
                     alert('请先登录后再结算');
                     router.push('/login?redirect=/checkout/cart');
                   }}>
                  去结算 ({totalItems}件)
                </Link>
              </div>
            </div>

            {/* 清空按钮 */}
            <button onClick={clearCart} className="w-full py-2 text-sm text-gray-400 hover:text-red-500 transition-colors text-center">
              清空购物车
            </button>
          </>
        )}

        {/* 推荐入口 */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <a href="/buyer" className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl text-sm hover:shadow-sm transition-shadow">
            <ShoppingBag className="w-4 h-4 text-orange-500" />
            继续选品
          </a>
          <a href="/courses" className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl text-sm hover:shadow-sm transition-shadow">
            <MessageCircle className="w-4 h-4 text-blue-500" />
            课程商城
          </a>
        </div>
      </main>

      <TabBar />
    </div>
  );
}
