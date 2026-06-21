"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Trash2, RefreshCw, Clock, CircleCheck } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "待确认", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  confirmed: { label: "已开通", cls: "bg-green-50 text-green-700 border border-green-200" },
  cancelled: { label: "已取消", cls: "bg-gray-100 text-gray-500 border border-gray-200" },
};

interface Order {
  id: string;
  plan_id: string;
  plan_name: string;
  price: number;
  payment_method: string;
  status: string;
  created_at: string;
}

export default function MembershipOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null); /* 正在操作的订单 */
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const m = searchParams.get("msg");
    if (m === "deleted") setMsg("订单已删除");
    else if (m === "confirmed") setMsg("订单已开通");
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/membership-orders-data");
      const json = await res.json();
      if (json.success) setOrders(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  /* 删除订单 */
  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此订单？此操作不可恢复")) return;
    setActionId(id);
    try {
      const res = await fetch("/api/admin/membership-orders-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) router.push("/admin/membership-orders?msg=deleted");
      else alert("删除失败：" + (json.error || "未知错误"));
    } catch (e: any) {
      alert("删除失败：" + e.message);
    } finally {
      setActionId(null);
    }
  };

  /* 确认开通 */
  const handleConfirm = async (id: string) => {
    if (!confirm("确定开通此VIP会员？")) return;
    setActionId(id);
    try {
      const res = await fetch("/api/admin/membership-orders-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "confirm" }),
      });
      const json = await res.json();
      if (json.success) router.push("/admin/membership-orders?msg=confirmed");
      else alert("开通失败：" + (json.error || "未知错误"));
    } catch (e: any) {
      alert("开通失败：" + e.message);
    } finally {
      setActionId(null);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    revenue: orders.filter(o => o.status === "confirmed").reduce((s, o) => s + (o.price || 0), 0),
  };

  const filterStatus = searchParams.get("status") || "";
  const filtered = filterStatus ? orders.filter(o => o.status === filterStatus) : orders;

  return (
    <div className="min-h-screen p-6">
      {/* 操作结果提示 */}
      {msg && (
        <div className="mb-6 px-5 py-3 rounded-xl font-medium text-sm shadow-sm bg-green-50 text-green-700 border border-green-200 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4" />
          {msg}
          <button onClick={() => router.push("/admin/membership-orders")} className="underline ml-2">返回列表</button>
        </div>
      )}

      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-primary">VIP订单管理</h1>
          </div>
          <p className="text-sm text-muted-foreground">审核会员支付订单，确认开通或删除</p>
        </div>
        <button onClick={fetchOrders} className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5">
          <RefreshCw className="w-4 h-4 inline mr-1" /> 刷新
        </button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-muted-foreground">待确认</p>
          <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-muted-foreground">已开通</p>
          <p className="text-2xl font-black text-green-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-muted-foreground">累计营收</p>
          <p className="text-2xl font-black text-accent">{stats.revenue > 0 ? "\u00A5" + (stats.revenue / 100).toFixed(0) : "\u00A50"}</p>
        </div>
      </div>

      {/* 筛选按钮 */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <button
          onClick={() => router.push("/admin/membership-orders")}
          className={"px-3 py-2 rounded-lg text-sm border transition-colors " +
            (!filterStatus ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:bg-gray-50")}
        >
          全部 ({stats.total})
        </button>
        <button
          onClick={() => router.push("?status=pending")}
          className={"px-3 py-2 rounded-lg text-sm border transition-colors " +
            (filterStatus === "pending" ? "bg-amber-500 text-white border-amber-500" : "border-gray-200 hover:bg-gray-50")}
        >
          待确认 ({stats.pending})
        </button>
        <button
          onClick={() => router.push("?status=confirmed")}
          className={"px-3 py-2 rounded-lg text-sm border transition-colors " +
            (filterStatus === "confirmed" ? "bg-green-600 text-white border-green-600" : "border-gray-200 hover:bg-gray-50")}
        >
          已开通 ({stats.confirmed})
        </button>
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border shadow-sm"><p className="text-muted-foreground">暂无订单</p></div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-muted-foreground uppercase">
                <th className="text-left px-4 py-3">套餐</th>
                <th className="text-left px-4 py-3">支付方式</th>
                <th className="text-right px-4 py-3">金额</th>
                <th className="text-left px-4 py-3">时间</th>
                <th className="text-left px-4 py-3">状态</th>
                <th className="text-right px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((o) => {
                const st = STATUS_MAP[o.status] || STATUS_MAP.pending;
                const isPending = o.status === "pending";
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{o.plan_name || o.plan_id || "-"}</td>
                    <td className="px-4 py-3">{o.payment_method === "wechat" ? "微信" : "-"}</td>
                    <td className="px-4 py-3 text-right font-bold">\u00A5{(o.price / 100).toFixed(0)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border " + st.cls}>
                        {o.status === "confirmed"
                          ? <CheckCircle2 className="w-3 h-3" /> :
                          o.status === "cancelled"
                          ? <XCircle className="w-3 h-3" />
                          : <Clock className="w-3 h-3" />}
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* 待确认：显示开通按钮 */}
                        {isPending && (
                          <button
                            onClick={() => handleConfirm(o.id)}
                            disabled={actionId === o.id}
                            className="text-green-600 hover:text-green-700 disabled:opacity-50 inline-flex items-center gap-1 text-xs font-medium"
                            title="确认开通"
                          >
                            {actionId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CircleCheck className="w-4 h-4" />}
                            开通
                          </button>
                        )}
                        {/* 所有订单都可以删 */}
                        <button
                          onClick={() => handleDelete(o.id)}
                          disabled={actionId === o.id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50 inline-flex items-center gap-1 text-xs font-medium"
                          title="删除订单"
                        >
                          {actionId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          删除
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

      <div className="mt-8 text-xs text-gray-400 text-center">
        数据来自 membership_orders 表 · 共 {stats.total} 条记录 · 通过服务端API获取（绕过RLS）
      </div>
    </div>
  );
}
