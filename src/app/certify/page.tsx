"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ALL_STYLES } from "@/lib/styles";
import { estimateRankPercent, formatYuan } from "@/lib/rank";
import {
  ShieldCheck, ArrowRight, CheckCircle2, XCircle,
  ChevronRight, Sparkles, Crown, Package, Eye,
  Loader2, Trophy, TrendingUp, Gift, Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ==================== 答题题库 ==================== */
interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number; // 正确答案的选项索引
}

const QUIZ: QuizQuestion[] = [
  {
    id: 1,
    question: "炒货就是某些档口到一批市场拿的货，在其他一批市场卖同款",
    options: ["A. 对", "B. 错"],
    correctIndex: 0,
  },
  {
    id: 2,
    question: '以下哪个属于"拿货"的术语？',
    options: ["A. 多少钱1件", "B. 怎么拿", "C. 衣服怎么卖"],
    correctIndex: 1,
  },
  {
    id: 3,
    question: "以下哪个属于正确的服装批发市场？",
    options: ["A. 杭州四季青", "B. 广州四季青", "C. 深圳四季青"],
    correctIndex: 0,
  },
  {
    id: 4,
    question: "10件起批是什么意思？",
    options: ["A. 10件以内按批发价", "B. 10件才能按批发价", "C. 100件才能按批发价"],
    correctIndex: 1,
  },
  {
    id: 5,
    question: '在服装行业中，同一个款是"打包价"便宜还是"拿货价"便宜？',
    options: ["A. 打包价", "B. 拿货价"],
    correctIndex: 0,
  },
  {
    id: 6,
    question: "二批市场就是从一批拿货回各个城市销售的",
    options: ["A. 对", "B. 错"],
    correctIndex: 0,
  },
];

type CertStep =
  | "intro"
  | "quiz"
  | "passed"
  | "style"
  | "recommend"
  | "sales"
  | "rank"
  | "benefits"
  | "done";

const TIER_BENEFITS = [
  { amount: "5万", returnRate: "5%", color: "from-blue-500 to-blue-400" },
  { amount: "10万", returnRate: "10%", color: "from-amber-500 to-orange-400" },
  { amount: "30万", returnRate: "20%", color: "from-purple-500 to-pink-400" },
];

export default function CertifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, refreshProfile, isCertifiedStoreOwner } = useAuth();

  const [step, setStep] = useState<CertStep>("intro");
  const [quizIdx, setQuizIdx] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false); // 当前题答对/错反馈
  const [isCorrect, setIsCorrect] = useState(false);

  // 用户输入
  const [styleInput, setStyleInput] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [salesInput, setSalesInput] = useState("");

  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // 已认证 → 跳转或展示
  useEffect(() => {
    if (isCertifiedStoreOwner) {
      setStep("done");
    }
  }, [isCertifiedStoreOwner]);

  // 从 ?redirect= 回跳
  const redirectTo = searchParams.get("redirect") || "/buyer";

  /* ── 答题逻辑 ── */
  const handleSelectAnswer = (idx: number) => {
    if (showResult) return; // 已显示结果时不可再选
    setSelectedAnswer(idx);
  };

  const confirmAnswer = () => {
    if (selectedAnswer === null) return;
    const q = QUIZ[quizIdx];
    const correct = selectedAnswer === q.correctIndex;
    setIsCorrect(correct);
    setShowResult(true);

    if (!correct) {
      setWrongCount((c) => c + 1);
    }
  };

  const nextQuestion = () => {
    setShowResult(false);
    setSelectedAnswer(null);
    if (quizIdx < QUIZ.length - 1) {
      setQuizIdx((i) => i + 1);
    } else {
      // 全部答完
      setStep("passed");
    }
  };

  /* ── 风格选择 ── */
  const toggleStyle = (value: string) => {
    setSelectedStyles((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  /* ── 提交认证 ── */
  const submitCertification = async () => {
    if (!user) {
      router.push(`/login?redirect=/certify?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    try {
      const sales = salesInput ? Number(salesInput.replace(/[^\d]/g, "")) : 0;

      const res = await fetch("/api/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_passed: true,
          style: selectedStyles.length > 0 ? selectedStyles.join(",") : styleInput || undefined,
          monthly_sales: sales > 0 ? sales : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "提交失败");

      // 刷新 auth context 使 canViewWholesale 生效
      await refreshProfile();
      setStep("benefits");
    } catch (err: any) {
      setSubmitError(err.message || "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const gotoBuyer = () => {
    router.push(redirectTo);
  };

  /* ── 渲染：各步骤 ── */

  // 已认证完成
  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-5 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-primary mb-2">您已是认证店主</h1>
          <p className="text-sm text-muted-foreground mb-6">
            认证时间：{profile?.certified_at
              ? new Date(profile.certified_at).toLocaleDateString("zh-CN")
              : "已认证"}
            {profile?.certified_style && (
              <>
                <br />常拿风格：<span className="font-medium">{profile.certified_style}</span>
              </>
            )}
          </p>
          <div className="space-y-3">
            <button onClick={gotoBuyer} className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:brightness-110 transition-all">
              去看款拿货
            </button>
            <Link href="/my" className="block w-full py-3 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl text-center hover:bg-gray-50">
              返回个人中心
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const q = QUIZ[quizIdx];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-accent/5 to-white">
      {/* 顶部导航条 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {step !== "intro" && step !== "done" && (
            <button
              onClick={() => {
                if (step === "quiz" && quizIdx > 0) {
                  setQuizIdx((i) => i - 1);
                  setShowResult(false);
                  setSelectedAnswer(null);
                } else if (step === "passed") {
                  setStep("quiz");
                  setQuizIdx(QUIZ.length - 1);
                  setShowResult(false);
                  setSelectedAnswer(null);
                } else if (step === "style") setStep("passed");
                else if (step === "recommend") setStep("style");
                else if (step === "sales") setStep("recommend");
                else if (step === "rank") setStep("sales");
                else if (step === "benefits") setStep("rank");
              }}
              className="text-sm text-gray-500 hover:text-primary"
            >
              ← 上一步
            </button>
          )}
          {!user && (
            <Link href={`/login?redirect=/certify`} className="ml-auto text-sm text-primary font-medium hover:underline">
              登录
            </Link>
          )}
        </div>

        {/* 进度条（答题阶段） */}
        {step === "quiz" && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>题目 {quizIdx + 1}/{QUIZ.length}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={false}
                  animate={{ width: `${((quizIdx + 1) / QUIZ.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Step 1: 开场 ── */}
      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-lg mx-auto px-4 pt-12 pb-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg mb-5">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-primary leading-snug mb-3">认证店主</h1>
              <p className="text-base text-gray-600 leading-relaxed">
                为了让您更好的拿货，<br />所有店主均需通过认证后才能看款/拿货！
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 space-y-4">
              {[
                { icon: Eye, title: "批发价查看权", desc: "通过认证即可查看所有商品批发价" },
                { icon: Gift, title: "退换额度权益", desc: "充值后享阶梯退换额度（最高20%）" },
                { icon: Sparkles, title: "新款抢先看", desc: "当季新品提前浏览与推荐" },
                { icon: TrendingUp, title: "全国排名", desc: "了解自己在行业中的位置" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep("quiz")}
              className="w-full py-4 bg-accent text-white text-lg font-bold rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2"
            >
              开始认证答题
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">共 {QUIZ.length} 道行业知识题 · 不限次数可重答</p>
          </motion.div>
        )}

        {/* ── Step 2: 答题 ── */}
        {step === "quiz" && (
          <motion.div key={`quiz-${quizIdx}`} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.25 }} className="max-w-lg mx-auto px-4 pt-8 pb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              {/* 题目 */}
              <div className="mb-6">
                <span className="inline-flex items-center px-2.5 py-0.5 bg-accent/10 text-accent text-xs font-bold rounded-full mb-3">
                  第 {quizIdx + 1} 题
                </span>
                <h2 className="text-lg font-bold text-gray-900 leading-relaxed">{q.question}</h2>
              </div>

              {/* 选项 */}
              <div className="space-y-3">
                {q.options.map((opt, idx) => {
                  let cls = "border-gray-200 hover:border-primary hover:bg-primary/5";
                  if (showResult) {
                    if (idx === q.correctIndex) {
                      cls = "border-green-400 bg-green-50 text-green-700";
                    } else if (idx === selectedAnswer && !isCorrect) {
                      cls = "border-red-300 bg-red-50 text-red-600";
                    } else {
                      cls = "border-gray-100 bg-gray-50 text-gray-400";
                    }
                  } else if (selectedAnswer === idx) {
                    cls = "border-primary bg-primary/10 text-primary";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      disabled={showResult}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${cls}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg border-2 border-current flex items-center justify-center text-xs shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt}
                        {showResult && idx === q.correctIndex && (
                          <CheckCircle2 className="w-4.5 h-4.5 ml-auto text-green-500 shrink-0" />
                        )}
                        {showResult && idx === selectedAnswer && !isCorrect && idx !== q.correctIndex && (
                          <XCircle className="w-4.5 h-4.5 ml-auto text-red-500 shrink-0" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 答案结果提示 */}
              {showResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 p-3 rounded-xl text-sm text-center ${isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {isCorrect ? (
                    <>✅ 回答正确！</>
                  ) : (
                    <>❌ 回答错误，正确答案是「{q.options[q.correctIndex]}」</>
                  )}
                </motion.div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="mt-5">
              {!showResult ? (
                <button
                  onClick={confirmAnswer}
                  disabled={selectedAnswer === null}
                  className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  确认选择
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl hover:brightness-110 transition-all"
                >
                  {quizIdx < QUIZ.length - 1 ? "下一题" : "查看结果"}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Step 3: 通过 ── */}
        {step === "passed" && (
          <motion.div key="passed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto px-4 pt-10 pb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="w-14 h-14 text-green-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-primary mb-2">恭喜通过！</h1>
            <p className="text-gray-500 mb-2">您已具备服装批发行业基础知识</p>
            <p className="text-lg font-bold text-accent mb-8">开启您的拿货之旅吧！</p>

            <button
              onClick={() => setStep("style")}
              className="w-full py-4 bg-accent text-white text-lg font-bold rounded-2xl hover:brightness-110 transition-all shadow-md"
            >
              下一步：填写经营风格
              <ChevronRight className="w-5 h-5 inline ml-1" />
            </button>
          </motion.div>
        )}

        {/* ── Step 4: 输入风格 ── */}
        {step === "style" && (
          <motion.div key="style" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto px-4 pt-8 pb-8">
            <h2 className="text-lg font-bold text-primary text-center mb-1">您常拿什么风格的货？</h2>
            <p className="text-sm text-gray-400 text-center mb-6">帮助我们为您推荐更精准的商品</p>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
              {/* 快捷标签 */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">快捷选择（可多选）</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => toggleStyle(s.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedStyles.includes(s.value)
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 自定义输入 */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">或自定义描述</label>
                <input
                  type="text"
                  value={styleInput}
                  onChange={(e) => setStyleInput(e.target.value)}
                  placeholder="如：韩系女装、日系休闲、欧美大牌..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
            </div>

            <button
              onClick={() => setStep("recommend")}
              className="w-full mt-5 py-3.5 bg-accent text-white font-semibold rounded-xl hover:brightness-110 transition-all"
            >
              下一步：获取推荐
              <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </motion.div>
        )}

        {/* ── Step 5: 推荐 ── */}
        {step === "recommend" && (
          <motion.div key="recommend" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto px-4 pt-8 pb-8">
            <h2 className="text-lg font-bold text-primary text-center mb-1">为您推荐当季市场的畅销风格</h2>
            <p className="text-sm text-gray-400 text-center mb-6">基于您选择的风格偏好</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {(selectedStyles.length > 0
                ? selectedStyles.slice(0, 4).map((v) => ALL_STYLES.find((s) => s.value === v))
                : [
                    { label: "淑女风", proLabel: "少女型", value: "shao_nv" },
                    { label: "潮牌风", proLabel: "时尚型", value: "shi_shang_f" },
                    { label: "职业风", proLabel: "古典型", value: "gu_dian_f" },
                    { label: "休闲风", proLabel: "自然型", value: "zi_ran_f" },
                  ]
              )
                .filter(Boolean)
                .map((s) => (
                  <div key={s!.value} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                    <Sparkles className="w-7 h-7 mx-auto text-amber-400 mb-2" />
                    <p className="font-bold text-sm text-gray-900">{s!.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{s!.proLabel} · 当季热销</p>
                  </div>
                ))}
            </div>

            <button
              onClick={() => setStep("sales")}
              className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl hover:brightness-110 transition-all"
            >
              下一步：填写月销售额
              <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </motion.div>
        )}

        {/* ── Step 6: 月销售额 ── */}
        {step === "sales" && (
          <motion.div key="sales" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto px-4 pt-8 pb-8">
            <h2 className="text-lg font-bold text-primary text-center mb-1">输入您上月销售额</h2>
            <p className="text-sm text-gray-400 text-center mb-6">看看自己在全国的销售排名</p>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <label className="text-xs font-medium text-gray-500 block mb-1.5">上月销售额（元）</label>
              <input
                type="number"
                inputMode="decimal"
                value={salesInput}
                onChange={(e) => setSalesInput(e.target.value)}
                placeholder="如：50000"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-mono text-center focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              <p className="text-[11px] text-gray-400 text-center mt-2">仅用于排名估算，不会公开</p>
            </div>

            <button
              onClick={() => setStep("rank")}
              className="w-full mt-5 py-3.5 bg-accent text-white font-semibold rounded-xl hover:brightness-110 transition-all"
            >
              查看我的排名
              <TrendingUp className="w-4 h-4 inline ml-1" />
            </button>
          </motion.div>
        )}

        {/* ── Step 7: 排名 ── */}
        {step === "rank" && (
          <motion.div key="rank" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto px-4 pt-8 pb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 180, delay: 0.15 }}
              className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-5"
            >
              <Trophy className="w-10 h-10 text-amber-500" />
            </motion.div>

            {(() => {
              const sales = Number(salesInput) || 0;
              const pct = estimateRankPercent(sales);
              return (
                <>
                  <p className="text-2xl font-black text-primary mb-1">
                    您上月超过了全国 <span className="text-accent">{pct}%</span> 的店主
                  </p>
                  {sales >= 10000 ? (
                    <p className="text-sm text-gray-500 mb-6">
                      月销 ¥{formatYuan(sales)} · 表现优异！
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 mb-6">继续加油！</p>
                  )}
                </>
              );
            })()}

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/60 mb-6">
              <p className="text-sm text-amber-800">
                💡 排名基于当前平台数据估算，随着用户积累将越来越准确。后续开通真实数据统计后将自动更新。
              </p>
            </div>

            <button
              onClick={submitCertification}
              disabled={submitting}
              className="w-full py-4 bg-accent text-white text-lg font-bold rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 提交中...</>
              ) : (
                <>完成认证，开启批发价 <ShieldCheck className="w-5 h-5" /></>
              )}
            </button>

            {submitError && (
              <p className="mt-3 text-sm text-red-500 text-center">{submitError}</p>
            )}
          </motion.div>
        )}

        {/* ── Step 8: 权益展示 & 完成 ── */}
        {step === "benefits" && (
          <motion.div key="benefits" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto px-4 pt-8 pb-8">
            <div className="text-center mb-6">
              <div className="w-18 h-18 mx-auto rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg mb-4 w-16 h-16">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl font-bold text-primary">认证成功！🎉</h1>
              <p className="text-sm text-gray-500 mt-1">您已获得以下店主权益</p>
            </div>

            {/* 权益卡片 */}
            <div className="space-y-3 mb-6">
              {/* 1. 批发价查看 */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <Eye className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-800 text-sm">✅ 批发价已解锁</p>
                  <p className="text-xs text-green-600 mt-0.5">所有商品批发价立即可见，免费使用</p>
                </div>
              </div>

              {/* 2. 退换额度 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-500" /> 退换额度（充值后生效）
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {TIER_BENEFITS.map((t) => (
                    <div key={t.amount} className={`rounded-lg p-2.5 text-center bg-gradient-to-br ${t.color}`}>
                      <p className="text-white text-xs font-bold">充{t.amount}</p>
                      <p className="text-white/90 text-[11px]">退换{t.returnRate}</p>
                    </div>
                  ))}
                </div>
                <Link href="/members" className="block mt-2 text-xs text-primary text-right hover:underline">去充值 →</Link>
              </div>

              {/* 3. 新款抢看 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" /> 新款抢先看
                </p>
                <p className="text-xs text-gray-500">当季新品提前浏览，热门款式优先推送</p>
              </div>

              {/* 4. 全国排名 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-500" /> 全国销售排名
                </p>
                <p className="text-xs text-gray-500">
                  您上月超过了全国 <strong>{estimateRankPercent(Number(salesInput))}%</strong> 的店主
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={gotoBuyer}
                className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" /> 去看款拿货
              </button>
              <Link href="/my" className="block w-full py-3 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl text-center hover:bg-gray-50">
                前往个人中心
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TabBar 占位（移动端适配） */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
