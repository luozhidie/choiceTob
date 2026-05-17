"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Store, TrendingUp, BarChart3, Users, Palette,
  Sparkles, ShoppingBag, DollarSign, ArrowRight, Loader2,
  Lightbulb, Target, Layers, LayoutGrid, Eye, Package, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, FileText, Download,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from "recharts";
import {
  FEMALE_STYLES, MALE_STYLES, COLOR_SEASONS_PRO, COLOR_SEASON_COLORS,
  getStyleProLabel, getColorSeasonProLabel, STYLE_PRO_MAP,
} from "@/lib/styles";

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
}

interface BuyerReport {
  id?: string;
  title: string;
  summary: string;
  colorPlan: { season: string; label: string; percentage: number; rationale: string }[];
  stylePlan: { style: string; label: string; percentage: number; rationale: string }[];
  categoryPlan: { category: string; percentage: number; rationale: string }[];
  pricePlan: { range: string; percentage: number; rationale: string }[];
  displayAdvice: { zone: string; colors: string[]; styles: string[]; rationale: string }[];
  keyActions: { priority: number; action: string; expectedImpact: string }[];
  riskAlert?: string;
}

const PIE_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F0B27A", "#82E0AA",
];

export default function StoreBuyerPage() {
  const supabase = createClient();
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [members, setMembers] = useState<VipMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<BuyerReport | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>("color");
  const [historyReports, setHistoryReports] = useState<BuyerReport[]>([]);

  /* 加载店铺列表 */
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("id, name, city, district").order("name");
    if (data) setStores(data);
  };

  /* 加载选中店铺的VIP会员 */
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

  /* 数据分析 */
  const analysis = useMemo<BuyerAnalysis>(() => {
    const colorDist: Record<string, number> = {};
    const styleDist: Record<string, number> = {};
    const genderDist: Record<string, number> = {};
    const vipDist: Record<string, number> = {};

    members.forEach((m) => {
      if (m.color_season) colorDist[m.color_season] = (colorDist[m.color_season] || 0) + 1;
      if (m.main_style) styleDist[m.main_style] = (styleDist[m.main_style] || 0) + 1;
      if (m.gender) genderDist[m.gender] = (genderDist[m.gender] || 0) + 1;
      if (m.vip_level) vipDist[m.vip_level] = (vipDist[m.vip_level] || 0) + 1;
    });

    return { totalMembers: members.length, colorDist, styleDist, genderDist, vipDist };
  }, [members]);

  /* 图表数据 */
  const colorChartData = useMemo(() => {
    return Object.entries(analysis.colorDist)
      .map(([key, count]) => {
        const season = COLOR_SEASONS_PRO.find((c) => c.value === key);
        return {
          key,
          name: season ? `${season.label}(${season.group})` : key,
          count,
          color: COLOR_SEASON_COLORS[key] || "#ccc",
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [analysis.colorDist]);

  const styleChartData = useMemo(() => {
    return Object.entries(analysis.styleDist)
      .map(([key, count]) => ({
        key,
        name: getStyleProLabel(key) || key,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [analysis.styleDist]);

  const genderChartData = useMemo(() => [
    { name: "女性", value: analysis.genderDist.female || 0, color: "#FF6B9D" },
    { name: "男性", value: analysis.genderDist.male || 0, color: "#4ECDC4" },
  ], [analysis.genderDist]);

  /* 生成买手报告 */
  const generateReport = async () => {
    if (!selectedStore || members.length === 0) return;
    setGenerating(true);

    const store = stores.find((s) => s.id === selectedStore);

    // 构建会员数据摘要
    const memberSummary = {
      total: members.length,
      colorTop3: colorChartData.slice(0, 3).map((c) => ({ name: c.name, count: c.count, pct: Math.round((c.count / members.length) * 100) })),
      styleTop3: styleChartData.slice(0, 3).map((s) => ({ name: s.name, count: s.count, pct: Math.round((s.count / members.length) * 100) })),
      gender: analysis.genderDist,
      vip: analysis.vipDist,
    };

    try {
      const res = await fetch("/api/generate-buyer-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: store?.name || "",
          memberSummary,
          allColors: colorChartData.map((c) => ({ key: c.key, name: c.name, count: c.count })),
          allStyles: styleChartData.map((s) => ({ key: s.key, name: s.name, count: s.count })),
        }),
      });
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  /* 渲染会员画像卡片 */
  const MemberProfileCard = () => {
    if (members.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">该店铺暂无VIP会员数据</p>
          <p className="text-xs text-gray-400 mt-1">请先前往「客户管理」录入会员信息</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 色彩分布 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-accent" />
            会员色彩季型分布
            <span className="text-xs font-normal text-muted-foreground ml-auto">{members.length}人</span>
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={colorChartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v}人`, ""]} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {colorChartData.map((entry, index) => (
                    <Cell key={entry.key} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 风格分布 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            会员风格分布
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={styleChartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v}人`, ""]} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#45B7D1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 性别 + VIP */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-primary mb-3">性别比例</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={120} height={120}>
                <RePieChart>
                  <Pie data={genderChartData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                    {genderChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
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
            <h3 className="text-sm font-bold text-primary mb-3">VIP等级结构</h3>
            <div className="space-y-2">
              {Object.entries(analysis.vipDist).sort((a, b) => b[1] - a[1]).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{level}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${(count / members.length) * 100}%` }} />
                    </div>
                    <span className="font-semibold w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* 渲染买手报告 */
  const ReportSection = ({ title, icon: Icon, sectionKey, children }: any) => {
    const isOpen = expandedSection === sectionKey;
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setExpandedSection(isOpen ? "" : sectionKey)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-accent" />
            </div>
            <h3 className="font-bold text-primary">{title}</h3>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {isOpen && <div className="px-6 pb-6 border-t border-gray-50">{children}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">店铺买手决策中心</h1>
            <p className="text-sm text-muted-foreground mt-1">基于VIP会员数据驱动的智能买手企划系统</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 min-w-[240px]"
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
                className="px-5 py-2.5 bg-accent text-primary rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "生成中..." : "AI生成买手企划"}
              </button>
            )}
          </div>
        </div>

        {/* 会员画像 */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent" />
            会员画像分析
          </h2>
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
              <p className="text-sm text-gray-500">加载会员数据中...</p>
            </div>
          ) : (
            <MemberProfileCard />
          )}
        </div>

        {/* 买手报告 */}
        {report && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                AI买手企划报告
              </h2>
              <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString("zh-CN")} 生成</span>
            </div>

            {/* 报告摘要 */}
            <div className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-2xl border border-accent/10 p-6">
              <h3 className="font-bold text-primary mb-2">{report.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
            </div>

            {/* 色彩企划 */}
            <ReportSection title="色彩企划方案" icon={Palette} sectionKey="color">
              <div className="pt-4 space-y-3">
                {report.colorPlan.map((plan, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: COLOR_SEASON_COLORS[plan.season] || PIE_COLORS[i] }}>
                      {plan.percentage}%
                    </div>
                    <div>
                      <div className="font-semibold text-primary text-sm">{plan.label}</div>
                      <p className="text-xs text-muted-foreground mt-1">{plan.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* 风格企划 */}
            <ReportSection title="风格企划方案" icon={Sparkles} sectionKey="style">
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.stylePlan.map((plan, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-primary text-sm">{plan.label}</span>
                      <span className="text-xs font-bold text-accent">{plan.percentage}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.rationale}</p>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* 品类企划 */}
            <ReportSection title="品类结构建议" icon={Layers} sectionKey="category">
              <div className="pt-4 space-y-3">
                {report.categoryPlan.map((plan, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-32 font-semibold text-sm text-primary">{plan.category}</div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${plan.percentage}%` }} />
                    </div>
                    <span className="text-sm font-bold text-accent w-12 text-right">{plan.percentage}%</span>
                    <p className="text-xs text-muted-foreground flex-1">{plan.rationale}</p>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* 价格带 */}
            <ReportSection title="价格带规划" icon={DollarSign} sectionKey="price">
              <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {report.pricePlan.map((plan, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-lg font-bold text-accent">{plan.percentage}%</div>
                    <div className="text-sm font-semibold text-primary mt-1">{plan.range}</div>
                    <p className="text-xs text-muted-foreground mt-1">{plan.rationale}</p>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* 陈列建议 */}
            <ReportSection title="陈列分区建议" icon={LayoutGrid} sectionKey="display">
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.displayAdvice.map((adv, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <div className="font-semibold text-primary text-sm mb-2">{adv.zone}</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {adv.colors.map((c) => (
                        <span key={c} className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">{c}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {adv.styles.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{s}</span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{adv.rationale}</p>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* 关键行动 */}
            <ReportSection title="关键行动建议" icon={Target} sectionKey="actions">
              <div className="pt-4 space-y-3">
                {report.keyActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-accent text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {action.priority}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-primary text-sm">{action.action}</div>
                      <p className="text-xs text-muted-foreground mt-1">预期效果：{action.expectedImpact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ReportSection>
          </div>
        )}

        {/* 空状态 */}
        {selectedStore && !loading && members.length > 0 && !report && !generating && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">会员画像已分析完成</p>
            <p className="text-xs text-gray-400 mt-1">点击右上角「AI生成买手企划」获取智能买手报告</p>
          </div>
        )}
      </div>
    </div>
  );
}
