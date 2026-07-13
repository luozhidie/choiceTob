"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-[#f5f3f0] pb-32 md:pb-28">
      {/* Hero：全屏大图，暗遮罩保证文字可读 */}
      <section className="relative h-screen min-h-screen flex items-center justify-center overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2d1b2e] to-[#4a2a3e]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(201,162,75,.15),transparent_50%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl mx-auto px-4 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-widest">个人形象诊断</h1>
          <p className="inline-block mt-6 px-6 py-2 rounded-full bg-white/10 text-[#C9A24B] text-lg tracking-widest border border-[#C9A24B]/30">
            一次诊断 终身受益
          </p>
          <p className="mt-4 text-white/70 text-base md:text-lg">让你找到气质提升的本源</p>
        </motion.div>
      </section>

      {/* 后台配置的满框大图片模块（全宽无 padding，像同行） */}
      {blocks.length > 0 && (
        <section className="w-full space-y-0">
          {blocks.map((url, i) => (
            <img key={i} src={url} alt="" className="w-full h-auto block" />
          ))}
        </section>
      )}

      {/* 底部间距 */}
      <div className="h-8" />

      {/* 固定底部三按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 md:px-6 md:py-5 flex gap-3 z-50">
        <Link
          href="/personal-image/questionnaire"
          className="flex-1 flex flex-col items-center justify-center bg-[#C9A24B] text-white rounded-full py-3 hover:opacity-95 transition"
        >
          <span className="text-sm font-bold">VIP形象诊断</span>
          <span className="text-xs text-white/80">21题问卷</span>
        </Link>
        <Link
          href="/style-test/female"
          className="flex-1 flex flex-col items-center justify-center bg-[#2d1b2e] text-white rounded-full py-3 hover:opacity-95 transition"
        >
          <span className="text-sm font-bold">智能形象诊断</span>
          <span className="text-xs text-white/80">¥99 风格测试</span>
        </Link>
        <Link
          href="/courses"
          className="flex-1 flex flex-col items-center justify-center border border-[#2d1b2e] text-[#2d1b2e] rounded-full py-3 hover:bg-[#2d1b2e]/5 transition"
        >
          <span className="text-sm font-bold">整体形象诊断</span>
          <span className="text-xs text-[#2d1b2e]/70">预约</span>
        </Link>
      </div>
    </div>
  );
}
