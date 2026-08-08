"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
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

        {/* 风格测试会员 ¥99 — 付费入口 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-primary to-accent rounded-2xl p-5 mb-6 text-white flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">风格测试会员 · ¥99</h3>
              <p className="text-xs text-white/80 mt-0.5">14 题自动诊断 · 找到你的本命色彩与穿衣风格</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-2xl font-black">¥99</span>
            <div className="flex gap-2">
              <Link href="/style-test/female" className="px-3 py-1.5 bg-white text-primary text-xs font-semibold rounded-lg hover:bg-white/90 transition-colors">女士</Link>
              <Link href="/style-test/male" className="px-3 py-1.5 bg-white text-primary text-xs font-semibold rounded-lg hover:bg-white/90 transition-colors">男士</Link>
            </div>
          </div>
        </motion.div>

        {/* 后台可配 Hero 大图 */}
        {heroImage && (
          <div className="rounded-2xl overflow-hidden mb-6 shadow-sm">
            <img src={heroImage} alt="" className="w-full h-auto block" />
          </div>
        )}

        {/* 后台可配满框图片模块 */}
        {blocks.length > 0 && (
          <section className="w-full space-y-0 rounded-2xl overflow-hidden shadow-sm">
            {blocks.map((url, i) => (
              <img key={i} src={url} alt="" className="w-full h-auto block" />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
