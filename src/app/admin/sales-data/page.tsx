"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3, Upload, Download, Plus, Trash2,
  Calendar, TrendingUp, TrendingDown, Minus,
  RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface SaleRecord {
  id?: string;
  store_id: string;
  sale_date: string;
  period_type: "day" | "week" | "month" | "year";
  sales_amount: number;
  sales_units: number;
  avg_price: number;
  gross_margin_pct: number;
  comparison_last_week?: number;
  comparison_last_month?: number;
  comparison_last_year?: number;
  notes?: string;
}

export default function SalesDataPage() {
  const supabase = createClient();
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [records, setRecords] = useState<SaleRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SaleRecord | null>(null);

  // 表单
  const [form, setForm] = useState({
    sale_date: new Date().toISOString().slice(0, 10),
    period_type: "day" as const,
    sales_amount: "" as string | number,
    sales_units: "" as string | number,
    avg_price: "" as string | number,
    gross_margin_pct: "" as string | number,
    notes: "",
  });

  /* ── 加载店铺 ───────────────────── */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      setStores(data || []);
      if (data?.[0]) setStoreId(data[0].id);
    })();
  }, []);

  /* ── 加载销售记录 ───────────────── */
  const loadRecords = async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from("weekly_sales_analysis")
      .select("*")
      .eq("store_id", storeId)
      .order("sale_date", { ascending: false });
    setRecords(data || []);
  };

  useEffect(() => { loadRecords(); }, [storeId]);

  /* ── 自动计算对比 ───────────────── */
  const calcComparisons = (date: string, period: string) => {
    // 简化：用前端计算上周/上月/上年
    const d = new Date(date);
    let lastWeek: string, lastMonth: string, lastYear: string;

    const dWeek = new Date(d); dWeek.setDate(d.getDate() - 7); lastWeek = dWeek.toISOString().slice(0, 10);
    const dMonth = new Date(d); dMonth.setMonth(d.getMonth() - 1); lastMonth = dMonth.toISOString().slice(0, 10);
    const dYear = new Date(d); dYear.setFullYear(d.getFullYear() - 1); lastYear = dYear.toISOString().slice(0, 10);

    return { lastWeek, lastMonth, lastYear };
  };

  /* ── 保存 ───────────────── */
  const saveRecord = async () => {
    if (!storeId) return;
    const { lastWeek, lastMonth, lastYear } = calcComparisons(form.sale_date, form.period_type);

    // 查上周数据
    const { data: wk } = await supabase.from("weekly_sales_analysis").select("sales_amount").eq("store_id", storeId).eq("sale_date", lastWeek).maybeSingle();
    const { data: mm } = await supabase.from("weekly_sales_analysis").select("sales_amount").eq("store_id", storeId).eq("sale_date", lastMonth).maybeSingle();
    const { data: yy } = await supabase.from("weekly_sales_analysis").select("sales_amount").eq("store_id", storeId).eq("sale_date", lastYear).maybeSingle();

    const payload = {
      store_id: storeId,
      sale_date: form.sale_date,
      period_type: form.period_type,
      sales_amount: +form.sales_amount || 0,
      sales_units: +form.sales_units || 0,
      avg_price: +form.avg_price || 0,
      gross_margin_pct: +form.gross_margin_pct || 0,
      comparison_last_week: wk ? ((+form.sales_amount - wk.sales_amount) / wk.sales_amount) : null,
      comparison_last_month: mm ? ((+form.sales_amount - mm.sales_amount) / mm.sales_amount) : null,
      comparison_last_year: yy ? ((+form.sales_amount - yy.sales_amount) / yy.sales_amount) : null,
      notes: form.notes,
    };

    if (editing?.id) {
      await supabase.from("weekly_sales_analysis").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("weekly_sales_analysis").insert(payload);
    }
    setShowForm(false); setEditing(null);
    setForm({ sale_date: new Date().toISOString().slice(0, 10), period_type: "day", sales_amount: "", sales_units: "", avg_price: "", gross_margin_pct: "", notes: "" });
    loadRecords();
  };

  /* ── 删除 ───────────────── */
  const deleteRecord = async (id: string) => {
    if (!confirm("确定删除？")) return;
    await supabase.from("weekly_sales_analysis").delete().eq("id", id);
    loadRecords();
  };

  /* ── 图表数据（最近12条）────────────── */
  const chartData = useMemo(() =>
    [...records].reverse().slice(-12).map((r) => ({
      date: r.sale_date.slice(5), // MM-DD
      amount: r.sales_amount,
      units: r.sales_units,
      margin: r.gross_margin_pct,
    }))
  , [records]);

  /* ── 同步库存 ───────────────── */
  const syncInventory = async () => {
    if (!storeId) { alert("请先选择店铺"); return; }
    // 取最近录入的销售件数
    const recentUnits = records.reduce((s, r) => s + (r.sales_units || 0), 0);
    const input = prompt(`当前录入的销售总件数为 ${recentUnits} 件。\n\n请输入需要同步到库存的件数：`, String(recentUnits));
    if (!input || +input <= 0) return;
    try {
      const res = await fetch("/api/sales/sync-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, totalSold: +input }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      alert(`✅ ${data.message}`);
    } catch (e: any) {
      alert("同步失败：" + e.message);
    }
  };

  /* ── 导入 Excel ─────────────（用 xlsx）── */
  const importExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);
    for (const row of rows) {
      const r = row as any;
      await supabase.from("weekly_sales_analysis").insert({
        store_id: storeId,
        sale_date: r["日期"] || new Date().toISOString().slice(0, 10),
        period_type: "day",
        sales_amount: +r["销售额"] || 0,
        sales_units: +r["件数"] || 0,
        avg_price: +r["客单价"] || 0,
        gross_margin_pct: +r["毛利率%"] || 0,
      });
    }
    alert(`导入了 ${rows.length} 条记录`);
    loadRecords();
  };

  /* ═════════════════════════════════════
       渲染
       ═════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── 头部 ───────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">销售数据采集</h1>
            <p className="text-sm text-gray-500 mt-1">手工录入 / Excel 导入 · 自动对比上周、上月、上年</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={storeId} onChange={e => setStoreId(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm">
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <label className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" /> 导入 Excel
              <input type="file" accept=".xlsx,.xls" onChange={importExcel} className="hidden" />
            </label>
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> 手工录入
            </button>
            <button onClick={syncInventory} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> 同步库存
            </button>
          </div>
        </div>

        {/* ── 图表 ───────────────── */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3">📈 销售趋势（最近 12 条记录）</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="amount" name="销售额" fill="#3B82F6" radius={[4,4,0,0]} />
                  <Bar yAxisId="right" dataKey="units" name="件数" fill="#10B981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── 录入/编辑弹窗 ─────────────── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
              <h2 className="text-lg font-bold mb-4">{editing ? "编辑" : "新增"}销售记录</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">日期</label>
                    <input type="date" value={form.sale_date} onChange={e => setForm({ ...form, sale_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">周期</label>
                    <select value={form.period_type} onChange={e => setForm({ ...form, period_type: e.target.value as any })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option value="day">日报</option>
                      <option value="week">周报</option>
                      <option value="month">月报</option>
                      <option value="year">年报</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">销售额（元）</label>
                    <input type="number" value={form.sales_amount} onChange={e => setForm({ ...form, sales_amount: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">销售件数</label>
                    <input type="number" value={form.sales_units} onChange={e => setForm({ ...form, sales_units: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">客单价（元）</label>
                    <input type="number" value={form.avg_price} onChange={e => setForm({ ...form, avg_price: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">毛利率（%）</label>
                    <input type="number" value={form.gross_margin_pct} onChange={e => setForm({ ...form, gross_margin_pct: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">备注</label>
                  <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="可选" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={saveRecord} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">保存</button>
                  <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2.5 bg-gray-200 rounded-xl text-sm">取消</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 数据表格 ───────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 text-left">日期</th>
                <th className="p-3 text-left">周期</th>
                <th className="p-3 text-right">销售额</th>
                <th className="p-3 text-right">件数</th>
                <th className="p-3 text-right">客单价</th>
                <th className="p-3 text-right">毛利率</th>
                <th className="p-3 text-right">环比上周</th>
                <th className="p-3 text-right">环比上月</th>
                <th className="p-3 text-right">同比上年</th>
                <th className="p-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3">{r.sale_date}</td>
                  <td className="p-3">{r.period_type === "day" ? "日报" : r.period_type === "week" ? "周报" : r.period_type === "month" ? "月报" : "年报"}</td>
                  <td className="p-3 text-right">¥{r.sales_amount?.toLocaleString()}</td>
                  <td className="p-3 text-right">{r.sales_units}</td>
                  <td className="p-3 text-right">¥{r.avg_price?.toLocaleString()}</td>
                  <td className="p-3 text-right">{r.gross_margin_pct}%</td>
                  <td className="p-3 text-right">
                    {r.comparison_last_week != null && (
                      <span className={r.comparison_last_week >= 0 ? "text-green-600" : "text-red-600"}>
                        {r.comparison_last_week >= 0 ? "+" : ""}{(r.comparison_last_week * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {r.comparison_last_month != null && (
                      <span className={r.comparison_last_month >= 0 ? "text-green-600" : "text-red-600"}>
                        {r.comparison_last_month >= 0 ? "+" : ""}{(r.comparison_last_month * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {r.comparison_last_year != null && (
                      <span className={r.comparison_last_year >= 0 ? "text-green-600" : "text-red-600"}>
                        {r.comparison_last_year >= 0 ? "+" : ""}{(r.comparison_last_year * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => { setForm({
                      sale_date: r.sale_date,
                      period_type: r.period_type as any,  // 强制赋值
                      sales_amount: r.sales_amount,
                      sales_units: r.sales_units,
                      avg_price: r.avg_price,
                      gross_margin_pct: r.gross_margin_pct,
                      notes: r.notes || "",
                    }); setEditing(r); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 mr-3 text-xs">编辑</button>
                    <button onClick={() => deleteRecord(r.id!)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={10} className="p-8 text-center text-gray-400">暂无数据，点击「手工录入」或「导入 Excel」开始</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Excel 模板说明 ──────────── */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-800 mb-2">Excel 导入格式说明</h3>
          <p className="text-sm text-blue-700 mb-2">Excel 第一列须包含以下列名（顺序不限）：<code className="bg-white px-1 rounded">日期</code> <code className="bg-white px-1 rounded">销售额</code> <code className="bg-white px-1 rounded">件数</code> <code className="bg-white px-1 rounded">客单价</code> <code className="bg-white px-1 rounded">毛利率%</code></p>
          <p className="text-xs text-blue-600">💡 也可下载当前数据作为模板：<button onClick={() => { /* 导出当前 records 为 Excel */ alert("功能开发中，可先手工录入"); }} className="underline hover:no-underline">下载模板</button></p>
        </div>

      </div>
    </div>
  );
}
