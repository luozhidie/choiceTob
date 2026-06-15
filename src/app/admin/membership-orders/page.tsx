"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, Trash2,
  AlertTriangle, RefreshCw, Search, DollarSign, Clock, UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Order {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_phone: string;
  plan_id: string;
  plan_name: string;
  price: number;
  status: string;
  payment_method: string;
  created_at: string;
  confirmed_at?: string;
}

const STATUS_LABLES: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "待确认", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
  confirmed: { label: "已开通", icon: UserCheck, color: "text-green-600 bg-green-50 border-green-200" },
  cancelled: { label: "已取消", icon: XCircle, color: "text-gray-500 bg-gray-50 border-gray-200" },
};

const PLAN_TYPE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  view_price: { label: "查价特权", icon: DollarSign, color: "text-blue-600 bg-blue-50" },
  deposit_discount: { label: "拿货折扣", icon: UserCheck, color: "text-accent bg-accent/10" },
};

export default function AdminMembershipOrdersPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const supabase = createClient();

  // 管理员权限检查
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/admin/login"); return; }
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "luozhidie@live.cn").split(",").map(e => e.trim());
      if (!adminEmails.includes(user.email || "")) { router.push("/admin/login"); return; }
      setIsAdmin(true);
      setChecking(false);
    };
    check();
  }, [router]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("membership_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      showToast("error", "加载失败：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) fetchOrders(); }, [isAdmin]);

  // 确认开通
  const handleConfirm = async (order: Order) => {
    if (!confirm(`确认开通「${order.user_name || order.user_email}」的VIP会员？`)) return;
    setProcessingId(order.id);
    try {
      const { error } = await supabase
        .from("membership_orders")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", order.id);
      if (error) throw error;
      showToast("success", "已开通VIP");
      fetchOrders();
    } catch (err: any) {
      showToast("error", "开通失败：" + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // 取消订单
  const handleCancel = async (order: Order) => {
    if (!confirm(`取消「${order.user_name || order.user_email}」的订单？`)) return;
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

  // 统计
  const totalRevenue = orders
    .filter((o) => o.status === "confirmed")
    .reduce((sum, o) => sum + o.price, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;

  // 筛选
  const filteredOrders = orders.filter((o) => {
    const matchStatus = !filterStatus || o.status === filterStatus;
    const matchSearch = !search ||
      o.user_email?.includes(search) ||
      o.user_name?.includes(search) ||
      o.user_phone?.includes(search);
    return matchStatus && matchSearch;
  });

  if (checking) return null;
  if (!isAdmin) return null;

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

      <div className="p-6">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin/dashboard" className="text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl font-bold text-primary">VIP订单管理</h1>
            </div>
            <p className="text-sm text-muted-foreground">审核会员支付订单，确认开通或取消</p>
          </div>
          <button onClick={fetchOrders} className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5">
            <RefreshCw className="w-4 h-4 inline mr-1" /> 刷新
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-xs text-muted-foreground">待确认</p>
            <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-xs text-muted-foreground">已开通</p>
            <p className="text-2xl font-black text-green-600">{confirmedCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-xs text-muted-foreground">累计营收</p>
            <p className="text-2xl font-black text-accent">¥{(totalRevenue / 100).toFixed(0)}</p>
          </div>
        </div>

        {/* 筛选 */}
        <div className="flex gap-3 mb-4">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索邮箱/姓名/手机号..."
            className="flex-1 max-w-sm px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <select
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">全部状态</option>
            <option value="pending">待确认</option>
            <option value="confirmed">已开通</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        {/* 表格 */}
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">暂无订单</div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3">用户</th>
                  <th className="text-left px-4 py-3">套餐</th>
                  <th className="text-left px-4 py-3">支付</th>
                  <th className="text-right px-4 py-3">金额</th>
                  <th className="text-left px-4 py-3">时间</th>
                  <th className="text-left px-4 py-3">状态</th>
                  <th className="text-right px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const statusInfo = STATUS_LABLES[order.status] || STATUS_LABLES.pending;
                  const StatusIcon = statusInfo.icon;
                  const planInfo = PLAN_TYPE_MAP[order.plan_id] || { label: order.plan_name, icon: DollarSign, color: "text-gray-600 bg-gray-50" };
                  const PlanIcon = planInfo.icon;
                  return (
                    <tr key={order.id} className="border-t hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm">{order.user_name || "-"}</p>
                          <p className="text-xs text-muted-foreground">{order.user_email}</p>
                          {order.user_phone && <p className="text-xs text-muted-foreground">{order.user_phone}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${planInfo.color}`}>
                          <PlanIcon className="w-3 h-3" /> {planInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{order.payment_method === "wechat" ? "微信" : order.payment_method === "alipay" ? "支付宝" : "-"}</td>
                      <td className="px-4 py-3 text-right font-bold">¥{(order.price / 100).toFixed(0)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("zh-CN")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {order.status === "pending" ? (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleConfirm(order)}
                              disabled={processingId === order.id}
                              className="px-3 py-1 text-xs bg-accent text-white rounded-lg disabled:opacity-50"
                            >
                              {processingId === order.id ? <Loader2 className="w-3 h-3 inline animate-spin" /> : "确认开通"}
                            </button>
                            <button
                              onClick={() => handleCancel(order)}
                              disabled={processingId === order.id}
                              className="px-3 py-1 text-xs border rounded-lg disabled:opacity-50"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDelete(order.id, order.user_email || "")}
                            disabled={processingId === order.id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            title="删除"
                          >
                            {processingId === order.id ? <Loader2 className="w-3 h-3 inline animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
