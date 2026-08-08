"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Store, BarChart3, Users, Palette,
  Sparkles, ShoppingBag, DollarSign, Loader2,
  Lightbulb, Target, Layers, LayoutGrid, Eye, Package, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, FileText, Download,
  Calendar, TrendingDown, Percent, ShoppingCart,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie,
} from "recharts";
import {
  FEMALE_STYLES, COLOR_SEASONS_PRO, COLOR_SEASON_COLORS,
  getStyleProLabel,
} from "@/lib/styles";

/* ── 类型定义 ─────────────────────────────────────────────── */
interface StoreOption {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
}

interface VipMember {
  id: string;
  name: string;
  gender: string | null;
  color_season: string | null;
  main_style: string | null;
  vip_level: string;
  created_at: string;
}

interface BuyerAnalysis {
  totalMembers: number;
  colorDist: Record<string, number>;
  styleDist: Record<string, number>;
  genderDist: Record<string, number>;
  vipDist: Record<string, number>;
  ageDist: Record<string, number>;
  avgAge: number;
}

interface BuyerReport {
  id?: string;
  title: string;
  summary: string;
  totalBudget?: number;
  budgetAllocation?: { category: string; amount: number; percentage: number }[];
  colorPlan: { season: string; label: string; percentage: number; rationale: string }[];
  stylePlan: { style: string; label: string; percentage: number; rationale: string }[];
  sizePlan?: { size: string; percentage: number; rationale: string }[];
  categoryPlan: { category: string; percentage: number; units?: number; rationale: string }[];
  pricePlan: { range: string; percentage: number; rationale: string }[];
  procurementTimeline?: { week: number; action: string; items: string }[];
  displayAdvice: { zone: string; colors: string[]; styles: string[]; rationale: string }[];
  keyActions: { priority: number; action: string; expectedImpact: string; cost?: string }[];
  riskAlert?: string;
  kpiTargets?: {
    sellThroughRate: number;
    inventoryTurnoverDays: number;
    attachmentRate: number;
  };
}

/* ── 常量 ─────────────────────────────────────────────────── */
const PIE_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
];

/* ── 组件 ─────────────────────────────────────────────────── */
export default function StoreBuyerPage() {
  const supabase = createClient();
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [members, setMembers] = useState<VipMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<BuyerReport | null>(null);
  const [expandedSection, setExpandedSection] = useState("overview");
  const [budgetInput, setBudgetInput] = useState("");

  /* 加载店铺列表 */
  useEffect(() => { fetchStores(); }, []);
  const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("id, name, city, district").order("name");
    if (data) setStores(data);
  };

  /* 加载会员 */
  useEffect(() => {
    if (!selectedStore) { setMembers([]); setReport(null); return; }
    fetchMembers(selectedStore);
  }, [selectedStore]);

  const fetchMembers = async (storeId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("vip_customers")
      .select("id, name, gender, color_season, main_style, vip_level, created_at")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setMembers(data || []);
    setLoading(false);
  };

  /* ── 数据分析（含年龄分布）────────────────────────────── */
  const analysis = useMemo<BuyerAnalysis>(() => {
    const colorDist: Record<string, number> = {};
    const styleDist: Record<string, number> = {};
    const genderDist: Record<string, number> = {};
    const vipDist: Record<string, number> = {};
    const ageDist: Record<string, number> = {};
    let totalAge = 0;
    let ageCount = 0;

    members.forEach((m) => {
      if (m.color_season) colorDist[m.color_season] = (colorDist[m.color_season] || 0) + 1;
      if (m.main_style) styleDist[m.main_style] = (styleDist[m.main_style] || 0) + 1;
      if (m.gender) genderDist[m.gender] = (genderDist[m.gender] || 0) + 1;
      if (m.vip_level) vipDist[m.vip_level] = (vipDist[m.vip_level] || 0) + 1;
    });

    return { totalMembers: members.length, colorDist, styleDist, genderDist, vipDist, ageDist, avgAge: ageCount > 0 ? Math.round(totalAge / ageCount) : 0 };
  }, [members]);

  /* ── 图表数据（含百分比）──────────────────────────────── */
  const colorChartData = useMemo(() =>
    Object.entries(analysis.colorDist)
      .map(([key, count]) => {
        const s = COLOR_SEASONS_PRO.find((c) => c.value === key);
        return {
          key,
          name: s ? `${s.label}(${s.group})` : key,
          count,
          pct: Math.round((count / Math.max(analysis.totalMembers, 1)) * 100),
          color: COLOR_SEASON_COLORS[key] || "#ccc",
        };
      })
      .sort((a, b) => b.count - a.count),
    [analysis.colorDist, analysis.totalMembers]
  );

  const styleChartData = useMemo(() =>
    Object.entries(analysis.styleDist)
      .map(([key, count]) => ({
        key,
        name: getStyleProLabel(key) || key,
        count,
        pct: Math.round((count / Math.max(analysis.totalMembers, 1)) * 100),
      }))
      .sort((a, b) => b.count - a.count),
    [analysis.styleDist, analysis.totalMembers]
  );

  const genderChartData = useMemo(() => [
    { name: "女性", value: analysis.genderDist.female || 0, color: "#FF6B9D" },
    { name: "男性", value: analysis.genderDist.male || 0, color: "#4ECDC4" },
  ], [analysis.genderDist]);

  /* ── 预算估算 ─────────────────────────────────────────── */
  const estimatedBudget = useMemo(() => {
    const v = analysis.totalMembers;
    const h = (analysis.vipDist["钻石VIP"] || 0) + (analysis.vipDist["金牌VIP"] || 0);
    const avg = h > 0 ? 800 : 400;
    return Math.round(v * avg * 0.3 * 2.5);
  }, [analysis.totalMembers, analysis.vipDist]);

  /* ── 生成报告 ─────────────────────────────────────────── */
  const generateReport = async () => {
    if (!selectedStore || members.length === 0) return;
    setGenerating(true);
    const store = stores.find((s) => s.id === selectedStore);
    const memberSummary = {
      total: members.length,
      colorTop3: colorChartData.slice(0, 3).map((c) => ({ name: c.name, count: c.count, pct: c.pct })),
      styleTop3: styleChartData.slice(0, 3).map((s) => ({ name: s.name, count: s.count, pct: s.pct })),
      gender: analysis.genderDist,
      vip: analysis.vipDist,
      avgAge: analysis.avgAge,
      avgSpending: (analysis.vipDist["钻石VIP"] || 0) > 0 ? 800 : 500,
    };
    try {
      const res = await fetch("/api/generate-buyer-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: store?.name || "",
          memberSummary,
          allColors: colorChartData.map((c) => ({ key: c.key, name: c.name, count: c.count, pct: c.pct })),
          allStyles: styleChartData.map((s) => ({ key: s.key, name: s.name, count: s.count, pct: s.pct })),
          budgetInfo: {
            estimatedBudget,
            userBudget: budgetInput ? parseInt(budgetInput) : null,
          },
        }),
      });
      const data = await res.json();
      if (data.report) setReport(data.report);
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  /* ── 导出 CSV ─────────────────────────────────────────── */
  const exportReportToCSV = () => {
    if (!report) return;
    const rows = [
      ["字段", "内容"],
      ["报告标题", report.title],
      ["总结", report.summary],
      [""], ["=== 色彩企划 ==="],
      ...(report.colorPlan || []).map((p) => [`${p.label}`, `${p.percentage}% — ${p.rationale}`]),
      [""], ["=== 风格企划 ==="],
      ...(report.stylePlan || []).map((p) => [`${p.label}`, `${p.percentage}% — ${p.rationale}`]),
      [""], ["=== 尺码比例 ==="],
      ...(report.sizePlan || []).map((p) => [`${p.size}`, `${p.percentage}% — ${p.rationale}`]),
      [""], ["=== KPI目标 ==="],
      ["售罄率目标", `${report.kpiTargets?.sellThroughRate ?? "-"}%`],
      ["库存周转天数", `${report.kpiTargets?.inventoryTurnoverDays ?? "-"}天`],
      ["连带率目标", `${report.kpiTargets?.attachmentRate ?? "-"}`],
    ];
    const csv = "\uFEFF" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `买手企划_${storeName()}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const storeName = () => stores.find((s) => s.id === selectedStore)?.name || "未知店铺";

  /* ═══════════════════════════════════════════════════
     渲染
     ═══════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── 头部 ──────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">店铺买手决策中心</h1>
            <p className="text-sm text-gray-500 mt-1">SPA 模式 · 基于 VIP 会员数据驱动的智能买手企划系统</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[240px]"
            >
              <option value="">选择店铺...</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ""}</option>
              ))}
            </select>
            {selectedStore && members.length > 0 && (
              <button
                onClick={generateReport}
                disabled={generating}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "生成中..." : "AI 生成买手企划"}
              </button>
            )}
          </div>
        </div>

        {/* ── 预算设置（生成前显示）────────────────────── */}
        {selectedStore && members.length > 0 && !report && !generating && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              采购预算设置（可选）
            </h3>
            <p className="text-xs text-gray-400 mb-3">系统推荐预算：¥{estimatedBudget.toLocaleString()}（根据 VIP 消费力自动推算）</p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">自定义预算</span>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder={`默认：¥${estimatedBudget}`}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-xs text-gray-400">元</span>
            </div>
          </div>
        )}

        {/* ── VIP 会员画像分析 ─────────────────────────── */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            VIP 会员画像分析
            {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          </h2>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">加载会员数据中...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">该店铺暂无 VIP 会员数据</p>
              <p className="text-xs text-gray-400 mt-1">请先前往「客户管理」录入会员信息</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 色彩分布 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4">VIP 色彩季型分布 <span className="text-xs font-normal text-gray-400 ml-auto">{members.length}人</span></h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={colorChartData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => [`${v}人（${colorChartData.find(d => d.count === v)?.pct ?? 0}%）`, ""]} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {colorChartData.map((entry, i) => (
                          <Cell key={entry.key} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 风格分布 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4">VIP 风格分布</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={styleChartData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => [`${v}人（${styleChartData.find(d => d.count === v)?.pct ?? 0}%）`, ""]} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#45B7D1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 性别 + VIP 等级 */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">性别比例</h3>
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width={120} height={120}>
                      <RePieChart>
                        <Pie data={genderChartData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                          {genderChartData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                        </Pie>
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-1">
                      {genderChartData.map((g) => (
                        <div key={g.name} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                            {g.name}
                          </span>
                          <span className="font-semibold">{g.value}人</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">VIP 等级结构</h3>
                  <div className="space-y-2">
                    {Object.entries(analysis.vipDist).sort((a, b) => b[1] - a[1]).map(([level, count]) => (
                      <div key={level} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{level}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(count / members.length) * 100}%` }} />
                          </div>
                          <span className="font-semibold w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 买手报告 ──────────────────────────────────── */}
        {report && (
          <div className="space-y-4">

            {/* 报告头部 */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                AI 买手企划报告
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={exportReportToCSV} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> 导出 CSV
                </button>
                <span className="text-xs text-gray-400">{new Date().toLocaleDateString("zh-CN")} 生成</span>
              </div>
            </div>

            {/* 摘要 + KPI 目标 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-gray-800">{report.title}</h3>
                {report.totalBudget && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">建议采购预算</div>
                    <div className="text-lg font-bold text-blue-600">¥{report.totalBudget.toLocaleString()}</div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{report.summary}</p>

              {/* KPI 目标卡片 */}
              {report.kpiTargets && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: Percent, label: "售罄率目标", value: `${report.kpiTargets.sellThroughRate}%` },
                    { icon: TrendingDown, label: "库存周转目标", value: `${report.kpiTargets.inventoryTurnoverDays}天` },
                    { icon: ShoppingCart, label: "连带率目标", value: report.kpiTargets.attachmentRate },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white/80 rounded-xl p-4 text-center">
                      <kpi.icon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <div className="text-xl font-bold text-gray-800">{kpi.value}</div>
                      <div className="text-xs text-gray-500">{kpi.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 预算分配 */}
            {report.budgetAllocation && report.budgetAllocation.length > 0 && (
              <Section title="预算分配方案" icon={DollarSign} sectionKey="budget" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
                <div className="pt-4 space-y-3">
                  {report.budgetAllocation.map((a, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-32 font-semibold text-sm text-gray-700">{a.category}</div>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${a.percentage}%` }} />
                      </div>
                      <span className="text-sm font-bold text-blue-600 w-20 text-right">¥{a.amount.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 w-10">{a.percentage}%</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* 色彩企划 */}
            <Section title="色彩企划方案" icon={Palette} sectionKey="color" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
              <div className="pt-4 space-y-3">
                {report.colorPlan.map((p, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: COLOR_SEASON_COLORS[p.season] || PIE_COLORS[i] }}>
                      {p.percentage}%
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{p.label}</div>
                      <p className="text-xs text-gray-500 mt-1">{p.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 风格企划 */}
            <Section title="风格企划方案" icon={Sparkles} sectionKey="style" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.stylePlan.map((p, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-gray-800">{p.label}</span>
                      <span className="text-xs font-bold text-blue-600">{p.percentage}%</span>
                    </div>
                    <p className="text-xs text-gray-500">{p.rationale}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* 尺码比例 */}
            {report.sizePlan && report.sizePlan.length > 0 && (
              <Section title="尺码比例规划" icon={ShoppingCart} sectionKey="size" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
                <div className="pt-4 space-y-3">
                  {report.sizePlan.map((p, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-16 font-semibold text-sm text-gray-700">{p.size}</div>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${p.percentage}%` }} />
                      </div>
                      <span className="text-sm font-bold text-indigo-600 w-10 text-right">{p.percentage}%</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* 品类结构 */}
            <Section title="品类结构建议" icon={Layers} sectionKey="category" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
              <div className="pt-4 space-y-3">
                {report.categoryPlan.map((p, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-32 font-semibold text-sm text-gray-700">{p.category}</div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${p.percentage}%` }} />
                    </div>
                    <span className="text-sm font-bold text-blue-600 w-12 text-right">{p.percentage}%</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* 价格带 */}
            <Section title="价格带规划" icon={DollarSign} sectionKey="price" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
              <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {report.pricePlan.map((p, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-lg font-bold text-blue-600">{p.percentage}%</div>
                    <div className="text-sm font-semibold text-gray-800 mt-1">{p.range}</div>
                    <p className="text-xs text-gray-500 mt-1">{p.rationale}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* 采购时间轴 */}
            {report.procurementTimeline && report.procurementTimeline.length > 0 && (
              <Section title="采购时间轴" icon={Calendar} sectionKey="timeline" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
                <div className="pt-4">
                  <div className="relative border-l-2 border-blue-200 ml-4">
                    {report.procurementTimeline.map((t, i) => (
                      <div key={i} className="mb-6 ml-6">
                        <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] mt-1" />
                        <div className="text-xs font-bold text-blue-600">第{t.week}周</div>
                        <div className="text-sm font-semibold text-gray-800 mt-1">{t.action}</div>
                        <div className="text-xs text-gray-500">{t.items}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            )}

            {/* 陈列建议 */}
            <Section title="陈列分区建议" icon={LayoutGrid} sectionKey="display" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.displayAdvice.map((adv, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <div className="font-semibold text-sm text-gray-800 mb-2">{adv.zone}</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {adv.colors.map((c) => (
                        <span key={c} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{c}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {adv.styles.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{s}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">{adv.rationale}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* 关键行动 */}
            <Section title="关键行动建议" icon={Target} sectionKey="actions" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
              <div className="pt-4 space-y-3">
                {report.keyActions.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {a.priority}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-800">{a.action}</div>
                      <p className="text-xs text-gray-500 mt-1">预期效果：{a.expectedImpact}</p>
                      {a.cost && <p className="text-xs text-gray-400">预估成本：{a.cost}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 风险提示 */}
            {report.riskAlert && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> 风险提示
                </h3>
                <p className="text-sm text-amber-700 leading-relaxed">{report.riskAlert}</p>
              </div>
            )}
          </div>
        )}

        {/* ── 空状态引导 ────────────────────────────────── */}
        {selectedStore && !loading && members.length > 0 && !report && !generating && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">会员画像已分析完成</p>
            <p className="text-xs text-gray-400 mt-1">点击右上角「AI 生成买手企划」获取智能买手报告</p>
          </div>
        )}

      </div>
    </div>
  );
}

/* ── 可折叠 Section 子组件 ──────────────────────────────── */
function Section({ title, icon: Icon, sectionKey, expandedSection, setExpandedSection, children }: any) {
  const isOpen = expandedSection === sectionKey;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpandedSection(isOpen ? "" : sectionKey)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-700">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {isOpen && <div className="px-6 pb-6 border-t border-gray-50">{children}</div>}
    </div>
  );
}
