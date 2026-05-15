"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { femaleTestConfig, calculateFemaleResult } from "@/lib/style-test-data";
import type { StyleResult } from "@/lib/style-test-data";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

const { questions, results } = femaleTestConfig;

export default function FemaleStyleTestPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
  const totalQuestions = questions.length; // 14

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`还有 ${unanswered.length} 道题未作答，请完成所有题目后提交`);
      const firstUnanswered = unanswered[0]?.id;
      if (firstUnanswered) {
        document
          .getElementById(`question-${firstUnanswered}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);

    try {
      const styleName = calculateFemaleResult(answers);
      const result = results.find((r) => r.name === styleName) || results[0];
      setResultStyle(result);

      await supabase.from("style_test_results").insert([
        {
          gender: "female",
          answers: answers,
          result_style: styleName,
        },
      ]);

      setShowResult(true);
    } catch (error) {
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
      await supabase.from("leads").insert([
        {
          name: leadForm.name.trim(),
          phone: leadForm.phone.trim(),
          wechat: leadForm.wechat.trim() || null,
          source: "female_style_test",
          style_result: resultStyle?.name || "",
        },
      ]);
      setLeadSubmitted(true);
    } catch (error) {
      console.error("留资失败:", error);
      alert("提交失败，请重试");
    } finally {
      setSavingLead(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setShowResult(false);
    setResultStyle(null);
    setLeadSubmitted(false);
    setLeadForm({ name: "", phone: "", wechat: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answeredCount = Object.keys(answers).length;

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
            <span className="text-primary font-medium">女士风格测试</span>
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
            女士风格测试
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm md:text-base text-white/80"
          >
            共 {totalQuestions} 道题，约2分钟完成
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

      {/* Questions */}
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
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
                        answers[question.id] === option.value
                          ? "text-accent"
                          : "text-gray-700"
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
                  {resultStyle.name}
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
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-colors"
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
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-colors"
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
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-colors"
                            placeholder="微信号（选填）"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={savingLead}
                        className="w-full btn-accent py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    想获知准确结果可联系骆芷蝶CMB色彩形象顾问进行测试
                    <br />
                    Tel：13925997776 &nbsp; VX：luozhidie666
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
