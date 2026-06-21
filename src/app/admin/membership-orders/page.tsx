"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Trash2, RefreshCw, Clock, CircleCheck, RotateCcw } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "\u5F85\u786E\u8BA4", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  confirmed: { label: "\u5DF2\u5F00\u901A", cls: "bg-green-50 text-green-700 border border-green-200" },
  cancelled: { label: "\u5DF2\u53D6\u6D88", cls: "bg-gray-100 text-gray-500 border border-gray-200" },
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
    if (m === "deleted") showToast("\u8BA2\u5355\u5DF2\u5220\u9664");
    else if (m === "confirmed") showToast("\u8BA2\u5355\u5DF2\u5F00\u901A");
    else if (m === "cancelled") showToast("\u8BA2\u5357\u5DF2\u53D6\u6D88");
    else if (m === "reset") showToast("\u5DF2\u91CD\u7F6E\u4E3A\u5F85\u786E\u8BA4");
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

  /* 通用操作函数 */
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
        showToast(label + "\u6210\u529F");
        fetchOrders(); /* 立即刷新列表 */
      } else {
        alert(label + "\u5931\u8D25：" + (json.error || "\u672A\u77E5\u9519\u8BEF"));
      }
    } catch (e: any) {
      alert(label + "\u5931\u8D25：" + e.message);
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
            <h1 className="text-2xl font-bold text-primary">VIP\u8BA2\u5357\u7BA1\u7406</h1>
          </div>
          <p className="text-sm text-muted-foreground">\u5BA1\u6838\u4F1A\u5458\u652F\u4ED8\u8BA2\u5355\uFF0C\u786E\u8BA4\u5F00\u901A\u6216\u5220\u9664</p>
        </div>
        <button onClick={fetchOrders} className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5">
          <RefreshCw className="w-4 h-4 inline mr-1" /> \u5237\u65B0
        </button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {label: "\u5F85\u786E\u8BA4", val: stats.pending, color: "text-amber-600"},
          {label: "\u5DF2\u5F00\u901A", val: stats.confirmed, color: "text-green-600"},
          {label: "\u5DF2\u53D6\u6D88", val: stats.cancelled, color: "text-gray-400"},
          {label: "\u7D2F\u8BA1\u8425\u6536", val: stats.revenue > 0 ? "\u00A5" + (stats.revenue / 100).toFixed(0) : "\u00A50", color: "text-accent"},
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={"text-2xl font-black " + s.color}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* 筛选 */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {[["","\u5168\u90E8"],["pending","\u5F85\u786E\u8BA4"],["confirmed","\u5DF2\u5F00\u901A"],["cancelled","\u5DF2\u53D6\u6D88"]].map(([v,l]) => (
          <button key={v}
            onClick={() => router.push(v ? "?status="+v : "/admin/membership-orders")}
            className={"px-3 py-2 rounded-lg text-sm border transition-colors " +
              (!filterStatus && !v ? "bg-gray-800 text-white border-gray-800" :
               filterStatus === v ? "bg-primary text-white border-primary" :
               "border-gray-200 hover:bg-gray-50")}
          >{l} ({v==="pending"?stats.pending:v==="confirmed"?stats.confirmed:v==="cancelled"?stats.cancelled:stats.total})</button>
        ))}
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border shadow-sm"><p className="text-muted-foreground">\u6682\u65E0\u8BA2\u5355</p></div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-xs text-muted-foreground uppercase">
              <th className="text-left px-4 py-3">\u5957\u9910</th><th className="text-left px-4 py-3">\u652F\u4ED8\u65B9\u5F0F</th>
              <th className="text-right px-4 py-3">\u91D1\u989D</th><th className="text-left px-4 py-3">\u65F6\u95F4</th>
              <th className="text-left px-4 py-3">\u72B6\u6001</th><th className="text-right px-4 py-3">\u64CD\u4F5C</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((o) => {
                const st = STATUS_MAP[o.status] || STATUS_MAP.pending;
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{o.plan_name || o.plan_id || "-"}</td>
                    <td className="px-4 py-3">{o.payment_method === "wechat" ? "\u5FAE\u4FE1" : "-"}</td>
                    <td className="px-4 py-3 text-right font-bold">\u00A5{(o.price / 100).toFixed(0)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("zh-CN")}</td>
                    <td className="px-4 py-3">
                      <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border " + st.cls}>
                        {o.status === "confirmed" ? <CheckCircle2 className="w-3 h-3" /> :
                         o.status === "cancelled" ? <XCircle className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}{st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {/* 待确认 -> 开通 */}
                        {o.status === "pending" && (
                          <button onClick={() => doAction(o.id, "confirm", "\u5F00\u901A", "\u786E\u5B9A\u5F00\u901A\u6B64VIP\u4F1A\u5458？")}
                            disabled={busy(o.id)} className={btnCls + " text-green-600 bg-green-50 hover:bg-green-100"}
                            title="\u786E\u8BA4\u5F00\u901A">{busy(o.id)?<Loader2 className="w-3 h-3 animate-spin" />:<CircleCheck className="w-4 h-4" />} \u5F00\u901A
                          </button>
                        )}
                        {/* 已开通 -> 取消 + 重置 */}
                        {o.status === "confirmed" && (
                          <>
                            <button onClick={() => doAction(o.id, "cancel", "\u53D6\u6D88", "\u786E\u5B9A\u53D6\u6D88\u6B64\u5F00\u901A？")}
                              disabled={busy(o.id)} className={btnCls + " text-orange-500 bg-orange-50 hover:bg-orange-100"}>\u53D6\u6D88
                            </button>
                            <button onClick={() => doAction(o.id, "reset-pending", "\u91CD\u7F6E", "\u91CD\u7F6E\u4E3A\u5F85\u786E\u8BA4\u72B6\u6001？")}
                              disabled={busy(o.id)} className={btnCls + " text-blue-500 bg-blue-50 hover:bg-blue-100"}>
                              {busy(o.id)?<Loader2 className="w-3 h-3 animate-spin" />:<RotateCcw className="w-4 h-4" />} \u91CD\u7F6E
                            </button>
                          </>
                        )}
                        {/* 所有状态都可以删 */}
                        <button onClick={() => doAction(o.id, "delete", "\u5220\u9664", "\u786E\u5B9A\u5220\u9664\u6B4E\u8BA2\u5355\uFF1F\u4E0D\u53EF\u6062\u590D")}
                          disabled={busy(o.id)} className={btnCls + " text-red-500 bg-red-50 hover:bg-red-100"}>
                          {busy(o.id)?<Loader2 className="w-3 h-3 animate-spin" />:<Trash2 className="w-4 h-4" />} \u5220\u9664
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
