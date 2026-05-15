"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  Lightbulb,
  FileText,
  BarChart3,
  LayoutGrid,
  Megaphone,
  Headphones,
  Crown,
  Truck,
  GraduationCap,
  BookOpen,
  Palette,
  ShoppingBag,
  Calendar,
  Sparkles,
  ListOrdered,
  Layers,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const sidebarItems = [
  { label: "数据概览", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "买手选品", href: "/admin/buyer", icon: TrendingUp },
  { label: "选品步骤", href: "/admin/buyer-steps", icon: ListOrdered },
  { label: "选品功能", href: "/admin/buyer-features", icon: Layers },
  { label: "商品企划", href: "/admin/planning", icon: Lightbulb },
  { label: "企划工具", href: "/planning-tool", icon: FileText },
  { label: "爆款货盘", href: "/admin/hot-picks", icon: BarChart3 },
  { label: "陈列搭配", href: "/admin/display", icon: LayoutGrid },
  { label: "营销策划", href: "/admin/marketing", icon: Megaphone },
  { label: "销售服务", href: "/admin/sales", icon: Headphones },
  { label: "VIP管理", href: "/admin/vip", icon: Crown },
  { label: "VIP加油包", href: "/admin/vip-addons", icon: Sparkles },
  { label: "供应商中心", href: "/admin/supplier", icon: Truck },
  { label: "设计师中心", href: "/admin/designer", icon: Palette },
  { label: "买手中心", href: "/admin/buyer-center", icon: ShoppingBag },
  { label: "沙龙活动", href: "/admin/salon", icon: Calendar },
  { label: "教学中心", href: "/admin/education", icon: GraduationCap },
  { label: "流行资讯管理", href: "/admin/magazine", icon: BookOpen },
  { label: "服装趋势管理", href: "/admin/fashion-trends", icon: TrendingUp },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }
      setUser(user);
    };
    getUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  // Login page doesn't need admin layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-primary z-50 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="px-6 py-5 border-b border-white/10">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent">
                <span className="text-primary font-bold text-sm">骆</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-white font-bold text-base tracking-wide">
                  骆芷蝶智选
                </span>
                <span className="text-[10px] text-white/50 tracking-widest">
                  管理后台
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent text-primary"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    {item.label}
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="px-3 py-4 border-t border-white/10">
            <div className="px-3 py-2 mb-2">
              <div className="text-xs text-white/50">当前用户</div>
              <div className="text-sm text-white/80 truncate">
                {user?.email || "加载中..."}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4.5 h-4.5" />
              退出登录
            </button>
            <Link
              href="/"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors mt-1"
            >
              <ChevronRight className="w-4.5 h-4.5 rotate-180" />
              返回前台网站
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">管理后台</span>
              <span className="text-sm text-gray-300">/</span>
              <span className="text-sm font-medium text-primary">
                {sidebarItems.find((item) => item.href === pathname)?.label || "数据概览"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-muted-foreground">
                🔒 已安全登录
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
