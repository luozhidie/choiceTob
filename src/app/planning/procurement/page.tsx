"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COLOR_SEASONS_PRO, FEMALE_STYLES, MALE_STYLES, PRODUCT_CATEGORIES } from "@/lib/styles";
import { Package, BarChart3, Save, Sparkles, Trash2 } from "lucide-react";

const SEASON_KEYS = COLOR_SEASONS_PRO.map(c => c.value);
const STYLE_KEYS = [...FEMALE_STYLES.map(s => s.value), ...MALE_STYLES.map(s => s.value)];

const SEASON_LABELS: Record<string, string> = {};
COLOR_SEASONS_PRO.forEach(c => { SEASON_LABELS[c.value] = c.label; });

const STYLE_LABELS: Record<string, string> = {};
FEMALE_STYLES.forEach(s => { STYLE_LABELS[s.value] = s.label; });
MALE_STYLES.forEach(s => { STYLE_LABELS[s.value] = s.label; });

const EMPTY_CELL = { sku: 0, pct: 0, budget: 0 };

/** 获取当前用户 store_id */
async function fetchStoreId(supabase: any): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("store_id")
    .eq("id", user.id)
    .single();
  return data?.store_id || null;
}

/** 从数据库加载矩阵 */
async function loadMatrix(supabase: any, storeId: string): Promise<Record<string, any>> {
  const { data } = await supabase
    .from("product_matrix_plan")
    .select("matrix_data")
    .eq("store_id", storeId)
    .maybeSingle();
  if (data?.matrix_data) return data.matrix_data as Record<string, any>;
  // 返回空矩阵
  const empty: Record<string, any> = {};
  SEASON_KEYS.forEach(s => { empty[s] = {}; });
  return empty;
}

/** 保存矩阵到数据库 */
async function saveMatrix(supabase: any, storeId: string, matrix: Record<string, any>) {
  const { error } = await supabase
    .from("product_matrix_plan")
    .upsert({
      store_id: storeId,
      matrix_data: matrix,
      season_tag: "2025SS",
      updated_at: new Date().toISOString(),
    }, { onConflict: "store_id,season_tag" });
  return error;
}

export default function ProcurementMatrixPage() {
  const [matrix, setMatrix] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [genResult, setGenResult] = useState<any>(null);

  const supabase = createClient();

  // 初始化加载
  useEffect(() => {
    (async () => {
      const sid = await fetchStoreId(supabase);
      setStoreId(sid);
      if (sid) {
        const data = await loadMatrix(supabase, sid);
        setMatrix(data);
      }
      setLoading(false);
    })();
  }, []);

  // 计算汇总
  let totalSku = 0, totalBudget = 0, filledCells = 0;
  SEASON_KEYS.forEach(season => {
    STYLE_KEYS.forEach(style => {
      const cell = matrix[season]?.[style] || EMPTY_CELL;
      totalSku += cell.sku || 0;
      totalBudget += cell.budget || 0;
      if (cell.sku > 0) filledCells++;
    });
  });
  const totalCells = SEASON_KEYS.length * STYLE_KEYS.length;
  const coverage = Math.round((filledCells / totalCells) * 100);

  // 更新某个格子
  const updateCell = useCallback((season: string, style: string, field: string, value: number) => {
    setMatrix(prev => {
      const next = { ...prev };
      if (!next[season]) next[season] = {};
      if (!next[season][style]) next[season][style] = { ...EMPTY_CELL };
      next[season][style] = { ...next[season][style], [field]: value };
      return next;
    });
  }, []);

  // 保存
  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    setSaveMsg("");
    const err = await saveMatrix(supabase, storeId, matrix);
    setSaveMsg(err ? "保存失败：" + err.message : "✅ 保存成功！");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  // 生成采购清单
  const handleGenerate = async () => {
    if (!storeId) return;
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await fetch("/api/plan/generate-procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, season: "2025SS" }),
      });
      const data = await res.json();
      setGenResult(data);
    } catch (e: any) {
      setGenResult({ error: e.message });
    } finally {
      setGenerating(false);
    }
  };

  // 清空矩阵
  const handleClear = () => {
    if (!confirm("确认清空整个矩阵？")) return;
    const empty: Record<string, any> = {};
    SEASON_KEYS.forEach(s => { empty[s] = {}; });
    setMatrix(empty);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">加载中...</p>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">请先登录</p>
          <Link href="/login" className="text-accent hover:underline text-sm">去登录 →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 面包屑 */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <Link href="/planning" className="hover:text-primary">商品企划</Link>
            <span>/</span>
            <span className="text-primary font-medium">货盘组合</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-accent text-white py-10">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm mb-3">
            <Package className="w-4 h-4" /> 96格矩阵 · 货盘组合可视化
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">货盘组合规划</h1>
          <p className="text-white/70 text-sm">
            基于色彩季型 × 风格维度的96格矩阵，可视化你的货盘SKU分布与预算分配
          </p>
        </div>
      </section>

      {/* 汇总卡片 */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">总SKU数</p>
              <p className="text-3xl font-bold text-primary">{totalSku}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">总预算（元）</p>
              <p className="text-3xl font-bold text-accent">¥{totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">矩阵覆盖率</p>
              <p className="text-3xl font-bold text-green-600">{coverage}%</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">已填格子</p>
              <p className="text-3xl font-bold text-indigo-600">{filledCells}/{totalCells}</p>
            </div>
          </div>

          {/* 操作栏 */}
          <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-primary">96格矩阵详情</h2>
            <div className="flex gap-2">
              <button onClick={() => setViewMode("table")} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${viewMode === "table" ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200"}`}>表格</button>
              <button onClick={() => setViewMode("chart")} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${viewMode === "chart" ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200"}`}>图表</button>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3 mb-6 max-w-4xl mx-auto">
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              <Save className="w-4 h-4" /> {saving ? "保存中..." : "保存矩阵"}
            </button>
            <button onClick={handleGenerate} disabled={generating || totalSku === 0} className="px-5 py-2 bg-accent text-white text-sm font-bold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> {generating ? "生成中..." : "生成采购清单"}
            </button>
            <button onClick={handleClear} className="px-5 py-2 bg-white text-red-500 text-sm font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> 清空
            </button>
            {saveMsg && <span className="text-sm text-green-600 font-medium">{saveMsg}</span>}
          </div>

          {/* 表格视图 */}
          {viewMode === "table" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="px-3 py-3 text-left sticky left-0 bg-gray-50 z-10">色彩季型</th>
                    {STYLE_KEYS.map(style => (
                      <th key={style} className="px-2 py-3 text-center min-w-[70px]">{STYLE_LABELS[style]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SEASON_KEYS.map((season, idx) => (
                    <tr key={season} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2 font-medium text-primary sticky left-0 bg-inherit z-10">{SEASON_LABELS[season]}</td>
                      {STYLE_KEYS.map(style => {
                        const cell = matrix[season]?.[style] || EMPTY_CELL;
                        const hasData = cell.sku > 0;
                        return (
                          <td key={style} className="px-1 py-1">
                            <div className={`rounded-lg border text-center p-1 ${hasData ? "border-accent/30 bg-accent/5" : "border-gray-100 bg-gray-50/50"}`}>
                              <input
                                type="number"
                                min={0}
                                value={cell.sku}
                                onChange={e => updateCell(season, style, "sku", Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-center text-sm font-bold text-primary bg-transparent border-none outline-none"
                                placeholder="SKU"
                              />
                              <input
                                type="number"
                                min={0}
                                value={cell.budget}
                                onChange={e => updateCell(season, style, "budget", Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-center text-xs text-accent bg-transparent border-none outline-none"
                                placeholder="预算"
                              />
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={cell.pct}
                                onChange={e => updateCell(season, style, "pct", Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                                className="w-full text-center text-xs text-gray-400 bg-transparent border-none outline-none"
                                placeholder="%"
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 图表视图 */}
          {viewMode === "chart" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-4xl mx-auto">
              <h3 className="text-sm font-bold text-primary mb-4">各季型SKU分布</h3>
              <div className="space-y-3">
                {SEASON_KEYS.map(season => {
                  const seasonTotal = STYLE_KEYS.reduce((s, style) => s + (matrix[season]?.[style]?.sku || 0), 0);
                  const maxSku = Math.max(10, ...SEASON_KEYS.map(s => STYLE_KEYS.reduce((t, style) => t + (matrix[s]?.[style]?.sku || 0), 0)));
                  return (
                    <div key={season} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-16 shrink-0">{SEASON_LABELS[season]}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (seasonTotal / maxSku) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{seasonTotal} SKU</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 生成结果 */}
      {genResult && (
        <section className="pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-primary mb-4">📦 采购清单生成结果</h3>
              {genResult.error ? (
                <p className="text-sm text-red-500">{genResult.error}</p>
              ) : genResult.success ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">订单数</p>
                      <p className="text-2xl font-bold text-green-600">{genResult.orders?.length || 0}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">总款数</p>
                      <p className="text-2xl font-bold text-blue-600">{genResult.totalItems || 0}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">总金额（元）</p>
                      <p className="text-2xl font-bold text-amber-600">¥{(genResult.totalAmount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  {genResult.orders && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2">订单明细</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs text-gray-500">
                            <th className="px-3 py-2 text-left">订单号</th>
                            <th className="px-3 py-2 text-left">波段</th>
                            <th className="px-3 py-2 text-right">款数</th>
                            <th className="px-3 py-2 text-right">总金额</th>
                          </tr>
                        </thead>
                        <tbody>
                          {genResult.orders.map((o: any, i: number) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="px-3 py-2 font-mono text-xs">{o.order_no}</td>
                              <td className="px-3 py-2">{o.wave}</td>
                              <td className="px-3 py-2 text-right">{o.total_sku}</td>
                              <td className="px-3 py-2 text-right">¥{o.total_amount?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(genResult, null, 2)}</pre>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
