"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { maleTestConfig, calculateMaleResult, getMarketStyleName } from "@/lib/style-test-data";
import type { StyleResult } from "@/lib/style-test-data";
import { motion, AnimatePresence } from "framer-motion";
import StyleTestProPay from "@/components/style-test/StyleTestProPay";
import {
  ChevronRight,
  Home,
  ClipboardList,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Phone,
  User,
  MessageCircle,
  QrCode,
} from "lucide-react";

const { preferenceQuestion, questions, results } = maleTestConfig;

export default function MaleStyleTestPage() {
  // 支付流程：扫码付款 → 微信回调自动发权益 → 跳转测试（与 tryon 专业版套餐打通）
  const [payStep, setPayStep] = useState<"pay" | "testing">("pay");

  // 测试相关
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [preference, setPreference] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [resultStyle, setResultStyle] = useState<StyleResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingLead, setSavingLead] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: "",
    phone: "",
    wechat: "",
  });

  const supabase = createClient();
  const totalQuestions = questions.length + 1;

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0 || !preference) {
      const missingCount = unanswered.length + (preference ? 0 : 1);
      alert(`还有 ${missingCount} 道题未作答，请完成所有题目后提交`);
      const firstUnanswered = !preference
        ? "preference"
        : unanswered[0]?.id;
      if (firstUnanswered) {
        document
          .getElementById(`question-${firstUnanswered}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);
    try {
      const styleName = calculateMaleResult(answers, preference);
      const result = results.find((r) => r.name === styleName) || results[0];
      setResultStyle(result);

      await supabase.from("style_test_results").insert([
        {
          gender: "male",
          answers,
          preference,
          main_style: styleName,
        },
      ]);

      setShowResult(true);
    } catch (error: any) {
      console.error("提交失败:", error);
      alert("提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name.trim() || !leadForm.phone.trim()) {
      alert("请填写姓名和手机号");
      return;
    }
    if (!/^1\d{10}$/.test(leadForm.phone)) {
      alert("请输入正确的手机号");
      return;
    }
    setSavingLead(true);
    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadForm.name.trim(),
          phone: leadForm.phone.trim(),
          wechat: leadForm.wechat.trim() || null,
          source: "male_style_test",
          interest: resultStyle?.name || "",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        console.error("留资失败:", json.error);
        alert("提交失败，请重试");
        return;
      }

      await supabase.rpc("upsert_customer_from_test", {
        p_name: leadForm.name.trim(),
        p_phone: leadForm.phone.trim(),
        p_wechat: leadForm.wechat.trim() || null,
        p_gender: "male",
        p_main_style: resultStyle?.name || null,
        p_source: "male_style_test",
      });

      setLeadSubmitted(true);
    } catch (error: any) {
      console.error("留资失败:", error);
      alert("提交失败，请重试");
    } finally {
      setSavingLead(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setPreference("");
    setShowResult(false);
    setResultStyle(null);
    setLeadSubmitted(false);
    setLeadForm({ name: "", phone: "", wechat: "" });
    setPayStep("pay");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answeredCount = Object.keys(answers).length + (preference ? 1 : 0);

  // 未支付：扫码付款（自动支付，微信回调后跳转）
  if (payStep === "pay") {
    return <StyleTestProPay onPaid={() => setPayStep("testing")} />;
  }

  // 已支付：显示测试界面（原有代码保持不变）
  // eslint-disable-next-line no-case-declarations
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              首页
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/style-test" className="hover:text-primary transition-colors">
              风格测试
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-primary font-medium">男士风格测试</span>
          </nav>
        </div>
      </div>

      {/* Page Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white py-10 md:py-14">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3"
          >
            男士风格测试
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm md:text-base text-white/80"
          >
            共 {totalQuestions} 道题，约3分钟完成
          </motion.p>
          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-md mx-auto"
          >
            <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
              <span>完成进度</span>
              <span>{answeredCount} / {totalQuestions}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div
                className="bg-accent rounded-full h-2"
                initial={{ width: 0 }}
                animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Preference Question */}
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <motion.div
          id="question-preference"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 text-accent text-sm font-bold">
                喜
              </span>
              <h3 className="text-lg font-semibold text-primary">
                {preferenceQuestion.text}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {preferenceQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPreference(option.value)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${
                    preference === option.value
                      ? "border-accent bg-accent/5 shadow-sm"
                      : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      preference === option.value
                        ? "border-accent"
                        : "border-gray-300"
                    }`}
                  >
                    {preference === option.value && (
                      <motion.span
                        layoutId="preference-dot"
                        className="w-2.5 h-2.5 rounded-full bg-accent"
                      />
                    )}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      preference === option.value ? "text-accent" : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Regular Questions */}
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            id={`question-${question.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
            className="mb-6"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {index + 1}
                </span>
                <h3 className="text-base md:text-lg font-semibold text-primary">
                  {question.text}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(question.id, option.value)}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      answers[question.id] === option.value
                        ? "border-accent bg-accent/5 shadow-sm"
                        : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        answers[question.id] === option.value
                          ? "border-accent"
                          : "border-gray-300"
                      }`}
                    >
                      {answers[question.id] === option.value && (
                        <motion.span
                          layoutId={`dot-${question.id}`}
                          className="w-2.5 h-2.5 rounded-full bg-accent"
                        />
                      )}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        answers[question.id] === option.value ? "text-accent" : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center pt-4 pb-8"
        >
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary inline-flex items-center gap-2 px-10 py-3.5 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                计算中...
              </>
            ) : (
              <>
                <ClipboardList className="w-5 h-5" />
                查看测试结果
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && resultStyle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) return;
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Result Header */}
              <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-8 rounded-t-2xl text-center">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-white/80 mb-2"
                >
                  您的主风格是
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="text-3xl md:text-4xl font-bold"
                >
                  {getMarketStyleName(resultStyle.name, 'male')}
                </motion.h2>
              </div>

              {/* Result Body */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed text-center">
                  {resultStyle.desc}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap justify-center gap-2">
                  {resultStyle.tags.map((tag, i) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>

                {/* Lead Form */}
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-primary mb-4 text-center">
                    获取专属风格建议
                  </h4>
                  {leadSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-4"
                    >
                      <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium text-primary">
                        提交成功！我们会尽快联系您
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleLeadSubmit} className="space-y-3">
                      <div>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={leadForm.name}
                            onChange={(e) =>
                              setLeadForm({ ...leadForm, name: e.target.value })
                            }
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            placeholder="姓名 *"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            required
                            value={leadForm.phone}
                            onChange={(e) =>
                              setLeadForm({ ...leadForm, phone: e.target.value })
                            }
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            placeholder="手机号 *"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="relative">
                          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={leadForm.wechat}
                            onChange={(e) =>
                              setLeadForm({ ...leadForm, wechat: e.target.value })
                            }
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            placeholder="微信号（选填）"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={savingLead}
                        className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {savingLead ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            提交中...
                          </>
                        ) : (
                          "提交信息"
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* Retry Button */}
                <div className="text-center pt-2">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    再测一次
                  </button>
                </div>

                {/* Contact Info */}
                <div className="border-t border-gray-100 pt-4 text-center">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    想获取准确结果可以联系骆芷蝶CMB色彩形象顾问进行测试。
                    <br />
                    Tel：13925997776 &nbsp; 微信：luozhidie666
                  </p>
                </div>

                {/* 微信支付登记入口 */}
                <div className="border-t border-gray-100 pt-6 mt-4 text-center">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5">
                    <QrCode className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-green-800 mb-1">色彩风格在线咨询</h4>
                    <p className="text-xs text-green-700 mb-3">专业CMB色彩顾问一对一咨询</p>
                    <div className="text-2xl font-bold text-green-700 mb-3">¥800</div>
                    <a
                      href="https://f.wps.cn/g/fJ1Z7rJz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-accent inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
                    >
                      <QrCode className="w-4 h-4" />
                      微信扫码支付并登记
                    </a>
                    <p className="text-xs text-gray-400 mt-2">
                      支付后自动跳转登记表 · 专业咨询30分钟起
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
