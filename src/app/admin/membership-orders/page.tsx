"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Loader2, CheckCircle2, X, Clock, CreditCard, Crown, Eye,
  Search, RefreshCw, Filter, UserCheck, UserX, DollarSign,
  Calendar, AlertTriangle, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MembershipOrder {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  price: number;
  payment_method: string;
  status: "pending" | "confirmed" | "cancelled";
  notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  user_email?: string;
  user_name?: string;
  user_phone?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "待确认", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  confirmed: { label: "已开通", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  cancelled: { label: "已取消", color: "bg-red-50 text-red-600 border-red-200", icon: X },
};

const PLAN_TYPE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  basic: { label: "基础VIP", icon: Eye, color: "text-blue-600 bg-blue-50" },
  premium: { label: "高阶VIP", icon: Crown, color: "text-amber-600 bg-amber-50" },
};

export default function AdminMembershipOrdersPage() {
  const [orders, setOrders] = useState<MembershipOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<MembershipOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/admin/login");
    };
    check();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("membership_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // 获取用户信息
      const userIds = [...new Set((data || []).map((o: any) => o.user_id))];
      const { data: users } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone")
        .in("id", userIds);

      const userMap = new Map((users || []).map((u: any) => [u.id, u]));

      const enriched = (data || []).map((o: any) => ({
        ...o,
        user_email: userMap.get(o.user_id)?.email || "-",
        user_name: userMap.get(o.user_id)?.full_name || "",
        user_phone: userMap.get(o.user_id)?.phone || "",
      }));

      setOrders(enriched);
      setFilteredOrders(enriched);
    } catch (err: any) {
      showToast("error", "加载失败：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // 筛选 + 搜索
  useEffect(() => {
    let list = [...orders];
    if (filterStatus) list = list.filter((o) => o.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.user_email?.toLowerCase().includes(q) ||
          o.user_name?.toLowerCase().includes(q) ||
          o.user_phone?.includes(q) ||
          o.plan_name?.toLowerCase().includes(q)
      );
    }
    setFilteredOrders(list);
  }, [filterStatus, search, orders]);

  // 确认订单：更新订单状态 + 更新用户会员
  const handleConfirm = async (order: MembershipOrder) => {
    if (!confirm(`确认开通「${order.user_email}」的${order.plan_name}？`)) return;
    setProcessingId(order.id);
    try {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // 1. 更新用户会员信息
      const membershipType = order.plan_id === "basic" ? "view_price" : "deposit_discount";
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          membership_type: membershipType,
          membership_expires_at: expiresAt.toISOString(),
        })
        .eq("id", order.user_id);

      if (profileError) throw profileError;

      // 2. 更新订单状态
      const { error: orderError } = await supabase
        .from("membership_orders")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (orderError) throw orderError;

      showToast("success", "已确认开通");
      fetchOrders();
    } catch (err: any) {
      showToast("error", "确认失败：" + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // 取消订单
  const handleCancel = async (order: MembershipOrder) => {
    if (!confirm(`确定取消「${order.user_email}」的订单？`)) return;
    setProcessingId(order.id);
    try {
      const { error } = await supabase
        .from("membership_orders")
        .update({ status: "cancelled" })
        .eq("id", order.id);
      if (error) throw error;
      showToast("success", "已取消");
      fetchOrders();
    } catch (err: any) {
      showToast("error", "取消失败：" + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // 删除订单（直接调用服务端API，service role 完全绕过RLS）
  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`确定彻底删除「${email}」的订单记录？此操作不可恢复。`)) return;
    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/delete-membership-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "删除失败");
      showToast("success", "已删除");
      fetchOrders();
    } catch (err: any) {
      showToast("error", "删除失败：" + err.message);
    } finally {
      setProcessingId(null);
    }
  };
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "删除失败");
      showToast("success", "已删除");
      fetchOrders();
    } catch (err: any) {
      showToast("error", "删除失败：" + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // 统计
  const totalRevenue = orders
    .filter((o) => o.status === "confirmed")
    .reduce((sum, o) => sum + o.price, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-primary" : "bg-red-500"}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">VIP订单管理</h1>
          <p className="text-sm text-muted-foreground mt-1">审核会员支付订单，确认开通或取消</p>
        </div>
        <button onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-border rounded-lg hover:bg-muted transition-colors">
          <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "待确认", value: pendingCount, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "已开通", value: confirmedCount, icon: UserCheck, color: "text-green-600 bg-green-50" },
          { label: "累计营收", value: `¥${(totalRevenue / 100).toFixed(0)}`, icon: DollarSign, color: "text-accent bg-accent-light/30" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-primary">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* 筛选 + 搜索 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索邮箱/姓名/手机号..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">全部状态</option>
          <option value="pending">待确认</option>
          <option value="confirmed">已开通</option>
          <option value="cancelled">已取消</option>
        </select>
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5" /> {pendingCount} 笔待确认
          </div>
        )}
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground text-sm">
          {orders.length === 0 ? "暂无VIP订单" : "无匹配结果"}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">用户</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">套餐</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">支付方式</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">金额</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">时间</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">状态</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order) => {
                  const statusInfo = STATUS_LABELS[order.status];
                  const StatusIcon = statusInfo?.icon || Clock;
                  const planInfo = PLAN_TYPE_MAP[order.plan_id] || { label: order.plan_name, icon: Crown, color: "text-gray-600 bg-gray-50" };
                  const PlanIcon = planInfo.icon;

                  return (
                    <tr key={order.id} className={`hover:bg-gray-50/50 transition-colors ${order.status === "pending" ? "bg-amber-50/20" : ""}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">{(order.user_name || order.user_email || "?").charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">{order.user_name || "未设置姓名"}</p>
                            <p className="text-xs text-muted-foreground truncate">{order.user_email}</p>
                            {order.user_phone && <p className="text-xs text-gray-400">{order.user_phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${planInfo.color}`}>
                          <PlanIcon className="w-3 h-3" /> {planInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-600">
                          {order.payment_method === "wechat" ? "微信支付" : order.payment_method === "alipay" ? "支付宝" : order.payment_method || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-bold text-accent">¥{(order.price / 100).toFixed(0)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("zh-CN")}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {order.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleConfirm(order)}
                              disabled={processingId === order.id}
                              className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-lg hover:brightness-110 disabled:opacity-50 flex items-center gap-1"
                            >
                              {processingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              确认开通
                            </button>
                            <button
                              onClick={() => handleCancel(order)}
                              disabled={processingId === order.id}
                              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-500 rounded-lg border border-gray-200 hover:border-red-200 disabled:opacity-50"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDelete(order.id, order.user_email || "")}
                            disabled={processingId === order.id}
                            className="px-2 py-1 text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="删除此订单"
                          >
                            {processingId === order.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
