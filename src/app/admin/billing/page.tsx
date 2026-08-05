"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Wallet, CheckCircle2, Clock, Trash2 } from "lucide-react";

interface BillingRecord {
  id: string;
  user_id?: string;
  user_email?: string;
  item: string;
  amount: number;
  status: string;
  period?: string;
  created_at?: string;
  settled_at?: string;
}

export default function BillingAdminPage() {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [period, setPeriod] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/billing");
      const j = await r.json();
      if (j.ok) setRecords(j.data || []);
      else setError(j.error || "加载失败");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!item.trim()) { setError("计费项必填"); return; }
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, amount: Number(amount) || 0, user_email: userEmail || null, period: period || null }),
      });
      const j = await r.json();
      if (j.ok) { setItem(""); setAmount(""); setUserEmail(""); setPeriod(""); load(); }
      else setError(j.error || "添加失败");
    } catch { setError("网络错误"); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("确认删除该帐单记录？")) return;
    await fetch(`/api/admin/billing?id=${id}`, { method: "DELETE" });
    load();
  };

  const markSettled = async (id: string) => {
    await fetch("/api/admin/billing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "settled" }),
    });
    load();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <Wallet className="w-6 h-6 text-amber-600" /> API 帐单
      </h1>
      <p className="text-sm text-gray-500 mb-6">查看与管理 API 调用 / 套餐的计费与结算记录。</p>

      <div className="bg-white rounded-xl shadow p-4 mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="计费项（必填）" value={item} onChange={(e) => setItem(e.target.value)} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="金额（元）" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="用户邮箱" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="账期（如 2026-08）" value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={add} disabled={saving} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 新增帐单
          </button>
          {error && <span className="text-red-500 text-sm">{error}</span>}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-400 py-10">暂无帐单记录</p>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{r.item}</div>
                <div className="text-sm text-gray-500 mt-1">
                  ¥{Number(r.amount || 0).toLocaleString()} · {r.user_email || "—"} · {r.period || "—"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.status === "settled" ? (
                  <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 已结算</span>
                ) : (
                  <>
                    <button onClick={() => markSettled(r.id)} className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 标记结算
                    </button>
                    <button onClick={() => del(r.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> 删除
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
