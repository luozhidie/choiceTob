"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dice6, BarChart3, RotateCcw, Info, TrendingDown,
  AlertTriangle, Trophy, Coins, Zap, ChevronRight,
} from "lucide-react";
import { LotteryType, SimulationResult } from "@/lib/lottery/types";
import { getAllGames, getLotteryGame, expectedValue } from "@/lib/lottery/probability";
import { runSimulation, generateRandomBet } from "@/lib/lottery/simulator";

/* ── 彩票卡片组件 ── */
function LotteryCard({
  type,
  isActive,
  onClick,
}: {
  type: LotteryType;
  isActive: boolean;
  onClick: () => void;
}) {
  const game = getLotteryGame(type);
  const { config } = game;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 transition-all text-left w-full ${
        isActive
          ? "border-red-500 bg-red-50 shadow-lg"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-800">{config.name}</h3>
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500">
          ¥{config.price}/注
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{config.fullName}</p>
      <div className="flex gap-3 text-xs text-gray-600">
        <span>🎯 {config.poolDesc}</span>
        <span>📅 {config.drawSchedule}</span>
      </div>

      {/* 概率提示 */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          总组合数：{game.totalCombinations.toLocaleString()}
        </p>
      </div>
    </motion.button>
  );
}

/* ── 奖级表格 ── */
function PrizeTable({ type }: { type: LotteryType }) {
  const game = getLotteryGame(type);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-600">
            <th className="px-3 py-2 text-left">奖级</th>
            <th className="px-3 py-2 text-left">条件</th>
            <th className="px-3 py-2 text-right">概率</th>
            <th className="px-3 py-2 text-right">奖金</th>
          </tr>
        </thead>
        <tbody>
          {game.prizes.map((p) => (
            <tr key={p.level} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2 font-medium text-gray-800">{p.level}</td>
              <td className="px-3 py-2 text-gray-600">{p.condition}</td>
              <td className="px-3 py-2 text-right font-mono text-xs text-orange-600">{p.odds}</td>
              <td className="px-3 py-2 text-right text-green-600">{p.prize}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── 模拟器面板 ── */
function SimulatorPanel({ type }: { type: LotteryType }) {
  const [bets, setBets] = useState(1);
  const [simulations, setSimulations] = useState(1000);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setResult(null);

    // 调用 API 执行模拟（服务端计算）
    try {
      const res = await fetch(
        `/api/lottery?action=simulate&type=${type}&bets=${bets}&simulations=${simulations}`
      );
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } catch {
      // 如果API失败，前端直接算
      const localResult = runSimulation({ lotteryType: type, bets, simulations });
      setResult(localResult as any);
    }

    setRunning(false);
  }, [type, bets, simulations]);

  // 快速选号
  const [quickPick, setQuickPick] = useState<string>("");

  const handleQuickPick = () => {
    const bet = generateRandomBet(type);
    if (type === "ssq") {
      setQuickPick(
        `红球: ${bet.reds.map(n => n.toString().padStart(2, "0")).join(" ")} | 蓝球: ${bet.blues?.map(n => n.toString().padStart(2, "0"))}`
      );
    } else if (type === "dlt") {
      setQuickPick(
        `前区: ${bet.reds.map(n => n.toString().padStart(2, "0")).join(" ")} | 后区: ${bet.blues?.map(n => n.toString().padStart(2, "0")).join(" ")}`
      );
    } else {
      setQuickPick(`号码: ${bet.reds.join("")}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* 参数设置 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            每期注数
          </label>
          <select
            value={bets}
            onChange={(e) => setBets(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {[1, 2, 5, 10].map((n) => (
              <option key={n} value={n}>
                {n} 注
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            模拟期数
          </label>
          <select
            value={simulations}
            onChange={(e) => setSimulations(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {[
              { v: 1000, l: "1,000期" },
              { v: 10000, l: "1万期" },
              { v: 50000, l: "5万期" },
              { v: 100000, l: "10万期" },
            ].map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleRun}
          disabled={running}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {running ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              计算中...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              开始模拟
            </>
          )}
        </button>
        <button
          onClick={handleQuickPick}
          className="px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-red-300 hover:text-red-500 transition-colors"
        >
          <Dice6 className="w-5 h-5" />
        </button>
      </div>

      {/* 机选号码 */}
      {quickPick && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center"
        >
          <p className="font-mono text-sm text-yellow-800">{quickPick}</p>
        </motion.div>
      )}

      {/* 模拟结果 */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* 核心指标 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-blue-600 mb-1">总花费</p>
                <p className="text-lg font-bold text-blue-700">
                  ¥{result.totalCost.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600 mb-1">总奖金</p>
                <p className="text-lg font-bold text-green-700">
                  ¥{result.totalPrize.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-lg text-center ${result.roi >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                <p className={`text-xs mb-1 ${result.roi >= 0 ? "text-green-600" : "text-red-600"}`}>ROI</p>
                <p className={`text-lg font-bold ${result.roi >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {(result.roi * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* 中奖明细 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                中奖统计 ({result.simulations.toLocaleString()}期 × {result.bets}注)
              </h4>
              {Object.keys(result.wins).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(result.wins)
                    .sort(([, a], [, b]) => b - a)
                    .map(([level, count]) => (
                      <div key={level} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{level}</span>
                        <span className="font-mono font-medium text-gray-800">
                          {count} 次
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-sm py-4">
                  😢 本轮模拟未中奖
                </p>
              )}
            </div>

            {/* ROI 提示 */}
            <div className={`p-3 rounded-lg flex items-start gap-2 ${result.roi > -0.5 ? "bg-yellow-50" : "bg-red-50"}`}>
              {result.roi > -0.5 ? (
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              )}
              <div className="text-xs leading-relaxed">
                <p className={result.roi > -0.5 ? "text-yellow-800" : "text-red-800"}>
                  <strong>理性提醒：</strong>
                  长期来看，彩票的数学期望值远低于投入金额。本次模拟的ROI为{" "}
                  <strong>{(result.roi * 100).toFixed(1)}%</strong>，
                  意味着平均每投入1元，只能回收约{" "}
                  <strong>{Math.abs(1 + result.roi).toFixed(2)}</strong> 元。
                  请将购彩视为娱乐，而非投资。
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════ 主页面 ══════════════════ */

export default function LotteryPage() {
  const [activeType, setActiveType] = useState<LotteryType>("ssq");
  const [tab, setTab] = useState<"info" | "simulate">("info");
  const games = getAllGames();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 头部 */}
      <header className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Dice6 className="w-8 h-8" />
              <h1 className="text-2xl font-bold">福利彩票概率统计</h1>
            </div>
            <p className="text-red-100 text-sm">
              数学视角看彩票 · 蒙特卡洛模拟 · 理性分析
            </p>
          </motion.div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 免责声明 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <strong>免责声明：</strong>
            本页面仅提供基于数学的概率统计与模拟功能，
            不构成任何购彩建议。彩票本质是随机游戏，过往数据不预示未来结果。
            未成年禁止购彩。请量力而行，理性娱乐。
          </div>
        </motion.div>

        {/* 彩票选择 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {games.map(({ type }) => (
            <LotteryCard
              key={type}
              type={type}
              isActive={activeType === type}
              onClick={() => {
                setActiveType(type);
                setTab("info");
              }}
            />
          ))}
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setTab("info")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === "info"
                ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1" />
            概率详情
          </button>
          <button
            onClick={() => setTab("simulate")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === "simulate"
                ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Zap className="w-4 h-4 inline mr-1" />
            蒙特卡洛模拟
          </button>
        </div>

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          {tab === "info" ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* 游戏规则 */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    {getLotteryGame(activeType).config.name} · 玩法说明
                  </h3>
                </div>
                <div className="p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed font-sans">
                    {getLotteryGame(activeType).rules}
                  </pre>
                </div>
              </div>

              {/* 奖级表 */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-purple-500" />
                    中奖概率 & 奖金设置
                  </h3>
                </div>
                <div className="p-4">
                  <PrizeTable type={activeType} />
                </div>
              </div>

              {/* 数学期望 */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  数学期望分析
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {getLotteryGame(activeType).config.name}
                  的单注期望回报约为{" "}
                  <strong className="text-indigo-700">
                    ¥{(expectedValue(getLotteryGame(activeType).prizes)).toFixed(2)}
                  </strong>{" "}
                  （投入¥{getLotteryGame(activeType).config.price}）。
                  这意味着长期来看，每花1元购彩，平均只能收回约{" "}
                  <strong className="text-red-600">
                    {(expectedValue(getLotteryGame(activeType).prizes) / getLotteryGame(activeType).config.price * 100).toFixed(1)}%
                  </strong>{" "}
                  。
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="simulate"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-red-500" />
                蒙特卡洛模拟投注
              </h3>
              <SimulatorPanel type={activeType} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部信息 */}
        <footer className="text-center text-xs text-gray-400 py-6 space-y-1">
          <p>数据来源：中国福利彩票 / 中国体育彩票官方规则</p>
          <p>概率计算基于组合数学 · 模拟采用伪随机数生成器</p>
          <p className="pt-2">
            本工具仅供学习研究使用 ·{" "}
            <a href="/" className="text-red-500 hover:underline">
              返回首页
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
