"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  ClipboardList,
  Palette,
  Key,
  Package,
  BookOpen,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  UserCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRightCircle,
  Database,
  AlertTriangle,
  BarChart3,
  PieChart,
  Layers,
  Package2,
  Activity,
  Store,
} from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#f97316", "#ef4444", "#84cc16", "#14b8a6"];

interface DashboardData {
  customerCount: number;
  leadCount: number;
  newLeadCount: number;
  testResultCount: number;
  testCodeCount: number;
  activeTestCodeCount: number;
  deliveryCount: number;
  draftDeliveryCount: number;
  deliveredCount: number;
  orderCount: number;
  paidOrderCount: number;
  totalRevenue: number;
  pendingAmount: number;
  courseCount: number;
  publishedCourseCount: number;
  productCount: number;
  publishedProductCount: number;
  recentLeads: any[];
  recentDeliveries: any[];
  inventoryTotalValue: number;
  inventorySellThroughRate: number;
  lowStockCount: number;
  categoryDistribution: { name: string; value: number }[];
  stockStatusDistribution: { name: string; count: number }[];
  spaCycleData: {
    planning: number;
    purchasing: number;
    receiving: number;
    sales: number;
    replenishment: number;
  };
}

// 默认值 - 避免页面崩溃
const DEFAULT_DATA: DashboardData = {
  customerCount: 0,
  leadCount: 0,
  newLeadCount: 0,
  testResultCount: 0,
  testCodeCount: 0,
  activeTestCodeCount: 0,
  deliveryCount: 0,
  draftDeliveryCount: 0,
  deliveredCount: 0,
  orderCount: 0,
  paidOrderCount: 0,
  totalRevenue: 0,
  pendingAmount: 0,
  courseCount: 0,
  publishedCourseCount: 0,
  productCount: 0,
  publishedProductCount: 0,
  recentLeads: [],
  recentDeliveries: [],
  inventoryTotalValue: 0,
  inventorySellThroughRate: 0,
  lowStockCount: 0,
  categoryDistribution: [],
  stockStatusDistribution: [
    { name: "正常库存", count: 0 },
    { name: "低库存", count: 0 },
    { name: "断货", count: 0 },
    { name: "滞销", count: 0 },
  ],
  spaCycleData: { planning: 0, purchasing: 0, receiving: 0, sales: 0, replenishment: 0 },
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const router = useRouter();

  // 管理员权限检查（最简化的版本）
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/admin/login");
          return;
        }
        // 简单检查：只要有登录用户就允许进入（后续可以在 middleware 中加强）
        setChecking(false);
      } catch (e) {
        console.error("权限检查错误:", e);
        router.push("/admin/login");
      }
    };
    checkAuth();
  }, [router]);

  if (checking) return null;

  // 加载数据
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        // 尝试通过 API 获取数据
        const res = await fetch(`/api/admin/dashboard-stats`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setData(result.data);
            return;
          }
        }

        // API 获取失败，使用默认值但不显示错误
        console.warn("Dashboard API 返回异常，使用默认数据");
        setData(DEFAULT_DATA);
      } catch (err: any) {
        console.error("Dashboard 加载错误:", err);
        // 即使出错也不崩溃，使用默认数据
        setData(DEFAULT_DATA);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const formatPrice = (price: number) => {
    try {
      return `¥${price.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } catch {
      return `¥${price}`;
    }
  };

  // 加载中状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">加载经营数据...</p>
        </div>
      </div>
    );
  }

  // 错误状态（可选显示）
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">数据加载异常</h2>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-primary">经营驾驶舱</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          骆芷蝶智选 · 实时经营数据全景视图
        </p>
      </div>

      {/* Core Business Metrics */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">核心业务指标</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "VIP客户", value: data.customerCount, icon: Users, color: "bg-primary/10 text-primary" },
            { label: "累计收入", value: formatPrice(data.totalRevenue), icon: DollarSign, color: "bg-green-50 text-green-600" },
            { label: "待收款项", value: formatPrice(data.pendingAmount), icon: Clock, color: "bg-amber-50 text-amber-600" },
            { label: "已交付方案", value: data.deliveredCount, icon: CheckCircle2, color: "bg-blue-50 text-blue-600" },
          ].map((item) => (
            <Link key={item.label} href="#" className="block bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-primary">{item.value}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Inventory KPI Cards */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">进销存关键指标</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            {
              label: "库存总价值",
              value: formatPrice(data.inventoryTotalValue),
              icon: Database,
              color: "bg-indigo-50 text-indigo-600",
            },
            {
              label: "售罄率",
              value: `${(data.inventorySellThroughRate || 0).toFixed(1)}%`,
              icon: TrendingUp,
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "低库存预警",
              value: data.lowStockCount,
              icon: AlertTriangle,
              color: "bg-rose-50 text-rose-600",
            },
          ].map((item) => (
            <Link key={item.label} href="#" className="block bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-primary">{item.value}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Pie Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-primary">品类库存分布</h3>
          </div>
          {(data.categoryDistribution || []).length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
              暂无库存数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={data.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(((percent || 0) * 100)).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(data.categoryDistribution || []).map((entry, index) => (
                    <Cell key={String(index)} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => `¥${Number(value).toLocaleString()}`} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stock Status Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-primary">库存状态分布</h3>
          </div>
          {(!data.stockStatusDistribution || data.stockStatusDistribution.every((item) => item.count === 0)) ? (
            <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
              暂无库存数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={data.stockStatusDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" name="商品数量" radius={[8, 8, 0, 0]}>
                  {(data.stockStatusDistribution || []).map((entry, index) => (
                    <Cell key={String(index)} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* SPA Business Cycle */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">SPA业务闭环</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {[
              { label: "商品企划", value: data.spaCycleData.planning, icon: ClipboardList, color: "from-primary to-primary/80", ringColor: "ring-primary/30" },
              { label: "采购下单", value: data.spaCycleData.purchasing, icon: ShoppingBag, color: "from-accent to-accent/80", ringColor: "ring-accent/30" },
              { label: "收货入库", value: data.spaCycleData.receiving, icon: Package2, color: "from-emerald-500 to-emerald-600", ringColor: "ring-emerald-300" },
              { label: "销售出库", value: data.spaCycleData.sales, icon: TrendingUp, color: "from-blue-500 to-blue-600", ringColor: "ring-blue-300" },
              { label: "智能补货", value: data.spaCycleData.replenishment, icon: Activity, color: "from-rose-500 to-rose-600", ringColor: "ring-rose-300" },
            ].map((stage, i, arr) => (
              <div key={stage.label} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${stage.color} ring-4 ${stage.ringColor} flex flex-col items-center justify-center text-white shadow-lg`}>
                    <stage.icon className="w-7 h-7 mb-1" />
                    <span className="text-xl sm:text-2xl font-bold">{stage.value}</span>
                  </div>
                  <span className="text-xs font-bold text-primary mt-2">{stage.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRightCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary/40 mx-1" />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center mt-6 text-xs text-muted-foreground">
            <ArrowRightCircle className="w-4 h-4 mr-2 text-accent" />
            SPA闭环：商品企划 → 采购下单 → 收货入库 → 销售出库 → 智能补货 → 商品企划
          </div>
        </div>
      </div>

      {/* Business Flow Status */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">业务流程状态</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "新线索", value: data.newLeadCount, icon: AlertCircle, color: "bg-red-50 text-red-500" },
            { label: "测试记录", value: data.testResultCount, icon: UserCircle, color: "bg-purple-50 text-purple-600" },
            { label: "有效测试码", value: data.activeTestCodeCount, icon: Key, color: "bg-cyan-50 text-cyan-600" },
            { label: "待交付方案", value: data.draftDeliveryCount, icon: Package, color: "bg-amber-50 text-amber-600" },
            { label: "已发布课程", value: data.publishedCourseCount, icon: BookOpen, color: "bg-indigo-50 text-indigo-600" },
            { label: "在售商品", value: data.publishedProductCount, icon: ShoppingBag, color: "bg-pink-50 text-pink-600" },
          ].map((item) => (
            <Link key={item.label} href="#" className="block bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color} mb-2`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold text-primary">{item.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Leads + Recent Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-primary">最新线索</h2>
            <Link href="#" className="text-xs text-accent hover:underline flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {(!data.recentLeads || data.recentLeads.length === 0) ? (
              <div className="p-6 text-center text-sm text-muted-foreground">暂无线索</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.recentLeads.map((lead: any, idx: number) => (
                  <div key={lead?.id || idx} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      lead?.status === "new" ? "bg-red-50 text-red-500" :
                      lead?.status === "contacted" ? "bg-amber-50 text-amber-600" :
                      "bg-green-50 text-green-600"
                    }`}>
                      {(lead?.name || "?")[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{lead?.name || "匿名"}</div>
                      <div className="text-xs text-muted-foreground truncate">{lead?.interest || lead?.source || "—"}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      lead?.status === "new" ? "bg-red-50 text-red-500" :
                      lead?.status === "contacted" ? "bg-amber-50 text-amber-600" :
                      "bg-green-50 text-green-600"
                    }`}>
                      {lead?.status === "new" ? "新" : lead?.status === "contacted" ? "跟进中" : "已转化"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Deliveries */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-primary">最新交付方案</h2>
            <Link href="#" className="text-xs text-accent hover:underline flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {(!data.recentDeliveries || data.recentDeliveries.length === 0) ? (
              <div className="p-6 text-center text-sm text-muted-foreground">暂无交付方案</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.recentDeliveries.map((del: any, idx: number) => (
                  <div key={del?.id || idx} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      del?.service_type === "select" ? "bg-blue-50 text-blue-600" :
                      del?.service_type === "display" ? "bg-purple-50 text-purple-600" :
                      del?.service_type === "planning" ? "bg-amber-50 text-amber-600" :
                      "bg-green-50 text-green-600"
                    }`}>
                      {del?.service_type === "select" ? "选" : del?.service_type === "display" ? "陈" : del?.service_type === "planning" ? "企" : "全"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{del?.title || "未命名方案"}</div>
                      <div className="text-xs text-muted-foreground">{del?.customer_name || "—"}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      del?.status === "draft" ? "bg-gray-100 text-gray-500" :
                      del?.status === "in_progress" ? "bg-amber-50 text-amber-600" :
                      del?.status === "delivered" ? "bg-blue-50 text-blue-600" :
                      "bg-green-50 text-green-600"
                    }`}>
                      {del?.status === "draft" ? "草稿" : del?.status === "in_progress" ? "进行中" : del?.status === "delivered" ? "已交付" : "已确认"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "录入色彩数据", desc: "采集VIP客户色彩季型", href: "/admin/color-analysis", icon: Palette, color: "bg-accent/10 text-accent hover:bg-accent/20" },
            { label: "生成测试码", desc: "为客户创建测试码", href: "/admin/test-codes", icon: Key, color: "bg-primary/10 text-primary hover:bg-primary/20" },
            { label: "新建交付方案", desc: "创建选品/陈列/企划方案", href: "/admin/deliveries", icon: Package, color: "bg-purple-50 text-purple-600 hover:bg-purple-100" },
            { label: "查看订单", desc: "管理客户订单和收款", href: "/admin/orders", icon: DollarSign, color: "bg-green-50 text-green-600 hover:bg-green-100" },
          ].map((item) => (
            <Link key={item.label} href={item.href} className={`group flex flex-col items-center p-5 rounded-xl border border-gray-100 shadow-sm transition-all ${item.color}`}>
              <item.icon className="w-6 h-6 mb-2" />
              <span className="text-sm font-bold">{item.label}</span>
              <span className="text-xs opacity-70 mt-1">{item.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
