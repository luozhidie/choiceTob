"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Palette, ArrowLeftRight, BarChart3, Users } from "lucide-react";
import Link from "next/link";
import { COLOR_SEASONS_PRO, COLOR_SEASON_DETAILS } from "@/lib/styles";

// 复用 styles.ts 中的真实12季色彩定义（单一事实来源）

export default function ColorComparePage() {
  const [season1, setSeason1] = useState("");
  const [season2, setSeason2] = useState("");
  const [customerStats, setCustomerStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const { data } = await supabase.from("vip_customers").select("color_season");
    const stats: Record<string, number> = {};
    (data || []).forEach((c: any) => {
      if (c.color_season) {
        stats[c.color_season] = (stats[c.color_season] || 0) + 1;
      }
    });
    setCustomerStats(stats);
    setLoading(false);
  };

  const detail1 = season1 ? COLOR_SEASON_DETAILS[season1] : null;
  const detail2 = season2 ? COLOR_SEASON_DETAILS[season2] : null;
  const season1Info = COLOR_SEASONS_PRO.find((s) => s.value === season1);
  const season2Info = COLOR_SEASONS_PRO.find((s) => s.value === season2);

  // 对比差异
  const getDiff = () => {
    if (!detail1 || !detail2) return null;
    const diffs: string[] = [];
    if (detail1.tone !== detail2.tone) diffs.push(`色调：${detail1.tone}调 vs ${detail2.tone}调`);
    if (detail1.brightness !== detail2.brightness) diffs.push(`明度：${detail1.brightness} vs ${detail2.brightness}`);
    if (detail1.saturation !== detail2.saturation) diffs.push(`艳度：${detail1.saturation} vs ${detail2.saturation}`);
    return diffs;
  };

  const diff = getDiff();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-primary">色彩季型对比分析</h1>
        <p className="text-sm text-muted-foreground mt-1">
          对比不同色彩季型的差异，辅助选品和陈列决策 · 行业差异化工具
        </p>
      </div>

      {/* Customer Distribution */}
      <div className="max-w-6xl mx-auto mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          客户色彩季型分布
        </h2>
        {Object.keys(customerStats).length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无客户色彩数据，请先在"色彩季型录入"中录入客户信息</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {COLOR_SEASONS_PRO.map((season) => {
              const count = customerStats[season.value] || 0;
              if (count === 0) return null;
              return (
                <div key={season.value} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                  <span className="text-xs text-muted-foreground">{season.group}</span>
                  <span className="font-bold text-sm text-primary">{season.label}</span>
                  <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full font-medium">{count}人</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compare Selector */}
      <div className="max-w-6xl mx-auto mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5" />
          季型对比选择
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">季型 A</label>
            <select value={season1} onChange={(e) => setSeason1(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">请选择</option>
              {COLOR_SEASONS_PRO.map((s) => (
                <option key={s.value} value={s.value}>{s.label}（{s.group}）</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">季型 B</label>
            <select value={season2} onChange={(e) => setSeason2(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">请选择</option>
              {COLOR_SEASONS_PRO.map((s) => (
                <option key={s.value} value={s.value}>{s.label}（{s.group}）</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Result */}
      {detail1 && detail2 && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Diff Summary */}
          {diff && diff.length > 0 && (
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
              <h3 className="text-sm font-bold text-amber-700 mb-3">⚡ 核心差异</h3>
              <div className="flex flex-wrap gap-3">
                {diff.map((d, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white text-amber-600 text-xs rounded-lg font-medium border border-amber-200">{d}</span>
                ))}
              </div>
              {detail1.tone !== detail2.tone && (
                <p className="mt-3 text-xs text-amber-600 leading-relaxed">
                  💡 暖调与冷调客户在选品方向上差异最大。暖调客户偏好大地色系、黄基调；冷调客户偏好蓝基调、灰色调。陈列时应分区展示，避免混淆。
                </p>
              )}
            </div>
          )}

          {/* Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Season A */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="text-xs text-muted-foreground mb-1">{season1Info?.group}</div>
              <h3 className="text-xl font-bold text-primary mb-4">{season1Info?.label}</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">特征</div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{detail1.tone}调</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{detail1.brightness}</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{detail1.saturation}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">最佳色彩</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail1.bestColors.map((c) => (
                      <span key={c} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">避免色彩</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail1.avoidColors.map((c) => (
                      <span key={c} className="px-2 py-1 bg-red-50 text-red-400 text-xs rounded-full line-through">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">推荐面料</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail1.bestFabrics.map((f) => (
                      <span key={f} className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">适配风格</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail1.matchingStyles.map((s) => (
                      <span key={s} className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Season B */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="text-xs text-muted-foreground mb-1">{season2Info?.group}</div>
              <h3 className="text-xl font-bold text-primary mb-4">{season2Info?.label}</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">特征</div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{detail2.tone}调</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{detail2.brightness}</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{detail2.saturation}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">最佳色彩</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail2.bestColors.map((c) => (
                      <span key={c} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">避免色彩</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail2.avoidColors.map((c) => (
                      <span key={c} className="px-2 py-1 bg-red-50 text-red-400 text-xs rounded-full line-through">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">推荐面料</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail2.bestFabrics.map((f) => (
                      <span key={f} className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">适配风格</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail2.matchingStyles.map((s) => (
                      <span key={s} className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Colors (for mixed display planning) */}
          {detail1 && detail2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                陈列建议：混合色系通用色
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                当同一区域需要服务多种色彩季型客户时，以下色彩可作为通用陈列色：
              </p>
              <div className="flex flex-wrap gap-2">
                {detail1.bestColors.filter((c) => detail2.bestColors.includes(c) || detail2.bestColors.some((c2) => {
                  const commonWords = ["白", "灰", "米", "蓝", "粉"];
                  return commonWords.some((w) => c.includes(w) && c2.includes(w));
                })).map((c) => (
                  <span key={c} className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-lg font-medium">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
