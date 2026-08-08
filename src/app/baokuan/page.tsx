"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Search, Filter, BarChart3, TrendingUp, ShoppingBag, Store, MessageCircle } from "lucide-react";

// FCPSR编码体系
const FABRIC_CODES = [
  { code: "F01", name: "棉" }, { code: "F02", name: "丝" }, { code: "F03", name: "羊毛" },
  { code: "F04", name: "麻" }, { code: "F05", name: "化纤" }, { code: "F06", name: "混纺" },
  { code: "F07", name: "皮革" }, { code: "F08", name: "羽绒" }
];
const CUT_CODES = [
  { code: "C01", name: "修身" }, { code: "C02", name: "宽松" }, { code: "C03", name: "直筒" },
  { code: "C04", name: "A字" }, { code: "C05", name: "不规则" }
];
const PATTERN_CODES = [
  { code: "P01", name: "条纹" }, { code: "P02", name: "波点" }, { code: "P03", name: "碎花" },
  { code: "P04", name: "几何" }, { code: "P05", name: "纯色" }, { code: "P06", name: "格子" },
  { code: "P07", name: "字母" }, { code: "P08", name: "动物" }
];
const SEASON_CODES = [
  { code: "S01", name: "春浅" }, { code: "S02", name: "夏冷" }, { code: "S03", name: "秋深" },
  { code: "S04", name: "冬亮" }, { code: "S05", name: "中性" }
];

interface BaoKuanCase {
  id: string;
  case_id: string;
  source_platform: string;
  title: string;
  price: number;
  sales_volume: number;
  image_urls: string[];
  heat_score: number;
  competition_level: string;
  crawled_at: string;
  attr_fabric: string[];
  attr_cut: string[];
  attr_pattern: string[];
  attr_season_color: string[];
}

export default function BaoKuanPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [activePlatform, setActivePlatform] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedCuts, setSelectedCuts] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [cases, setCases] = useState<BaoKuanCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [crawling, setCrawling] = useState(false);

  const pageSize = 12;

  useEffect(() => {
    checkAuth();
    fetchCases();
  }, [activePlatform, page]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
    }
  };

  const fetchCases = async () => {
    setLoading(true);
    let query = supabase
      .from("bao_kuan_cases")
      .select("*", { count: "exact" });

    if (activePlatform !== "all") {
      query = query.eq("source_platform", activePlatform);
    }
    if (searchKeyword) {
      query = query.ilike("title", `%${searchKeyword}%`);
    }
    if (priceRange.min) {
      query = query.gte("price", parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      query = query.lte("price", parseFloat(priceRange.max));
    }

    query = query
      .order("crawled_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching cases:", error);
    } else {
      setCases(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  const handleCrawl = async () => {
    if (!searchKeyword.trim()) {
      alert("请输入搜索关键词");
      return;
    }

    setCrawling(true);
    try {
      const platforms = activePlatform === "all" ? ["taobao", "1688"] : [activePlatform];
      
      const response = await fetch("/api/crawl/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms,
          keyword: searchKeyword,
          page: 1,
          options: {
            minPrice: priceRange.min ? parseFloat(priceRange.min) : undefined,
            maxPrice: priceRange.max ? parseFloat(priceRange.max) : undefined,
          }
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`爬取成功！共获取 ${result.summary.totalItems} 条数据，已入库 ${result.summary.totalInserted} 条`);
        fetchCases(); // 刷新列表
      } else {
        alert("爬取失败：" + (result.results?.[0]?.error || "未知错误"));
      }
    } catch (error: any) {
      alert("爬取失败：" + error.message);
    } finally {
      setCrawling(false);
    }
  };

  const handleViewAnalysis = (caseId: string) => {
    router.push(`/baokuan/${caseId}`);
  };

  const toggleFilter = (code: string, selected: string[], setSelected: (val: string[]) => void) => {
    if (selected.includes(code)) {
      setSelected(selected.filter(c => c !== code));
    } else {
      setSelected([...selected, code]);
    }
  };

  const platformTabs = [
    { key: "all", label: "全部", icon: BarChart3 },
    { key: "taobao", label: "淘宝", icon: ShoppingBag },
    { key: "1688", label: "1688", icon: Store },
    { key: "douyin", label: "抖音", icon: TrendingUp },
    { key: "xiaohongshu", label: "小红书", icon: MessageCircle },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* 顶部导航 */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>爆款数据中心</h1>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => router.push("/baokuan/monitor")}
              style={{ padding: "8px 16px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
            >
              竞品监控
            </button>
            <button
              onClick={() => router.push("/baokuan/cases")}
              style={{ padding: "8px 16px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
            >
              案例库
            </button>
            <button
              onClick={() => router.push("/baokuan/ai-assistant")}
              style={{ padding: "8px 16px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
            >
              AI助手
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
        {/* 平台切换Tab */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", backgroundColor: "white", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          {platformTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActivePlatform(tab.key); setPage(1); }}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "8px", border: "none",
                backgroundColor: activePlatform === tab.key ? "#3b82f6" : "transparent", color: activePlatform === tab.key ? "white" : "#64748b",
                cursor: "pointer", fontSize: "14px", fontWeight: "500", transition: "all 0.2s"
              }}
            >
              <tab.icon style={{ width: "18px", height: "18px" }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 搜索和筛选区 */}
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="输入关键词搜索爆款（如：春装 连衣裙）"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && fetchCases()}
                style={{ width: "100%", padding: "12px 12px 12px 44px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none" }}
              />
            </div>
            <button
              onClick={handleCrawl}
              disabled={crawling}
              style={{ padding: "12px 24px", backgroundColor: crawling ? "#94a3b8" : "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: crawling ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "500" }}
            >
              {crawling ? "爬取中..." : "开始爬取"}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ padding: "12px 20px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Filter style={{ width: "18px", height: "18px" }} />
              筛选
            </button>
          </div>

          {/* 高级筛选面板 */}
          {showFilters && (
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
              {/* 价格区间 */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#64748b", marginBottom: "8px" }}>价格区间（元）</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input type="number" placeholder="最低价" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} style={{ width: "120px", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px" }} />
                  <span style={{ color: "#94a3b8" }}>-</span>
                  <input type="number" placeholder="最高价" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} style={{ width: "120px", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px" }} />
                </div>
              </div>

              {/* FCPSR筛选 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#64748b", marginBottom: "8px" }}>面料 (F)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {FABRIC_CODES.map(f => (
                      <button key={f.code} onClick={() => toggleFilter(f.code, selectedFabrics, setSelectedFabrics)} style={{ padding: "4px 10px", fontSize: "12px", border: `1px solid ${selectedFabrics.includes(f.code) ? "#3b82f6" : "#e2e8f0"}`, borderRadius: "4px", backgroundColor: selectedFabrics.includes(f.code) ? "#dbeafe" : "white", cursor: "pointer" }}>{f.name}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#64748b", marginBottom: "8px" }}>剪裁 (C)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {CUT_CODES.map(c => (
                      <button key={c.code} onClick={() => toggleFilter(c.code, selectedCuts, setSelectedCuts)} style={{ padding: "4px 10px", fontSize: "12px", border: `1px solid ${selectedCuts.includes(c.code) ? "#3b82f6" : "#e2e8f0"}`, borderRadius: "4px", backgroundColor: selectedCuts.includes(c.code) ? "#dbeafe" : "white", cursor: "pointer" }}>{c.name}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#64748b", marginBottom: "8px" }}>图案 (P)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {PATTERN_CODES.map(p => (
                      <button key={p.code} onClick={() => toggleFilter(p.code, selectedPatterns, setSelectedPatterns)} style={{ padding: "4px 10px", fontSize: "12px", border: `1px solid ${selectedPatterns.includes(p.code) ? "#3b82f6" : "#e2e8f0"}`, borderRadius: "4px", backgroundColor: selectedPatterns.includes(p.code) ? "#dbeafe" : "white", cursor: "pointer" }}>{p.name}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#64748b", marginBottom: "8px" }}>色季型 (S)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {SEASON_CODES.map(s => (
                      <button key={s.code} onClick={() => toggleFilter(s.code, selectedSeasons, setSelectedSeasons)} style={{ padding: "4px 10px", fontSize: "12px", border: `1px solid ${selectedSeasons.includes(s.code) ? "#3b82f6" : "#e2e8f0"}`, borderRadius: "4px", backgroundColor: selectedSeasons.includes(s.code) ? "#dbeafe" : "white", cursor: "pointer" }}>{s.name}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button onClick={() => { setSelectedFabrics([]); setSelectedCuts([]); setSelectedPatterns([]); setSelectedSeasons([]); setPriceRange({ min: "", max: "" }); }} style={{ padding: "8px 16px", backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>重置</button>
                <button onClick={() => { fetchCases(); setShowFilters(false); }} style={{ padding: "8px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>应用筛选</button>
              </div>
            </div>
          )}
        </div>

        {/* 数据统计 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "总爆款数", value: total, color: "#3b82f6" },
            { label: "今日新增", value: cases.filter(c => new Date(c.crawled_at).toDateString() === new Date().toDateString()).length, color: "#10b981" },
            { label: "高热度", value: cases.filter(c => c.heat_score && c.heat_score >= 80).length, color: "#f59e0b" },
            { label: "低竞争", value: cases.filter(c => c.competition_level === "低").length, color: "#8b5cf6" },
          ].map((stat, idx) => (
            <div key={idx} style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "8px" }}>{stat.label}</p>
              <p style={{ fontSize: "28px", fontWeight: "bold", color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* 爆款卡片列表 */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white", borderRadius: "12px" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#94a3b8" }}>加载中...</p>
          </div>
        ) : cases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white", borderRadius: "12px" }}>
            <BarChart3 style={{ width: "48px", height: "48px", color: "#cbd5e1", margin: "0 auto 16px" }} />
            <p style={{ color: "#94a3b8" }}>暂无爆款数据，点击"开始爬取"获取最新爆款</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {cases.map((item) => (
              <div key={item.id} style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", transition: "all 0.2s", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"} onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
                {/* 商品图片 */}
                <div style={{ position: "relative", height: "200px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.image_urls && item.image_urls[0] ? (
                    <img src={item.image_urls[0]} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <BarChart3 style={{ width: "48px", height: "48px", color: "#cbd5e1" }} />
                  )}
                  {/* 平台标签 */}
                  <span style={{ position: "absolute", top: "12px", left: "12px", padding: "4px 10px", backgroundColor: "rgba(0,0,0,0.6)", color: "white", borderRadius: "4px", fontSize: "12px" }}>
                    {item.source_platform === "taobao" ? "淘宝" : item.source_platform === "1688" ? "1688" : item.source_platform === "douyin" ? "抖音" : "小红书"}
                  </span>
                  {/* 热度分 */}
                  {item.heat_score && (
                    <span style={{ position: "absolute", top: "12px", right: "12px", padding: "4px 10px", backgroundColor: item.heat_score >= 80 ? "#ef4444" : item.heat_score >= 60 ? "#f59e0b" : "#10b981", color: "white", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                      {item.heat_score}℃
                    </span>
                  )}
                </div>

                {/* 商品信息 */}
                <div style={{ padding: "16px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "500", color: "#1e293b", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</h3>
                  
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "18px", fontWeight: "bold", color: "#3b82f6" }}>¥{item.price}</span>
                    {item.sales_volume > 0 && (
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>销量 {item.sales_volume > 10000 ? (item.sales_volume / 10000).toFixed(1) + "w" : item.sales_volume}</span>
                    )}
                  </div>

                  {/* FCPSR标签 */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
                    {[...(item.attr_fabric || []), ...(item.attr_cut || []), ...(item.attr_pattern || []), ...(item.attr_season_color || [])].slice(0, 6).map((attr, idx) => (
                      <span key={idx} style={{ padding: "2px 6px", backgroundColor: "#f1f5f9", borderRadius: "3px", fontSize: "11px", color: "#64748b" }}>{attr}</span>
                    ))}
                  </div>

                  {/* 操作按钮 */}
                  <button
                    onClick={() => handleViewAnalysis(item.id)}
                    style={{ width: "100%", padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
                  >
                    查看拆解
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {total > pageSize && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "24px" }}>
            <button onClick={() => { setPage(page - 1); window.scrollTo(0, 0); }} disabled={page === 1} style={{ padding: "8px 16px", backgroundColor: page === 1 ? "#f1f5f9" : "white", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "14px" }}>上一页</button>
            <span style={{ fontSize: "14px", color: "#64748b" }}>第 {page} 页，共 {Math.ceil(total / pageSize)} 页</span>
            <button onClick={() => { setPage(page + 1); window.scrollTo(0, 0); }} disabled={page >= Math.ceil(total / pageSize)} style={{ padding: "8px 16px", backgroundColor: page >= Math.ceil(total / pageSize) ? "#f1f5f9" : "white", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: page >= Math.ceil(total / pageSize) ? "not-allowed" : "pointer", fontSize: "14px" }}>下一页</button>
          </div>
        )}
      </div>
    </div>
  );
}
