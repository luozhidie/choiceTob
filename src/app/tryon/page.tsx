"use client";

import Link from "next/link";
import TryonPayButton from "@/components/tryon/TryonPayButton";
import { TRYON_PRO_ENABLED } from "@/lib/tryon/flags";

export default function TryonPromoPage() {
  return (
    <main className="max-w-[720px] mx-auto min-h-screen bg-[#faf8f6] pb-28">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#2d1b2e] to-[#1c1020] text-white px-5 pt-9 pb-6 text-center">
        <span className="inline-block text-xs text-[#C9A24B] border border-[#C9A24B]/50 rounded-full px-3 py-1">
          骆芷蝶智选 · 云衣橱•AI虚拟试衣
        </span>
        <h1 className="text-3xl font-extrabold leading-tight mt-4">
          先试再买
          <br />
          穿上身再决定
        </h1>
        <p className="text-sm text-white/70 mt-3 leading-relaxed max-w-md mx-auto">
          上传你的照片，AI 把衣服「穿」到你身上。好不好看，一眼就知道。
        </p>
        <div className="flex gap-2 justify-center mt-4 flex-wrap">
          {["9.9元首单", "30秒出图", "隐私保护"].map((b) => (
            <span key={b} className="text-xs text-[#fcefe9] bg-white/10 rounded-full px-3 py-1.5">
              {b}
            </span>
          ))}
        </div>
        <div className="mt-5">
          <TryonPayButton productId="tryon_first_9_9" title="首单体验" price={9.9} label="新人首单 ¥9.9 试穿" />
        </div>
        <div className="text-xs text-white/55 mt-2">10 次普通试穿 · 限时</div>
      </section>

      {/* 三步 */}
      <section className="px-4 py-5">
        <h2 className="text-lg font-bold text-[#2d1b2e] mb-3">三步，看见上身效果</h2>
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-start justify-between gap-1.5">
          {[
            { n: "1", t: "上传照片", d: "正面半身照，仅用于本次合成" },
            { n: "2", t: "挑选衣服", d: "从店铺商品里选，或 AI 推荐" },
            { n: "3", t: "生成上身图", d: "AI 合成真实穿着效果" },
          ].map((s, i) => (
            <div key={s.n} className="flex-1 text-center">
              <div className="w-10 h-10 leading-10 rounded-full bg-[#2d1b2e] text-[#C9A24B] font-extrabold mx-auto mb-2">
                {s.n}
              </div>
              <div className="text-[15px] font-bold text-[#2d1b2e]">{s.t}</div>
              <div className="text-xs text-gray-500 mt-1.5 leading-snug">{s.d}</div>
              {i < 2 && <span className="inline-block mt-2 text-[#C9A24B] text-xs">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* 双轨选择 */}
      <section className="px-4">
        <h2 className="text-lg font-bold text-[#2d1b2e] mb-3">选择你的试衣方式</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/tryon/normal"
            className="bg-white rounded-2xl p-4 shadow-sm border border-[#eee5df] hover:border-[#C9A24B]/40 transition block"
          >
            <div className="text-2xl mb-2">👕</div>
            <h3 className="font-bold text-[#2d1b2e]">普通版</h3>
            <p className="text-xs text-gray-500 mt-1">快速看上身 · ¥99/月 100 次</p>
          </Link>
          {TRYON_PRO_ENABLED ? (
            <Link
              href="/tryon/pro"
              className="bg-gradient-to-br from-[#2d1b2e] to-[#4a3a5a] text-white rounded-2xl p-4 shadow-sm hover:opacity-95 transition block"
            >
              <div className="text-2xl mb-2">✨</div>
              <h3 className="font-bold">专业版</h3>
              <p className="text-xs text-white/80 mt-1">诊断+搭配 · ¥998/100 次</p>
            </Link>
          ) : (
            <div className="bg-white/70 rounded-2xl p-4 border border-dashed border-gray-300 opacity-70">
              <div className="text-2xl mb-2 grayscale">✨</div>
              <h3 className="font-bold text-gray-500">专业版</h3>
              <p className="text-xs text-gray-400 mt-1">升级打磨中 · 敬请期待</p>
            </div>
          )}
        </div>
      </section>

      {/* 套餐列表已移除：入口卡已承载普通版/专业版入口，避免重复堆叠 */}

      {/* 底部固定栏 */}
      <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between max-w-[720px] mx-auto z-20 shadow-[0_-4px_20px_rgba(0,0,0,.06)]">
        <div className="flex flex-col">
          <span className="text-xl font-extrabold text-[#C9A24B]">首单 ¥9.9</span>
          <span className="text-xs text-gray-400">10 次普通试穿</span>
        </div>
        <Link
          href="/look-studio"
          className="py-3 px-11 rounded-xl bg-[#2d1b2e] text-[#C9A24B] font-extrabold text-base no-underline"
        >
          立即试穿
        </Link>
      </div>
    </main>
  );
}
