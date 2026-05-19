"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  TrendingUp,
  Palette,
  Users,
  BarChart3,
  Loader2,
  RefreshCw,
  Target,
  DollarSign,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { STYLE_KEY_MAP, COLOR_SEASON_KEY_MAP } from "@/lib/styles";

/* ==================== 类型 ==================== */
interface StyleStat {
  style: string | null;
  count: number;
}

interface ColorStat {
  color: string | null;
  count: number;
}

interface AgeStat {
  age: string | null;
  count: number;
}

interface PriceStat {
  price: string | null;
  count: number;
}

interface SourceStat {
  source: string;
  total: number;
}

interface RecentOrder {
  id: string;
  style_type: string | null;
  color_season: string | null;
  target_age: string | null;
  price_range: string | null;
  brand_name: string | null;
  created_at: string;
}

/* ==================== 页面 ==================== */
export default function MarketDemandPage() {
  const [loading, setLoading] = useState(true);
  const [styleStats, setStyleStats] = useState<StyleStat[]>([]);
  const [colorStats, setColorStats] = useState<ColorStat[]>([]);
  const [ageStats, setAgeStats] = useState<AgeStat[]>([]);
  const [priceStats, setPriceStats] = useState<PriceStat[]>([]);
  const [sourceStats, setSourceStats] = useState<SourceStat[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [totalPlanning, setTotalPlanning] = useState(0);
  const [totalTests, setTotalTests] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStyleStats(),
      fetchColorStats(),
      fetchAgeStats(),
      fetchPriceStats(),
      fetchSourceStats(),
      fetchRecentOrders(),
      fetchTotals(),
    ]);
    setLoading(false);
  };

  const fetchStyleStats = async () => {
    const { data } = await supabase
      .from("planning_orders")
      .select("style_type")
      .not("style_type", "is", null);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((d: any) => {
        const key = d.style_type || "未指定";
        counts[key] = (counts[key] || 0) + 1;
      });
      const sorted = Object.entries(counts)
        .map(([style, count]) => ({ style, count }))
        .sort((a, b) => b.count - a.count);
      setStyleStats(sorted);
    }
  };

  const fetchColorStats = async () => {
    const { data } = await supabase
      .from("planning_orders")
      .select("color_season")
      .not("color_season", "is", null);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((d: any) => {
        const key = d.color_season || "未指定";
        counts[key] = (counts[key] || 0) + 1;
      });
      const sorted = Object.entries(counts)
        .map(([color, count]) => ({ color, count }))
        .sort((a, b) => b.count - a.count);
      setColorStats(sorted);
    }
  };

  const fetchAgeStats = async () => {
    const { data } = await supabase
      .from("planning_orders")
      .select("target_age")
      .not("target_age", "is", null);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((d: any) => {
        const key = d.target_age || "未指定";
        counts[key] = (counts[key] || 0) + 1;
      });
      const sorted = Object.entries(counts)
        .map(([age, count]) => ({ age, count }))
        .sort((a, b) => b.count - a.count);
      setAgeStats(sorted);
    }
  };

  const fetchPriceStats = async () => {
    const { data } = await supabase
      .from("planning_orders")
      .select("price_range")
      .not("price_range", "is", null);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((d: any) => {
        const key = d.price_range || "未指定";
        counts[key] = (counts[key] || 0) + 1;
      });
      const sorted = Object.entries(counts)
        .map(([price, count]) => ({ price, count }))
        .sort((a, b) => b.count - a.count);
      setPriceStats(sorted);
    }
  };

  const fetchSourceStats = async () => {
    const [planRes, testRes, leadRes] = await Promise.all([
      supabase.from("planning_orders").select("id", { count: "exact", head: true }),
      supabase.from("style_test_results").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }),
    ]);
    setSourceStats([
      { source: "企划需求", total: planRes.count || 0 },
      { source: "风格测试", total: testRes.count || 0 },
      { source: "客户线索", total: leadRes.count || 0 },
    ]);
  };

  const fetchRecentOrders = async () => {
    const { data } = await supabase
      .from("planning_orders")
      .select("id, style_type, color_season, target_age, price_range, brand_name, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setRecentOrders(data as RecentOrder[]);
  };

  const fetchTotals = async () => {
    const [planRes, testRes, leadRes] = await Promise.all([
      supabase.from("planning_orders").select("id", { count: "exact", head: true }),
      supabase.from("style_test_results").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }),
    ]);
    setTotalPlanning(planRes.count || 0);
    setTotalTests(testRes.count || 0);
    setTotalLeads(leadRes.count || 0);
  };

  const getStyleName = (key: string | null) => {
    if (!key) return "未指定";
    return STYLE_KEY_MAP[key] || key;
  };

  const getColorName = (key: string | null) => {
    if (!key) return "未指定";
    return COLOR_SEASON_KEY_MAP[key] || key;
  };

  const maxStyleCount = Math.max(...styleStats.map((s) => s.count), 1);
  const maxColorCount = Math.max(...colorStats.map((s) => s.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent mr-3" />
        <span className="text-muted-foreground">加载市场需求数据...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">市场需求统计</h1>
          <p className="text-sm text-muted-foreground mt-1">
            累计统计用户偏好数据，反馈市场客户需求趋势
          </p>
        </div>
        <button
          onClick={fetchAllData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">企划需求总数</p>
              <p className="text-2xl font-bold text-primary">{totalPlanning}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">风格测试总数</p>
              <p className="text-2xl font-bold text-primary">{totalTests}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">客户线索总数</p>
              <p className="text-2xl font-bold text-primary">{totalLeads}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 数据来源分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-primary">数据来源分布</h3>
          </div>
          <div className="space-y-3">
            {sourceStats.map((s) => {
              const total = sourceStats.reduce((sum, x) => sum + x.total, 0) || 1;
              const pct = ((s.total / total) * 100).toFixed(1);
              return (
                <div key={s.source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{s.source}</span>
                    <span className="text-sm font-bold text-primary">{s.total} 条 ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-accent to-accent/70 rounded-full h-3 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 风格偏好排行 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-primary">风格偏好排行</h3>
          </div>
          {styleStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无数据</p>
          ) : (
            <div className="space-y-2.5">
              {styleStats.slice(0, 8).map((s, i) => (
                <div key={s.style} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < 3 ? "bg-accent text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-700 flex-1">{getStyleName(s.style)}</span>
                  <div className="w-32 bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-accent rounded-full h-2.5 transition-all duration-500"
                      style={{ width: `${(s.count / maxStyleCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-primary w-8 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* 色系偏好 + 年龄/价格分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 色系偏好排行 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-primary">色系偏好排行</h3>
          </div>
          {colorStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无数据</p>
          ) : (
            <div className="space-y-2.5">
              {colorStats.slice(0, 8).map((s, i) => (
                <div key={s.color} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < 3 ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-700 flex-1">{getColorName(s.color)}</span>
                  <div className="w-20 bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-primary rounded-full h-2.5 transition-all duration-500"
                      style={{ width: `${(s.count / maxColorCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-primary w-8 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 年龄段分布 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-primary">目标年龄段</h3>
          </div>
          {ageStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {ageStats.map((s) => {
                const max = Math.max(...ageStats.map((a) => a.count), 1);
                return (
                  <div key={s.age}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{s.age || "未指定"}</span>
                      <span className="text-sm font-bold text-primary">{s.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-green-500 rounded-full h-2.5 transition-all duration-500"
                        style={{ width: `${(s.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* 价格带分布 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-primary">价格带分布</h3>
          </div>
          {priceStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {priceStats.map((s) => {
                const max = Math.max(...priceStats.map((p) => p.count), 1);
                return (
                  <div key={s.price}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">¥{s.price || "未指定"}</span>
                      <span className="text-sm font-bold text-primary">{s.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-amber-500 rounded-full h-2.5 transition-all duration-500"
                        style={{ width: `${(s.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* 最近企划需求 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h3 className="font-bold text-primary">最近企划需求</h3>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">暂无企划需求</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">风格</th>
                  <th className="px-4 py-3">色系</th>
                  <th className="px-4 py-3">年龄段</th>
                  <th className="px-4 py-3">价格带</th>
                  <th className="px-4 py-3">品牌</th>
                  <th className="px-4 py-3">提交时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                        {getStyleName(order.style_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {getColorName(order.color_season)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.target_age || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">¥{order.price_range || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{order.brand_name || "-"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("zh-CN", {
                        month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
