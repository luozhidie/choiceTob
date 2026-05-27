"use client";

import { useState } from "react";
import {
  Search, TrendingUp, BarChart3, Palette, Tag, DollarSign,
  Shirt, Eye, Star, Download, Loader2, RefreshCw,
  Filter, ChevronDown, ChevronUp, Sparkles, Globe, AlertCircle,
} from "lucide-react";

/* ============ 类型定义 ============ */
interface TrendItem {
  id: string;
  name: string;
  platform: string;
  category: string;
  price_range: string;
  colors: string[];
  style: string;
  heat_score: number;
  sales_volume: string;
  trend_type: string;
  source_url: string;
  image_url: string;
  keywords: string[];
  description: string;
}

interface CrawlStats {
  total: number;
  byPlatform: Record<string, number>;
  byType: Record<string, number>;
  topStyles: [string, number][];
  topColors: [string, number][];
  avgHeat: number;
}

/* ============ 数据源选项 ============ */
const sourceOptions = [
  { value: "general", label: "搜索引擎聚合", icon: Globe },
  { value: "taobao", label: "淘宝/天猫", icon: Tag },
  { value: "xiaohongshu", label: "小红书", icon: Eye },
  { value: "weibo", label: "微博", icon: TrendingUp },
  { value: "1688", label: "1688批发", icon: DollarSign },
];

const trendTypes = ["全网爆款", "潜在爆款", "爆款微调款", "设计师款", "原创款"];
const categories = ["女装", "男装", "配饰", "鞋靴", "包袋"];

/* ============ 主页面 ============ */
export default function TrendCenterPage() {
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<TrendItem[]>([]);
  const [stats, setStats] = useState<CrawlStats | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>(["general", "taobao", "xiaohongshu", "1688"]);
  const [filterType, setFilterType] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [savedItems, setSavedItems] = useState<TrendItem[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [crawlLog, setCrawlLog] = useState<string[]>([]);

  const addLog = (msg: string) => setCrawlLog(prev => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev].slice(0, 50));

  const toggleSource = (value: string) => {
    setSelectedSources(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  };

  // 真实爬取爆款数据
  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    setAnalysisResult("");
    setError("");
    setResults([]);
    setStats(null);
    addLog(`开始采集关键词: "${keyword}"`);
    addLog(`数据源: ${selectedSources.join(", ")}`);

    try {
      const resp = await fetch("/api/trend/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          sources: selectedSources,
        }),
      });

      const data = await resp.json();

      if (data.error) {
        setError(data.error);
        addLog(`采集出错: ${data.error}`);
      } else {
        const items = (data.items || []).map((item: any, i: number) => ({
          ...item,
          id: `trend_${Date.now()}_${i}`,
          category: item.category || keyword,
        }));

        setResults(items);
        setStats(data.stats || null);
        addLog(`采集完成: 共${items.length}条数据`);
        addLog(`平台分布: ${JSON.stringify(data.stats?.byPlatform || {})}`);

        if (items.length === 0) {
          addLog("⚠ 未采集到数据，可能被反爬限制，建议切换数据源或关键词");
        }
      }
    } catch (err: any) {
      setError(`网络请求失败: ${err.message}`);
      addLog(`请求失败: ${err.message}`);
    }

    setSearching(false);
  };

  // AI分析（调用DeepSeek）
  const handleAnalyze = async () => {
    if (results.length === 0) return;
    setAnalyzing(true);
    setAnalysisResult("");
    addLog("开始AI分析...");

    try {
      const resp = await fetch("/api/trend/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, items: results, stats }),
      });

      const data = await resp.json();
      if (data.error) {
        setError(data.error);
        addLog(`AI分析失败: ${data.error}`);
      } else {
        setAnalysisResult(data.analysis || "分析结果为空");
        addLog("AI分析完成");
      }
    } catch (err: any) {
      setError(`AI分析请求失败: ${err.message}`);
      addLog(`AI分析失败: ${err.message}`);
    }

    setAnalyzing(false);
  };

  const toggleSave = (item: TrendItem) => {
    if (savedItems.find(s => s.id === item.id)) {
      setSavedItems(prev => prev.filter(s => s.id !== item.id));
    } else {
      setSavedItems(prev => [...prev, item]);
    }
  };

  const handleExport = () => {
    const content = analysisResult || results.map(r =>
      `${r.name}\t${r.platform}\t${r.category}\t${r.price_range}\t${r.colors.join("/")}\t${r.style}\t${r.heat_score}\t${r.trend_type}\t${r.source_url}`
    ).join("\n");
    const headers = analysisResult ? "" : "名称\t平台\t品类\t价格区间\t颜色\t风格\t热度\t类型\t来源链接\n";
    const blob = new Blob(["\uFEFF" + headers + content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `爆款分析_${keyword}_${new Date().toLocaleDateString("zh-CN")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredResults = results.filter(r => {
    if (filterType && r.trend_type !== filterType) return false;
    if (filterPlatform && r.platform !== filterPlatform) return false;
    return true;
  });

  const displayItems = showSaved ? savedItems : filteredResults;

  // 平台列表（从结果中动态提取）
  const platformList = [...new Set(results.map(r => r.platform))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-accent" />
              爆款数据中心
            </h1>
            <p className="text-muted-foreground mt-1">真实互联网数据采集 + DeepSeek AI分析，挖掘全网爆款趋势</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaved(!showSaved)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${showSaved ? "bg-accent text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              已收藏 ({savedItems.length})
            </button>
            <button onClick={handleExport} disabled={results.length === 0 && !analysisResult}
              className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" /> 导出报告
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-muted-foreground mb-1">采集数据</div>
            <div className="text-2xl font-bold text-primary">{results.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-muted-foreground mb-1">全网爆款</div>
            <div className="text-2xl font-bold text-red-500">{results.filter(r => r.trend_type === "全网爆款").length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-muted-foreground mb-1">潜在爆款</div>
            <div className="text-2xl font-bold text-orange-500">{results.filter(r => r.trend_type === "潜在爆款").length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-muted-foreground mb-1">平均热度</div>
            <div className="text-2xl font-bold text-blue-500">{stats?.avgHeat || 0}</div>
          </div>
        </div>

        {/* 平台分布 */}
        {stats && Object.keys(stats.byPlatform).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
            <h3 className="text-sm font-bold text-primary mb-3">平台数据分布</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.byPlatform).sort((a, b) => b[1] - a[1]).map(([platform, count]) => (
                <div key={platform} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-primary">{platform}</span>
                  <span className="text-xs text-accent font-bold">{count}条</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 搜索栏 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="输入关键词搜索爆款（如：女装连衣裙、韩系外套、春季新款）"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm"
              />
            </div>
            <button onClick={handleSearch} disabled={searching || selectedSources.length === 0}
              className="btn-primary flex items-center gap-2 px-6 whitespace-nowrap">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {searching ? "采集中..." : "采集数据"}
            </button>
            <button onClick={handleAnalyze} disabled={analyzing || results.length === 0}
              className="btn-secondary flex items-center gap-2 px-6 bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 whitespace-nowrap">
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analyzing ? "分析中..." : "AI分析"}
            </button>
          </div>

          {/* 数据源选择 */}
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">选择数据源（可多选）：</div>
            <div className="flex flex-wrap gap-2">
              {sourceOptions.map(src => (
                <button
                  key={src.value}
                  onClick={() => toggleSource(src.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedSources.includes(src.value)
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <src.icon className="w-3 h-3" />
                  {src.label}
                </button>
              ))}
            </div>
          </div>

          {/* 快捷关键词 */}
          <div className="flex flex-wrap gap-2 mt-3">
            {["女装", "连衣裙", "春季新款", "韩系", "法式", "国潮", "通勤", "小众设计", "羽绒服", "西装"].map(kw => (
              <button key={kw} onClick={() => setKeyword(kw)}
                className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600 hover:bg-accent/10 hover:text-accent transition-colors">
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-700">采集异常</div>
              <div className="text-sm text-red-600 mt-1">{error}</div>
              <div className="text-xs text-red-500 mt-2">
                提示：部分平台有反爬机制，如未采集到数据，建议：1) 切换数据源 2) 更换关键词 3) 使用"搜索引擎聚合"
              </div>
            </div>
          </div>
        )}

        {/* 采集日志 */}
        {crawlLog.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 mb-6 max-h-40 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-green-400">采集日志</span>
              <button onClick={() => setCrawlLog([])} className="text-xs text-gray-500 hover:text-gray-300">清空</button>
            </div>
            {crawlLog.map((log, i) => (
              <div key={i} className="text-xs text-gray-400 font-mono leading-relaxed">{log}</div>
            ))}
          </div>
        )}

        {/* 筛选 */}
        {results.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
              <option value="">全部类型</option>
              {trendTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
              <option value="">全部平台</option>
              {platformList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <span className="text-sm text-gray-400 self-center">
              显示 {displayItems.length} / {results.length} 条
            </span>
          </div>
        )}

        {/* AI分析结果 */}
        {analysisResult && (
          <div className="bg-white rounded-xl border border-accent/20 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-primary">AI趋势分析报告</h2>
              <span className="text-xs text-muted-foreground">（基于真实爬取数据分析）</span>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {analysisResult}
            </div>
          </div>
        )}

        {/* 数据列表 */}
        {displayItems.length > 0 ? (
          <div className="space-y-3">
            {displayItems.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  {/* 热度 */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.heat_score >= 80 ? "bg-red-50" :
                    item.heat_score >= 60 ? "bg-orange-50" : "bg-blue-50"
                  }`}>
                    <span className={`text-lg font-bold ${
                      item.heat_score >= 80 ? "text-red-500" :
                      item.heat_score >= 60 ? "text-orange-500" : "text-blue-500"
                    }`}>{item.heat_score}</span>
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary text-sm truncate">{item.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        item.trend_type === "全网爆款" ? "bg-red-100 text-red-700" :
                        item.trend_type === "潜在爆款" ? "bg-orange-100 text-orange-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {item.trend_type}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full flex-shrink-0">{item.platform}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      {item.price_range && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />¥{item.price_range}</span>}
                      {item.colors.length > 0 && <span className="flex items-center gap-1"><Palette className="w-3 h-3" />{item.colors.join("/")}</span>}
                      {item.style && <span className="flex items-center gap-1"><Shirt className="w-3 h-3" />{item.style}</span>}
                      {item.sales_volume && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.sales_volume}</span>}
                    </div>
                  </div>

                  {/* 操作 */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); toggleSave(item); }}
                      className={`p-2 rounded-lg ${savedItems.find(s => s.id === item.id) ? "text-accent bg-accent/10" : "text-gray-400 hover:text-accent hover:bg-accent/10"}`}>
                      <Star className="w-4 h-4" />
                    </button>
                    {item.source_url && item.source_url !== "#" && (
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50">
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* 展开详情 */}
                {expandedId === item.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                    {item.description && (
                      <div className="mb-3 text-sm text-gray-600 line-clamp-3">{item.description}</div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 mb-1">平台来源</div>
                        <div className="font-medium text-primary">{item.platform}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">热度指数</div>
                        <div className="font-medium text-accent">{item.heat_score}/100</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">价格区间</div>
                        <div className="font-medium text-primary">{item.price_range || "未知"}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">销量</div>
                        <div className="font-medium text-primary">{item.sales_volume || "未知"}</div>
                      </div>
                    </div>
                    {item.keywords.length > 0 && (
                      <div className="mt-3 text-sm">
                        <div className="text-gray-500 mb-1">关键词</div>
                        <div className="flex flex-wrap gap-1">
                          {item.keywords.map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.image_url && (
                      <div className="mt-3">
                        <img src={item.image_url} alt={item.name} className="w-32 h-32 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !searching && results.length === 0 && !error && (
          <div className="text-center py-16">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">输入关键词开始采集真实互联网爆款数据</p>
            <p className="text-xs text-gray-400">数据来源：淘宝、小红书、微博、1688、搜索引擎聚合</p>
          </div>
        )}
      </div>
    </div>
  );
}
