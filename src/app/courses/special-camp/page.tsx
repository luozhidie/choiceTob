"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, CheckCircle } from "lucide-react";

const OUTLINE = [
  "AI 时尚趋势预测与爆款拆解",
  "色彩搭配公式与身材扬长避短",
  "VIP客户形象诊断与连带销售",
  "私域朋友圈美学内容批量产出",
  "线下陪购流程与逼单话术",
  "结业考核与 1v1 答疑",
];

export default function SpecialCampPage() {
  const [booked, setBooked] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f3f0]">
      <div className="bg-gradient-to-br from-[#2d1b2e] to-[#4a2a3e] text-white py-12 md:py-16 px-4 relative">
        <Link href="/courses" className="absolute top-4 left-4 text-white/70 hover:text-white flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> 返回
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center pt-6"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[#e91e63] text-white text-xs font-semibold mb-4">🔥 热门课程</span>
          <h1 className="text-3xl md:text-4xl font-bold">AI赋能·服装精英销售特训营</h1>
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-[#2d1b2e] mb-4">课程简介</h2>
          <p className="text-gray-600 leading-relaxed text-sm md:text-base">
            专为服装店主、搭配师、买手打造。AI选款 + 搭配公式 + 私域销售话术，让你学会用人工智能高效拿货、组货、卖货。
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {["AI赋能", "销售特训", "形象美学"].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[#faf8f6] text-[#C9A24B] text-xs border border-[#eee5df]">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-400">时长</span>
              <span className="text-gray-700 font-medium">2天1夜 · 线下集训</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-400">地点</span>
              <span className="text-gray-700 font-medium">深圳·南油服装批发市场</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm mb-24">
          <h2 className="text-xl font-bold text-[#2d1b2e] mb-4">课程大纲</h2>
          <div className="space-y-3">
            {OUTLINE.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#2d1b2e] text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-gray-600 text-sm md:text-base pt-0.5">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 md:px-6 z-50">
        {booked ? (
          <div className="flex items-center justify-center gap-2 text-green-600 font-bold py-3">
            <CheckCircle className="w-5 h-5" /> 已预约，客服将联系您
          </div>
        ) : (
          <button
            onClick={() => setBooked(true)}
            className="w-full bg-[#2d1b2e] text-white rounded-full py-3.5 font-bold text-base hover:opacity-95 transition"
          >
            立即预约
          </button>
        )}
      </div>
    </div>
  );
}
