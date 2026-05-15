"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";
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
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: "easeOut" as const },
  }),
};

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
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [
        customers, leads, testResults, testCodes,
        deliveries, orders, courses, products,
      ] = await Promise.all([
        supabase.from("vip_customers").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact" }).order("created_at", { ascending: false }),
        supabase.from("style_test_results").select("*", { count: "exact", head: true }),
        supabase.from("test_codes").select("*"),
        supabase.from("delivery_plans").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*"),
        supabase.from("courses").select("*", { count: "exact" }),
        supabase.from("products").select("*", { count: "exact" }),
      ]);

      const leadList = leads.data || [];
      const orderList = orders.data || [];
      const deliveryList = deliveries.data || [];
      const testCodeList = testCodes.data || [];

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
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
    setLoading(false);
  };

  const formatPrice = (price: number) => price > 0 ? `¥${(price / 100).toFixed(0)}` : "¥0";

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-primary">数据概览</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          骆芷蝶智选 · 服装供应链赋能平台 · 实时业务数据看板
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

      {/* Business Pipeline - Visual Flow */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">业务漏斗</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            {[
              { label: "线索", value: data.leadCount, color: "bg-red-400", w: "w-full" },
              { label: "客户", value: data.customerCount, color: "bg-amber-400", w: "w-4/5" },
              { label: "测试", value: data.testResultCount, color: "bg-blue-400", w: "w-3/5" },
              { label: "方案", value: data.deliveryCount, color: "bg-purple-400", w: "w-2/5" },
              { label: "交付", value: data.deliveredCount, color: "bg-green-400", w: "w-1/4" },
            ].map((stage, i) => (
              <div key={stage.label} className="flex-1 text-center">
                <div className={`${stage.color} ${stage.w} mx-auto h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold mb-2`}>
                  {stage.value}
                </div>
                <div className="text-xs text-muted-foreground font-medium">{stage.label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center mt-4 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            线索 → 客户 → 色彩测试 → 生成交付方案 → 交付完成
          </div>
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
