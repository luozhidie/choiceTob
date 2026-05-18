"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DollarSign, Plus, Trash2, Edit2, TrendingUp, TrendingDown } from "lucide-react";

const CATEGORIES = ["采购成本", "营销费用", "运营成本", "人力成本", "租金", "其他"];

interface BudgetItem {
  id?: string;
  store_id: string;
  category: string;
  item: string;
  budget_amount: number;
  actual_amount: number;
  variance?: number;
  variance_pct?: number;
  notes?: string;
}

export default function BudgetTrackerPage() {
  const supabase = createClient();
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [filterCategory, setFilterCategory] = useState("");

  const [form, setForm] = useState({
    category: "采购成本",
    item: "",
    budget_amount: "",
    actual_amount: "",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      setStores(data || []);
      if (data?.[0]) setStoreId(data[0].id);
    })();
  }, []);

  const load = async () => {
    if (!storeId) return;
    const { data } = await supabase.from("budget_tracker").select("*").eq("store_id", storeId).order("created_at");
    setItems(data || []);
  };
  useEffect(() => { load(); }, [storeId]);

  const calcVariance = (budget: number, actual: number) => {
    const v = actual - budget;
    const vp = budget > 0 ? (v / budget) * 100 : 0;
    return { variance: v, variance_pct: vp };
  };

  const save = async () => {
    if (!form.item.trim()) { alert("请填写项目名称"); return; }
    const b = +form.budget_amount || 0;
    const a = +form.actual_amount || 0;
    const { variance, variance_pct } = calcVariance(b, a);
    const payload = {
      store_id: storeId,
      category: form.category,
      item: form.item,
      budget_amount: b,
      actual_amount: a,
      variance,
      variance_pct,
      notes: form.notes,
    };
    if (editing?.id) await supabase.from("budget_tracker").update(payload).eq("id", editing.id);
    else await supabase.from("budget_tracker").insert(payload);
    setShowForm(false); setEditing(null);
    resetForm(); load();
  };

  const del = async (id: string) => {
    if (!confirm("确定删除？")) return;
    await supabase.from("budget_tracker").delete().eq("id", id);
    load();
  };

  const resetForm = () => setForm({ category: "采购成本", item: "", budget_amount: "", actual_amount: "", notes: "" });

  const openEdit = (it: BudgetItem) => {
    setForm({
      category: it.category, item: it.item,
      budget_amount: String(it.budget_amount || ""),
      actual_amount: String(it.actual_amount || ""),
      notes: it.notes || "",
    });
    setEditing(it); setShowForm(true);
  };

  const filtered = items.filter(it => filterCategory ? it.category === filterCategory : true);

  const stats = {
    totalBudget: items.reduce((s, it) => s + (it.budget_amount || 0), 0),
    totalActual: items.reduce((s, it) => s + (it.actual_amount || 0), 0),
    count: items.length,
  };
  stats.totalVariance = stats.totalActual - stats.totalBudget;

  return (
    <div className="min-h-screen bg-gray-50 p-6"><div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">预算与成本管理</h1>
          <p className="text-sm text-gray-500 mt-1">预算设定 · 实际跟踪 · 差异分析</p>
        </div>
        <div className="flex gap-3">
          <select value={storeId} onChange={e => setStoreId(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm">
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> 新增预算项
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.count}</div>
          <div className="text-xs text-gray-500">预算项目数</div>
        </div>
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">¥{stats.totalBudget.toLocaleString()}</div>
          <div className="text-xs text-blue-500">总预算</div>
        </div>
        <div className={`rounded-2xl border p-4 text-center ${stats.totalActual > stats.totalBudget ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          <div className={`text-2xl font-bold ${stats.totalActual > stats.totalBudget ? "text-red-600" : "text-green-600"}`}>¥{stats.totalActual.toLocaleString()}</div>
          <div className="text-xs text-gray-500">实际支出</div>
        </div>
        <div className={`rounded-2xl border p-4 text-center ${stats.totalVariance > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          <div className={`text-2xl font-bold ${stats.totalVariance > 0 ? "text-red-600" : "text-green-600"}`}>
            {stats.totalVariance >= 0 ? "+" : ""}¥{stats.totalVariance.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">总差异</div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center gap-4">
        <span className="text-sm text-gray-500">分类筛选：</span>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">全部分类</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* 弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-bold mb-4">{editing ? "编辑" : "新增"}预算项</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">分类</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">项目名称 *</label>
                  <input value={form.item} onChange={e => setForm({ ...form, item: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：春装采购" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">预算金额（元）</label>
                  <input type="number" value={form.budget_amount} onChange={e => setForm({ ...form, budget_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">实际金额（元）</label>
                  <input type="number" value={form.actual_amount} onChange={e => setForm({ ...form, actual_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              {(form.budget_amount && form.actual_amount) && (() => {
                const { variance, variance_pct } = calcVariance(+form.budget_amount, +form.actual_amount);
                return (
                  <div className={`p-3 rounded-lg text-sm ${variance > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                    差异：¥{variance.toLocaleString()}（{variance_pct.toFixed(1)}%）
                  </div>
                );
              })()}
              <div>
                <label className="text-xs text-gray-500">备注</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">保存</button>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2.5 bg-gray-200 rounded-xl text-sm">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 表格 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 text-left">分类</th>
              <th className="p-3 text-left">项目名称</th>
              <th className="p-3 text-right">预算</th>
              <th className="p-3 text-right">实际</th>
              <th className="p-3 text-right">差异</th>
              <th className="p-3 text-right">差异%</th>
              <th className="p-3 text-left">备注</th>
              <th className="p-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(it => {
              const v = (it.variance !== null && it.variance !== undefined) ? it.variance : ((it.actual_amount || 0) - (it.budget_amount || 0));
              const vp = (it.variance_pct !== null && it.variance_pct !== undefined) ? it.variance_pct : ((it.budget_amount || 0) > 0 ? v / (it.budget_amount || 0) * 100 : 0);
              return (
                <tr key={it.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{it.category}</span></td>
                  <td className="p-3 font-semibold">{it.item}</td>
                  <td className="p-3 text-right">¥{(it.budget_amount || 0).toLocaleString()}</td>
                  <td className="p-3 text-right">¥{(it.actual_amount || 0).toLocaleString()}</td>
                  <td className={`p-3 text-right font-semibold ${v >= 0 ? "text-red-600" : "text-green-600"}`}>
                    {v >= 0 ? "+" : ""}¥{v.toLocaleString()}
                  </td>
                  <td className={`p-3 text-right ${vp > 10 ? "text-red-600" : vp < -10 ? "text-green-600" : "text-gray-500"}`}>
                    {vp.toFixed(1)}%
                  </td>
                  <td className="p-3 text-xs text-gray-500 max-w-xs truncate">{it.notes || "—"}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => openEdit(it)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs">编辑</button>
                    <button onClick={() => del(it.id!)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-400">暂无数据</td></tr>}
            {/* 合计行 */}
            {filtered.length > 0 && (
              <tr className="border-t-2 border-blue-300 bg-blue-50 font-bold">
                <td colSpan={2} className="p-3">合计</td>
                <td className="p-3 text-right">¥{filtered.reduce((s, it) => s + (it.budget_amount || 0), 0).toLocaleString()}</td>
                <td className="p-3 text-right">¥{filtered.reduce((s, it) => s + (it.actual_amount || 0), 0).toLocaleString()}</td>
                <td colSpan={3} className="p-3 text-right">
                  {(() => {
                    const totalB = filtered.reduce((s, it) => s + (it.budget_amount || 0), 0);
                    const totalA = filtered.reduce((s, it) => s + (it.actual_amount || 0), 0);
                    const totalV = totalA - totalB;
                    return <span className={totalV >= 0 ? "text-red-600" : "text-green-600"}>{totalV >= 0 ? "+" : ""}¥{totalV.toLocaleString()}</span>;
                  })()}
                </td>
                <td className="p-3"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div></div>
  );
}
