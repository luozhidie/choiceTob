"use client";

import { useState } from "react";
import {
  Search, TrendingUp, BarChart3, Palette, Tag, DollarSign,
  Shirt, Eye, Star, Zap, Download, Loader2, RefreshCw,
  Filter, Plus, Trash2, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ============ 类型定义 ============ */
interface TrendItem {
  id: string;
  name: string;
  platform: string;
  category: string;
  price_range: string;
  colors: string[];
  style: string;
  heat_score: number;     // 热度分 0-100
  sales_volume: string;    // 销量描述
  trend_type: "全网爆款" | "潜在爆款" | "爆款微调款" | "设计师款" | "原创款";
  source_url: string;
  image_url: string;
  keywords: string[];
  analysis?: string;
  suggestion?: string;
  created_at: string;
}

/* ============ 平台选项 ============ */
const platforms = [
  { value: "taobao", label: "淘宝/天猫" },
  { value: "jd", label: "京东" },
  { value: "pdd", label: "拼多多" },
  { value: "douyin", label: "抖音" },
  { value: "xiaohongshu", label: "小红书" },
  { value: "weibo", label: "微博" },
  { value: "wechat", label: "微信" },
  { value: "wholesale", label: "批发市场" },
  { value: "buyer_store", label: "买手店" },
  { value: "niche_brand", label: "小众品牌" },
  { value: "luxury", label: "轻奢品牌" },
  { value: "designer", label: "设计师品牌" },
];

const trendTypes = ["全网爆款", "潜在爆款", "爆款微调款", "设计师款", "原创款"];
const categories = ["女装", "男装", "配饰", "鞋靴", "包袋"];
const styles = ["休闲", "通勤", "法式", "韩系", "国潮", "极简", "复古", "甜美", "街头", "优雅", "运动"];

/* ============ 模拟爆款数据 ============ */
function generateMockData(keyword: string, count: number): TrendItem[] {
  const results: TrendItem[] = [];
  const colorSets = [
    ["黑色", "白色", "灰色"],
    ["米白", "卡其", "驼色"],
    ["粉色", "蓝色", "绿色"],
    ["红色", "酒红", "焦糖"],
    ["藏青", "墨绿", "棕色"],
  ];
  const priceRanges = ["0-100", "100-300", "300-500", "500-1000", "1000+"];

  for (let i = 0; i < count; i++) {
    const heatScore = Math.floor(Math.random() * 60) + 40;
    const trendType = heatScore >= 80 ? "全网爆款" : heatScore >= 65 ? "潜在爆款" : "爆款微调款";
    results.push({
      id: `trend_${Date.now()}_${i}`,
      name: `${keyword}${["连衣裙", "西装外套", "针织衫", "衬衫", "阔腿裤", "风衣", "半裙", "卫衣", "马甲", "大衣"][i % 10]}`,
      platform: platforms[i % platforms.length].value,
      category: categories[i % categories.length],
      price_range: priceRanges[i % priceRanges.length],
      colors: colorSets[i % colorSets.length],
      style: styles[i % styles.length],
      heat_score: heatScore,
      sales_volume: heatScore >= 80 ? "10万+" : heatScore >= 65 ? "1-10万" : "1000-1万",
      trend_type: trendType,
      source_url: "#",
      image_url: "",
      keywords: [keyword, styles[i % styles.length], trendType],
      created_at: new Date().toISOString(),
    });
  }
  return results.sort((a, b) => b.heat_score - a.heat_score);
}

/* ============ 主页面 ============ */
export default function TrendCenterPage() {
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<TrendItem[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [savedItems, setSavedItems] = useState<TrendItem[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 搜索爆款
  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    setAnalysisResult("");

    // 模拟搜索延迟（实际生产中调用后端API）
    await new Promise(r => setTimeout(r, 1500));
    const mockData = generateMockData(keyword, 30);
    setResults(mockData);
    setSearching(false);
  };

  // AI分析
  const handleAnalyze = async () => {
    if (results.length === 0) return;
    setAnalyzing(true);

    await new Promise(r => setTimeout(r, 2000));

    const topStyles = results.reduce((acc, r) => { acc[r.style] = (acc[r.style] || 0) + 1; return acc; }, {} as Record<string, number>);
    const topColors = results.flatMap(r => r.colors).reduce((acc, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {} as Record<string, number>);
    const topCategories = results.reduce((acc, r) => { acc[r.category] = (acc[r.category] || 0) + 1; return acc; }, {} as Record<string, number>);
    const avgHeat = Math.round(results.reduce((s, r) => s + r.heat_score, 0) / results.length);

    const styleSorted = Object.entries(topStyles).sort((a, b) => b[1] - a[1]);
    const colorSorted = Object.entries(topColors).sort((a, b) => b[1] - a[1]);
    const catSorted = Object.entries(topCategories).sort((a, b) => b[1] - a[1]);

    const analysis = `## 爆款分析报告 — "${keyword}"

### 📊 整体热度
- 平均热度指数：**${avgHeat}/100**
- 全网爆款占比：**${results.filter(r => r.trend_type === "全网爆款").length}/${results.length}**
- 潜在爆款占比：**${results.filter(r => r.trend_type === "潜在爆款").length}/${results.length}**

### 🎨 热门风格排行
${styleSorted.map(([s, c], i) => `${i + 1}. **${s}** — 出现${c}次`).join("\n")}

### 🌈 热门颜色排行
${colorSorted.slice(0, 8).map(([c, n], i) => `${i + 1}. **${c}** — 出现${n}次`).join("\n")}

### 👗 品类分布
${catSorted.map(([c, n], i) => `${i + 1}. **${c}** — ${n}款`).join("\n")}

### 💡 爆款微调建议
1. **风格融合**：${styleSorted[0]?.[0]} + ${styleSorted[1]?.[0]} 跨风格混搭，打造差异化
2. **颜色策略**：主色${colorSorted[0]?.[0]} + 点缀${colorSorted[2]?.[0]}，提升视觉冲击力
3. **价格定位**：集中在${results[0]?.price_range}区间，符合大众消费预期
4. **面料升级**：在爆款基础上提升面料质感，增加溢价空间
5. **细节创新**：加入流行元素（如绑带、抽绳、不对称设计），增强辨识度

### 🔥 下季预测
- 风格方向：${styleSorted[0]?.[0]}持续走强，${styleSorted[2]?.[0]}有望成新趋势
- 色彩趋势：${colorSorted[0]?.[0]}系仍为主流，${colorSorted[3]?.[0]}可能成为下一季黑马
- 品类机会：${catSorted[0]?.[0]}赛道竞争激烈，${catSorted[1]?.[0]}存在蓝海空间`;

    setAnalysisResult(analysis);
    setAnalyzing(false);
  };

  // 收藏/取消收藏
  const toggleSave = (item: TrendItem) => {
    if (savedItems.find(s => s.id === item.id)) {
      setSavedItems(prev => prev.filter(s => s.id !== item.id));
    } else {
      setSavedItems(prev => [...prev, item]);
    }
  };

  // 导出报告
  const handleExport = () => {
    const content = analysisResult || results.map(r =>
      `${r.name}\t${r.platform}\t${r.category}\t${r.price_range}\t${r.colors.join("/")}\t${r.style}\t${r.heat_score}\t${r.trend_type}`
    ).join("\n");
    const headers = analysisResult ? "" : "名称\t平台\t品类\t价格区间\t颜色\t风格\t热度\t类型\n";
    const blob = new Blob(["\uFEFF" + headers + content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `爆款分析_${keyword}_${new Date().toLocaleDateString("zh-CN")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 筛选结果
  const filteredResults = results.filter(r => {
    if (filterType && r.trend_type !== filterType) return false;
    if (filterCategory && r.category !== filterCategory) return false;
    return true;
  });

  const displayItems = showSaved ? savedItems : filteredResults;

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
            <p className="text-muted-foreground mt-1">大数据分析全网爆款趋势，智能推荐微调方案</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaved(!showSaved)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${showSaved ? "bg-accent text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              已收藏 ({savedItems.length})
            </button>
            <button onClick={handleExport} disabled={results.length === 0}
              className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" /> 导出报告
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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
            <div className="text-xs text-muted-foreground mb-1">微调建议</div>
            <div className="text-2xl font-bold text-blue-500">{results.filter(r => r.trend_type === "爆款微调款").length}</div>
          </div>
        </div>

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
            <select value={selectedPlatform} onChange={e => setSelectedPlatform(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option value="">全部平台</option>
              {platforms.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button onClick={handleSearch} disabled={searching}
              className="btn-primary flex items-center gap-2 px-6">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {searching ? "采集中..." : "采集数据"}
            </button>
            <button onClick={handleAnalyze} disabled={analyzing || results.length === 0}
              className="btn-secondary flex items-center gap-2 px-6 bg-accent/10 text-accent border-accent/20 hover:bg-accent/20">
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analyzing ? "分析中..." : "AI分析"}
            </button>
          </div>

          {/* 快捷关键词 */}
          <div className="flex flex-wrap gap-2 mt-3">
            {["女装", "连衣裙", "春季新款", "韩系", "法式", "国潮", "通勤", "小众设计"].map(kw => (
              <button key={kw} onClick={() => { setKeyword(kw); }}
                className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600 hover:bg-accent/10 hover:text-accent transition-colors">
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* 筛选 */}
        {results.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
              <option value="">全部类型</option>
              {trendTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
              <option value="">全部品类</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="text-sm text-gray-400 self-center">
              共 {displayItems.length} 条数据
            </span>
          </div>
        )}

        {/* AI分析结果 */}
        {analysisResult && (
          <div className="bg-white rounded-xl border border-accent/20 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-primary">AI分析报告</h2>
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
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-accent">{item.heat_score}</span>
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary text-sm truncate">{item.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.trend_type === "全网爆款" ? "bg-red-100 text-red-700" :
                        item.trend_type === "潜在爆款" ? "bg-orange-100 text-orange-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {item.trend_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{item.category}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />¥{item.price_range}</span>
                      <span className="flex items-center gap-1"><Palette className="w-3 h-3" />{item.colors.join("/")}</span>
                      <span className="flex items-center gap-1"><Shirt className="w-3 h-3" />{item.style}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.sales_volume}</span>
                    </div>
                  </div>

                  {/* 操作 */}
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); toggleSave(item); }}
                      className={`p-2 rounded-lg ${savedItems.find(s => s.id === item.id) ? "text-accent bg-accent/10" : "text-gray-400 hover:text-accent hover:bg-accent/10"}`}>
                      <Star className="w-4 h-4" />
                    </button>
                    {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* 展开详情 */}
                {expandedId === item.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 mb-1">平台来源</div>
                        <div className="font-medium text-primary">{platforms.find(p => p.value === item.platform)?.label || item.platform}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">热度指数</div>
                        <div className="font-medium text-accent">{item.heat_score}/100</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">价格区间</div>
                        <div className="font-medium text-primary">¥{item.price_range}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">销量</div>
                        <div className="font-medium text-primary">{item.sales_volume}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <div className="text-gray-500 mb-1">关键词标签</div>
                      <div className="flex flex-wrap gap-1">
                        {item.keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">{kw}</span>
                        ))}
                      </div>
                    </div>
                    {item.trend_type === "爆款微调款" && (
                      <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm">
                        <div className="text-blue-700 font-medium mb-1">💡 微调建议</div>
                        <div className="text-blue-600">在原有爆款基础上，调整配色为今年流行色，升级面料质感，加入不对称剪裁细节，可提升30%溢价空间</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !searching && (
          <div className="text-center py-16">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">输入关键词开始采集爆款数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
