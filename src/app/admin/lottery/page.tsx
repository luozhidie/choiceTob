"use client";

import { useState, useCallback } from "react";
import { Dice6, BarChart3, RotateCcw, Info, AlertTriangle, Trophy, Zap } from "lucide-react";
import { LotteryType, SimulationResult } from "@/lib/lottery/types";
import { getAllGames, getLotteryGame, expectedValue } from "@/lib/lottery/probability";
import { runSimulation, generateRandomBet } from "@/lib/lottery/simulator";

/* ── 彩票选择卡片 ── */
function GameCard({
  type,
  active,
  onClick,
}: {
  type: LotteryType;
  active: boolean;
  onClick: () => void;
}) {
  const game = getLotteryGame(type);
  const c = game.config;

  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border text-left transition-all w-full ${
        active
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-gray-800 text-sm">{c.name}</span>
        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500">
          ¥{c.price}/注
        </span>
      </div>
      <p className="text-xs text-gray-400">{c.drawSchedule} · 总组合 {game.totalCombinations.toLocaleString()}</p>
    </button>
  );
}

/* ── 奖级表 ── */
function PrizeTable({ type }: { type: LotteryType }) {
  const game = getLotteryGame(type);

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-xs">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-600">奖级</th>
            <th className="px-3 py-2 text-left font-medium text-gray-600">条件</th>
            <th className="px-3 py-2 text-right font-medium text-gray-600">概率</th>
            <th className="px-3 py-2 text-right font-medium text-gray-600">奖金</th>
          </tr>
        </thead>
        <tbody>
          {game.prizes.map((p) => (
            <tr key={p.level} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-1.5 font-medium">{p.level}</td>
              <td className="px-3 py-1.5 text-gray-600">{p.condition}</td>
              <td className="px-3 py-1.5 text-right font-mono text-orange-600">{p.odds}</td>
              <td className="px-3 py-1.5 text-right text-green-600">{p.prize}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── 模拟器 ── */
function Simulator({ type }: { type: LotteryType }) {
  const [bets, setBets] = useState(1);
  const [sims, setSims] = useState(1000);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState("");
  const [quickPick, setQuickPick] = useState("");

  const handleRun = async () => {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const r = await fetch(`/api/lottery?action=simulate&type=${type}&bets=${bets}&simulations=${sims}`);
      const d = await r.json();
      if (d.success) {
        setResult(d.data);
      } else {
        setError(d.error || "模拟失败");
      }
    } catch (e: any) {
      setError("请求异常：" + e.message);
    } finally {
      setRunning(false);
    }
  };

  const handleQuickPick = () => {
    const bet = generateRandomBet(type);
    if (type === "ssq") {
      setQuickPick(`红球 ${bet.reds.map(n => n.toString().padStart(2, "0")).join(" ")} | 蓝球 ${bet.blues?.map(n => n.toString().padStart(2, "0"))}`);
    } else if (type === "dlt") {
      setQuickPick(`前区 ${bet.reds.map(n => n.toString().padStart(2, "0")).join(" ")} | 后区 ${bet.blues?.map(n => n.toString().padStart(2, "0")).join(" ")}`);
    } else {
      setQuickPick(`号码 ${bet.reds.join("")}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* 参数 */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">每期注数</label>
          <select
            value={bets}
            onChange={(e) => setBets(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
          >
            {[1, 2, 5, 10].map((n) => (
              <option key={n} value={n}>{n} 注</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">模拟期数</label>
          <select
            value={sims}
            onChange={(e) => setSims(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
          >
            <option value={1000}>1,000期</option>
            <option value={10000}>1万期</option>
            <option value={50000}>5万期</option>
            <option value={100000}>10万期</option>
          </select>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-1.5"
        >
          {running ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          开始模拟
        </button>
        <button
          onClick={handleQuickPick}
          className="px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 text-sm rounded hover:border-blue-300"
        >
          <Dice6 className="w-4 h-4 inline" />
        </button>
      </div>

      {/* 机选结果 */}
      {quickPick && (
        <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded text-center">
          <span className="font-mono text-sm text-yellow-800">{quickPick}</span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 模拟结果 */}
      {result && (
        <div className="border rounded-lg p-4 space-y-4">
          {/* 核心指标 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-blue-50 p-3 rounded text-center">
              <p className="text-xs text-blue-600">总花费</p>
              <p className="text-lg font-bold text-blue-700">¥{result.totalCost.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-3 rounded text-center">
              <p className="text-xs text-green-600">总奖金</p>
              <p className="text-lg font-bold text-green-700">¥{result.totalPrize.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded text-center ${result.roi >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`text-xs ${result.roi >= 0 ? "text-green-600" : "text-red-600"}`}>ROI</p>
              <p className={`text-lg font-bold ${result.roi >= 0 ? "text-green-700" : "text-red-700"}`}>
                {(result.roi * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded text-center">
              <p className="text-xs text-purple-600">总投注</p>
              <p className="text-lg font-bold text-purple-700">{(result.bets * result.simulations).toLocaleString()}注</p>
            </div>
          </div>

          {/* 中奖明细 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> 中奖统计
            </h4>
            {Object.keys(result.wins).length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {Object.entries(result.wins)
                  .sort(([, a], [, b]) => b - a)
                  .map(([level, count]) => (
                    <div key={level} className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-xs text-gray-500">{level}</p>
                      <p className="font-bold text-gray-800">{count}次</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-3">本轮模拟未中奖</p>
            )}
          </div>

          {/* 提醒 */}
          <div className={`p-3 rounded flex items-start gap-2 ${result.roi > -0.5 ? "bg-amber-50" : "bg-red-50"}`}>
            <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${result.roi > -0.5 ? "text-amber-600" : "text-red-600"}`} />
            <p className={`text-xs leading-relaxed ${result.roi > -0.5 ? "text-amber-800" : "text-red-800"}`}>
              <strong>理性提醒：</strong>长期来看彩票期望值远低于投入。本次 ROI{" "}
              <strong>{(result.roi * 100).toFixed(1)}%</strong>，
              平均每投入1元仅收回约<strong>{Math.abs(1 + result.roi).toFixed(2)}元</strong>。
              请将购彩视为娱乐，不构成任何投资建议。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═════════════ 主页面 ═════════════ */
export default function AdminLotteryPage() {
  const [activeType, setActiveType] = useState<LotteryType>("ssq");
  const [tab, setTab] = useState<"info" | "simulate">("info");
  const games = getAllGames();
  const game = getLotteryGame(activeType);

  return (
    <div className="p-6 space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Dice6 className="w-6 h-6 text-red-500" />
            福利彩票概率统计
          </h1>
          <p className="text-sm text-gray-500 mt-1">数学视角看彩票 · 蒙特卡洛模拟 · 理性分析</p>
        </div>
      </div>

      {/* 免责声明 */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>免责声明：</strong>本页面仅提供基于数学的概率统计与模拟功能，不构成任何购彩建议。
          彩票本质是随机游戏，过往数据不预示未来结果。请量力而行，理性娱乐。
        </p>
      </div>

      {/* 彩票选择 */}
      <div className="grid grid-cols-4 gap-3">
        {games.map(({ type }) => (
          <GameCard
            key={type}
            type={type}
            active={activeType === type}
            onClick={() => { setActiveType(type); setTab("info"); }}
          />
        ))}
      </div>

      {/* Tab切换 */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("info")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "info"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 inline mr-1" />
          概率详情
        </button>
        <button
          onClick={() => setTab("simulate")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "simulate"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Zap className="w-3.5 h-3.5 inline mr-1" />
          蒙特卡洛模拟
        </button>
      </div>

      {/* 内容区域 */}
      {tab === "info" && (
        <div className="space-y-4">
          {/* 玩法规则 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b">
              <h3 className="font-semibold text-sm text-gray-800">{game.config.name} · 玩法说明</h3>
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed font-sans">
                {game.rules}
              </pre>
            </div>
          </div>

          {/* 奖级表 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b">
              <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-purple-500" /> 中奖概率 & 奖金设置
              </h3>
            </div>
            <div className="p-4">
              <PrizeTable type={activeType} />
            </div>
          </div>

          {/* 数学期望 */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> 数学期望分析
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {game.config.name} 单注期望回报约{" "}
              <strong className="text-indigo-700">¥{expectedValue(game.prizes).toFixed(2)}</strong>{" "}
              （投入¥{game.config.price}）。
              长期回收率仅{" "}
              <strong className="text-red-600">
                {(expectedValue(game.prizes) / game.config.price * 100).toFixed(1)}%
              </strong>。
            </p>
          </div>
        </div>
      )}

      {tab === "simulate" && (
        <Simulator type={activeType} />
      )}
    </div>
  );
}
