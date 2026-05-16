"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight, TrendingUp } from "lucide-react";

const navItems = [
  { label: "首页", href: "/" },
  { label: "风格测试", href: "/style-test" },
  { label: "线上课程", href: "/courses" },
  { label: "精选好物", href: "/shop" },
  { label: "买手选品", href: "/buyer" },
  { label: "商品企划", href: "/planning" },
  { label: "爆款货盘", href: "/hot-picks" },
  { label: "陈列搭配", href: "/display" },
  { label: "营销策划", href: "/marketing" },
  { label: "销售服务", href: "/sales" },
  { label: "VIP管理", href: "/vip" },
  { label: "原创设计", href: "/designer" },
  { label: "联系我们", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
              <span className="text-white font-bold text-sm">骆</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-primary font-bold text-base tracking-wide">
                骆芷蝶智选
              </span>
              <span className="text-[10px] text-muted-foreground tracking-widest">
                LUOZHDIE ZHIXUAN
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-md hover:bg-primary/5 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-sm"
            >
              免费体验
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="切换菜单"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 pb-4 animate-[slideDown_0.2s_ease-out]">
            <div className="flex flex-col gap-1 pt-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 px-4">
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
              >
                免费体验
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
