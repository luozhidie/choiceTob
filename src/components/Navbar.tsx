"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Menu, X, ChevronRight, User, LogOut, Sparkles } from "lucide-react";

const navItems = [
  { label: "VIP会员", href: "/vip" },
  { label: "风格测试", href: "/style-test" },
  { label: "线上课程", href: "/courses" },
  { label: "买手选品", href: "/buyer" },
  { label: "商品企划", href: "/planning" },
  { label: "陈列搭配", href: "/display" },
  { label: "营销策划", href: "/marketing" },
  { label: "时尚博主", href: "/magazine" },
  { label: "原创爆款", href: "/designer" },
  { label: "联系我们", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

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
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/members"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-primary hover:bg-muted rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  {profile?.full_name || user.email?.split("@")[0] || "用户"}
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
      </nav>
    </header>
  );
}
