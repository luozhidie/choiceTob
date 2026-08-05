"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, DollarSign, KeyRound, CreditCard } from "lucide-react";

interface Order {
  id: string;
  api_key: string;
  package_key: string;
  amount: number;
  currency: string;
  calls: number;
  buyer_email?: string;
  buyer_name?: string;
  status: string;
  created_at: string;
}
interface CredKey {
  id: string;
  api_key: string;
  name: string;
  owner: string;
  status: string;
  credit_balance: number;
  credit_used: number;
  usage_count: number;
}

const PKG_NAME: Record<string, string> = { trial: "试用", starter: "入门", pro: "专业" };
const STATUS_LABEL: Record<string, string> = { pending: "待支付", paid: "已支付", failed: "失败" };

export default function BillingAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [keys, setKeys] = useState<CredKey[]>([]);
  const [revenueCents, setRevenueCents] = useState(0);
  const [counts, setCounts] = useState({ total: 0, paid: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/billing", { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (String(data.error || "").includes("relation") || String(data.error || "").includes("does not exist")) setErr("TABLE_MISSING");
        else setErr(data.error || "加载失败");
      } else {
        setOrders(data.orders || []);
        setKeys(data.keys || []);
        setRevenueCents(data.revenueCents || 0);
        setCounts(data.counts || { total: 0, paid: 0, pending: 0 });
      }
    } catch (e: any) {
      setErr(e.message || "加载异常");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">词元 API 账单</h1>
        <p className="text-muted-foreground mt-1">海外买家经 Stripe 外币支付记录、收入合计、各 Key 额度消耗（消除人工对账）</p>
      </div>

      {err === "TABLE_MISSING" ? (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
          <div className="flex items-center gap-2 text-amber-800 font-medium mb-2"><AlertCircle className="w-5 h-5" /> 数据表尚未创建</div>
          <p className="text-sm text-amber-700">请到 Supabase Dashboard → SQL Editor 执行仓库里的 <code className="bg-white px-1 rounded">supabase-billing.sql</code> 一次，刷新本页即可使用。</p>
        </div>
      ) : err ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">{err}</div>
      ) : (
        <>
          {/* 概览卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><DollarSign className="w-4 h-4 text-green-600" /> 已收收入</div>
              <div className="text-2xl font-bold text-primary mt-1">${(revenueCents / 100).toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><CreditCard className="w-4 h-4 text-indigo-600" /> 订单总数</div>
              <div className="text-2xl font-bold text-primary mt-1">{counts.total}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">已支付</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{counts.paid}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">待支付</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{counts.pending}</div>
            </div>
          </div>

          {/* 预付费 Key 额度 */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <h2 className="font-semibold text-primary flex items-center gap-2 mb-3"><KeyRound className="w-4 h-4 text-indigo-600" /> 预付费 Key 额度消耗</h2>
            {keys.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无预付费 Key（旧 Key 为不限次模式）。</p>
            ) : (
              <div className="space-y-2">
                {keys.map((k) => {
                  const remain = (k.credit_balance || 0) - (k.credit_used || 0);
                  const pct = k.credit_balance ? Math.round((k.credit_used / k.credit_balance) * 100) : 0;
                  return (
                    <div key={k.id} className="flex items-center gap-3 flex-wrap">
                      <code className="text-xs text-gray-500 w-44 truncate">{k.api_key}</code>
                      <span className="text-xs text-gray-600">{k.name}</span>
                      <div className="flex-1 min-w-[120px] h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-600 whitespace-nowrap">余 {remain}/{k.credit_balance}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 订单列表 */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="font-semibold text-primary mb-3">支付订单</h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline" /> 加载中…</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">还没有支付订单。</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-gray-100">
                      <th className="py-2 pr-3 font-medium">套餐</th>
                      <th className="py-2 pr-3 font-medium">金额</th>
                      <th className="py-2 pr-3 font-medium">调用数</th>
                      <th className="py-2 pr-3 font-medium">买家</th>
                      <th className="py-2 pr-3 font-medium">状态</th>
                      <th className="py-2 pr-3 font-medium">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-gray-50">
                        <td className="py-2 pr-3">{PKG_NAME[o.package_key] || o.package_key}</td>
                        <td className="py-2 pr-3">${(o.amount / 100).toFixed(2)}</td>
                        <td className="py-2 pr-3">{o.calls}</td>
                        <td className="py-2 pr-3 text-xs text-gray-600">{o.buyer_name || "-"}{o.buyer_email ? ` · ${o.buyer_email}` : ""}</td>
                        <td className="py-2 pr-3">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${o.status === "paid" ? "bg-green-50 text-green-700" : o.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                            {STATUS_LABEL[o.status] || o.status}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-xs text-gray-500">{o.created_at ? new Date(o.created_at).toLocaleString("zh-CN") : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
