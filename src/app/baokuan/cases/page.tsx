"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Search, Filter, BarChart3, TrendingUp } from "lucide-react";

interface CaseItem {
  id: string;
  case_id: string;
  title: string;
  source_platform: string;
  image_urls: string[];
  heat_score: number;
  competition_level: string;
  attr_fabric: string[];
  attr_cut: string[];
  attr_pattern: string[];
  attr_season_color: string[];
  crawled_at: string;
}

export default function CasesPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortBy, setSortBy] = useState("heat"); // heat | date | competition
  const [filterLevel, setFilterLevel] = useState("all"); // all | 高 | 中 | 低

  useEffect(() => {
    checkAuth();
    fetchCases();
  }, [sortBy, filterLevel]);

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
      .select("*");

    // 筛选竞争度
    if (filterLevel !== "all") {
      query = query.eq("competition_level", filterLevel);
    }

    // 排序
    if (sortBy === "heat") {
      query = query.order("heat_score", { ascending: false });
    } else if (sortBy === "date") {
      query = query.order("crawled_at", { ascending: false });
    } else if (sortBy === "competition") {
      query = query.order("competition_level", { ascending: true });
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error("Error fetching cases:", error);
    } else {
      // 前端搜索过滤
      let filtered = data || [];
      if (searchKeyword) {
        filtered = filtered.filter(c => 
          c.title?.includes(searchKeyword) || 
          c.case_id?.includes(searchKeyword)
        );
      }
      setCases(filtered);
    }
    setLoading(false);
  };

  const getHeatColor = (score: number) => {
    if (score >= 80) return "#ef4444";
    if (score >= 60) return "#f59e0b";
    return "#10b981";
  };

  const getCompetitionBadge = (level: string) => {
    if (level === "高") return { bg: "#fee2e2", color: "#991b1b", label: "高竞争" };
    if (level === "中") return { bg: "#fef3c7", color: "#92400e", label: "中竞争" };
    return { bg: "#d1fae5", color: "#065f46", label: "低竞争" };
  };

  const getAllAttrs = (item: CaseItem) => {
    return [
      ...(item.attr_fabric || []),
      ...(item.attr_cut || []),
      ...(item.attr_pattern || []),
      ...(item.attr_season_color || [])
    ].slice(0, 8);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* 顶部导航 */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>实战案例库</h1>
            <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>爆款案例拆解与FCPSR属性分析</p>
          </div>
          <button
            onClick={() => router.push("/baokuan")}
            style={{ padding: "10px 20px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
          >
            返回数据中心
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
        {/* 搜索和筛选区 */}
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="搜索案例标题或编号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && fetchCases()}
                style={{ width: "100%", padding: "12px 12px 12px 44px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none" }}
              />
            </div>
            <button
              onClick={() => fetchCases()}
              style={{ padding: "12px 24px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
            >
              搜索
            </button>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter style={{ width: "16px", height: "16px", color: "#94a3b8" }} />
              <span style={{ fontSize: "13px", color: "#64748b" }}>筛选：</span>
            </div>
            <select 
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
            >
              <option value="all">全部竞争度</option>
              <option value="低">低竞争</option>
              <option value="中">中竞争</option>
              <option value="高">高竞争</option>
            </select>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>排序：</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
              >
                <option value="heat">按热度</option>
                <option value="date">按时间</option>
                <option value="competition">按竞争度</option>
              </select>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "案例总数", value: cases.length, color: "#3b82f6" },
            { label: "高热度案例", value: cases.filter(c => c.heat_score >= 80).length, color: "#ef4444" },
            { label: "低竞争机会", value: cases.filter(c => c.competition_level === "低").length, color: "#10b981" },
            { label: "已分析", value: cases.filter(c => c.heat_score > 0).length, color: "#8b5cf6" },
          ].map((stat, idx) => (
            <div key={idx} style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "8px" }}>{stat.label}</p>
              <p style={{ fontSize: "28px", fontWeight: "bold", color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* 案例卡片墙 */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white", borderRadius: "12px" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#94a3b8" }}>加载中...</p>
          </div>
        ) : cases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white", borderRadius: "12px" }}>
            <BarChart3 style={{ width: "48px", height: "48px", color: "#cbd5e1", margin: "0 auto 16px" }} />
            <p style={{ color: "#94a3b8" }}>暂无案例数据</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {cases.map((item) => {
              const competitionBadge = getCompetitionBadge(item.competition_level);
              return (
                <div 
                  key={item.id} 
                  style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                  onClick={() => router.push(`/baokuan/cases/${item.id}`)}
                >
                  {/* 封面图 */}
                  <div style={{ position: "relative", height: "200px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.image_urls && item.image_urls[0] ? (
                      <img src={item.image_urls[0]} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <BarChart3 style={{ width: "48px", height: "48px", color: "#cbd5e1" }} />
                    )}
                    
                    {/* 案例编号 */}
                    <span style={{ position: "absolute", top: "12px", left: "12px", padding: "4px 10px", backgroundColor: "rgba(0,0,0,0.6)", color: "white", borderRadius: "4px", fontSize: "12px", fontWeight: "500" }}>
                      {item.case_id || "未编号"}
                    </span>

                    {/* 热度指数 */}
                    {item.heat_score > 0 && (
                      <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: "4px" }}>
                        <TrendingUp style={{ width: "14px", height: "14px", color: getHeatColor(item.heat_score) }} />
                        <span style={{ fontSize: "12px", fontWeight: "bold", color: getHeatColor(item.heat_score) }}>{item.heat_score}℃</span>
                      </div>
                    )}

                    {/* 竞争度标签 */}
                    {item.competition_level && (
                      <span style={{ position: "absolute", bottom: "12px", left: "12px", padding: "4px 10px", backgroundColor: competitionBadge.bg, color: competitionBadge.color, borderRadius: "4px", fontSize: "11px", fontWeight: "500" }}>
                        {competitionBadge.label}
                      </span>
                    )}
                  </div>

                  {/* 信息区 */}
                  <div style={{ padding: "16px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "500", color: "#1e293b", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title || "未命名案例"}
                    </h3>

                    {/* FCPSR标签 */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
                      {getAllAttrs(item).map((attr, idx) => (
                        <span key={idx} style={{ padding: "2px 6px", backgroundColor: "#f1f5f9", borderRadius: "3px", fontSize: "11px", color: "#64748b" }}>
                          {attr}
                        </span>
                      ))}
                      {getAllAttrs(item).length === 0 && (
                        <span style={{ fontSize: "11px", color: "#cbd5e1" }}>待分析</span>
                      )}
                    </div>

                    {/* 底部信息 */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#94a3b8" }}>
                      <span>来源：{item.source_platform === "taobao" ? "淘宝" : item.source_platform === "1688" ? "1688" : item.source_platform === "douyin" ? "抖音" : "小红书"}</span>
                      <span>{new Date(item.crawled_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
