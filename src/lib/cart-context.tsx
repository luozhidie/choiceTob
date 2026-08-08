"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface CartItem {
  id: string;              // product_id
  title: string;
  image: string | null;
  price: number;           // 单价（分）
  originalPrice: number | null;  // 原价
  quantity: number;        // 数量
  source: string;          // 'buyer' 或 'platform'
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "lzdzhixuan_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 从localStorage加载购物车
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("加载购物车失败:", e);
    }
    setLoaded(true);
  }, []);

  // 保存到localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  // 添加商品到购物车
  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.id === item.id);
      if (existingIndex > -1) {
        // 已存在，增加数量
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      // 新增
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // 移除商品
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // 更新数量
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // 清空购物车
  const clearCart = () => {
    setItems([]);
  };

  // 计算总数量
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // 计算总价格
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 检查商品是否在购物车中
  const isInCart = (id: string) => items.some(item => item.id === id);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isInCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
