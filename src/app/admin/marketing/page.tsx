"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {  } from "next/navigation";
import {
  Loader2,
  Megaphone,
  Target,
  Users,
  Package,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Save,
  Sparkles,
  BarChart3,
} from "lucide-react";

interface Store {
  id: string;
  name: string;
  business_goals?: Record<string, any>;
}

const campaignTypes = [
  { value: "VIP召回", label: "VIP召回", desc: "唤醒沉睡VIP，提升复购率" },
  { value: "新品推广", label: "新品推广", desc: "新季新品上市推广" },
  { value: "清仓促销", label: "清仓促销", desc: "消化滞销库存" },
  { value: "节日营销", label: "节日营销", desc: "节日/纪念日主题营销" },
  { value: "会员日", label: "会员日", desc: "VIP专属权益活动" },
  { value: "综合营销", label: "综合营销", desc: "多目标综合方案" },
];

const seasons = ["春季", "夏季", "秋季", "冬季"];

export default function AdminMarketingPlanPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [season, setSeason] = useState("夏季");
  const [campaignType, setCampaignType] = useState("综合营销");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [dataSources, setDataSources] = useState<Record<string, any> | null>(null);
  const [storeGoals, setStoreGoals] = useState<Record<string, any> | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ budgetPlan: true, vipStrategies: true, timeline: true, productFocus: true });
  const [savedCampaigns, setSavedCampaigns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "saved">("generate");
  const [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  useEffect(() => {
    
fetchStores();
    fetchSavedCampaigns();
  }, []);
const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("id, name, business_goals").order("name");
    if (data) setStores(data);
  };

  const fetchSavedCampaigns = async () => {
    const { data } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .not("ai_report", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setSavedCampaigns(data);
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

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = async () => {
    if (!selectedStore) {
      alert("请选择店铺");
      return;
    }
    setLoading(true);
    setResult(null);
    setDataSources(null);

    try {
      const resp = await fetch("/api/generate-marketing-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: selectedStore,
          season,
          campaignType,
          budget: budget ? parseInt(budget) : undefined,
          notes,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        alert(err.error || "生成失败");
        return;
      }

      const data = await resp.json();
      setResult(data.report);
      setDataSources(data.dataSources);
    } catch (err: any) {
      alert("生成失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !selectedStore) return;

    const { error } = await supabase.from("marketing_campaigns").insert([{
      title: result.title || `${season}${campaignType}营销方案`,
      season,
      content: result.summary || "",
      store_id: selectedStore,
      campaign_type: campaignType,
      budget_amount: result.budgetPlan?.totalBudget || 0,
      expected_revenue: result.budgetPlan?.expectedRevenue || 0,
      expected_roi: result.budgetPlan?.expectedROI || 0,
      target_audience: result.targetAudience || {},
      data_sources: dataSources || {},
      ai_report: result,
      is_published: false,
    }]);

    if (error) {
      alert("保存失败: " + error.message);
      return;
    }
    alert("方案已保存！");
    fetchSavedCampaigns();
    setActiveTab("saved");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">营销策划</h1>
          <p className="text-muted-foreground mt-1">基于VIP画像+市场趋势+经营目标的精准营销方案</p>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "generate" ? "bg-accent text-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          <Sparkles className="w-4 h-4 inline mr-1" />AI生成方案
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "saved" ? "bg-accent text-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          <Save className="w-4 h-4 inline mr-1" />已保存方案 ({savedCampaigns.length})
        </button>
      </div>

      {activeTab === "generate" ? (
        <div className="space-y-6">
          {/* 输入区 */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">方案参数</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">选择店铺 <span className="text-red-500">*</span></label>
                <select
                  value={selectedStore}
                  onChange={(e) => handleStoreChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">选择店铺</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">季节</label>
                <div className="flex gap-2">
                  {seasons.map(s => (
                    <button key={s} type="button" onClick={() => setSeason(s)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${season === s ? "bg-accent text-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">活动类型</label>
                <div className="flex flex-wrap gap-2">
                  {campaignTypes.map(ct => (
                    <button key={ct.value} type="button" onClick={() => setCampaignType(ct.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${campaignType === ct.value ? "bg-accent text-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`} title={ct.desc}>{ct.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">活动预算（元）</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="留空则按店铺目标自动计算"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-primary mb-2">补充说明</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                placeholder="如：即将到来的节日、特定活动需求等"
              />
            </div>

            {/* 经营目标预览 */}
            {storeGoals && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1"><Target className="w-4 h-4" />店铺经营目标</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {storeGoals.annual_revenue_target && <div><span className="text-blue-600">年度业绩：</span>¥{storeGoals.annual_revenue_target.toLocaleString()}</div>}
                  {storeGoals.quarterly_revenue_target && <div><span className="text-blue-600">季度业绩：</span>¥{storeGoals.quarterly_revenue_target.toLocaleString()}</div>}
                  {storeGoals.gross_margin_target && <div><span className="text-blue-600">毛利率目标：</span>{(storeGoals.gross_margin_target * 100).toFixed(0)}%</div>}
                  {storeGoals.sell_through_target && <div><span className="text-blue-600">售罄率目标：</span>{(storeGoals.sell_through_target * 100).toFixed(0)}%</div>}
                  {storeGoals.attachment_rate_target && <div><span className="text-blue-600">连带率目标：</span>{storeGoals.attachment_rate_target}</div>}
                  {storeGoals.new_vip_target && <div><span className="text-blue-600">新增VIP：</span>{storeGoals.new_vip_target}人</div>}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={loading || !selectedStore}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />生成中（约30秒）</> : <><Sparkles className="w-4 h-4" />生成营销方案</>}
              </button>
            </div>
          </div>

          {/* 数据源概览 */}
          {dataSources && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <Users className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                <div className="text-2xl font-bold text-primary">{dataSources.vipCount}</div>
                <div className="text-xs text-muted-foreground">VIP客户</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <TrendingUp className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                <div className="text-2xl font-bold text-primary">{dataSources.trendItems}</div>
                <div className="text-xs text-muted-foreground">趋势数据</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <Package className="w-5 h-5 mx-auto text-green-500 mb-1" />
                <div className="text-2xl font-bold text-primary">{dataSources.inventorySKUs}</div>
                <div className="text-xs text-muted-foreground">库存SKU</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <BarChart3 className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                <div className="text-2xl font-bold text-primary">{dataSources.inventorySellThrough}%</div>
                <div className="text-xs text-muted-foreground">动销率</div>
              </div>
            </div>
          )}

          {/* 结果展示 */}
          {result && (
            <div className="space-y-4">
              {/* 概要 */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-bold text-primary">{result.title}</h2>
                  <button onClick={handleSave} className="btn-secondary flex items-center gap-1 text-sm"><Save className="w-3.5 h-3.5" />保存方案</button>
                </div>
                <p className="text-gray-600">{result.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">{result.campaignType}</span>
                  {result.budgetPlan?.expectedROI && <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">预期ROI: {result.budgetPlan.expectedROI}x</span>}
                  {result.budgetPlan?.expectedRevenue && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">预期营收: ¥{result.budgetPlan.expectedRevenue?.toLocaleString()}</span>}
                </div>
              </div>

              {/* 目标客群 */}
              {result.targetAudience && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-primary mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" />目标客群</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{result.targetAudience.primarySegment}</p>
                      <div className="flex flex-wrap gap-1">
                        {(result.targetAudience.colorSeasons || []).map((cs: string) => (
                          <span key={cs} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{cs}</span>
                        ))}
                        {(result.targetAudience.styles || []).map((st: string) => (
                          <span key={st} className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded text-xs">{st}</span>
                        ))}
                        {(result.targetAudience.spendingBands || []).map((sb: string) => (
                          <span key={sb} className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">{sb}</span>
                        ))}
                      </div>
                    </div>
                    {result.targetAudience.estimatedReach > 0 && (
                      <div className="text-center">
                        <div className="text-3xl font-bold text-accent">{result.targetAudience.estimatedReach}</div>
                        <div className="text-xs text-muted-foreground">预计触达人数</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 预算计划 */}
              {result.budgetPlan && (
                <CollapsibleSection title="预算计划" icon={DollarSign} color="green" expanded={expandedSections.budgetPlan} onToggle={() => toggleSection("budgetPlan")}>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-700">¥{(result.budgetPlan.totalBudget || 0).toLocaleString()}</div>
                      <div className="text-xs text-green-600">总预算</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-700">¥{(result.budgetPlan.expectedRevenue || 0).toLocaleString()}</div>
                      <div className="text-xs text-blue-600">预期营收</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-700">{result.budgetPlan.expectedROI || 0}x</div>
                      <div className="text-xs text-purple-600">预期ROI</div>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100"><th className="text-left py-2 text-muted-foreground">预算项</th><th className="text-right py-2 text-muted-foreground">金额</th><th className="text-right py-2 text-muted-foreground">占比</th><th className="text-left py-2 text-muted-foreground">原因</th></tr></thead>
                    <tbody>
                      {(result.budgetPlan.allocation || []).map((item: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50"><td className="py-2 font-medium">{item.item}</td><td className="text-right">¥{(item.amount || 0).toLocaleString()}</td><td className="text-right">{item.percentage}</td><td className="text-gray-600">{item.rationale}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </CollapsibleSection>
              )}

              {/* VIP策略 */}
              {result.vipStrategies && (
                <CollapsibleSection title="VIP分层策略" icon={Users} color="purple" expanded={expandedSections.vipStrategies} onToggle={() => toggleSection("vipStrategies")}>
                  <div className="space-y-3">
                    {result.vipStrategies.map((vs: any, i: number) => (
                      <div key={i} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-primary">{vs.segment}</span>
                          <div className="flex gap-3 text-xs">
                            {vs.expectedConversionRate && <span className="text-blue-600">转化率 {vs.expectedConversionRate}</span>}
                            {vs.expectedRevenue && <span className="text-green-600">¥{vs.expectedRevenue?.toLocaleString()}</span>}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{vs.strategy}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* 时间线 */}
              {result.timeline && (
                <CollapsibleSection title="执行时间线" icon={Calendar} color="blue" expanded={expandedSections.timeline} onToggle={() => toggleSection("timeline")}>
                  <div className="space-y-3">
                    {result.timeline.map((phase: any, i: number) => (
                      <div key={i} className="border-l-3 border-accent pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-primary">{phase.phase}</span>
                          <span className="text-xs text-muted-foreground">{phase.days}</span>
                          {phase.budget > 0 && <span className="text-xs text-green-600">预算 ¥{phase.budget?.toLocaleString()}</span>}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">{(phase.actions || []).join(" → ")}</div>
                        {phase.kpis && <div className="text-xs text-accent">KPI: {(phase.kpis || []).join("、")}</div>}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* 推广品类 */}
              {result.productFocus && (
                <CollapsibleSection title="推广品类重点" icon={Package} color="orange" expanded={expandedSections.productFocus} onToggle={() => toggleSection("productFocus")}>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100"><th className="text-left py-2 text-muted-foreground">品类</th><th className="text-left py-2 text-muted-foreground">策略</th><th className="text-left py-2 text-muted-foreground">原因</th><th className="text-center py-2 text-muted-foreground">优先级</th></tr></thead>
                    <tbody>
                      {result.productFocus.map((pf: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 font-medium">{pf.category}</td>
                          <td className="text-gray-600">{pf.strategy}</td>
                          <td className="text-gray-500 text-xs">{pf.reason}</td>
                          <td className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${pf.priority === "高" ? "bg-red-50 text-red-700" : pf.priority === "中" ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-700"}`}>{pf.priority}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CollapsibleSection>
              )}

              {/* 风险 */}
              {result.riskMitigation && result.riskMitigation.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-primary mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />风险与应对</h3>
                  <div className="space-y-2">
                    {result.riskMitigation.map((r: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${r.probability === "高" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{r.probability}</span>
                        <div><div className="text-sm font-medium text-amber-900">{r.risk}</div><div className="text-xs text-amber-700">{r.mitigation}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 已保存方案列表 */
        <div className="space-y-4">
          {savedCampaigns.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">暂无已保存的营销方案</p>
            </div>
          ) : (
            savedCampaigns.map(campaign => (
              <div key={campaign.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-primary">{campaign.title}</h3>
                    <div className="flex gap-2 mt-1">
                      {campaign.season && <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs">{campaign.season}</span>}
                      {campaign.campaign_type && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{campaign.campaign_type}</span>}
                      {campaign.budget_amount > 0 && <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">预算 ¥{campaign.budget_amount?.toLocaleString()}</span>}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${campaign.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{campaign.is_published ? "已发布" : "草稿"}</span>
                </div>
                {campaign.content && <p className="text-sm text-gray-600 mt-2">{campaign.content}</p>}
                <div className="text-xs text-muted-foreground mt-2">{new Date(campaign.created_at).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ============ 可折叠区域组件 ============ */
function CollapsibleSection({ title, icon: Icon, color, expanded, onToggle, children }: {
  title: string; icon: any; color: string; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-500", green: "text-green-500", purple: "text-purple-500", orange: "text-orange-500", red: "text-red-500",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${colorMap[color] || "text-gray-500"}`} /><span className="font-semibold text-primary">{title}</span></div>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
