"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dice6, BarChart3, Loader2, Info, AlertTriangle, Trophy, Zap,
  TrendingUp, TrendingDown, Flame, Snowflake, Hash, Calculator,
  RotateCcw, Target, Shuffle, Eye, Calendar,
} from "lucide-react";
import {
  LotteryType, SimulationResult,
  SsqAnalysis, BallFrequency, HotColdAnalysis,
  OmissionEntry, PickResult, PickStrategy,
} from "@/lib/lottery/types";
import { getAllGames, getLotteryGame, expectedValue } from "@/lib/lottery/probability";
import { runSimulation } from "@/lib/lottery/simulator";

/* ════════════════════════════════════════
   常量 & 工具函数
   ════════════════════════════════════════ */

const STRATEGIES: { key: PickStrategy; label: string; desc: string; color: string }[] = [
  { key: "balanced", label: "均衡", desc: "2热+2温+2冷", color: "bg-blue-50 border-blue-300" },
  { key: "hot", label: "偏热", desc: "高频号加权", color: "bg-red-50 border-red-300" },
  { key: "cold", label: "偏冷", desc: "低频号追冷", color: "bg-cyan-50 border-cyan-300" },
  { key: "omission", label: "遗漏追号", desc: "高遗漏优先", color: "bg-orange-50 border-orange-300" },
  { key: "random", label: "纯随机", desc: "无偏好", color: "bg-gray-50 border-gray-300" },
];

function fmt(n: number, d = 2) { return Number(n).toFixed(d); }

/* ════════════════════════════════════════
   子组件：频率条形图
   ════════════════════════════════════════ */

function FreqBar({ freq, maxCount, colorClass }: {
  freq: BallFrequency; maxCount: number; colorClass?: string;
}) {
  const pct = maxCount > 0 ? (freq.count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="w-5 text-right font-mono text-gray-500">{String(freq.ball).padStart(2, "0")}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden relative">
        <div
          className={`h-full rounded transition-all ${colorClass || "bg-blue-400"}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-end px-1 text-[10px] text-gray-600">
          {freq.count}<span className="text-gray-400 ml-0.5">({freq.percentage})</span>
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   子组件：遗漏榜表格
   ════════════════════════════════════════ */

function OmissionTable({
  entries, title, maxShow,
}: { entries: OmissionEntry[]; title: string; maxShow?: number }) {
  const sorted = [...entries].sort((a, b) => b.currentOmission - a.currentOmission);
  const display = maxShow ? sorted.slice(0, maxShow) : sorted;

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1.5 text-left">#</th>
              <th className="px-2 py-1.5 text-left">号码</th>
              <th className="px-2 py-1.5 text-right">当前遗漏</th>
              <th className="px-2 py-1.5 text-right">最大遗漏</th>
              <th className="px-2 py-1.5 text-left">上次出现</th>
            </tr>
          </thead>
          <tbody>
            {display.map((e, i) => (
              <tr key={e.ball} className={`border-t ${i === 0 ? "bg-yellow-30" : ""}`}>
                <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                <td className="px-2 py-1.5 font-mono font-bold">{String(e.ball).padStart(2, "0")}</td>
                <td className={`px-2 py-1.5 text-right font-bold ${e.currentOmission > e.maxOmission * 0.8 ? "text-red-600" : "text-gray-700"}`}>
                  {e.currentOmission}
                </td>
                <td className="px-2 py-1.5 text-right text-gray-500">{e.maxOmission}</td>
                <td className="px-2 py-1.5 text-gray-500 whitespace-nowrap">{e.lastAppearIssue || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   子组件：选号结果展示
   ════════════════════════════════════════ */

function PickDisplay({ result }: { result: PickResult }) {
  return (
    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
      <p className="text-xs text-indigo-700 font-medium">{result.reasoning}</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500">红球:</span>
          {result.reds.map((r) => (
            <span key={r} className="w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {String(r).padStart(2, "0")}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500">蓝球:</span>
          <span className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
            {String(result.blue).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   Tab: 概率详情（精简版）
   ════════════════════════════════════════ */

function InfoTab({ type }: { type: LotteryType }) {
  const game = getLotteryGame(type);

  return (
    <div className="space-y-4">
      {/* 玩法规则 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b">
          <h3 className="font-semibold text-sm text-gray-800">{game.config.name} · 玩法说明</h3>
        </div>
        <div className="p-4"><pre className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed font-sans">{game.rules}</pre></div>
      </div>

      {/* 奖级表 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b">
          <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-purple-500" /> 中奖概率 & 奖金设置
          </h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr><th className="px-3 py-2 text-left">奖级</th><th className="px-3 py-2 text-left">条件</th><th className="px-3 py-2 text-right">概率</th><th className="px-3 py-2 text-right">奖金</th></tr>
            </thead>
            <tbody>{game.prizes.map((p) => (<tr key={p.level} className="border-t hover:bg-gray-50">
              <td className="px-3 py-1.5 font-medium">{p.level}</td>
              <td className="px-3 py-1.5 text-gray-600">{p.condition}</td>
              <td className="px-3 py-1.5 text-right font-mono text-orange-600">{p.odds}</td>
              <td className="px-3 py-1.5 text-right text-green-600">{p.prize}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>

      {/* 数学期望 */}
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
        <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-indigo-500" /> 数学期望分析
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {game.config.name} 单注期望回报约 <strong className="text-indigo-700">¥{expectedValue(game.prizes).toFixed(2)}</strong>{" "}
          （投入¥{game.config.price}）。长期回收率仅{" "}
          <strong className="text-red-600">{(expectedValue(game.prizes) / game.config.price * 100).toFixed(1)}%</strong>。
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   Tab: 历史数据统计（深化核心）
   ════════════════════════════════════════ */

interface AnalysisState {
  loading: boolean;
  data: SsqAnalysis | null;
  error: string;
  dataSource?: string;
  lastUpdated?: string | null;
  syncing?: boolean;
  syncMsg?: string;
}

const SOURCE_LABEL: Record<string, string> = {
  "17500": "乐彩网 (17500.cn)",
  "500": "500彩票网",
  "cwl": "中彩网",
  "demo": "演示数据",
};

function fmtTime(iso?: string | null): string {
  if (!iso) return "未知";
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", { hour12: false });
  } catch { return iso; }
}

function AnalysisTab() {
  const [state, setState] = useState<AnalysisState>({ loading: true, data: null, error: "" });
  const [pickStrategy, setPickStrategy] = useState<PickStrategy>("balanced");
  const [pickResult, setPickResult] = useState<PickResult | null>(null);
  const [showAllReds, setShowAllReds] = useState(false);

  const loadAnalysis = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    try {
      const r = await fetch("/api/lottery?action=analysis");
      const d = await r.json();
      if (d.success) setState({
        loading: false, data: d.data, error: "",
        dataSource: d.dataSource, lastUpdated: d.lastUpdated,
      });
      else setState({ loading: false, data: null, error: d.error || "加载失败" });
    } catch (e: any) { setState({ loading: false, data: null, error: e.message }); }
  }, []);

  const handleSync = useCallback(async () => {
    setState(s => ({ ...s, syncing: true, syncMsg: "" }));
    try {
      const r = await fetch("/api/lottery?action=sync");
      const d = await r.json();
      if (d.success) {
        setState(s => ({ ...s, syncing: false, syncMsg: d.message, lastUpdated: d.lastUpdated, dataSource: d.source }));
        await loadAnalysis();
      } else {
        setState(s => ({ ...s, syncing: false, syncMsg: d.error || "同步失败" }));
      }
    } catch (e: any) {
      setState(s => ({ ...s, syncing: false, syncMsg: e.message }));
    }
  }, [loadAnalysis]);

  useEffect(() => { loadAnalysis(); }, [loadAnalysis]);

  const handlePick = async () => {
    try {
      const r = await fetch(`/api/lottery?action=pick&strategy=${pickStrategy}`);
      const d = await r.json();
      if (d.success) setPickResult(d.data);
    } catch {}
  };

  /* 加载中 */
  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
        <span className="text-gray-500">正在分析历史数据...</span>
      </div>
    );
  }

  /* 出错 */
  if (!state.data || state.error) {
    return (
      <div className="py-10 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-red-600 text-sm mb-3">{state.error || "数据加载失败"}</p>
        <button onClick={loadAnalysis} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
          重试
        </button>
      </div>
    );
  }

  const a = state.data;

  return (
    <div className="space-y-6">
      {/* 数据概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 bg-white border rounded-lg text-center">
          <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{a.meta.totalDraws.toLocaleString()}</p>
          <p className="text-xs text-gray-500">总期数</p>
        </div>
        <div className="p-3 bg-white border rounded-lg text-center">
          <Eye className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{a.meta.latestIssue}</p>
          <p className="text-xs text-gray-500">最新期号</p>
        </div>
        <div className="p-3 bg-white border rounded-lg text-center">
          <Hash className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{fmt(a.sumStats.mean)}</p>
          <p className="text-xs text-gray-500">和值均值</p>
        </div>
        <div className="p-3 bg-white border rounded-lg text-center">
          <Flame className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{a.consecutiveStats.mostCommonLength}</p>
          <p className="text-xs text-gray-500">最常见连号长</p>
        </div>
        <div className="p-3 bg-white border rounded-lg text-center">
          <Calculator className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{a.sumStats.mode}</p>
          <p className="text-xs text-gray-500">和值众数</p>
        </div>
      </div>

      {/* 数据来源 / 更新时间 / 手动同步 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs text-blue-800 space-y-0.5">
          <p>
            📡 数据来源：<strong>{SOURCE_LABEL[state.dataSource || ""] || state.dataSource || "未知"}</strong>
            {" · "}
            共 <strong>{a.meta.totalDraws.toLocaleString()}</strong> 期
            {" · "}
            最新 <strong>{a.meta.latestIssue}</strong>（{a.meta.dateRange.split(" ~ ")[1] || a.meta.latestIssue}）
          </p>
          <p className="text-blue-600/80">🕒 最后更新：{fmtTime(state.lastUpdated)}（北京时间）</p>
        </div>
        <div className="flex items-center gap-2">
          {state.syncMsg && (
            <span className="text-xs text-green-700">{state.syncMsg}</span>
          )}
          <button
            onClick={handleSync}
            disabled={state.syncing}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-1.5"
          >
            {state.syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            {state.syncing ? "同步中..." : "同步最新开奖"}
          </button>
        </div>
      </div>

      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
        ℹ️ 系统已接入真实开奖数据源，并通过定时任务（开奖日北京时间 22:00）自动同步，也可点击右侧按钮手动拉取最新一期。
        所有统计分析均为<strong>描述过去、不预测未来</strong>。
      </p>

      {/* ===== 红球频率分布 ===== */}
      <div className="border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-blue-500" /> 红球历史出现频率（1~33）
          </h3>
          <button onClick={() => setShowAllReds(!showAllReds)} className="text-xs text-blue-600 hover:underline">
            {showAllReds ? "收起" : "展开全部"}
          </button>
        </div>
        <div className="p-4 space-y-1">
          {(showAllReds ? a.redFrequency : a.redFrequency.sort((x, y) => y.count - x.count)).map(f => (
            <FreqBar
              key={f.ball}
              freq={f}
              maxCount={Math.max(...a.redFrequency.map(r => r.count))}
              colorClass={f.count > a.meta.totalDraws * 0.11 ? "bg-red-400" : f.count < a.meta.totalDraws * 0.08 ? "bg-cyan-400" : undefined}
            />
          ))}
        </div>
      </div>

      {/* 蓝球频率 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b">
          <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-indigo-500" /> 蓝球历史出现频率（1~16）
          </h3>
        </div>
        <div className="p-4 space-y-1">
          {a.blueFrequency.map(f => (
            <FreqBar key={f.ball} freq={f} maxCount={Math.max(...a.blueFrequency.map(r => r.count))} />
          ))}
        </div>
      </div>

      {/* 冷热分布 & 遗漏榜（两列布局） */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 左侧：冷热分布 */}
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b">
            <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-500" /> 近 {a.redHotCold.windowSize} 期冷热分布
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {/* 热号 */}
            <div>
              <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 热号 ({a.redHotCold.hot.length}个)
              </p>
              <div className="flex flex-wrap gap-1">
                {a.redHotCold.hot.map(h => (
                  <span key={h.ball} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-mono font-bold">
                    {String(h.ball).padStart(2, "0")}<span className="ml-1 font-normal opacity-60">{h.recentCount?.[0]?.count ?? "?"}</span>
                  </span>
                ))}
              </div>
            </div>
            {/* 温号 */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">温号 ({a.redHotCold.warm.length}个)</p>
              <div className="flex flex-wrap gap-1">
                {a.redHotCold.warm.map(w => (
                  <span key={w.ball} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-mono">
                    {String(w.ball).padStart(2, "0")}
                  </span>
                ))}
              </div>
            </div>
            {/* 冷号 */}
            <div>
              <p className="text-xs font-semibold text-cyan-600 mb-1.5 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> 冷号 ({a.redHotCold.cold.length}个)
              </p>
              <div className="flex flex-wrap gap-1">
                {a.redHotCold.cold.map(c => (
                  <span key={c.ball} className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded-full font-mono font-bold">
                    {String(c.ball).padStart(2, "0")}<span className="ml-1 font-normal opacity-60">{c.recentCount?.[0]?.count ?? "?"}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：遗漏榜 */}
        <div className="space-y-4">
          <OmissionTable entries={a.redOmission} title="红球遗漏榜 TOP 10（当前未出最长）" maxShow={10} />
          <OmissionTable entries={a.blueOmission} title="蓝球遗漏榜" maxShow={16} />
        </div>
      </div>

      {/* 连号 & 和值统计 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-purple-500" /> 连号统计
          </h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between"><span>平均每期连号组数</span><span className="font-mono font-bold">{fmt(a.consecutiveStats.avgConsecutivePerDraw)}</span></div>
            <div className="flex justify-between"><span>单期最大连号长度</span><span className="font-mono font-bold text-red-600">{a.consecutiveStats.maxConsecutiveInOneDraw}</span></div>
            <div className="flex justify-between"><span>最常见连号长度</span><span className="font-mono font-bold">{a.consecutiveStats.mostCommonLength}连</span></div>
            <div className="mt-2 pt-2 border-t">
              <p className="text-gray-500 mb-1">长度分布：</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(a.consecutiveStats.lengthDistribution).map(([len, cnt]) => (
                  <span key={len} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                    {len}连 × {cnt}次
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-orange-500" /> 和值统计（红球）
          </h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between"><span>均值</span><span className="font-mono font-bold">{a.sumStats.mean}</span></div>
            <div className="flex justify-between"><span>标准差</span><span className="font-mono">{a.sumStats.stdDev}</span></div>
            <div className="flex justify-between"><span>最小值</span><span className="font-mono text-green-600">{a.sumStats.min}</span></div>
            <div className="flex justify-between"><span>最大值</span><span className="font-mono text-red-600">{a.sumStats.max}</span></div>
            <div className="flex justify-between"><span>众数</span><span className="font-mono font-bold text-purple-600">{a.sumStats.mode}</span></div>
          </div>
        </div>
      </div>

      {/* ===== 选号辅助 ===== */}
      <div className="border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
          <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-indigo-500" /> 选号辅助
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            ⚠️ 基于历史频率加权随机生成候选组合。<strong>不能提高中奖率</strong>，仅供研究参考。
          </p>
        </div>
        <div className="p-4 space-y-4">
          {/* 策略选择 */}
          <div className="flex gap-2 flex-wrap">
            {STRATEGIES.map(s => (
              <button
                key={s.key}
                onClick={() => { setPickStrategy(s.key); setPickResult(null); }}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                  pickStrategy === s.key
                    ? `${s.color} border-current font-bold shadow-sm`
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {s.label} — {s.desc}
              </button>
            ))}
          </div>

          {/* 生成按钮 */}
          <button
            onClick={handlePick}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"
          >
            <Shuffle className="w-4 h-4" /> 生成一注
          </button>

          {/* 结果展示 */}
          {pickResult && <PickDisplay result={pickResult} />}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   Tab: 蒙特卡洛模拟
   ════════════════════════════════════════ */

function SimulateTab() {
  const [bets, setBets] = useState(1);
  const [sims, setSims] = useState(10000);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState("");

  const handleRun = async () => {
    setRunning(true); setError(""); setResult(null);
    try {
      const r = await fetch(`/api/lottery?action=simulate&type=ssq&bets=${bets}&simulations=${sims}`);
      const d = await r.json();
      if (d.success) setResult(d.data); else setError(d.error || "模拟失败");
    } catch (e: any) { setError(e.message); }
    finally { setRunning(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">每期注数</label>
          <select value={bets} onChange={e => setBets(Number(e.target.value))} className="px-3 py-1.5 border rounded text-sm bg-white">
            {[1, 2, 5, 10].map(n => <option key={n} value={n}>{n} 注</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">模拟期数</label>
          <select value={sims} onChange={e => setSims(Number(e.target.value))} className="px-3 py-1.5 border rounded text-sm bg-white">
            {[1000, 10000, 50000, 100000].map(v => <option key={v} value={v}>{v.toLocaleString()}期</option>)}
          </select>
        </div>
        <button onClick={handleRun} disabled={running}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-1.5">
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          运行模拟
        </button>
      </div>

      {error && <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

      {result && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-blue-50 p-3 rounded text-center"><p className="text-xs text-blue-600">总花费</p><p className="text-lg font-bold text-blue-700">¥{result.totalCost.toLocaleString()}</p></div>
            <div className="bg-green-50 p-3 rounded text-center"><p className="text-xs text-green-600">总奖金</p><p className="text-lg font-bold text-green-700">¥{result.totalPrize.toLocaleString()}</p></div>
            <div className={`p-3 rounded text-center ${result.roi >= 0 ? "bg-green-50" : "bg-red-50"}`}><p className={`text-xs ${result.roi >= 0 ? "text-green-600" : "text-red-600"}`}>ROI</p><p className={`text-lg font-bold ${result.roi >= 0 ? "text-green-700" : "text-red-700"}`}>{(result.roi * 100).toFixed(1)}%</p></div>
            <div className="bg-purple-50 p-3 rounded text-center"><p className="text-xs text-purple-600">总投注</p><p className="text-lg font-bold text-purple-700">{(result.bets * result.simulations).toLocaleString()}注</p></div>
          </div>
          {Object.keys(result.wins).length > 0 && (
            <div><h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Trophy className="w-4 h-4"/>中奖统计</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {Object.entries(result.wins).sort(([, a], [, b]) => b - a).map(([level, count]) =>
                  <div key={level} className="bg-gray-50 p-2 rounded text-center"><p className="text-xs text-gray-500">{level}</p><p className="font-bold text-gray-800">{count}次</p></div>
                )}
              </div>
            </div>
          )}
          {!Object.keys(result.wins).length && <p className="text-center text-gray-400 text-sm py-3">本轮模拟未中奖</p>}
          <div className={`p-3 rounded flex items-start gap-2 ${result.roi > -0.5 ? "bg-amber-50" : "bg-red-50"}`}>
            <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${result.roi > -0.5 ? "text-amber-600" : "text-red-600"}`} />
            <p className={`text-xs leading-relaxed ${result.roi > -0.5 ? "text-amber-800" : "text-red-800"}`}>
              <strong>理性提醒：</strong>长期来看彩票期望值远低于投入。本次 ROI <strong>{(result.roi * 100).toFixed(1)}%</strong>，
              平均每投入1元仅收回<strong>{Math.abs(1 + result.roi).toFixed(2)}元</strong>。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   主页面
   ════════════════════════════════════════ */

export default function AdminLotteryPage() {
  const [tab, setTab] = useState<"info" | "analysis" | "simulate">("analysis");

  return (
    <div className="p-6 space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Dice6 className="w-6 h-6 text-red-500" /> 福利彩票概率统计
          </h1>
          <p className="text-sm text-gray-500 mt-1">历史数据分析 · 频率统计 · 冷热分布 · 遗漏追踪 · 选号辅助 · 蒙特卡洛模拟</p>
        </div>
      </div>

      {/* 免责声明 */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>免责声明：</strong>本页面提供基于数学的概率统计与历史数据分析功能，不构成任何购彩建议。
          彩票本质是随机游戏，过往数据不预示未来结果。所有选号功能均为<strong>加权随机生成，不预测未来，不保证中奖</strong>，
          每期独立随机。请量力而行，理性娱乐。
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: "analysis", label: "📊 历史数据统计", icon: BarChart3 },
          { key: "info", label: "📋 概率规则", icon: Trophy },
          { key: "simulate", label: "⚡ 蒙特卡洛模拟", icon: Zap },
        ].map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t.key ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      {tab === "analysis" && <AnalysisTab />}
      {tab === "info" && <InfoTab type="ssq" />}
      {tab === "simulate" && <SimulateTab />}
    </div>
  );
}
