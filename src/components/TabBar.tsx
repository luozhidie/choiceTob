"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";

const tabs = [
  { href: "/", label: "首页", icon: Home },
  { href: "/buyer", label: "分类", icon: LayoutGrid },
  { href: "/checkout/cart", label: "购物车", icon: ShoppingCart },
  { href: "/my", label: "我的", icon: User },
];

export default function TabBar() {
  const pathname = usePathname();

  // 在管理后台和登录/注册页面不显示
  if (pathname.startsWith("/admin") || ["/login", "/register"].includes(pathname)) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "/buyer";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[60px] transition-colors ${
                active ? "text-accent" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className={`text-[10px] ${active ? "font-semibold" : "font-normal"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
