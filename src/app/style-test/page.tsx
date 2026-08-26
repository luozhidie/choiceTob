"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Camera, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function StyleTestPage() {
  const [visible, setVisible] = useState(false);
  const [heroImage, setHeroImage] = useState("");
  const [blocks, setBlocks] = useState<string[]>([]);

  useEffect(() => {
    setVisible(true);
    (async () => {
      try {
        const res = await fetch("/api/public/site-assets?keys=style_test_hero,style_test_blocks");
        const d = await res.json();
        if (d.success && d.data) {
          if (d.data.style_test_hero) setHeroImage(d.data.style_test_hero);
          if (d.data.style_test_blocks) {
            try {
              const list = JSON.parse(d.data.style_test_blocks);
              if (Array.isArray(list)) setBlocks(list);
            } catch {}
          }
        }
      } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">骆</span>
            </div>
            <span className="font-bold text-lg text-primary">骆芷蝶智选</span>
          </Link>
          <h1 className="text-2xl font-bold text-primary">色彩季型VS穿衣风格判断</h1>
        </div>

        {/* 1. 八大风格真人试穿入口（最上） */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-5 mb-6 text-white flex items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg,#2d1b2e,#3a233a)", border: "1px solid rgba(201,162,75,.4)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/20 flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6 text-[#C9A24B]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#C9A24B]">八大风格 · 真人试穿</h3>
              <p className="text-xs text-white/70 mt-0.5">把你的真人照套进 8 大风格测试衣，比问卷更直观</p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-[#C9A24B] shrink-0" />
        </motion.div>

        {/* 2. 风格测试会员 ¥998 — 付费入口（男女同时开通） */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-r from-primary to-accent rounded-2xl p-5 mb-6 text-white flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">风格测试会员 · ¥998</h3>
              <p className="text-xs text-white/80 mt-0.5">14 题自动诊断 · 八大风格真人试穿 · 100 次专业诊断 · 女士男士同时开通</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-2xl font-black">¥998</span>
            <Link href="/personal-image" className="px-3 py-1.5 bg-white text-primary text-xs font-semibold rounded-lg hover:bg-white/90 transition-colors">立即开通</Link>
          </div>
        </motion.div>

        {/* 3. 两个测试入口链接 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4 mb-6"
        >
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👗</span>
              <div>
                <h3 className="font-bold text-primary text-base">女士风格测试</h3>
                <p className="text-xs text-gray-500 mt-0.5">14 道题 · 自动出主风格与穿搭建议</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-[#C9A24B]">开通后可用 ›</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👔</span>
              <div>
                <h3 className="font-bold text-primary text-base">男士风格测试</h3>
                <p className="text-xs text-gray-500 mt-0.5">18 道题 · 自动出主风格与穿搭建议</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-[#C9A24B]">开通后可用 ›</span>
          </div>
        </motion.div>

        {/* 4. 后台可配满框图片模块 */}
        {blocks.length > 0 && (
          <section className="w-full space-y-4 rounded-2xl overflow-hidden shadow-sm mb-6">
            {blocks.map((url, i) => (
              <img key={i} src={url} alt="" className="w-full h-auto block rounded-2xl" />
            ))}
          </section>
        )}

        {/* 后台可配 Hero 大图（可选） */}
        {heroImage && (
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <img src={heroImage} alt="" className="w-full h-auto block" />
          </div>
        )}
      </div>
    </div>
  );
}
