"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingBag, Download, Save, Calculator,
  Trash2, Plus, Layers, Calendar, BarChart3,
  ShoppingCart,
} from "lucide-react";
import {
  FEMALE_STYLES, MALE_STYLES, COLOR_SEASONS_PRO,
  getStyleProLabel, CATEGORY_OPTIONS,
} from "@/lib/styles";
import * as XLSX from "xlsx";

/* ── 12 季型 ─────────────────────────────── */
const SEASON_TYPES = [
  "light_warm", "warm_bright", "clear_warm",
  "light_cool", "soft_cool", "cool_soft",
  "warm_soft", "soft_warm", "deep_warm",
  "clear_cool", "cool_bright", "deep_cool",
];

/* ── 全部风格（行头）──────────────── */
const ALL_STYLES: any[] = [
  ...FEMALE_STYLES.map((s) => ({ ...s, group: "女士" })),
  ...MALE_STYLES.map((s) => ({ ...s, group: "男士" })),
];

/* ── 品类选项（从 styles.ts 统一引入）── */
// CATEGORY_OPTIONS 已从 @/lib/styles 引入

/* ── 类型定义 ─────────────────────────────── */
interface StructureItem {
  category: string;
  pct: number;
  sku: number;
  margin: number;
  sales: number;
  season: string;
}

interface WaveItem {
  wave: number;
  date: string;
  pct: number;
  sku: number;
  amount: number;
  categories: string[];
  seasonFocus: string[];
  styleFocus: string[];
  activity: string;
}

export default function ProductPlanPage() {
  const supabase = createClient();
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ── 商品结构规划 ────────────────────────
  const [structure, setStructure] = useState<StructureItem[]>([
    { category: "TX-T恤针织衫", pct: 15, sku: 30, margin: 55, sales: 90000, season: "春夏/秋冬" },
    { category: "DY-大衣", pct: 15, sku: 15, margin: 65, sales: 120000, season: "秋冬" },
    { category: "YR-羽绒服（真毛领）", pct: 12, sku: 12, margin: 60, sales: 108000, season: "秋冬" },
    { category: "KZ-裤装（仔裤/西裤/休闲裤/牛仔外套）", pct: 10, sku: 20, margin: 55, sales: 60000, season: "全年" },
    { category: "LQ-连衣裙", pct: 8, sku: 15, margin: 65, sales: 50000, season: "春夏" },
    { category: "FY-风衣/外套/单西装", pct: 10, sku: 10, margin: 65, sales: 70000, season: "秋冬" },
    { category: "MS-毛衫（上衣/连衣裙）", pct: 8, sku: 15, margin: 60, sales: 48000, season: "秋冬" },
    { category: "MF-棉服", pct: 5, sku: 8, margin: 55, sales: 35000, season: "秋冬" },
    { category: "WY-卫衣", pct: 5, sku: 10, margin: 55, sales: 30000, season: "秋冬" },
    { category: "SZ-梭织上装（小衫/打底衫）", pct: 4, sku: 10, margin: 60, sales: 24000, season: "全年" },
    { category: "MJ-马甲（羊绒/毛呢时尚款）", pct: 3, sku: 8, margin: 60, sales: 20000, season: "秋冬" },
    { category: "TZ-套装（1套1-2件）", pct: 2, sku: 5, margin: 65, sales: 15000, season: "全年" },
    { category: "KL-夹克衫", pct: 2, sku: 5, margin: 60, sales: 12000, season: "秋冬" },
    { category: "BQ-半身裙", pct: 1, sku: 7, margin: 60, sales: 8000, season: "春夏/秋冬" },
  ]);

  // ── 96 格矩阵数据 ────────────────────────
  // matrix[seasonType][styleValue] = { sku, pct, budget }
  const [matrix, setMatrix] = useState<Record<string, any>>(() => {
    const m: Record<string, any> = {};
    SEASON_TYPES.forEach((s) => {
      m[s] = {};
      ALL_STYLES.forEach((st) => {
        m[s][st.value] = { sku: 0, pct: 0, budget: 0 };
      });
    });
    return m;
  });

  // ── 波段计划 ────────────────────────────
  const [waves, setWaves] = useState<WaveItem[]>([
    { wave: 1, date: "2月第1周", pct: 15, sku: 30, amount: 150000, categories: ["春装上衣", "裙装"], seasonFocus: ["春早春", "春中"], styleFocus: ["优雅", "浪漫"], activity: "春季新品发布" },
    { wave: 2, date: "3月第1周", pct: 20, sku: 40, amount: 200000, categories: ["全套春装"], seasonFocus: ["春中", "春末"], styleFocus: ["休闲", "通勤"], activity: "女神节促销" },
    { wave: 3, date: "4月第1周", pct: 25, sku: 50, amount: 250000, categories: ["春夏过渡款"], seasonFocus: ["春末", "初夏"], styleFocus: ["简约", "优雅"], activity: "会员专享日" },
    { wave: 4, date: "5月第1周", pct: 40, sku: 80, amount: 400000, categories: ["夏装全套"], seasonFocus: ["盛夏"], styleFocus: ["运动", "前卫"], activity: "夏季焕新大促" },
  ]);

  /* ── 加载店铺列表 ──────────────────────── */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      setStores(data || []);
      if (data && data.length > 0) setStoreId(data[0].id);
    })();
  }, []);

  /* ── 自动填充 96 格矩阵（基于 VIP 数据）── */
  const autoFillMatrix = async () => {
    if (!storeId) { alert("请先选择店铺"); return; }
    setSaving(true);
    try {
      const { data: members } = await supabase
        .from("vip_customers")
        .select("color_season, main_style")
        .eq("store_id", storeId)
        .eq("is_active", true);

      if (!members || members.length === 0) {
        alert("该店铺暂无 VIP 数据，无法自动填充");
        setSaving(false);
        return;
      }

      const countMap: Record<string, Record<string, number>> = {};
      SEASON_TYPES.forEach((s) => { countMap[s] = {}; ALL_STYLES.forEach((st) => { countMap[s][st.value] = 0; }); });

      let total = 0;
      members.forEach((m: any) => {
        const s = m.color_season;
        const st = m.main_style;
        if (s && st && countMap[s]) {
          countMap[s][st] = (countMap[s][st] || 0) + 1;
          total++;
        }
      });

      const totalSku = structure.reduce((sum, item) => sum + item.sku, 0) || 200;
      const newMatrix = { ...matrix };
      SEASON_TYPES.forEach((s) => {
        ALL_STYLES.forEach((st) => {
          const cnt = countMap[s]?.[st.value] || 0;
          const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
          const sku = Math.round((pct / 100) * totalSku);
          newMatrix[s][st.value] = {
            sku,
            pct,
            budget: Math.round(sku * 500),
          };
        });
      });
      setMatrix(newMatrix);
      alert("96 格矩阵已根据 VIP 数据自动填充！");
    } catch (e: any) {
      alert("填充失败：" + e.message);
    }
    setSaving(false);
  };

  /* ── 保存到数据库 ──────────────────────── */
  const saveToDB = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      await supabase.from("product_structure_plan").upsert({
        store_id: storeId,
        season: "全年",
        items: structure,
        total_sku: structure.reduce((s, i) => s + i.sku, 0),
        total_budget: structure.reduce((s, i) => s + i.sales, 0),
      });

      await supabase.from("product_matrix_plan").upsert({
        store_id: storeId,
        season: "全年",
        matrix_data: matrix,
        total_sku: structure.reduce((s, i) => s + i.sku, 0),
      });

      for (const w of waves) {
        await supabase.from("wave_plan").upsert({
          store_id: storeId,
          wave_number: w.wave,
          plan_date: w.date,
          pct: w.pct,
          sku_count: w.sku,
          amount: w.amount,
          core_categories: w.categories,
          season_focus: w.seasonFocus,
          style_focus: w.styleFocus,
          marketing_activity: w.activity,
        });
      }
      alert("保存成功！");
    } catch (e: any) {
      alert("保存失败：" + e.message);
    }
    setSaving(false);
  };

  /* ── 导出 Excel ─────────────────────────── */
  const exportToExcel = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet1: 商品结构规划
      const ws1 = XLSX.utils.aoa_to_sheet([
        ["序号", "品类", "占比%", "SKU数", "毛利率%", "目标销售额", "季节分布"],
        ...structure.map((item, i) => [i + 1, item.category, item.pct, item.sku, item.margin, `¥${item.sales.toLocaleString()}`, item.season]),
      ]);
      XLSX.utils.book_append_sheet(wb, ws1, "1.商品结构规划");

      // Sheet2: 96格商品矩阵
      const header2 = ["季型\\风格", ...ALL_STYLES.map((s) => s.proLabel || s.label)];
      const rows2 = SEASON_TYPES.map((s) => {
        const season = COLOR_SEASONS_PRO.find((c) => c.value === s);
        return [
          `${season?.label || s}`,
          ...ALL_STYLES.map((st) => {
            const cell = matrix[s]?.[st.value];
            return `SKU:${cell?.sku || 0}\n占比:${cell?.pct || 0}%\n预算:¥${cell?.budget?.toLocaleString() || 0}`;
          }),
        ];
      });
      const ws2 = XLSX.utils.aoa_to_sheet([header2, ...rows2]);
      XLSX.utils.book_append_sheet(wb, ws2, "2.96格商品矩阵");

      // Sheet3: 上货波段计划
      const ws3 = XLSX.utils.aoa_to_sheet([
        ["波段", "时间", "占比%", "SKU数", "金额", "核心品类", "季型重点", "风格重点", "营销活动"],
        ...waves.map((w) => [w.wave, w.date, w.pct, w.sku, `¥${w.amount.toLocaleString()}`, w.categories.join("、"), w.seasonFocus.join("、"), w.styleFocus.join("、"), w.activity]),
      ]);
      XLSX.utils.book_append_sheet(wb, ws3, "3.上货波段计划");

      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `商品企划_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      alert("Excel 已导出！");
    } catch (e: any) {
      alert("导出失败：" + e.message);
    }
    setExporting(false);
  };

  /* ── 一键生成采购清单 ─────────────────── */
  const [generatingPO, setGeneratingPO] = useState(false);
  const generateProcurement = async () => {
    if (!storeId) { alert("请先选择店铺"); return; }
    setGeneratingPO(true);
    try {
      const res = await fetch("/api/plan/generate-procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, season: "2026", supplier: "待确认", avgCostPrice: 150 }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); setGeneratingPO(false); return; }
      alert(`✅ ${data.message}\n\n共 ${data.orders?.length || 0} 张采购单\n总计 ${data.totalSku || 0} 件，¥${(data.totalAmount || 0).toLocaleString()}`);
    } catch (e: any) {
      alert("生成失败：" + e.message);
    }
    setGeneratingPO(false);
  };

  /* ═══════════════════════════════════════════
       渲染
       ═══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-8xl mx-auto">

        {/* ── 头部 ────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">商品企划系统</h1>
            <p className="text-sm text-gray-500 mt-1">96 格商品矩阵 · 基于 VIP 数据自动生成可落地的进货方案</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
            >
              <option value="">选择店铺</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button onClick={autoFillMatrix} disabled={saving || !storeId} className="px-4 py-2.5 bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-200 disabled:opacity-50 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              {saving ? "填充中..." : "AI 自动填充矩阵"}
            </button>
            <button onClick={saveToDB} disabled={saving} className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? "保存中..." : "保存到数据库"}
            </button>
            <button onClick={exportToExcel} disabled={exporting} className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              {exporting ? "导出中..." : "导出 Excel"}
            </button>
            <button onClick={generateProcurement} disabled={generatingPO || !storeId} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              {generatingPO ? "生成中..." : "一键生成采购清单"}
            </button>
          </div>
        </div>

        {/* === 1. 商品结构规划 === */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" /> 1. 商品结构规划
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 text-left">品类</th>
                  <th className="p-3 text-left">占比%</th>
                  <th className="p-3 text-left">SKU数</th>
                  <th className="p-3 text-left">毛利率%</th>
                  <th className="p-3 text-left">目标销售额</th>
                  <th className="p-3 text-left">季节分布</th>
                  <th className="p-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {structure.map((item, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="p-3">
                      <select value={item.category} onChange={(e) => { const s = [...structure]; s[i].category = e.target.value; setStructure(s); }} className="px-2 py-1 border border-gray-200 rounded-lg text-sm">
                        {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="p-3"><input type="number" value={item.pct} onChange={(e) => { const s = [...structure]; s[i].pct = +e.target.value; setStructure(s); }} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={item.sku} onChange={(e) => { const s = [...structure]; s[i].sku = +e.target.value; setStructure(s); }} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={item.margin} onChange={(e) => { const s = [...structure]; s[i].margin = +e.target.value; setStructure(s); }} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={item.sales} onChange={(e) => { const s = [...structure]; s[i].sales = +e.target.value; setStructure(s); }} className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={item.season} onChange={(e) => { const s = [...structure]; s[i].season = e.target.value; setStructure(s); }} className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3">
                      <button onClick={() => { const s = [...structure]; s.splice(i, 1); setStructure(s); }} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-blue-50 font-semibold">
                <tr>
                  <td className="p-3">合计</td>
                  <td className="p-3">{structure.reduce((s, i) => s + i.pct, 0)}%</td>
                  <td className="p-3">{structure.reduce((s, i) => s + i.sku, 0)}</td>
                  <td className="p-3">—</td>
                  <td className="p-3">¥{structure.reduce((s, i) => s + i.sales, 0).toLocaleString()}</td>
                  <td className="p-3">—</td>
                  <td className="p-3">
                    <button onClick={() => setStructure([...structure, { category: "配饰", pct: 0, sku: 0, margin: 0, sales: 0, season: "全年" }])} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs">
                      <Plus className="w-3 h-3" /> 添加
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* === 2. 96 格商品矩阵 === */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> 2. 96 格商品矩阵（季型 × 风格）
          </h2>
          <p className="text-xs text-gray-400 mb-3">点击「AI 自动填充矩阵」根据 VIP 数据自动生成，也可手动调整每个单元格的 SKU 数和预算</p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 border border-gray-200 min-w-[80px]">季型 \ 风格</th>
                  {ALL_STYLES.map((s) => (
                    <th key={s.value} className="p-2 border border-gray-200 min-w-[90px] text-xs">
                      <div>{s.proLabel || s.label}</div>
                      <div className="text-gray-400">({s.group})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEASON_TYPES.map((season) => {
                  const seasonInfo = COLOR_SEASONS_PRO.find((c) => c.value === season);
                  return (
                    <tr key={season}>
                      <td className="p-2 border border-gray-200 font-semibold bg-gray-50 text-left pl-2">
                        {seasonInfo?.label}<br /><span className="text-gray-400 text-xs">{seasonInfo?.group}</span>
                      </td>
                      {ALL_STYLES.map((st) => {
                        const cell = matrix[season]?.[st.value] || { sku: 0, pct: 0, budget: 0 };
                        return (
                          <td key={st.value} className="p-1 border border-gray-200 align-top">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500 text-xs">SKU:</span>
                                <input
                                  type="number"
                                  value={cell.sku}
                                  onChange={(e) => {
                                    const m = { ...matrix };
                                    m[season][st.value] = { ...cell, sku: +e.target.value };
                                    setMatrix(m);
                                  }}
                                  className="w-14 px-1 py-0.5 border border-gray-200 rounded text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500 text-xs">%:</span>
                                <input
                                  type="number"
                                  value={cell.pct}
                                  onChange={(e) => {
                                    const m = { ...matrix };
                                    m[season][st.value] = { ...cell, pct: +e.target.value };
                                    setMatrix(m);
                                  }}
                                  className="w-12 px-1 py-0.5 border border-gray-200 rounded text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500 text-xs">¥:</span>
                                <input
                                  type="number"
                                  value={cell.budget}
                                  onChange={(e) => {
                                    const m = { ...matrix };
                                    m[season][st.value] = { ...cell, budget: +e.target.value };
                                    setMatrix(m);
                                  }}
                                  className="w-20 px-1 py-0.5 border border-gray-200 rounded text-xs"
                                />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* === 3. 上货波段计划 === */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> 3. 上货波段计划
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 text-left">波段</th>
                  <th className="p-3 text-left">时间</th>
                  <th className="p-3 text-left">占比%</th>
                  <th className="p-3 text-left">SKU数</th>
                  <th className="p-3 text-left">金额</th>
                  <th className="p-3 text-left">核心品类</th>
                  <th className="p-3 text-left">季型重点</th>
                  <th className="p-3 text-left">风格重点</th>
                  <th className="p-3 text-left">营销活动</th>
                </tr>
              </thead>
              <tbody>
                {waves.map((w, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="p-3 font-semibold">第{w.wave}波</td>
                    <td className="p-3"><input type="text" value={w.date} onChange={(e) => { const ws = [...waves]; ws[i].date = e.target.value; setWaves(ws); }} className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={w.pct} onChange={(e) => { const ws = [...waves]; ws[i].pct = +e.target.value; setWaves(ws); }} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={w.sku} onChange={(e) => { const ws = [...waves]; ws[i].sku = +e.target.value; setWaves(ws); }} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="number" value={w.amount} onChange={(e) => { const ws = [...waves]; ws[i].amount = +e.target.value; setWaves(ws); }} className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={w.categories.join("、")} onChange={(e) => { const ws = [...waves]; ws[i].categories = e.target.value.split("、"); setWaves(ws); }} className="w-40 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={w.seasonFocus.join("、")} onChange={(e) => { const ws = [...waves]; ws[i].seasonFocus = e.target.value.split("、"); setWaves(ws); }} className="w-40 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={w.styleFocus.join("、")} onChange={(e) => { const ws = [...waves]; ws[i].styleFocus = e.target.value.split("、"); setWaves(ws); }} className="w-32 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                    <td className="p-3"><input type="text" value={w.activity} onChange={(e) => { const ws = [...waves]; ws[i].activity = e.target.value; setWaves(ws); }} className="w-36 px-2 py-1 border border-gray-200 rounded-lg text-sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 使用说明 ────────────────────────── */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-800 mb-2">使用流程</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>选择店铺 → 系统自动加载该店铺 VIP 数据</li>
            <li>点击「AI 自动填充矩阵」→ 根据 VIP 色彩季型 + 风格分布，自动计算 96 格矩阵的 SKU 数和预算</li>
            <li>手动微调 → 在表格里直接调整每个季型×风格组合的 SKU 数和预算</li>
            <li>点击「保存到数据库」→ 持久化到 Supabase</li>
            <li>点击「导出 Excel」→ 下载和 Supalema 模板一样格式的商品企划案，<strong>直接拿去进货</strong></li>
          </ol>
        </div>

      </div>
    </div>
  );
}
