"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Menu, X, ChevronRight, User, LogOut, Sparkles, ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";

const navItems = [
  { label: "👑 会员中心", href: "/members" },
  { label: "每日搭配", href: "/daily-looks" },
  { label: "教学课程", href: "/courses" },
  { label: "风格测试", href: "/style-test" },
  { label: "买手选品", href: "/buyer" },
  { label: "时尚博主", href: "/magazine" },
  { label: "联系我们", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  // 格式化价格
  const formatPrice = (price: number) => `¥${(price / 100).toFixed(2)}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-border/80">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary group-hover:bg-accent transition-colors duration-300">
              <span className="text-white font-bold text-sm tracking-wider">骆</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-primary font-bold text-base tracking-wide">
                骆芷蝶智选
              </span>
              <span className="text-[9px] text-muted-foreground tracking-[0.15em] uppercase">
                CHOICETOB
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-[13px] font-medium text-foreground/70 hover:text-primary rounded-lg hover:bg-muted transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {/* 购物车按钮 */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-foreground/70 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
              title="购物车"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/my"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-primary hover:bg-muted rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  {profile?.full_name || user.email?.split("@")[0] || "我的"}
                </Link>
                <Link
                  href="/checkout/cart"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors relative"
                >
                  <ShoppingCart className="w-4 h-4" />
                  购物车
                  {totalItems > 0 && (
                    <span className="w-4 h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">{totalItems > 99 ? '99+' : totalItems}</span>
                  )}
                </Link>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-[13px] font-medium text-foreground/70 hover:text-primary rounded-lg hover:bg-muted transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="btn-fashion btn-fashion-accent text-[13px] px-5 py-2.5"
                >
                  注册
                  <Sparkles className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg text-foreground/70 hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="切换菜单"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border pb-5 animate-[slideDown_0.2s_ease-out]">
            <div className="flex flex-col gap-0.5 pt-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-foreground/70 hover:text-primary hover:bg-muted rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 px-4 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/70">
                    <User className="w-4 h-4" />
                    {profile?.full_name || user.email?.split("@")[0] || "用户"}
                  </div>
                  <Link
                    href="/my"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors"
                  >
                    我的报告
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-border text-foreground/70 text-sm font-semibold rounded-lg hover:bg-muted transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-border text-foreground text-sm font-semibold rounded-lg hover:bg-muted transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
                  >
                    注册
                    <Sparkles className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* 购物车侧边栏 */}
        {cartOpen && (
          <div className="fixed inset-0 z-[60]">
            {/* 遮罩层 */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            {/* 侧边栏 */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
              {/* 头部 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-accent" />
                  购物车 ({totalItems}件)
                </h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* 商品列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p>购物车是空的</p>
                    <Link
                      href="/buyer"
                      onClick={() => setCartOpen(false)}
                      className="inline-block mt-3 text-accent font-medium hover:underline"
                    >
                      去选购 →
                    </Link>
                  </div>
                ) : (
                  items.map(item => (
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-20 h-20 rounded-lg object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
                        <p className="text-accent font-bold mt-1">{formatPrice(item.price)}</p>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <p className="text-xs text-gray-400 line-through">{formatPrice(item.originalPrice)}</p>
                        )}

                        {/* 数量控制 */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-white rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 底部结算区 */}
              {items.length > 0 && (
                <div className="border-t border-gray-100 p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">合计</span>
                    <span className="text-xl font-bold text-accent">{formatPrice(totalPrice)}</span>
                  </div>

                  <Link
                    href="/checkout/cart"
                    onClick={() => setCartOpen(false)}
                    className="block w-full py-3 bg-green-500 text-white text-center font-bold rounded-xl hover:bg-green-600 transition-colors"
                  >
                    💚 立即结算 ({totalItems}件)
                  </Link>

                  <button
                    onClick={() => { clearCart(); }}
                    className="block w-full py-2 text-center text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    清空购物车
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
