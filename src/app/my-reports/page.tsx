"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, Eye, Download, Trash2, Plus, ChevronRight,
  Sparkles, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/* ==================== 类型 ==================== */
interface MyReport {
  id: string;
  title: string;
  category: string;
  status: string;
  amount: number;
  created_at: string;
  // note: planning_reports table may not have updated_at column
  report_json: any;
}

/* ==================== 页面 ==================== */
export default function MyReportsPage() {
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=" + encodeURIComponent("/my-reports"));
        return;
      }

      const { data, error } = await supabase
        .from("planning_reports")
        .select("id, title, category, status, amount, created_at, report_json")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setReports(data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const statusLabel: Record<string, string> = {
    draft: "草稿",
    pending_review: "待审核",
    approved: "已通过",
    rejected: "已拒绝",
  };

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    pending_review: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">我的报告</h1>
              <p className="mt-1 text-sm text-muted-foreground">查看您购买并生成的企划报告</p>
            </div>
            <a
              href="/planning-tool"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建报告
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无报告</h3>
            <p className="text-sm text-muted-foreground mb-6">购买AI企划报告后，您可以在这里查看</p>
            <a
              href="/planning-tool"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              立即购买 ¥2,980起
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                {/* 报告头部 */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary">{report.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString("zh-CN")}
                          {report.amount > 0 && <span className="ml-2">¥{(report.amount / 100).toFixed(0)}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[report.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabel[report.status] || report.status}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === report.id ? "rotate-90" : ""}`} />
                    </div>
                  </div>
                </div>

                {/* 报告详情（展开） */}
                {expandedId === report.id && report.report_json && (
                  <div className="border-t border-gray-100 p-5 space-y-6">
                    <ReportDetail report={report.report_json} />
                  </div>
                )}

                {/* 无报告JSON时的提示 */}
                {expandedId === report.id && !report.report_json && (
                  <div className="border-t border-gray-100 p-5 text-center">
                    <p className="text-sm text-muted-foreground">报告生成中，请稍后刷新...</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ==================== 报告详情组件 ==================== */
function ReportDetail({ report }: { report: any }) {
  if (!report) return <p className="text-sm text-muted-foreground">报告数据为空</p>;

  return (
    <div className="space-y-6 text-sm">
      {/* 概要 */}
      {report.summary && (
        <div>
          <h4 className="font-bold text-primary mb-2">📝 企划概要</h4>
          <p className="text-muted-foreground leading-relaxed">{report.summary}</p>
        </div>
      )}

      {/* 市场分析 */}
      {report.marketAnalysis && (
        <div>
          <h4 className="font-bold text-primary mb-2">📊 市场分析</h4>
          <div className="space-y-3">
            {report.marketAnalysis.trend && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-primary mb-1 text-xs">市场趋势</h5>
                <p className="text-muted-foreground leading-relaxed">{report.marketAnalysis.trend}</p>
              </div>
            )}
            {report.marketAnalysis.competition && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-primary mb-1 text-xs">竞争格局</h5>
                <p className="text-muted-foreground leading-relaxed">{report.marketAnalysis.competition}</p>
              </div>
            )}
            {report.marketAnalysis.opportunity && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-primary mb-1 text-xs">市场机会点</h5>
                <ul className="space-y-1">
                  {report.marketAnalysis.opportunity.map((op: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-accent mt-0.5 shrink-0" />
                      {op}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIP画像 */}
      {report.vipPortrait && (
        <div>
          <h4 className="font-bold text-primary mb-2">👥 VIP画像分析</h4>
          <div className="space-y-3">
            {report.vipPortrait.corePortrait && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-primary mb-1 text-xs">核心客群画像</h5>
                <p className="text-muted-foreground leading-relaxed">{report.vipPortrait.corePortrait}</p>
              </div>
            )}
            {report.vipPortrait.consumptionPower && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-primary mb-1 text-xs">消费力分析</h5>
                <p className="text-muted-foreground leading-relaxed">{report.vipPortrait.consumptionPower}</p>
              </div>
            )}
            {report.vipPortrait.priceSensitivity && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-primary mb-1 text-xs">价格敏感度</h5>
                <p className="text-muted-foreground leading-relaxed">{report.vipPortrait.priceSensitivity}</p>
              </div>
            )}
            {report.vipPortrait.loyaltyLevel && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-primary mb-1 text-xs">忠诚度分析</h5>
                <p className="text-muted-foreground leading-relaxed">{report.vipPortrait.loyaltyLevel}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 色彩企划 */}
      {report.colorPlan && report.colorPlan.length > 0 && (
        <div>
          <h4 className="font-bold text-primary mb-2">🎨 色彩企划</h4>
          <div className="grid grid-cols-2 gap-3">
            {report.colorPlan.map((cp: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-primary">{cp.type}</span>
                  <span className="text-xs text-accent font-bold">{cp.ratio}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {(cp.colors || []).map((c: string, j: number) => (
                    <span key={j} className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200">{c}</span>
                  ))}
                </div>
                {cp.reason && <p className="text-xs text-muted-foreground">{cp.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 风格企划 */}
      {report.stylePlan && report.stylePlan.length > 0 && (
        <div>
          <h4 className="font-bold text-primary mb-2">👗 风格企划</h4>
          <div className="space-y-2">
            {report.stylePlan.map((sp: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="font-medium text-primary">{sp.mainStyle || sp.style}</span>
                    {sp.subStyle && <span className="text-muted-foreground ml-2">（{sp.subStyle}）</span>}
                    {sp.targetAge && <span className="text-xs text-muted-foreground ml-2">· {sp.targetAge}</span>}
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>流量{sp.trafficRatio}</span>
                    <span>利润{sp.profitRatio}</span>
                  </div>
                </div>
                {sp.occasions && <p className="text-xs text-muted-foreground">场合：{sp.occasions.join("、")}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 商品结构 */}
      {report.productStructure && report.productStructure.length > 0 && (
        <div>
          <h4 className="font-bold text-primary mb-2">📦 商品结构</h4>
          <div className="grid grid-cols-2 gap-2">
            {report.productStructure.map((ps: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-primary">{ps.type}</span>
                  <span className="text-xs text-accent font-bold">{ps.ratio}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{ps.desc}</p>
                {ps.keyItems && <p className="text-xs text-muted-foreground mt-1">关键单品：{ps.keyItems.join("、")}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 价格带策略 */}
      {report.pricePlan && report.pricePlan.length > 0 && (
        <div>
          <h4 className="font-bold text-primary mb-2">💰 价格带策略</h4>
          <div className="space-y-2">
            {report.pricePlan.map((pp: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-primary">{pp.band}</span>
                  <span className="text-muted-foreground ml-2">{pp.range}</span>
                  {pp.marginTarget && <span className="text-xs text-green-600 ml-2">毛利{pp.marginTarget}</span>}
                </div>
                <div className="text-right">
                  <div className="text-xs text-accent font-bold">{pp.ratio}</div>
                  <div className="text-xs text-muted-foreground">{pp.strategy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 波段日历 */}
      {report.waveCalendar && report.waveCalendar.length > 0 && (
        <div>
          <h4 className="font-bold text-primary mb-2">📅 波段日历</h4>
          <div className="space-y-3">
            {report.waveCalendar.map((wc: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-primary">第{wc.week}周：{wc.theme}</h5>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="font-medium text-muted-foreground">关键动作</span>
                    <ul className="mt-1 space-y-0.5">
                      {(wc.keyActions || []).map((a: string, j: number) => (
                        <li key={j} className="text-muted-foreground">{a}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">采购计划</span>
                    <p className="mt-1 text-muted-foreground">{wc.buyPlan}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">陈列重点</span>
                    <p className="mt-1 text-muted-foreground">{wc.displayFocus}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 陈列建议 */}
      {report.displayAdvice && (
        <div>
          <h4 className="font-bold text-primary mb-2">🏬 陈列建议</h4>
          <div className="space-y-3">
            {report.displayAdvice.floorPlan && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-primary mb-1 text-xs">卖场规划</h5>
                <p className="text-muted-foreground leading-relaxed">{report.displayAdvice.floorPlan}</p>
              </div>
            )}
            {report.displayAdvice.keyAreas && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-primary mb-1 text-xs">重点区域</h5>
                <div className="space-y-2">
                  {report.displayAdvice.keyAreas.map((ka: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="font-medium text-primary">{ka.area}：</span>
                      <span className="text-muted-foreground">{ka.focus} / {ka.colorMatch}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {report.displayAdvice.windowDisplay && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-primary mb-1 text-xs">橱窗陈列</h5>
                <p className="text-muted-foreground leading-relaxed">{report.displayAdvice.windowDisplay}</p>
              </div>
            )}
            {report.displayAdvice.tipsTips && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-primary mb-1 text-xs">搭配技巧</h5>
                <ul className="space-y-1">
                  {report.displayAdvice.tipsTips.map((tip: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-accent mt-0.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI目标 */}
      {report.kpiTargets && (
        <div>
          <h4 className="font-bold text-primary mb-2">🎯 KPI目标</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {report.kpiTargets.salesTarget && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">销售额目标</span>
                  <span className="font-medium text-primary">{report.kpiTargets.salesTarget}</span>
                </div>
              )}
              {report.kpiTargets.marginTarget && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">毛利率目标</span>
                  <span className="font-medium text-primary">{report.kpiTargets.marginTarget}</span>
                </div>
              )}
              {report.kpiTargets.sellThroughTarget && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">售罄率目标</span>
                  <span className="font-medium text-primary">{report.kpiTargets.sellThroughTarget}</span>
                </div>
              )}
              {report.kpiTargets.inventoryTurnTarget && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">库存周转目标</span>
                  <span className="font-medium text-primary">{report.kpiTargets.inventoryTurnTarget}天</span>
                </div>
              )}
              {report.kpiTargets.trafficGoal && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">客流目标</span>
                  <span className="font-medium text-primary">{report.kpiTargets.trafficGoal}</span>
                </div>
              )}
              {report.kpiTargets.conversionGoal && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">成交率目标</span>
                  <span className="font-medium text-primary">{report.kpiTargets.conversionGoal}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 风险预警 */}
      {report.riskWarnings && report.riskWarnings.length > 0 && (
        <div>
          <h4 className="font-bold text-primary mb-2">⚠️ 风险预警</h4>
          <div className="space-y-2">
            {report.riskWarnings.map((rw: any, i: number) => (
              <div key={i} className={`rounded-lg p-3 border ${
                rw.level === "高" ? "bg-red-50 border-red-200" :
                rw.level === "中" ? "bg-yellow-50 border-yellow-200" :
                "bg-blue-50 border-blue-200"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium text-sm ${
                    rw.level === "高" ? "text-red-700" :
                    rw.level === "中" ? "text-yellow-700" :
                    "text-blue-700"
                  }`}>{rw.risk}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    rw.level === "高" ? "bg-red-200 text-red-800" :
                    rw.level === "中" ? "bg-yellow-200 text-yellow-800" :
                    "bg-blue-200 text-blue-800"
                  }`}>{rw.level}风险</span>
                </div>
                <p className={`text-xs ${
                  rw.level === "高" ? "text-red-600" :
                  rw.level === "中" ? "text-yellow-600" :
                  "text-blue-600"
                }`}>{rw.mitigation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 波段计划（原有quartersPlan） */}
      {report.quartersPlan && report.quartersPlan.length > 0 && (
        <div>
          <h4 className="font-bold text-primary mb-2">📅 波段上新计划</h4>
          <div className="space-y-3">
            {report.quartersPlan.map((qp: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-primary mb-2">{qp.phase}</h5>
                <ul className="space-y-1">
                  {(qp.items || []).map((item: string, j: number) => (
                    <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-accent mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 货盘建议 */}
      {report.assortmentAdvice && (
        <div>
          <h4 className="font-bold text-primary mb-2">📊 货盘建议</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {report.assortmentAdvice.summary && (
              <p className="text-muted-foreground text-sm">{report.assortmentAdvice.summary}</p>
            )}

            {/* 核心SKU */}
            {report.assortmentAdvice.coreSkuList && report.assortmentAdvice.coreSkuList.length > 0 && (
              <div>
                <h5 className="font-medium text-primary mb-2">核心款清单（{report.assortmentAdvice.coreSkuList.length}款）</h5>
                <div className="space-y-2">
                  {report.assortmentAdvice.coreSkuList.map((sku: any, i: number) => (
                    <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-primary">{sku.name}</span>
                        <span className="text-xs text-accent">{sku.expectedSellThrough || sku.expectedSellThrough}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{sku.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 避坑清单 */}
            {report.assortmentAdvice.avoidList && report.assortmentAdvice.avoidList.length > 0 && (
              <div>
                <h5 className="font-medium text-primary mb-2">⚠️ 避坑清单</h5>
                <div className="space-y-1">
                  {report.assortmentAdvice.avoidList.map((item: any, i: number) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                      <span>{item.category}：{item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 库存策略 */}
            {report.assortmentAdvice.stockStrategy && (
              <div>
                <h5 className="font-medium text-primary mb-1">库存策略</h5>
                <p className="text-xs text-muted-foreground">{report.assortmentAdvice.stockStrategy}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
