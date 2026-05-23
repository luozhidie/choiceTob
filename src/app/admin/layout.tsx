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
  Calendar,
  Sparkles,
  ListOrdered,
  Layers,
  ImageIcon,
  Users,
  UserCircle,
  ClipboardList,
  Key,
  Package,
  ShoppingBag,
  Book,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Store,
  FileDown,
  CheckSquare,
  DollarSign,
  Tag,
  Warehouse,
  Receipt,
  Scissors,
  ImagePlus,
  Target,
  MessageSquare,
  Palette as StyleIcon,
} from "lucide-react";

/* ── 侧边栏分组配置 ── */
interface SidebarItem {
  label: string;
  href: string;
  icon: any;
}

interface SidebarGroup {
  title: string;
  icon: any;
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    title: "概览",
    icon: LayoutDashboard,
    items: [
      { label: "数据概览", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "店铺管理",
    icon: Store,
    items: [
      { label: "店铺列表", href: "/admin/stores", icon: Store },
      { label: "品类管理", href: "/admin/categories", icon: Tag },
      { label: "店铺买手决策", href: "/admin/store-buyer", icon: Target },
    ],
  },
  {
    title: "VIP 会员",
    icon: Crown,
    items: [
      { label: "VIP 管理", href: "/admin/vip", icon: Crown },
      { label: "VIP 加油包", href: "/admin/vip-addons", icon: Sparkles },
      { label: "色彩季型录入", href: "/admin/color-analysis", icon: Palette },
      { label: "色彩季型对比", href: "/admin/color-compare", icon: Palette },
      { label: "风格测试记录", href: "/admin/style-test-results", icon: UserCircle },
      { label: "测试码管理", href: "/admin/test-codes", icon: Key },
    ],
  },
  {
    title: "商品 & 企划",
    icon: Lightbulb,
    items: [
      { label: "商品企划", href: "/admin/product-plan", icon: Lightbulb },
      { label: "生成企划报告", href: "/admin/report", icon: FileDown },
      { label: "商品管理", href: "/admin/products", icon: ShoppingBag },
      { label: "爆款货盘", href: "/admin/hot-picks", icon: BarChart3 },
      { label: "爆款图片", href: "/admin/hot-picks-images", icon: ImageIcon },
      { label: "买手选品", href: "/admin/buyer", icon: TrendingUp },
      { label: "选品步骤", href: "/admin/buyer-steps", icon: ListOrdered },
      { label: "选品功能", href: "/admin/buyer-features", icon: Layers },
      { label: "买手中心", href: "/admin/buyer-center", icon: Users },
    ],
  },
  {
    title: "采购 & 供应链",
    icon: Truck,
    items: [
      { label: "采购意向", href: "/admin/purchase-intents", icon: ClipboardList },
      { label: "订单管理", href: "/admin/orders", icon: ShoppingBag },
      { label: "采购订单", href: "/admin/purchase-orders", icon: Truck },
      { label: "供应商管理", href: "/admin/supplier", icon: Package },
      { label: "供应商图片", href: "/admin/supplier-images", icon: ImagePlus },
    ],
  },
  {
    title: "库存 & 销售",
    icon: Warehouse,
    items: [
      { label: "库存管理", href: "/admin/inventory", icon: Warehouse },
      { label: "销售数据", href: "/admin/sales-data", icon: Receipt },
      { label: "订单管理", href: "/admin/orders", icon: FileText },
      { label: "市场需求统计", href: "/admin/market-demand", icon: TrendingUp },
    ],
  },
  {
    title: "陈列 & 搭配",
    icon: LayoutGrid,
    items: [
      { label: "陈列搭配", href: "/admin/display", icon: LayoutGrid },
      { label: "陈列图片", href: "/admin/display-images", icon: ImageIcon },
    ],
  },
  {
    title: "营销 & 内容",
    icon: Megaphone,
    items: [
      { label: "营销策划", href: "/admin/marketing", icon: Megaphone },
      { label: "营销图片", href: "/admin/marketing-images", icon: ImageIcon },
      { label: "销售服务", href: "/admin/sales", icon: Headphones },
      { label: "销售图片", href: "/admin/sales-images", icon: ImageIcon },
      { label: "内容日历", href: "/admin/content-calendar", icon: Calendar },
      { label: "沙龙活动", href: "/admin/salon", icon: Calendar },
      { label: "原创设计", href: "/admin/designer", icon: Scissors },
    ],
  },
  {
    title: "客户 & 线索",
    icon: Users,
    items: [
      { label: "客户管理", href: "/admin/customers", icon: Users },
      { label: "线索管理", href: "/admin/leads", icon: ClipboardList },
      { label: "交付方案", href: "/admin/deliveries", icon: Package },
    ],
  },
  {
    title: "项目 & 预算",
    icon: CheckSquare,
    items: [
      { label: "项目进度", href: "/admin/project-tracker", icon: CheckSquare },
      { label: "预算与成本", href: "/admin/budget-tracker", icon: DollarSign },
    ],
  },
  {
    title: "教学 & 资讯",
    icon: GraduationCap,
    items: [
      { label: "教学中心", href: "/admin/education", icon: GraduationCap },
      { label: "课程管理", href: "/admin/courses", icon: Book },
      { label: "流行资讯", href: "/admin/magazine", icon: BookOpen },
      { label: "服装趋势", href: "/admin/fashion-trends", icon: TrendingUp },
    ],
  },
];

/* ── 扁平化所有项用于面包屑 ── */
const allSidebarItems = sidebarGroups.flatMap((g) => g.items);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
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

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // 判断分组是否有激活项
  const isGroupActive = (group: SidebarGroup) =>
    group.items.some((item) => pathname === item.href);

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
          <div className="px-5 py-4 border-b border-white/10">
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
          <nav className="flex-1 px-2 py-3 overflow-y-auto">
            <div className="space-y-0.5">
              {sidebarGroups.map((group) => {
                const active = isGroupActive(group);
                const collapsed = collapsedGroups[group.title];
                // 概览组没有折叠按钮，直接展示
                if (group.items.length === 1 && group.title === "概览") {
                  return group.items.map((item) => {
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
                        <item.icon className="w-4 h-4" />
                        {item.label}
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </Link>
                    );
                  });
                }

                return (
                  <div key={group.title} className="mb-1">
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(group.title)}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                        active
                          ? "text-accent"
                          : "text-white/40 hover:text-white/60"
                      }`}
                    >
                      <group.icon className="w-3.5 h-3.5" />
                      {group.title}
                      <ChevronDown
                        className={`w-3 h-3 ml-auto transition-transform ${
                          collapsed ? "-rotate-90" : ""
                        }`}
                      />
                    </button>
                    {/* Group items */}
                    {!collapsed && (
                      <div className="space-y-0.5 mt-0.5">
                        {group.items.map((item) => {
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg text-sm transition-colors ${
                                isActive
                                  ? "bg-accent text-primary font-semibold"
                                  : "text-white/60 hover:text-white hover:bg-white/8"
                              }`}
                            >
                              <item.icon className="w-4 h-4" />
                              {item.label}
                              {isActive && (
                                <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="px-3 py-3 border-t border-white/10">
            <div className="px-3 py-2 mb-1">
              <div className="text-xs text-white/50">当前用户</div>
              <div className="text-sm text-white/80 truncate">
                {user?.email || "加载中..."}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
            <Link
              href="/"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors mt-1"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
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
                {allSidebarItems.find((item) => item.href === pathname)?.label || "数据概览"}
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
