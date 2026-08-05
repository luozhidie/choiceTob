"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Wallet, CheckCircle2, Clock } from "lucide-react";

interface Settlement {
  id: string;
  creator_id?: string | null;
  creator_name: string;
  period?: string | null;
  amount?: number;
  status?: string;
  settled_at?: string | null;
}

export default function PlatformSettlementPage() {
  const [list, setList] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ creator_name: "", period: "", amount: 0 });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/platform/settlement", { credentials: "include" });
      const j = await res.json();
      if (j.ok) setList(j.data || []);
      else flash(j.error || "加载失败");
    } catch {
      flash("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.creator_name.trim()) {
      flash("创作者名称必填");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/platform/settlement", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (j.ok) {
        flash("已创建结算单");
        setShowForm(false);
        setForm({ creator_name: "", period: "", amount: 0 });
        load();
      } else flash(j.error || "保存失败");
    } catch {
      flash("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const markSettled = async (id: string) => {
    const res = await fetch("/api/admin/platform/settlement", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "settled" }),
    });
    const j = await res.json();
    if (j.ok) load();
    else flash(j.error || "操作失败");
  };

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> 平台结算
          </h1>
          <p className="text-sm text-gray-500 mt-1">记录并向创作者结算佣金 / 稿费。</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 新增
        </button>
      </div>

      {toast && <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm">{toast}</div>}

      {showForm && (
        <div className="mb-4 p-4 rounded-xl border border-gray-200 bg-white space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">创作者名称</label>
            <input
              value={form.creator_name}
              onChange={(e) => setForm({ ...form, creator_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">账期</label>
              <input
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                placeholder="如：2026-07"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">金额（元）</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null} 创建
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-sm">暂无结算单，点击右上角“新增”。</div>
      ) : (
        <div className="space-y-2">
          {list.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
              <div>
                <div className="font-medium text-gray-800">{s.creator_name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {s.period && <span className="mr-2">账期 {s.period}</span>}
                  <span className="text-primary font-medium">¥{Number(s.amount || 0).toFixed(2)}</span>
                </div>
              </div>
              <div>
                {s.status === "settled" ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" /> 已结算
                  </span>
                ) : (
                  <button
                    onClick={() => markSettled(s.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary text-primary text-sm"
                  >
                    <Clock className="w-3.5 h-3.5" /> 标记结算
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
