"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Headphones,
  Target,
  Users,
  Package,
  TrendingUp,
  Save,
  Sparkles,
  BarChart3,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  MessageSquare,
  DollarSign,
} from "lucide-react";

interface Store { id: string; name: string; business_goals?: Record<string, any>; }

const serviceCategories = ["综合销售策略", "话术培训", "VIP服务", "连带提升", "复购激活"];
const seasons = ["春季", "夏季", "秋季", "冬季"];

export default function AdminSalesPlanPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [season, setSeason] = useState("夏季");
  const [serviceCategory, setServiceCategory] = useState("综合销售策略");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [dataSources, setDataSources] = useState<Record<string, any> | null>(null);
  const [storeGoals, setStoreGoals] = useState<Record<string, any> | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ vipStrategies: true, salesScripts: true, productMatrix: true });
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "saved">("generate");
  const router = useRouter();
  const supabase = createClient();

  // middleware 已验证管理员身份

  const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("id, name").order("name");
    if (data) setStores(data);
  };

  const handleStoreChange = (storeId: string) => {
    setSelectedStore(storeId);
    const store = stores.find(s => s.id === storeId);
    if (store?.business_goals && Object.keys(store.business_goals).length > 0) {
      setStoreGoals(store.business_goals);
    } else {
      setStoreGoals(null);
    }
  };

  const fetchSaved = async () => {
    const { data } = await supabase
      .from("sales_services")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setSavedPlans(data);
  };

  useEffect(() => { fetchStores(); fetchSaved(); }, []);


  const toggle = (k: string) => setExpanded(p => ({ ...p, [k]: !p[k] }));

  const handleGenerate = async () => {
    if (!selectedStore) { alert("请选择店铺"); return; }
    setLoading(true); setResult(null); setDataSources(null);
    try {
      const resp = await fetch("/api/generate-sales-plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: selectedStore, season, serviceCategory, notes }),
      });
      if (!resp.ok) { const e = await resp.json(); alert(e.error || "生成失败"); return; }
      const data = await resp.json();
      setResult(data.report); setDataSources(data.dataSources);
    } catch (e: any) { alert("生成失败: " + e.message); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!result || !selectedStore) return;
    const { error } = await supabase.from("sales_services").insert([{
      title: result.title || `${season}${serviceCategory}方案`,
      type: serviceCategory, price: 0,
      description: result.summary || "",
      store_id: selectedStore, service_category: serviceCategory, season,
      target_audience: result.targetAudience || {},
      data_sources: dataSources || {}, ai_report: result, is_published: false,
    }]);
    if (error) { alert("保存失败: " + error.message); return; }
    alert("方案已保存！"); fetchSaved(); setActiveTab("saved");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">销售服务</h1>
        <p className="text-muted-foreground mt-1">基于VIP画像+库存+经营目标的精准销售策略</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab("generate")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "generate" ? "bg-accent text-primary" : "bg-gray-100 text-gray-700"}`}>
          <Sparkles className="w-4 h-4 inline mr-1" />AI生成方案
        </button>
        <button onClick={() => setActiveTab("saved")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "saved" ? "bg-accent text-primary" : "bg-gray-100 text-gray-700"}`}>
          <Save className="w-4 h-4 inline mr-1" />已保存 ({savedPlans.length})
        </button>
      </div>

      {activeTab === "generate" ? (
        <div className="space-y-6">
          {/* 输入 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">选择店铺 <span className="text-red-500">*</span></label>
                <select value={selectedStore} onChange={e => handleStoreChange(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20">
                  <option value="">选择店铺</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">季节</label>
                <div className="flex gap-2">{seasons.map(s => <button key={s} onClick={() => setSeason(s)} className={`px-4 py-2 rounded-lg text-sm font-medium ${season === s ? "bg-accent text-primary" : "bg-gray-100 text-gray-700"}`}>{s}</button>)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">服务类别</label>
                <div className="flex flex-wrap gap-2">{serviceCategories.map(c => <button key={c} onClick={() => setServiceCategory(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${serviceCategory === c ? "bg-accent text-primary" : "bg-gray-100 text-gray-700"}`}>{c}</button>)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">补充说明</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="特殊需求等" />
              </div>
            </div>

            {storeGoals && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-1 mb-1"><Target className="w-3.5 h-3.5 text-blue-600" /><span className="text-xs font-semibold text-blue-800">经营目标</span></div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {storeGoals.quarterly_revenue_target && <div><span className="text-blue-600">季度业绩：</span>¥{storeGoals.quarterly_revenue_target.toLocaleString()}</div>}
                  {storeGoals.gross_margin_target && <div><span className="text-blue-600">毛利率：</span>{(storeGoals.gross_margin_target * 100).toFixed(0)}%</div>}
                  {storeGoals.attachment_rate_target && <div><span className="text-blue-600">连带率：</span>{storeGoals.attachment_rate_target}</div>}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button onClick={handleGenerate} disabled={loading || !selectedStore} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />生成中（约30秒）</> : <><Sparkles className="w-4 h-4" />生成销售方案</>}
              </button>
            </div>
          </div>

          {/* 数据源 */}
          {dataSources && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <Users className="w-5 h-5 mx-auto text-blue-500 mb-1" /><div className="text-2xl font-bold">{dataSources.vipCount}</div><div className="text-xs text-muted-foreground">VIP客户</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <Package className="w-5 h-5 mx-auto text-green-500 mb-1" /><div className="text-2xl font-bold">{dataSources.inventorySKUs}</div><div className="text-xs text-muted-foreground">库存SKU</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <BarChart3 className="w-5 h-5 mx-auto text-purple-500 mb-1" /><div className="text-2xl font-bold">{dataSources.inventorySellThrough}%</div><div className="text-xs text-muted-foreground">动销率</div>
              </div>
            </div>
          )}

          {/* 结果 */}
          {result && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-bold text-primary">{result.title}</h2>
                  <button onClick={handleSave} className="btn-secondary flex items-center gap-1 text-sm"><Save className="w-3.5 h-3.5" />保存</button>
                </div>
                <p className="text-gray-600">{result.summary}</p>
              </div>

              {/* 销售诊断 */}
              {result.salesDiagnosis && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-primary mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-amber-500" />销售诊断</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-green-600 font-medium">优势</span><ul className="mt-1 space-y-1 text-gray-600">{(result.salesDiagnosis.currentStrengths || []).map((s: string, i: number) => <li key={i}>✓ {s}</li>)}</ul></div>
                    <div><span className="text-red-600 font-medium">短板</span><ul className="mt-1 space-y-1 text-gray-600">{(result.salesDiagnosis.currentWeaknesses || []).map((s: string, i: number) => <li key={i}>✗ {s}</li>)}</ul></div>
                  </div>
                  {result.salesDiagnosis.opportunityGap && <p className="mt-3 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">{result.salesDiagnosis.opportunityGap}</p>}
                </div>
              )}

              {/* KPI目标 */}
              {result.kpisAndTargets && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-primary mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-500" />KPI目标与差距</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(result.kpisAndTargets).map(([key, val]: [string, any]) => (
                      <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">{key === "conversionRate" ? "成交率" : key === "attachmentRate" ? "连带率" : key === "avgOrderValue" ? "客单价" : key === "repurchaseRate" ? "复购率" : "VIP激活率"}</div>
                        <div className="text-lg font-bold text-primary">{val.current || 0} → <span className="text-accent">{val.target || 0}</span></div>
                        {val.gap > 0 && <div className="text-xs text-red-500">差距: {val.gap}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIP策略 */}
              {result.vipServiceStrategies && (
                <Collapsible title="VIP分层服务策略" icon={Users} color="purple" open={expanded.vipStrategies} onToggle={() => toggle("vipStrategies")}>
                  <div className="space-y-3">
                    {result.vipServiceStrategies.map((vs: any, i: number) => (
                      <div key={i} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{vs.segment}</span>
                          <div className="flex gap-3 text-xs">{vs.expectedConversionRate && <span className="text-blue-600">转化率 {vs.expectedConversionRate}</span>}{vs.expectedAvgOrderValue > 0 && <span className="text-green-600">客单价 ¥{vs.expectedAvgOrderValue}</span>}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>接待：{vs.greetingStyle}</div><div>推荐：{vs.recommendationLogic}</div>
                          <div>连带：{vs.upsellStrategy}</div><div>跟进：{vs.followUpPlan}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Collapsible>
              )}

              {/* 话术 */}
              {result.salesScripts && (
                <Collapsible title="销售话术" icon={MessageSquare} color="blue" open={expanded.salesScripts} onToggle={() => toggle("salesScripts")}>
                  <div className="space-y-3">
                    {result.salesScripts.map((ss: any, i: number) => (
                      <div key={i} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2"><span className="font-semibold text-primary">{ss.scenario}</span><span className="text-xs text-muted-foreground">→ {ss.targetCustomer}</span></div>
                        <div className="space-y-2 text-sm">
                          {ss.openingLine && <div><span className="text-muted-foreground">开场：</span><span className="text-gray-700">{ss.openingLine}</span></div>}
                          {ss.recommendationScript && <div><span className="text-muted-foreground">推荐：</span><span className="text-gray-700">{ss.recommendationScript}</span></div>}
                          {ss.closingScript && <div><span className="text-muted-foreground">成交：</span><span className="text-gray-700">{ss.closingScript}</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Collapsible>
              )}

              {/* 推荐矩阵 */}
              {result.productRecommendationMatrix && (
                <Collapsible title="品类推荐矩阵" icon={Package} color="green" open={expanded.productMatrix} onToggle={() => toggle("productMatrix")}>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100"><th className="text-left py-2 text-muted-foreground">品类</th><th className="text-left py-2 text-muted-foreground">核心款</th><th className="text-left py-2 text-muted-foreground">搭配款</th><th className="text-left py-2 text-muted-foreground">升单款</th></tr></thead>
                    <tbody>
                      {result.productRecommendationMatrix.map((m: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 font-medium">{m.category}</td>
                          <td className="text-gray-600">{(m.coreItems || []).join("、")}</td>
                          <td className="text-gray-600">{(m.crossSellItems || []).join("、")}</td>
                          <td className="text-gray-600">{(m.upsellItems || []).join("、")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Collapsible>
              )}

              {/* 营收预测 */}
              {result.revenueProjection && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-primary mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" />营收预测</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg"><div className="text-xl font-bold text-green-700">¥{(result.revenueProjection.totalProjectedRevenue || 0).toLocaleString()}</div><div className="text-xs text-green-600">预测总营收</div></div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg"><div className="text-xl font-bold text-blue-700">¥{(result.revenueProjection.perVIPContribution || 0).toLocaleString()}</div><div className="text-xs text-blue-600">VIP贡献</div></div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg"><div className="text-xl font-bold text-amber-700">¥{(result.revenueProjection.gapToGoal || 0).toLocaleString()}</div><div className="text-xs text-amber-600">距目标差距</div></div>
                  </div>
                </div>
              )}

              {/* 库存联动 */}
              {result.inventoryLinkedActions && result.inventoryLinkedActions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-primary mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />库存联动动作</h3>
                  {result.inventoryLinkedActions.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm font-medium text-primary">{a.action}</span>
                      <span className="text-xs text-muted-foreground">{a.category} — {a.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {savedPlans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <Headphones className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-muted-foreground">暂无已保存方案</p>
            </div>
          ) : savedPlans.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-primary">{p.title}</h3>
                <span className={`px-2 py-1 rounded text-xs ${p.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{p.is_published ? "已发布" : "草稿"}</span>
              </div>
              <div className="flex gap-2 mt-1">
                {p.season && <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs">{p.season}</span>}
                {p.service_category && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{p.service_category}</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-2">{new Date(p.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Collapsible({ title, icon: Icon, color, open, onToggle, children }: {
  title: string; icon: any; color: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  const cm: Record<string, string> = { blue: "text-blue-500", green: "text-green-500", purple: "text-purple-500", orange: "text-orange-500" };
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${cm[color] || "text-gray-500"}`} /><span className="font-semibold text-primary">{title}</span></div>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
