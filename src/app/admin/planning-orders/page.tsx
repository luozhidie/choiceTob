"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Filter, CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlanningOrder {
  id: string;
  user_id: string;
  plan_type: string;
  color_season: string | null;
  style_type: string | null;
  brand_name: string | null;
  target_age: string | null;
  price_range: string | null;
  notes: string | null;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

const PLAN_TYPE_MAP: Record<string, string> = {
  structure: "商品结构企划",
  style: "风格企划",
  color: "色彩企划",
  price: "价格带企划",
  quarter: "季度企划书",
  full: "全案企划",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "待处理", color: "bg-amber-50 text-amber-700" },
  paid: { label: "已支付", color: "bg-blue-50 text-blue-700" },
  processing: { label: "处理中", color: "bg-purple-50 text-purple-700" },
  completed: { label: "已完成", color: "bg-green-50 text-green-700" },
};

export default function AdminPlanningOrdersPage() {
  const [orders, setOrders] = useState<PlanningOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("planning_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // 获取用户邮箱
      const userIds = [...new Set(data?.map((o: any) => o.user_id) || [])];
      const { data: usersData } = userIds.length > 0
        ? await supabase.from("profiles").select("id, email").in("id", userIds)
        : { data: [] };
      const userMap = new Map((usersData || []).map((u: any) => [u.id, u.email]));

      const enriched = (data || []).map((o: any) => ({
        ...o,
        user_email: userMap.get(o.user_id) || "未知",
      }));
      setOrders(enriched);
    } catch (err: any) {
      showToast("error", "加载失败：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("planning_orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      showToast("success", "状态已更新");
      fetchOrders();
    } catch (err: any) {
      showToast("error", "更新失败：" + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此订单？")) return;
    try {
      const res = await fetch("/api/admin/common/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, table: "planning_orders" }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      if (error) throw error;
      showToast("success", "已删除");
      fetchOrders();
    } catch (err: any) {
      showToast("error", "删除失败：" + err.message);
    }
  };

  const filtered = filterStatus ? orders.filter((o) => o.status === filterStatus) : orders;

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">企划订单管理</h1>
            <p className="text-sm text-muted-foreground mt-1">查看所有企划订单（¥9.9/¥598）</p>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="paid">已支付</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "全部订单", value: stats.total, color: "bg-primary/10 text-primary" },
            { label: "待处理", value: stats.pending, color: "bg-amber-50 text-amber-700" },
            { label: "处理中", value: stats.processing, color: "bg-purple-50 text-purple-700" },
            { label: "已完成", value: stats.completed, color: "bg-green-50 text-green-700" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs opacity-70 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">暂无企划订单</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3">用户</th>
                    <th className="px-5 py-3">企划类型</th>
                    <th className="px-5 py-3">金额</th>
                    <th className="px-5 py-3">状态</th>
                    <th className="px-5 py-3">备注</th>
                    <th className="px-5 py-3">时间</th>
                    <th className="px-5 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-sm">{o.user_email}</td>
                      <td className="px-5 py-3 text-sm font-medium text-primary">{PLAN_TYPE_MAP[o.plan_type] || o.plan_type}</td>
                      <td className="px-5 py-3 text-sm">¥{(o.amount / 100).toFixed(0)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[o.status]?.color || "bg-gray-100"}`}>
                          {STATUS_CONFIG[o.status]?.label || o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{o.notes || "—"}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("zh-CN")}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {o.status !== "completed" && (
                            <button onClick={() => handleUpdateStatus(o.id, "completed")} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="标记完成">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {o.status === "pending" && (
                            <button onClick={() => handleUpdateStatus(o.id, "processing")} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title="开始处理">
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(o.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="删除">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
