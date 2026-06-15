"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import ErrorBoundary from "@/components/ErrorBoundary";
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
  CreditCard,
  Tag,
  Warehouse,
  Receipt,
  Scissors,
  ImagePlus,
  Star,
  Target,
  MessageSquare,
  Building2,
  Phone,
  Bell,
  Globe,
  Upload,
  MessageCircle,
  Database,
  Eye,
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
      { label: "站点图片", href: "/admin/site-assets", icon: ImageIcon },
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
      { label: "VIP 订单", href: "/admin/membership-orders", icon: CreditCard },
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
      { label: "企划需求处理", href: "/admin/planning-requests", icon: ClipboardList },
      { label: "企划订单管理", href: "/admin/planning-orders", icon: FileText },
      { label: "商品企划", href: "/admin/product-plan", icon: Lightbulb },
      { label: "生成企划报告", href: "/admin/report", icon: FileDown },
      { label: "商品管理", href: "/admin/products", icon: ShoppingBag },
      { label: "爆款样衣", href: "/admin/hot-products", icon: ShoppingBag },
      { label: "爆款货盘", href: "/admin/hot-picks", icon: BarChart3 },
      { label: "爆款图片", href: "/admin/hot-picks-images", icon: ImageIcon },
      { label: "买手选品", href: "/admin/buyer", icon: TrendingUp },
      { label: "选品步骤", href: "/admin/buyer-steps", icon: ListOrdered },
      { label: "选品功能", href: "/admin/buyer-features", icon: Layers },
      { label: "买手中心", href: "/admin/buyer-center", icon: Users },
      { label: "爆款数据中心", href: "/admin/trend-center", icon: TrendingUp },
      { label: "爆款预测", href: "/admin/trend-predict", icon: TrendingUp },
      { label: "明星同款搜索", href: "/admin/celebrity", icon: Star },
      { label: "货盘规划", href: "/admin/assortment", icon: Package },
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
      { label: "门店经营数据", href: "/admin/store-reports", icon: BarChart3 },
      { label: "订单管理", href: "/admin/orders", icon: FileText },
      { label: "市场需求统计", href: "/admin/market-demand", icon: TrendingUp },
    ],
  },
  {
    title: "陈列 & 搭配",
    icon: LayoutGrid,
    items: [
      { label: "陈列搭配", href: "/admin/display", icon: LayoutGrid },
      { label: "搭配方案", href: "/admin/collocation", icon: Layers },
      { label: "陈列图片", href: "/admin/display-images", icon: ImageIcon },
      { label: "每日搭配", href: "/admin/daily-looks", icon: Palette },
      { label: "属性编码管理", href: "/admin/attribute-encoding", icon: Database },
    ],
  },
  {
    title: "营销 & 内容",
    icon: Megaphone,
    items: [
      { label: "营销策划", href: "/admin/marketing", icon: Megaphone },
      { label: "营销图片", href: "/admin/marketing-images", icon: ImageIcon },
      { label: "Banner 轮播图", href: "/admin/banners", icon: LayoutGrid },
      { label: "搭配灵感", href: "/admin/inspirations", icon: Lightbulb },
      { label: "销售服务", href: "/admin/sales", icon: Headphones },
      { label: "销售图片", href: "/admin/sales-images", icon: ImageIcon },
      { label: "内容日历", href: "/admin/content-calendar", icon: Calendar },
      { label: "沙龙活动", href: "/admin/salon", icon: Calendar },
      { label: "爆款样衣", href: "/admin/designer", icon: Scissors },
    ],
  },
  {
    title: "客户 & 线索",
    icon: Users,
    items: [
      { label: "客户管理", href: "/admin/customers", icon: Users },
      { label: "访客管理", href: "/admin/visitors", icon: Eye },
      { label: "线索管理", href: "/admin/leads", icon: ClipboardList },
      { label: "交付方案", href: "/admin/deliveries", icon: Package },
    ],
  },
  {
    title: "潜客管理",
    icon: Building2,
    items: [
      { label: "门店信息", href: "/admin/crm/stores", icon: Building2 },
      { label: "联系人管理", href: "/admin/crm/contacts", icon: Phone },
      { label: "跟进记录", href: "/admin/crm/follow-ups", icon: ClipboardList },
      { label: "加微信", href: "/admin/crm/wechat-add", icon: MessageCircle },
      { label: "微信话术", href: "/admin/crm/wechat-templates", icon: MessageCircle },
      { label: "门店采集", href: "/admin/crm/scrape", icon: Globe },
      { label: "提醒中心", href: "/admin/crm/reminders", icon: Bell },
      { label: "批量导入", href: "/admin/crm/import", icon: Upload },
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
      { label: "课程购买记录", href: "/admin/course-purchases", icon: FileText },
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

  // 使用 useMemo 缓存 supabase 实例，避免每次渲染重新创建
  const supabase = useMemo(() => createClient(), []);

  // 客户端 session 同步：只同步用户状态，不做权限检查
  // 权限检查完全由 middleware 在服务端处理
  useEffect(() => {
    let mounted = true;

    // 安全地获取用户信息
    if (supabase && supabase.auth) {
      supabase.auth
        .getUser()
        .then((result) => {
          if (!mounted) return;
          // 安全解构：防御 data 为 undefined 的情况
          const u = result?.data?.user ?? null;
          setUser(u);
        })
        .catch((err) => {
          console.warn("[AdminLayout] getUser error:", err);
          if (mounted) setUser(null);
        });

      // 安全地监听 auth 变化
      try {
        const result = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
          }
        });

        return () => {
          mounted = false;
          // 安全取消订阅
          try {
            result?.data?.subscription?.unsubscribe();
          } catch (e) {
            // 忽略 unsubscribe 错误
          }
        };
      } catch (err) {
        console.warn("[AdminLayout] onAuthStateChange error:", err);
      }
    }

    return () => { mounted = false; };
  }, [supabase]);

  const handleLogout = async () => {
    try {
      if (supabase?.auth?.signOut) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn("signOut error:", e);
    }
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
                                  : "text-white/60 hover:text-white hover:bg-white/10"
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
                已安全登录
              </span>
            </div>
          </div>
        </header>

        {/* Page content with ErrorBoundary */}
        <main className="p-4 sm:p-6 lg:p-8">
          <ErrorBoundary fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-bold text-primary mb-2">页面出错</h3>
                <p className="text-sm text-muted-foreground mb-4">请刷新页面或返回登录</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                  >
                    刷新页面
                  </button>
                  <a
                    href="/admin/login"
                    className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                  >
                    返回登录
                  </a>
                </div>
              </div>
            </div>
          }>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
