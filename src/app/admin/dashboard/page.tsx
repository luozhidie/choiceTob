"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
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
  TrendingDown,
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
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: "easeOut" as const },
  }),
};

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
  // 进销存相关
  inventoryTotalValue: number;
  inventorySellThroughRate: number;
  lowStockCount: number;
  categoryDistribution: { name: string; value: number }[];
  stockStatusDistribution: { name: string; count: number }[];
  // SPA闭环数据
  spaCycleData: {
    planning: number;
    purchasing: number;
    receiving: number;
    sales: number;
    replenishment: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // 管理员权限检查
  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/admin/login"); return; }
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "luozhidie@live.cn").split(",").map(e => e.trim());
      if (!adminEmails.includes(user.email || "")) { router.push("/admin/login"); return; }
      setChecking(false);
    };
    check();
  }, [router]);

  if (checking) return null;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      setStores(data || []);
      if (data?.[0]) setStoreId(data[0].id);
    })();
  }, []);

  useEffect(() => {
    if (storeId) fetchDashboard();
  }, [storeId]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [
        customers,
        leads,
        testResults,
        testCodes,
        deliveries,
        orders,
        courses,
        products,
        inventory,
      ] = await Promise.all([
        supabase.from("vip_customers").select("*", { count: "exact", head: true }).eq("store_id", storeId),
        supabase.from("leads").select("*", { count: "exact" }).order("created_at", { ascending: false }),
        supabase.from("style_test_results").select("*", { count: "exact", head: true }),
        supabase.from("test_codes").select("*"),
        supabase.from("delivery_plans").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*"),
        supabase.from("courses").select("*", { count: "exact" }),
        supabase.from("products").select("*", { count: "exact" }),
        supabase.from("inventory").select("*").eq("store_id", storeId),
      ]);

      const leadList = leads.data || [];
      const orderList = orders.data || [];
      const deliveryList = deliveries.data || [];
      const testCodeList = testCodes.data || [];
      const inventoryList = inventory.data || [];

      // 计算进销存数据
      const inventoryTotalValue = inventoryList.reduce(
        (sum: number, item: any) => sum + (item.current_stock || 0) * (item.unit_cost || 0),
        0
      );

      const totalSalesQty = inventoryList.reduce((sum: number, item: any) => sum + (item.sales_qty || 0), 0);
      const totalStockInQty = inventoryList.reduce((sum: number, item: any) => sum + (item.stock_in_qty || 0), 0);
      const inventorySellThroughRate = totalStockInQty > 0 ? (totalSalesQty / totalStockInQty) * 100 : 0;

      const lowStockCount = inventoryList.filter((item: any) => (item.current_stock || 0) < 5).length;

      // 品类库存分布
      const categoryMap = new Map<string, number>();
      inventoryList.forEach((item: any) => {
        const category = item.category || "未分类";
        const value = (item.current_stock || 0) * (item.unit_cost || 0);
        categoryMap.set(category, (categoryMap.get(category) || 0) + value);
      });
      const categoryDistribution = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }));

      // 库存状态分布
      const normalStock = inventoryList.filter((item: any) => (item.current_stock || 0) >= 20).length;
      const lowStock = inventoryList.filter((item: any) => (item.current_stock || 0) >= 5 && (item.current_stock || 0) < 20).length;
      const outOfStock = inventoryList.filter((item: any) => (item.current_stock || 0) === 0).length;
      const slowMoving = inventoryList.filter((item: any) => (item.sales_qty || 0) === 0 && (item.current_stock || 0) > 0).length;

      const stockStatusDistribution = [
        { name: "正常库存", count: normalStock },
        { name: "低库存", count: lowStock },
        { name: "断货", count: outOfStock },
        { name: "滞销", count: slowMoving },
      ];

      // SPA闭环数据（示例数据，实际应从相关表查询）
      const spaCycleData = {
        planning: products.data?.filter((p: any) => p.status === "planning").length || 0,
        purchasing: products.data?.filter((p: any) => p.status === "purchasing").length || 0,
        receiving: inventoryList.filter((item: any) => (item.current_stock || 0) > 0 && (item.stock_in_qty || 0) > 0).length,
        sales: inventoryList.filter((item: any) => (item.sales_qty || 0) > 0).length,
        replenishment: inventoryList.filter((item: any) => (item.current_stock || 0) < 10 && (item.sales_qty || 0) > 0).length,
      };

      setData({
        customerCount: customers.count || 0,
        leadCount: leads.count || 0,
        newLeadCount: leadList.filter((l: any) => l.status === "new").length,
        testResultCount: testResults.count || 0,
        testCodeCount: testCodeList.length,
        activeTestCodeCount: testCodeList.filter((t: any) => t.is_active).length,
        deliveryCount: deliveryList.length,
        draftDeliveryCount: deliveryList.filter((d: any) => d.status === "draft").length,
        deliveredCount: deliveryList.filter((d: any) => d.status === "delivered" || d.status === "confirmed").length,
        orderCount: orderList.length,
        paidOrderCount: orderList.filter((o: any) => o.status === "paid").length,
        totalRevenue: orderList.filter((o: any) => o.status === "paid").reduce((sum: number, o: any) => sum + (o.amount || 0), 0),
        pendingAmount: orderList.filter((o: any) => o.status === "pending").reduce((sum: number, o: any) => sum + (o.amount || 0), 0),
        courseCount: courses.count || 0,
        publishedCourseCount: (courses.data || []).filter((c: any) => c.is_published).length,
        productCount: products.count || 0,
        publishedProductCount: (products.data || []).filter((p: any) => p.is_published).length,
        recentLeads: leadList.slice(0, 5),
        recentDeliveries: deliveryList.slice(0, 5),
        inventoryTotalValue,
        inventorySellThroughRate,
        lowStockCount,
        categoryDistribution,
        stockStatusDistribution,
        spaCycleData,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
    setLoading(false);
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 店铺选择器 */}
      <div className="flex items-center gap-3">
        <Store className="w-5 h-5 text-gray-500" />
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm"
        >
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-primary">经营驾驶舱</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          骆芷蝶智选 · 服装供应链赋能平台 · 实时经营数据全景视图
        </p>
      </div>

      {/* Core Business Metrics */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">核心业务指标</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "VIP客户", value: data.customerCount, icon: Users, color: "bg-primary/10 text-primary", href: "/admin/customers" },
            { label: "累计收入", value: formatPrice(data.totalRevenue), icon: DollarSign, color: "bg-green-50 text-green-600", href: "/admin/orders" },
            { label: "待收款项", value: formatPrice(data.pendingAmount), icon: Clock, color: "bg-amber-50 text-amber-600", href: "/admin/orders" },
            { label: "已交付方案", value: data.deliveredCount, icon: CheckCircle2, color: "bg-blue-50 text-blue-600", href: "/admin/deliveries" },
          ].map((item, i) => (
            <motion.div key={item.label} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
              <Link href={item.href} className="block bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">{item.value}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Inventory KPI Cards */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">进销存关键指标</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {[
            {
              label: "库存总价值",
              value: formatPrice(data.inventoryTotalValue),
              icon: Database,
              color: "bg-indigo-50 text-indigo-600",
              href: "/admin/inventory",
              desc: "当前库存总价值",
            },
            {
              label: "售罄率",
              value: `${data.inventorySellThroughRate.toFixed(1)}%`,
              icon: TrendingUp,
              color: "bg-emerald-50 text-emerald-600",
              href: "/admin/inventory",
              desc: "销售数量/入库数量",
            },
            {
              label: "低库存预警",
              value: data.lowStockCount,
              icon: AlertTriangle,
              color: "bg-rose-50 text-rose-600",
              href: "/admin/inventory",
              desc: "库存低于5件的商品",
            },
          ].map((item, i) => (
            <motion.div key={item.label} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
              <Link href={item.href} className="block bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">{item.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Pie Chart */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-primary">品类库存分布</h3>
            </div>
            {data.categoryDistribution.length === 0 ? (
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
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `¥${Number(value).toLocaleString()}`} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Stock Status Bar Chart */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-primary">库存状态分布</h3>
            </div>
            {data.stockStatusDistribution.every((item) => item.count === 0) ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                暂无库存数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={data.stockStatusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="商品数量" radius={[8, 8, 0, 0]}>
                    {data.stockStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* SPA Business Cycle */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">SPA业务闭环</h2>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {[
              {
                label: "商品企划",
                value: data.spaCycleData.planning,
                icon: ClipboardList,
                color: "from-primary to-primary/80",
                ringColor: "ring-primary/30",
              },
              {
                label: "采购下单",
                value: data.spaCycleData.purchasing,
                icon: ShoppingBag,
                color: "from-accent to-accent/80",
                ringColor: "ring-accent/30",
              },
              {
                label: "收货入库",
                value: data.spaCycleData.receiving,
                icon: Package2,
                color: "from-emerald-500 to-emerald-600",
                ringColor: "ring-emerald-300",
              },
              {
                label: "销售出库",
                value: data.spaCycleData.sales,
                icon: TrendingUp,
                color: "from-blue-500 to-blue-600",
                ringColor: "ring-blue-300",
              },
              {
                label: "智能补货",
                value: data.spaCycleData.replenishment,
                icon: Activity,
                color: "from-rose-500 to-rose-600",
                ringColor: "ring-rose-300",
              },
            ].map((stage, i, arr) => (
              <div key={stage.label} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${stage.color} ring-4 ${stage.ringColor} flex flex-col items-center justify-center text-white shadow-lg transition-transform hover:scale-105`}
                  >
                    <stage.icon className="w-8 h-8 mb-1" />
                    <span className="text-2xl font-bold">{stage.value}</span>
                  </div>
                  <span className="text-xs font-bold text-primary mt-2">{stage.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRightCircle className="w-8 h-8 text-primary/40 mx-1" />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center mt-6 text-xs text-muted-foreground">
            <ArrowRightCircle className="w-4 h-4 mr-2 text-accent" />
            SPA闭环：商品企划 → 采购下单 → 收货入库 → 销售出库 → 智能补货 → 商品企划
          </div>
        </motion.div>
      </div>

      {/* Business Flow Status */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">业务流程状态</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "新线索", value: data.newLeadCount, icon: AlertCircle, color: "bg-red-50 text-red-500", href: "/admin/leads" },
            { label: "测试记录", value: data.testResultCount, icon: UserCircle, color: "bg-purple-50 text-purple-600", href: "/admin/style-test-results" },
            { label: "有效测试码", value: data.activeTestCodeCount, icon: Key, color: "bg-cyan-50 text-cyan-600", href: "/admin/test-codes" },
            { label: "待交付方案", value: data.draftDeliveryCount, icon: Package, color: "bg-amber-50 text-amber-600", href: "/admin/deliveries" },
            { label: "已发布课程", value: data.publishedCourseCount, icon: BookOpen, color: "bg-indigo-50 text-indigo-600", href: "/admin/courses" },
            { label: "在售商品", value: data.publishedProductCount, icon: ShoppingBag, color: "bg-pink-50 text-pink-600", href: "/admin/products" },
          ].map((item, i) => (
            <motion.div key={item.label} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
              <Link href={item.href} className="block bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color} mb-2`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-primary">{item.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Two Column: Recent Leads + Recent Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-primary">最新线索</h2>
            <Link href="/admin/leads" className="text-xs text-accent hover:underline flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {data.recentLeads.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">暂无线索</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.recentLeads.map((lead: any) => (
                  <div key={lead.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${lead.status === "new" ? "bg-red-50 text-red-500" : lead.status === "contacted" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>
                      {(lead.name || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{lead.name || "匿名"}</div>
                      <div className="text-xs text-muted-foreground truncate">{lead.interest || lead.source || "—"}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${lead.status === "new" ? "bg-red-50 text-red-500" : lead.status === "contacted" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>
                      {lead.status === "new" ? "新" : lead.status === "contacted" ? "跟进中" : "已转化"}
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
            <Link href="/admin/deliveries" className="text-xs text-accent hover:underline flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {data.recentDeliveries.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">暂无交付方案</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.recentDeliveries.map((del: any) => (
                  <div key={del.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      del.service_type === "select" ? "bg-blue-50 text-blue-600" :
                      del.service_type === "display" ? "bg-purple-50 text-purple-600" :
                      del.service_type === "planning" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                    }`}>
                      {del.service_type === "select" ? "选" : del.service_type === "display" ? "陈" : del.service_type === "planning" ? "企" : "全"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{del.title}</div>
                      <div className="text-xs text-muted-foreground">{del.customer_name}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      del.status === "draft" ? "bg-gray-100 text-gray-500" :
                      del.status === "in_progress" ? "bg-amber-50 text-amber-600" :
                      del.status === "delivered" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                    }`}>
                      {del.status === "draft" ? "草稿" : del.status === "in_progress" ? "进行中" : del.status === "delivered" ? "已交付" : "已确认"}
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
          ].map((item, i) => (
            <motion.div key={item.label} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
              <Link href={item.href} className={`group flex flex-col items-center p-5 rounded-xl border border-gray-100 shadow-sm transition-all ${item.color}`}>
                <item.icon className="w-6 h-6 mb-2" />
                <span className="text-sm font-bold">{item.label}</span>
                <span className="text-xs opacity-70 mt-1">{item.desc}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
