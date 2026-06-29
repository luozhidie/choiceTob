"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileDown, FileText, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

const SEASONS = [
  { value: "spring_summer", label: "2026 春夏" },
  { value: "autumn_winter", label: "2026 秋冬" },
  { value: "full_year", label: "2026 全年" },
];

const REPORT_TYPES = [
  { value: "basic", label: "标准版", desc: "8章节完整报告，数据齐全，适合内部使用", icon: FileText },
  { value: "premium", label: "专业版", desc: "含12季色卡+波段色板，适合拿货/展示给客户", icon: Sparkles },
];

export default function ReportPage() {
  const supabase = createClient();
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [season, setSeason] = useState("spring_summer");
  const [reportType, setReportType] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    customers: 0, structure: false, matrix: false,
    waves: 0, evaluations: 0, inventory: 0, orders: 0,
  });

  /* ── 加载店铺 ──────────────── */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      setStores(data || []);
      if (data?.[0]) setStoreId(data[0].id);
    })();
  }, []);

  /* ── 加载数据统计 ──────────────── */
  const loadStats = async () => {
    if (!storeId) return;
    const [{ count: c }, { data: s }, { data: m },
      { count: w }, { count: e }, { count: inv }, { count: o }] = await Promise.all([
      supabase.from("vip_customers").select("*", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("product_structure_plan").select("id").eq("store_id", storeId).maybeSingle(),
      supabase.from("product_matrix_plan").select("id").eq("store_id", storeId).maybeSingle(),
      supabase.from("wave_plan").select("*", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("product_evaluation").select("*", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("inventory").select("*", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("purchase_orders").select("*", { count: "exact", head: true }).eq("store_id", storeId),
    ]);
    setStats({
      customers: c || 0,
      structure: !!s,
      matrix: !!m,
      waves: w || 0,
      evaluations: e || 0,
      inventory: inv || 0,
      orders: o || 0,
    });
  };
  useEffect(() => { loadStats(); }, [storeId]);

  /* ── 生成报告 ──────────────── */
  const generateReport = async () => {
    if (!storeId) { alert("请先选择店铺"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, season, reportType }),
      });
      if (!res.ok) { alert("生成失败：" + await res.text()); setLoading(false); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const storeName = stores.find(s => s.id === storeId)?.name || "店铺";
      a.download = reportType === "premium"
        ? `商品企划案_专业版_${storeName}_${season}.docx`
        : `商品企划报告_${storeName}_${season}.docx`;
      a.click(); window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("生成失败：" + err.message);
    }
    setLoading(false);
  };

  /* ═════════════════════════════════════
       渲染
       ═════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* ── 头部 ──────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            生成商品企划报告
          </h1>
          <p className="text-sm text-gray-500 mt-1">一键生成 Word 格式企划报告，支持标准版和专业版两种格式</p>
        </div>

        {/* ── 设置区 ──────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 space-y-6">

          {/* 选择店铺 */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">选择店铺</label>
            <select value={storeId} onChange={e => setStoreId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* 报告类型 — 核心新增 */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">报告类型</label>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_TYPES.map(rt => (
                <button
                  key={rt.value}
                  onClick={() => setReportType(rt.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    reportType === rt.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <rt.icon className={`w-5 h-5 ${reportType === rt.value ? "text-blue-600" : "text-gray-400"}`} />
                    <span className={`font-bold text-sm ${reportType === rt.value ? "text-blue-700" : "text-gray-700"}`}>
                      {rt.label}
                    </span>
                    {reportType === rt.value && (
                      <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">已选</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{rt.desc}</div>
                  {rt.value === "premium" && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">✨ 含12季色彩卡 + 波段色板可视化</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 报告季节 */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">报告季节</label>
            <div className="flex gap-3">
              {SEASONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSeason(s.value)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    season === s.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ── 数据预览 ──────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">📊 报告将包含以下内容</h3>
          <div className="space-y-3">
            {[
              { label: "客户色彩/风格分析", ok: stats.customers > 0, desc: `已录入 ${stats.customers} 位客户数据` },
              { label: "商品结构规划", ok: stats.structure, desc: stats.structure ? "已设置" : "请在商品企划页面先设置" },
              { label: "96格商品矩阵", ok: stats.matrix, desc: stats.matrix ? "已设置" : "请在商品企划页面先设置" },
              { label: "上货波段企划", ok: stats.waves > 0, desc: stats.waves > 0 ? `已设置 ${stats.waves} 个波段` : "请在商品企划页面先设置" },
              { label: "选品评估汇总", ok: stats.evaluations > 0, desc: stats.evaluations > 0 ? `${stats.evaluations} 条评估记录` : "暂无数据（可选）" },
              { label: "库存建议", ok: stats.inventory > 0, desc: stats.inventory > 0 ? `${stats.inventory} 条库存记录` : "暂无数据（可选）" },
              { label: "采购订单汇总", ok: stats.orders > 0, desc: stats.orders > 0 ? `${stats.orders} 个订单` : "暂无数据（可选）" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.ok ? "bg-green-100" : "bg-gray-200"}`}>
                  {item.ok
                    ? <CheckCircle className="w-4 h-4 text-green-600" />
                    : <AlertCircle className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${item.ok ? "text-gray-800" : "text-gray-500"}`}>{item.label}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Premium版额外说明 ──────────────── */}
        {reportType === "premium" && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-5 mb-6">
            <h4 className="font-bold text-purple-800 text-sm mb-2">✨ 专业版特色内容</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-purple-700">
              <div>✅ 12季色彩体系完整色卡（含色值标注）</div>
              <div>✅ 各季型分组展示（春/夏/秋/冬）</div>
              <div>✅ 波段企划含重点季型色板参考</div>
              <div>✅ 适合打印、展示给客户或拿货参考</div>
            </div>
          </div>
        )}

        {/* ── 生成按钮 ──────────────── */}
        <button
          onClick={generateReport}
          disabled={loading || !storeId}
          className={`w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            loading || !storeId
              ? "bg-gray-300 cursor-not-allowed"
              : reportType === "premium"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          }`}
        >
          {reportType === "premium" ? <Sparkles className="w-5 h-5" /> : <FileDown className="w-5 h-5" />}
          {loading ? "正在生成报告，请稍候..." : `生成${reportType === "premium" ? "专业版" : "标准版"}报告并下载`}
        </button>

        {/* ── 说明 ──────────────── */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <h4 className="font-bold text-blue-800 text-sm mb-2">报告说明</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>✅ <strong>标准版</strong>：8章节完整报告，数据齐全，适合内部使用</li>
            <li>✅ <strong>专业版</strong>：在标准版基础上增加12季色彩卡和波段色板，适合展示给客户或拿货参考</li>
            <li>✅ 报告为 Word（.docx）格式，可直接编辑、打印</li>
            <li>💡 建议先完善各模块数据，再生成报告，效果更佳</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
