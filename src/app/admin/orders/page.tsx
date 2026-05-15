"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Filter, ChevronDown, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  service_type: string;
  title: string;
  amount: number;
  status: string;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "待支付", color: "text-amber-600 bg-amber-50" },
  paid: { label: "已支付", color: "text-green-600 bg-green-50" },
  refunded: { label: "已退款", color: "text-red-500 bg-red-50" },
};

const serviceTypeMap: Record<string, string> = {
  select: "选品方案",
  display: "陈列方案",
  planning: "企划方案",
  full: "全案服务",
  course: "课程",
  style_test: "风格测试",
  product: "商品",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const supabase = createClient();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (filterStatus) query = query.eq("status", filterStatus);
    const { data, error } = await query;
    if (!error && data) setOrders(data as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updateData: any = { status: newStatus };
    if (newStatus === "paid") updateData.paid_at = new Date().toISOString();
    const { error } = await supabase.from("orders").update(updateData).eq("id", id);
    if (error) showToast("error", "状态更新失败");
    else { showToast("success", "状态已更新"); fetchOrders(); }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return o.customer_name.toLowerCase().includes(term) || o.title.toLowerCase().includes(term) || (o.customer_phone && o.customer_phone.includes(term));
  });

  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;

  const totalRevenue = orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.amount, 0);
  const pendingAmount = orders.filter((o) => o.status === "pending").reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-primary" : "bg-red-500"}`}>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-primary">订单管理</h1>
        <p className="text-sm text-muted-foreground mt-1">管理客户订单和支付状态</p>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "全部订单", value: orders.length.toString(), color: "bg-primary/10 text-primary" },
          { label: "已收款", value: formatPrice(totalRevenue), color: "bg-green-50 text-green-600" },
          { label: "待支付", value: formatPrice(pendingAmount), color: "bg-amber-50 text-amber-600" },
          { label: "已退款", value: orders.filter((o) => o.status === "refunded").length.toString(), color: "bg-red-50 text-red-500" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs opacity-70 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="max-w-7xl mx-auto mb-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索客户姓名、方案标题、手机号..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${showFilters ? "border-primary text-primary bg-primary/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <Filter className="w-4 h-4" /> 筛选 <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>
        {showFilters && (
          <div className="flex gap-3">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">全部状态</option>
              <option value="pending">待支付</option>
              <option value="paid">已支付</option>
              <option value="refunded">已退款</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">暂无订单</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">客户</th>
                  <th className="px-5 py-3 font-medium">服务</th>
                  <th className="px-5 py-3 font-medium">金额</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium">支付方式</th>
                  <th className="px-5 py-3 font-medium">时间</th>
                  <th className="px-5 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const statusInfo = statusMap[order.status] || statusMap.pending;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{order.customer_phone || "—"}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-gray-900 line-clamp-1">{order.title}</div>
                        <div className="text-xs text-muted-foreground">{serviceTypeMap[order.service_type] || order.service_type}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-accent">{formatPrice(order.amount)}</td>
                      <td className="px-5 py-3.5">
                        <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusInfo.color}`}>
                          <option value="pending">待支付</option>
                          <option value="paid">已支付</option>
                          <option value="refunded">已退款</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{order.payment_method || "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {order.paid_at ? new Date(order.paid_at).toLocaleDateString("zh-CN") : new Date(order.created_at).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setDetailOrder(order)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors" title="详情">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl max-w-md w-full p-8">
            <h3 className="text-lg font-bold text-primary mb-4">订单详情</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">客户姓名</span><span className="font-medium">{detailOrder.customer_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">手机号</span><span>{detailOrder.customer_phone || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">服务类型</span><span>{serviceTypeMap[detailOrder.service_type] || detailOrder.service_type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">方案标题</span><span className="font-medium">{detailOrder.title}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">金额</span><span className="font-bold text-accent">{formatPrice(detailOrder.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">状态</span><span className={statusMap[detailOrder.status]?.color + " px-2 py-0.5 rounded-full text-xs font-medium"}>{statusMap[detailOrder.status]?.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">支付方式</span><span>{detailOrder.payment_method || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">创建时间</span><span>{new Date(detailOrder.created_at).toLocaleString("zh-CN")}</span></div>
              {detailOrder.paid_at && <div className="flex justify-between"><span className="text-muted-foreground">支付时间</span><span>{new Date(detailOrder.paid_at).toLocaleString("zh-CN")}</span></div>}
              {detailOrder.notes && <div><span className="text-muted-foreground">备注</span><p className="mt-1 text-gray-600">{detailOrder.notes}</p></div>}
            </div>
            <button onClick={() => setDetailOrder(null)} className="mt-6 w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90">关闭</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
