"use client";

import { useState, useEffect } from "react";
import {
  Search, TrendingUp, BarChart3, Palette, Tag, DollarSign,
  Shirt, Eye, Star, Download, Loader2, RefreshCw,
  Filter, ChevronDown, ChevronUp, Sparkles, Globe, AlertCircle,
  Info, ImageOff, ExternalLink,
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

interface CrawlResponse {
  keyword: string;
  items: TrendItem[];
  stats: CrawlStats;
  crawledAt: string;
  dataSource?: "demo" | "real";
  error?: string;
}

/* ============ 数据源选项（纯UI，不承诺真实性）============ */
const sourceOptions = [
  { value: "general", label: "搜索引擎", icon: Globe },
  { value: "taobao", label: "淘宝/天猫", icon: Tag },
  { value: "xiaohongshu", label: "小红书", icon: Eye },
  { value: "weibo", label: "微博", icon: TrendingUp },
  { value: "1688", label: "1688批发", icon: DollarSign },
];

const trendTypes = ["全网爆款", "潜在爆款", "爆款微调款", "设计师款", "原创款"];
const categories = ["女装", "男装", "配饰", "鞋靴", "包袋"];

/* ============ 工具函数 ============ */
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ============ 爆款卡片组件 ============ */
function TrendCard({
  item,
  isSaved,
  isExpanded,
  onToggleExpand,
  onToggleSave,
}: {
  item: TrendItem;
  isSaved: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleSave: () => void;
}) {
  const heatColor =
    item.heat_score >= 80 ? "text-red-500 bg-red-50" :
    item.heat_score >= 60 ? "text-orange-500 bg-orange-50" :
    "text-blue-500 bg-blue-50";

  const typeColor =
    item.trend_type === "全网爆款" ? "bg-red-100 text-red-700" :
    item.trend_type === "潜在爆款" ? "bg-orange-100 text-orange-700" :
    "bg-blue-100 text-blue-700";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-accent/30 transition-colors">
      {/* 主行 */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggleExpand}
      >
        {/* 热度分 */}
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg", heatColor)}>
          {item.heat_score}
        </div>

        {/* 图片缩略图 */}
        <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="w-5 h-5 text-gray-300" />
            </div>
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-primary text-sm truncate">{item.name}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0", typeColor)}>
              {item.trend_type}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />¥{item.price_range}</span>
            {item.colors.length > 0 && <span className="flex items-center gap-1"><Palette className="w-3 h-3" />{item.colors.join("/")}</span>}
            <span className="flex items-center gap-1"><Shirt className="w-3 h-3" />{item.style}</span>
            {item.sales_volume && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.sales_volume}</span>}
            <span className="text-gray-400">· {item.platform}</span>
          </div>
        </div>

        {/* 操作 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
            className={cn("p-2 rounded-lg transition-colors", isSaved ? "text-amber-500 bg-amber-50" : "text-gray-400 hover:text-amber-500 hover:bg-amber-50")}
            title={isSaved ? "取消收藏" : "收藏"}
          >
            <Star className={cn("w-4 h-4", isSaved && "fill-amber-500")} />
          </button>
          {item.source_url && item.source_url !== "#" && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              title="查看来源"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* 展开详情 */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-3">
          {item.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-gray-500 text-xs mb-0.5">平台</div>
              <div className="font-medium text-primary">{item.platform}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-0.5">热度</div>
              <div className="font-medium text-accent">{item.heat_score}/100</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-0.5">价格</div>
              <div className="font-medium text-primary">{item.price_range || "未知"}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-0.1">销量</div>
              <div className="font-medium text-primary">{item.sales_volume || "未知"}</div>
            </div>
          </div>

          {item.keywords.length > 0 && (
            <div>
              <div className="text-gray-500 text-xs mb-1">关键词</div>
              <div className="flex flex-wrap gap-1">
                {item.keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* 大图预览 */}
          {item.image_url && (
            <div>
              <div className="text-gray-500 text-xs mb-1">商品图片</div>
              <img
                src={item.image_url}
                alt={item.name}
                className="w-40 h-56 object-cover rounded-lg border border-gray-200"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [dataSource, setDataSource] = useState<"demo" | "real" | null>(null);
  const [crawlLog, setCrawlLog] = useState<string[]>([]);

  const addLog = (msg: string) => setCrawlLog(prev => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev].slice(0, 50));

  const toggleSource = (value: string) => {
    setSelectedSources(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  };

  // 采集数据
  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    setAnalysisResult("");
    setErrorMsg("");
    setResults([]);
    setStats(null);
    setDataSource(null);
    addLog(`开始: "${keyword}"`);

    try {
      const resp = await fetch("/api/trend/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), sources: selectedSources }),
      });

      const data: CrawlResponse = await resp.json();

      if (data.error) {
        setErrorMsg(data.error);
        addLog(`错误: ${data.error}`);
      } else {
        const items = (data.items || []).map((item: any, i: number) => ({
          ...item,
          id: `trend_${Date.now()}_${i}`,
          category: item.category || keyword,
        }));

        setResults(items);
        setStats(data.stats || null);
        setDataSource(data.dataSource || "real");
        addLog(`完成: ${items.length}条 | 来源:${data.dataSource === "demo" ? "演示数据" : "真实数据"}`);

        if (items.length === 0) {
          addLog("⚠ 无数据，建议换关键词");
        }
      }
    } catch (err: any) {
      setErrorMsg(`请求失败: ${err.message}`);
      addLog(`失败: ${err.message}`);
    }

    setSearching(false);
  };

  // AI分析
  const handleAnalyze = async () => {
    if (results.length === 0) return;
    setAnalyzing(true);
    setAnalysisResult("");
    setErrorMsg("");
    addLog("开始AI分析...");

    try {
      const resp = await fetch("/api/trend/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, items: results, stats }),
      });

      const data = await resp.json();
      if (data.error) {
        setErrorMsg(data.error);
        addLog(`分析失败: ${data.error}`);
      } else {
        setAnalysisResult(data.analysis || "无分析结果");
        addLog("分析完成");
      }
    } catch (err: any) {
      setErrorMsg(`分析请求失败: ${err.message}`);
      addLog(`分析失败: ${err.message}`);
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
    const headers = analysisResult ? "" : "名称\t平台\t品类\t价格\t颜色\t风格\t热度\t类型\t链接\n";
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
  const platformList = [...new Set(results.map(r => r.platform))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        {/* 标题区 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              爆款数据中心
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {dataSource === "demo" ? "演示模式 · 点击「采集数据」生成模拟爆款报告" : "采集全网爆款数据 + AI趋势分析"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaved(!showSaved)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", showSaved ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}
            >
              已收藏 ({savedItems.length})
            </button>
            <button onClick={handleExport} disabled={results.length === 0 && !analysisResult}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
              <Download className="w-4 h-4" /> 导出
            </button>
          </div>
        </div>

        {/* 演示数据提示 */}
        {dataSource === "demo" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-800">当前为演示数据</div>
              <div className="text-sm text-amber-700 mt-0.5">
                展示的是基于关键词生成的模拟爆款报告，用于功能演示。真实数据接入请咨询技术团队。
              </div>
            </div>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "数据量", value: results.length, color: "text-gray-900", bg: "bg-white" },
            { label: "全网爆款", value: results.filter(r => r.trend_type === "全网爆款").length, color: "text-red-500", bg: "bg-white" },
            { label: "潜在爆款", value: results.filter(r => r.trend_type === "潜在爆款").length, color: "text-orange-500", bg: "bg-white" },
            { label: "平均热度", value: stats?.avgHeat || 0, color: "text-blue-500", bg: "bg-white" },
          ].map((card, i) => (
            <div key={i} className={cn("rounded-xl border border-gray-100 p-4", card.bg)}>
              <div className="text-xs text-gray-500 mb-1">{card.label}</div>
              <div className={cn("text-2xl font-bold", card.color)}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* 平台分布 */}
        {stats && Object.keys(stats.byPlatform).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">平台分布</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.byPlatform).sort((a, b) => b[1] - a[1]).map(([platform, count]) => (
                <div key={platform} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{platform}</span>
                  <span className="text-xs text-blue-600 font-bold">{count}条</span>
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
                placeholder="输入关键词搜索（如：女装连衣裙、韩系外套、春季新款）"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              />
            </div>
            <button onClick={handleSearch} disabled={searching || selectedSources.length === 0}
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {searching ? "采集中..." : "采集数据"}
            </button>
            <button onClick={handleAnalyze} disabled={analyzing || results.length === 0}
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analyzing ? "分析中..." : "AI分析"}
            </button>
          </div>

          {/* 数据源选择（UI提示，不承诺真实性） */}
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">数据来源（演示模式，所有来源均生成模拟数据）：</div>
            <div className="flex flex-wrap gap-2">
              {sourceOptions.map(src => (
                <button
                  key={src.value}
                  onClick={() => toggleSource(src.value)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border", selectedSources.includes(src.value)
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  )}
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
                className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* 错误提示 */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-800">提示</div>
              <div className="text-sm text-red-700 mt-1">{errorMsg}</div>
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

        {/* 筛选栏 */}
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
              {displayItems.length} / {results.length} 条
            </span>
          </div>
        )}

        {/* AI分析结果 */}
        {analysisResult && (
          <div className="bg-white rounded-xl border border-purple-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">AI趋势分析报告</h2>
              <span className="text-xs text-gray-400">（模拟数据生成）</span>
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
              <TrendCard
                key={item.id}
                item={item}
                isSaved={savedItems.some(s => s.id === item.id)}
                isExpanded={expandedId === item.id}
                onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onToggleSave={() => toggleSave(item)}
              />
            ))}
          </div>
        ) : !searching && results.length === 0 && !errorMsg && (
          <div className="text-center py-16">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">输入关键词开始采集爆款数据</p>
            <p className="text-xs text-gray-400">支持品类：女装、男装、配饰等，或输入具体款式名称</p>
          </div>
        )}
      </div>
    </div>
  );
}
