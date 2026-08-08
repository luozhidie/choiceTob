"use client";

import { useState, useEffect } from "react";
import { Loader2, CreditCard, CheckCircle2, Send, Webhook, Terminal } from "lucide-react";

interface BetaOrder {
  id: string;
  item: string;
  amount: number;
  status: string;
  user_email?: string;
  created_at?: string;
  settled_at?: string;
}

const PACKAGES = [
  { id: "trial", label: "体验版", price: 299, desc: "14 天全功能体验" },
  { id: "year1", label: "年度会员 1", price: 3980, desc: "12 个月" },
  { id: "year2", label: "年度会员 2", price: 6960, desc: "24 个月" },
];

export default function TokenBetaPayPage() {
  const [pkgId, setPkgId] = useState<string>("trial");
  const [customAmount, setCustomAmount] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [order, setOrder] = useState<BetaOrder | null>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [log, setLog] = useState<string[]>([]);
  const [orders, setOrders] = useState<BetaOrder[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pushLog = (s: string) => setLog((l) => [s, ...l].slice(0, 30));

  const loadOrders = async () => {
    try {
      const r = await fetch("/api/admin/tokens/beta");
      const j = await r.json();
      if (j.ok) setOrders(j.data || []);
    } catch { /* ignore */ }
  };
  useEffect(() => { loadOrders(); }, []);

  const amount = pkgId === "custom" ? Number(customAmount) || 0 : (PACKAGES.find((p) => p.id === pkgId)?.price || 0);

  const createOrder = async () => {
    setBusy(true); setError(""); setReceipt(null);
    try {
      const r = await fetch("/api/admin/tokens/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", package_id: pkgId === "custom" ? undefined : pkgId, amount, user_email: userEmail || null }),
      });
      const j = await r.json();
      pushLog(`[下单] ${JSON.stringify(j.receipt || j)}`);
      if (j.ok) { setOrder({ id: j.receipt.order_id, item: j.receipt.item, amount: j.receipt.amount, status: "pending" }); loadOrders(); }
      else setError(j.error || "下单失败");
    } catch (e: any) { setError(e.message || "网络错误"); }
    finally { setBusy(false); }
  };

  const fireCallback = async () => {
    if (!order) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/admin/tokens/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "callback", order_id: order.id }),
      });
      const j = await r.json();
      pushLog(`[回调] ${JSON.stringify(j.receipt || j)}`);
      if (j.ok) { setReceipt(j.receipt); setOrder({ ...order, status: "settled" }); loadOrders(); }
      else setError(j.error || "回调失败");
    } catch (e: any) { setError(e.message || "网络错误"); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <CreditCard className="w-6 h-6 text-amber-600" /> 词元内测支付
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        内测工具：模拟用户下单 → 支付成功回调，验证「支付成功后后端能否正确收到 API / 回调」。不接真实微信支付。
      </p>

      <div className="bg-white rounded-xl shadow p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PACKAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPkgId(p.id)}
              className={`text-left rounded-xl border p-3 transition ${pkgId === p.id ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300"}`}
            >
              <div className="font-medium">{p.label}</div>
              <div className="text-amber-700 font-bold">¥{p.price.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">{p.desc}</div>
            </button>
          ))}
          <button
            onClick={() => setPkgId("custom")}
            className={`text-left rounded-xl border p-3 transition ${pkgId === "custom" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300"}`}
          >
            <div className="font-medium">自定义金额</div>
            <input
              className="mt-1 w-full border rounded-lg px-2 py-1 text-sm"
              placeholder="金额（元）"
              inputMode="decimal"
              value={customAmount}
              onChange={(e) => { setPkgId("custom"); setCustomAmount(e.target.value); }}
            />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
            placeholder="测试用户邮箱（可选）"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
          <button
            onClick={createOrder}
            disabled={busy || amount <= 0}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 发起内测支付（¥{amount.toLocaleString()}）
          </button>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>

      {order && (
        <div className="bg-white rounded-xl shadow p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{order.item}</div>
              <div className="text-sm text-gray-500 mt-1">订单 {order.id}</div>
            </div>
            {order.status === "settled" ? (
              <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 已确认收到 API 回执</span>
            ) : (
              <button onClick={fireCallback} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 flex items-center gap-1 disabled:opacity-50">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Webhook className="w-3.5 h-3.5" />} 模拟支付成功回调
              </button>
            )}
          </div>
          {receipt && (
            <pre className="bg-gray-900 text-green-300 text-xs rounded-lg p-3 overflow-auto">{JSON.stringify(receipt, null, 2)}</pre>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-600"><Terminal className="w-4 h-4" /> API 调用日志</div>
        {log.length === 0 ? (
          <p className="text-gray-400 text-sm py-3">暂无调用</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-auto">
            {log.map((l, i) => (
              <pre key={i} className="text-xs text-gray-700 bg-gray-50 rounded p-2 whitespace-pre-wrap break-all">{l}</pre>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-sm font-medium text-gray-600 mb-2">近期内测订单</div>
        {orders.length === 0 ? (
          <p className="text-center text-gray-400 py-8">暂无内测订单</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{o.item}</div>
                  <div className="text-sm text-gray-500 mt-1">¥{Number(o.amount || 0).toLocaleString()} · {o.user_email || "—"}</div>
                </div>
                {o.status === "settled" ? (
                  <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 已结算</span>
                ) : (
                  <span className="text-amber-600 text-sm">待支付</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
