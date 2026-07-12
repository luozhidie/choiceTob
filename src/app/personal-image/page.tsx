"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight, Crown } from "lucide-react";

const PAINS = [
  "重要场合，总是没有衣服穿",
  "缺乏审美能力，衣品不好",
  "我缺气场、缺权威感？",
  "我正面临亲密关系危机",
  "花了不少钱，还是没有高级感",
  "缺乏异性缘，但是想找男/女朋友",
  "衣服种类选择太多了，不知道怎么选",
  "缺乏个人魅力，没有影响力",
  "认为形象不够特别，对自己的形象没有自信",
  "觉得自己可以更好，需要得到专业的定位",
  "想建立更好的第一印象，穿不出自己的内在品质",
  "买衣服很迷茫，不知道自己究竟适合什么衣服？",
  "衣橱爆满，却总是觉得没有衣服可以穿？",
  "买回来的衣服经常穿一两次就不穿了？",
  "在职场，总感觉形象衣品配不上自己能力和实力",
  "跟姐妹朋友聚会不知道穿什么甚至很自卑",
  "花大把的钱总是买到踩雷不适合自己的衣服",
];

const FLOW = [
  { t: "风格诊断", d: "找到你的天生风格调性" },
  { t: "色彩诊断", d: "锁定专属用色范围" },
  { t: "身材诊断", d: "扬长避短的体型方案" },
  { t: "生成报告", d: "一站式个人形象报告" },
];

const REPORTS = [
  { t: "色彩报告", d: "面部明度/面部纯度/面部冷暖/色彩解析等" },
  { t: "身材报告", d: "身体廓形/身材特征/身材优缺点等" },
  { t: "风格报告", d: "风格印象/相似脸型/适合的穿搭等" },
  { t: "衣橱报告", d: "衣橱单品占比/衣橱科学占比/添置清单等" },
  { t: "星座报告", d: "心情/运势/事业/家庭/爱情等" },
];

export default function PersonalImagePage() {
  const [visible, setVisible] = useState(false);
  const [heroImage, setHeroImage] = useState("");
  const [blocks, setBlocks] = useState<string[]>([]);
  useEffect(() => {
    setVisible(true);
    (async () => {
      try {
        const res = await fetch("/api/public/site-assets?keys=diagnosis_hero,diagnosis_blocks");
        const d = await res.json();
        if (d.success && d.data) {
          if (d.data.diagnosis_hero) setHeroImage(d.data.diagnosis_hero);
          if (d.data.diagnosis_blocks) {
            try {
              const list = JSON.parse(d.data.diagnosis_blocks);
              if (Array.isArray(list)) setBlocks(list);
            } catch {}
          }
        }
      } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f3f0] pb-36 md:pb-32">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#2d1b2e] to-[#4a2a3e] py-16 md:py-24 text-center overflow-hidden">
        {heroImage && (
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(201,162,75,.15),transparent_50%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl mx-auto px-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-widest">个人形象诊断</h1>
          <p className="inline-block mt-6 px-6 py-2 rounded-full bg-white/10 text-[#C9A24B] text-lg tracking-widest border border-[#C9A24B]/30">
            一次诊断 终身受益
          </p>
          <p className="mt-4 text-white/70 text-base md:text-lg">让你找到气质提升的本源</p>
        </motion.div>
      </section>

      {/* 痛点 */}
      <section className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-[#2d1b2e]">遇到以下问题</h2>
            <h2 className="text-2xl font-bold text-[#C9A24B]">就急需做诊断</h2>
          </div>
          <div className="space-y-3">
            {PAINS.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#f5f3f0] text-[#C9A24B] text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed pt-0.5">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 服务流程 */}
      <section className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#2d1b2e] mb-6">形象诊断服务流程</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FLOW.map((item, i) => (
              <div key={i} className="bg-[#f8f6f4] rounded-2xl p-5 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#2d1b2e] text-white text-lg font-bold flex items-center justify-center mb-3">
                  {i + 1}
                </div>
                <p className="font-bold text-[#2d1b2e]">{item.t}</p>
                <p className="text-xs text-gray-500 mt-1">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 报告内容 */}
      <section className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#2d1b2e]">形象报告内容</h2>
          <p className="text-gray-500 mt-2 text-sm">一份专业全面的形象报告</p>
          <p className="text-gray-400 mt-1 text-xs md:text-sm leading-relaxed">
            通过诊断，找准显白本命色，锁定高级风格，越穿越显贵。搭配师每日精准推荐，不用动脑也能一直美。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {REPORTS.map((item, i) => (
              <div key={i} className="bg-gradient-to-br from-[#faf8f6] to-[#f5f3f0] rounded-2xl p-5 border border-[#eee5df]">
                <p className="font-bold text-[#2d1b2e] text-lg">{item.t}</p>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 仓库 */}
      <section className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#2d1b2e]">1000+平米南油大仓库</h2>
          <p className="text-gray-500 mt-2 text-sm">现场检验诊断结果</p>
          <div className="mt-5 h-56 rounded-2xl bg-[#e8e4e0] flex items-center justify-center text-6xl opacity-40">
            🏭
          </div>
        </div>
      </section>

      {/* 后台配置的满框大图片模块 */}
      {blocks.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 mt-6 space-y-4">
          {blocks.map((url, i) => (
            <div key={i} className="w-full rounded-2xl overflow-hidden shadow-sm bg-white">
              <img src={url} alt="" className="w-full h-auto object-cover" />
            </div>
          ))}
        </section>
      )}

      {/* 底部间距 */}
      <div className="h-10" />

      {/* 固定底部双按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 md:px-6 md:py-5 flex gap-4 z-50">
        <Link
          href="/style-test/female"
          className="flex-1 flex flex-col items-center justify-center bg-[#C9A24B] text-white rounded-full py-3 hover:opacity-95 transition"
        >
          <span className="text-base font-bold">智能形象诊断</span>
          <span className="text-sm text-white/80">¥99 风格测试</span>
        </Link>
        <Link
          href="/courses"
          className="flex-1 flex flex-col items-center justify-center bg-[#2d1b2e] text-white rounded-full py-3 hover:opacity-95 transition"
        >
          <span className="text-base font-bold">整体形象诊断</span>
          <span className="text-sm text-white/80">¥190 预约</span>
        </Link>
      </div>
    </div>
  );
}
