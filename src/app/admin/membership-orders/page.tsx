"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Trash2, RefreshCw, Clock, CircleCheck, RotateCcw } from "lucide-react";

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
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const m = searchParams.get("msg");
    if (m === "deleted") showToast("订单已删除");
    else if (m === "confirmed") showToast("订单已开通");
    else if (m === "cancelled") showToast("订单已取消");
    else if (m === "reset") showToast("已重置为待确认");
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/membership-orders-data");
      const json = await res.json();
      if (json.success) setOrders(json.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const doAction = async (id: string, action: string, label: string, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setActionId(id);
    try {
      const res = await fetch("/api/admin/membership-orders-data", {
        method: action === "delete" ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "delete" ? { id } : { id, action }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(label + "成功");
        fetchOrders();
      } else {
        alert(label + "失败：" + (json.error || "未知错误"));
      }
    } catch (e: any) {
      alert(label + "失败：" + e.message);
    } finally {
      setActionId(null);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
    revenue: orders.filter(o => o.status === "confirmed").reduce((s, o) => s + (o.price || 0), 0),
  };

  const filterStatus = searchParams.get("status") || "";
  const filtered = filterStatus ? orders.filter(o => o.status === filterStatus) : orders;

  const btnCls = "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors disabled:opacity-50";
  const busy = (id: string) => actionId === id;

  /* 筛选按钮数据 */
  const filters = [
    ["", "全部"],
    ["pending", "待确认"],
    ["confirmed", "已开通"],
    ["cancelled", "已取消"],
  ] as [string, string][];

  return (
    <div className="min-h-screen p-6">
      {/* Toast提示 */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg bg-gray-900 text-white text-sm font-medium animate-pulse">
          <CheckCircle2 className="w-4 h-4 inline mr-1" />{toast}
        </div>
      )}

      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-primary"><ArrowLeft className="w-4 h-4" /></Link>
            <h1 className="text-2xl font-bold text-primary">VIP 订单管理</h1>
          </div>
          <p className="text-sm text-muted-foreground">审核会员支付订单，确认开通或删除</p>
        </div>
        <button onClick={fetchOrders} className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5">
          <RefreshCw className="w-4 h-4 inline mr-1" /> 刷新
        </button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border shadow-sm"><p className="text-xs text-muted-foreground">待确认</p><p className="text-2xl font-black text-amber-600">{stats.pending}</p></div>
        <div className="bg-white rounded-xl p-4 border shadow-sm"><p className="text-xs text-muted-foreground">已开通</p><p className="text-2xl font-black text-green-600">{stats.confirmed}</p></div>
        <div className="bg-white rounded-xl p-4 border shadow-sm"><p className="text-xs text-muted-foreground">已取消</p><p className="text-2xl font-black text-gray-400">{stats.cancelled}</p></div>
        <div className="bg-white rounded-xl p-4 border shadow-sm"><p className="text-xs text-muted-foreground">累计营收</p><p className="text-2xl font-black text-accent">{stats.revenue > 0 ? "¥" + (stats.revenue / 100).toFixed(0) : "¥0"}</p></div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {filters.map(([v, l]) => (
          <button key={v}
            onClick={() => router.push(v ? "?status="+v : "/admin/membership-orders")}
            className={"px-3 py-2 rounded-lg text-sm border transition-colors " +
              (!filterStatus && !v ? "bg-gray-800 text-white border-gray-800" :
               filterStatus === v ? "bg-primary text-white border-primary" :
               "border-gray-200 hover:bg-gray-50")}
          >
            {l} ({v==="pending"?stats.pending:v==="confirmed"?stats.confirmed:v==="cancelled"?stats.cancelled:stats.total})
          </button>
        ))}
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border shadow-sm"><p className="text-muted-foreground">暂无订单</p></div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-xs text-muted-foreground uppercase">
              <th className="text-left px-4 py-3">套餐</th>
              <th className="text-left px-4 py-3">支付方式</th>
              <th className="text-right px-4 py-3">金额</th>
              <th className="text-left px-4 py-3">时间</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="text-right px-4 py-3">操作</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((o) => {
                const st = STATUS_MAP[o.status] || STATUS_MAP.pending;
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{o.plan_name || o.plan_id || "-"}</td>
                    <td className="px-4 py-3">{o.payment_method === "wechat" ? "微信" : "-"}</td>
                    <td className="px-4 py-3 text-right font-bold">¥{(o.price / 100).toFixed(0)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("zh-CN")}</td>
                    <td className="px-4 py-3">
                      <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border " + st.cls}>
                        {o.status === "confirmed"
                          ? <CheckCircle2 className="w-3 h-3" />
                          : o.status === "cancelled"
                          ? <XCircle className="w-3 h-3" />
                          : <Clock className="w-3 h-3" />}
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {o.status === "pending" && (
                          <button
                            onClick={() => doAction(o.id, "confirm", "开通", "确定开通此VIP会员？")}
                            disabled={busy(o.id)}
                            className={btnCls + " text-green-600 bg-green-50 hover:bg-green-100"}
                            title="确认开通">
                            {busy(o.id)?<Loader2 className="w-3 h-3 animate-spin" />:<CircleCheck className="w-4 h-4" />} 开通
                          </button>
                        )}
                        {o.status === "confirmed" && (
                          <>
                            <button onClick={() => doAction(o.id, "cancel", "取消", "确定取消此开通？")} disabled={busy(o.id)} className={btnCls + " text-orange-500 bg-orange-50 hover:bg-orange-100"}>取消</button>
                            <button onClick={() => doAction(o.id, "reset-pending", "重置", "重置为待确认状态？")} disabled={busy(o.id)} className={btnCls + " text-blue-500 bg-blue-50 hover:bg-blue-100"}>
                              {busy(o.id)?<Loader2 className="w-3 h-3 animate-spin" />:<RotateCcw className="w-4 h-4" />} 重置
                            </button>
                          </>
                        )}
                        <button onClick={() => doAction(o.id, "delete", "删除", "确定删除此订单？不可恢复")} disabled={busy(o.id)} className={btnCls + " text-red-500 bg-red-50 hover:bg-red-100"}>
                          {busy(o.id)?<Loader2 className="w-3 h-3 animate-spin" />:<Trash2 className="w-4 h-4" />} 删除
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
  );
}
