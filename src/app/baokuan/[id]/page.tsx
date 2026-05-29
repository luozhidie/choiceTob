"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, externalLink, Download, Send, Sparkles } from "lucide-react";

export default function BaoKuanAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("report"); // report | table | similar
  const [generating, setGenerating] = useState(false);

  const caseId = params.id as string;

  useEffect(() => {
    if (caseId) {
      fetchCaseData();
    }
  }, [caseId]);

  const fetchCaseData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bao_kuan_cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (error) {
      console.error("Error fetching case:", error);
      alert("获取数据失败");
    } else {
      setCaseData(data);
    }
    setLoading(false);
  };

  const handleGenerateDesign = async () => {
    setGenerating(true);
    try {
      // 调用AI生成设计稿API（模拟）
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert("设计稿生成中，完成后将通知您");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToMatch = async () => {
    try {
      const { error } = await supabase
        .from("match_packages")
        .insert([{
          title: caseData.title,
          source_case_id: caseData.id,
          status: "draft"
        }]);

      if (error) {
        alert("添加失败：" + error.message);
      } else {
        alert("已添加到搭配包！");
        router.push("/match-packages");
      }
    } catch (err: any) {
      alert("添加失败：" + err.message);
    }
  };

  const handleSendToClient = () => {
    router.push(`/clients?share=case&id=${caseId}`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#94a3b8" }}>加载中...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#94a3b8" }}>未找到该爆款数据</p>
      </div>
    );
  }

  // 解析AI报告表格数据
  const reportTable = caseData.ai_report_table ? JSON.parse(caseData.ai_report_table) : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* 顶部导航 */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => router.back()} style={{ padding: "8px", backgroundColor: "transparent", border: "none", cursor: "pointer" }}>
            <ArrowLeft style={{ width: "20px", height: "20px", color: "#64748b" }} />
          </button>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e293b" }}>爆款拆解分析</h1>
          <span style={{ padding: "4px 12px", backgroundColor: "#dbeafe", color: "#1e40af", borderRadius: "6px", fontSize: "12px", fontWeight: "500" }}>
            {caseData.case_id || "未编号"}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "1fr 1.5fr 0.8fr", gap: "24px" }}>
        {/* 左侧：原商品信息 */}
        <div>
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "16px" }}>
            <div style={{ height: "300px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {caseData.image_urls && caseData.image_urls[0] ? (
                <img src={caseData.image_urls[0]} alt={caseData.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ color: "#94a3b8" }}>暂无图片</div>
              )}
            </div>
            <div style={{ padding: "16px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "500", color: "#1e293b", marginBottom: "12px" }}>{caseData.title}</h2>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "24px", fontWeight: "bold", color: "#3b82f6" }}>¥{caseData.price}</span>
                {caseData.sales_volume > 0 && (
                  <span style={{ fontSize: "14px", color: "#94a3b8" }}>销量 {caseData.sales_volume > 10000 ? (caseData.sales_volume / 10000).toFixed(1) + "w" : caseData.sales_volume}</span>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#64748b" }}>
                <span>来源：{caseData.source_platform === "taobao" ? "淘宝" : caseData.source_platform === "1688" ? "1688" : caseData.source_platform === "douyin" ? "抖音" : "小红书"}</span>
                <span>|</span>
                <span>爬取时间：{new Date(caseData.crawled_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* FCPSR属性标签 */}
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "500", color: "#1e293b", marginBottom: "12px" }}>FCPSR属性编码</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "面料 (F)", values: caseData.attr_fabric },
                { label: "剪裁 (C)", values: caseData.attr_cut },
                { label: "图案 (P)", values: caseData.attr_pattern },
                { label: "色季型 (S)", values: caseData.attr_season_color },
                { label: "搭配原则 (R)", values: caseData.attr_rule },
              ].map((group, idx) => (
                <div key={idx}>
                  <span style={{ fontSize: "12px", color: "#94a3b8", marginRight: "8px" }}>{group.label}</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                    {group.values && group.values.length > 0 ? group.values.map((v: string, i: number) => (
                      <span key={i} style={{ padding: "2px 8px", backgroundColor: "#dbeafe", color: "#1e40af", borderRadius: "4px", fontSize: "12px" }}>{v}</span>
                    )) : (
                      <span style={{ fontSize: "12px", color: "#cbd5e1" }}>待识别</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 中间：AI拆解报告 */}
        <div>
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {/* Tab切换 */}
            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
              {[
                { key: "report", label: "文字报告" },
                { key: "table", label: "结构化表格" },
                { key: "similar", label: "相似爆款" },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1, padding: "12px 16px", border: "none", backgroundColor: "transparent",
                    borderBottom: activeTab === tab.key ? "2px solid #3b82f6" : "2px solid transparent",
                    color: activeTab === tab.key ? "#3b82f6" : "#64748b", cursor: "pointer", fontSize: "14px", fontWeight: "500"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: "24px" }}>
              {activeTab === "report" && (
                <div>
                  {caseData.ai_report_text ? (
                    <div style={{ lineHeight: "1.8", color: "#334155" }}>
                      {caseData.ai_report_text.split("\n").map((para: string, idx: number) => (
                        <p key={idx} style={{ marginBottom: "12px" }}>{para}</p>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                      <Sparkles style={{ width: "48px", height: "48px", margin: "0 auto 16px", color: "#cbd5e1" }} />
                      <p>AI报告尚未生成</p>
                      <button 
                        onClick={async () => {
                          // 模拟生成AI报告
                          const mockReport = `这款爆款的核心驱动因素是色彩季型S01（春浅色系）搭配剪裁C02（宽松版型），在25-35岁女性群体中引发"松弛感"共鸣。面料F01（纯棉）提供舒适度支撑，图案P03（小碎花）强化春季氛围感。

关键成功因素：
1. 色彩策略：S01春浅色系精准匹配春季消费需求，搜索热度环比上涨87%
2. 版型选择：C02宽松版型满足后疫情时代舒适穿搭需求
3. 面料优势：F01纯棉成本低、透气性好，适合春夏过渡季
4. 图案设计：P03小碎花符合"法式慵懒"风格趋势

竞争分析：
- 高竞争属性：S01（95%商家在用）、F01（92%）
- 低竞争机会：P03碎花（78%，可切入）、C02宽松（87%，可差异化）

下期跟款建议：
建议跟款方向：F01+C02+S01，可尝试加入R02层叠搭配提升客单价。避开P03红海，可尝试P05纯色+局部P03点缀的差异化设计。`;

                          await supabase.from("bao_kuan_cases").update({
                            ai_report_text: mockReport,
                            ai_report_table: JSON.stringify({
                              attributes: [
                                { code: "F01", name: "纯棉", heat: 92, competition: "高", advice: "跟" },
                                { code: "C02", name: "宽松", heat: 87, competition: "中", advice: "跟" },
                                { code: "P03", name: "碎花", heat: 78, competition: "低", advice: "跟" },
                                { code: "S01", name: "春浅", heat: 95, competition: "高", advice: "跟" },
                                { code: "R02", name: "层叠", heat: 81, competition: "中", advice: "跟" },
                              ]
                            }),
                            heat_score: 92,
                            competition_level: "中",
                          }).eq("id", caseData.id);

                          alert("AI报告生成完成！");
                          fetchCaseData();
                        }}
                        style={{ marginTop: "16px", padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
                      >
                        生成AI报告
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "table" && (
                <div>
                  {reportTable ? (
                    <div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f8fafc" }}>
                            <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "500", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>属性</th>
                            <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "500", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>编码</th>
                            <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "500", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>数值</th>
                            <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "500", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>热度</th>
                            <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "500", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>竞争度</th>
                            <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "500", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>建议</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportTable.attributes.map((attr: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "12px", fontSize: "14px", color: "#1e293b" }}>{attr.name}</td>
                              <td style={{ padding: "12px", fontSize: "14px", color: "#3b82f6", fontWeight: "500" }}>{attr.code}</td>
                              <td style={{ padding: "12px", fontSize: "14px", color: "#334155" }}>{attr.name}</td>
                              <td style={{ padding: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ width: "60px", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                    <div style={{ width: `${attr.heat}%`, height: "100%", backgroundColor: attr.heat >= 80 ? "#ef4444" : attr.heat >= 60 ? "#f59e0b" : "#10b981" }} />
                                  </div>
                                  <span style={{ fontSize: "13px", color: "#64748b" }}>{attr.heat}%</span>
                                </div>
                              </td>
                              <td style={{ padding: "12px" }}>
                                <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500", backgroundColor: attr.competition === "高" ? "#fee2e2" : attr.competition === "中" ? "#fef3c7" : "#d1fae5", color: attr.competition === "高" ? "#991b1b" : attr.competition === "中" ? "#92400e" : "#065f46" }}>
                                  {attr.competition}
                                </span>
                              </td>
                              <td style={{ padding: "12px" }}>
                                <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500", backgroundColor: attr.advice === "跟" ? "#d1fae5" : "#fee2e2", color: attr.advice === "跟" ? "#065f46" : "#991b1b" }}>
                                  {attr.advice === "跟" ? "建议跟款" : "谨慎跟款"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* AI建议 */}
                      {caseData.ai_suggestion && (
                        <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "500", color: "#166534", marginBottom: "8px" }}>AI建议</h4>
                          <p style={{ fontSize: "14px", color: "#15803d", lineHeight: "1.6" }}>{caseData.ai_suggestion}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                      <p>结构化表格尚未生成，请先生成AI报告</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "similar" && (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <p>相似爆款推荐（开发中）</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：操作区 */}
        <div>
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "500", color: "#1e293b", marginBottom: "16px" }}>操作</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={handleGenerateDesign}
                disabled={generating}
                style={{ width: "100%", padding: "12px", backgroundColor: generating ? "#94a3b8" : "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: generating ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Sparkles style={{ width: "18px", height: "18px" }} />
                {generating ? "生成中..." : "生成设计稿"}
              </button>

              <button
                onClick={handleAddToMatch}
                style={{ width: "100%", padding: "12px", backgroundColor: "white", color: "#3b82f6", border: "1px solid #3b82f6", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Download style={{ width: "18px", height: "18px" }} />
                加入搭配包
              </button>

              <button
                onClick={handleSendToClient}
                style={{ width: "100%", padding: "12px", backgroundColor: "white", color: "#10b981", border: "1px solid #10b981", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Send style={{ width: "18px", height: "18px" }} />
                发送给客户
              </button>
            </div>
          </div>

          {/* 爆款指数 */}
          <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "500", color: "#1e293b", marginBottom: "16px" }}>爆款指数</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { label: "热度分", value: caseData.heat_score || 0, color: "#ef4444" },
                { label: "竞争度", value: caseData.competition_level === "高" ? 90 : caseData.competition_level === "中" ? 60 : 30, color: "#f59e0b" },
                { label: "跟款建议", value: caseData.heat_score >= 80 ? 85 : caseData.heat_score >= 60 ? 65 : 40, color: "#10b981" },
              ].map((metric, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>{metric.label}</span>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: metric.color }}>{metric.value}分</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${metric.value}%`, height: "100%", backgroundColor: metric.color, transition: "width 0.5s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
