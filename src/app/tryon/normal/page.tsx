"use client";

import Link from "next/link";
import TryonPayButton from "@/components/tryon/TryonPayButton";

export default function TryonNormalPage() {
  return (
    <main className="max-w-[720px] mx-auto min-h-screen bg-[#faf8f6] px-4 py-6 pb-28">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-extrabold text-[#2d1b2e]">普通版</h1>
        <span className="text-sm text-gray-400">快速看上身</span>
      </div>
      <p className="text-sm text-gray-600 mt-2 mb-4">
        只想快速看衣服穿在自己身上、不想研究搭配，选这个就够。
      </p>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-[#2d1b2e] mb-2">包含</h2>
        <div className="space-y-1.5 text-sm text-[#2d1b2e]">
          {[
            "上传自己的人像照片",
            "上传想试穿的衣服照片",
            "一键 AI 合成上身效果",
            "从店铺挑选商品试穿",
          ].map((t) => (
            <div key={t}>✓ {t}</div>
          ))}
        </div>
        <h2 className="font-bold text-[#2d1b2e] mt-4 mb-2">不含</h2>
        <div className="space-y-1.5 text-sm text-gray-400">
          <div>— 风格诊断</div>
          <div>— AI 智能搭配 / 买手推荐</div>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between border border-[#C9A24B]/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[#C9A24B] text-[#2d1b2e] text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">体验</div>
        <div>
          <div className="text-lg font-extrabold text-[#2d1b2e]">首单体验</div>
          <div className="text-xs text-gray-500 mt-1">5 次普通试穿</div>
        </div>
        <div className="text-2xl font-extrabold text-[#C9A24B]">¥9.9</div>
      </div>
      <div className="mt-3">
        <TryonPayButton productId="tryon_first_9_9" title="首单体验" price={9.9} sub="5次普通试穿" />
      </div>

      <div className="mt-4 bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
        <div>
          <div className="text-lg font-extrabold text-[#2d1b2e]">普通月卡</div>
          <div className="text-xs text-gray-500 mt-1">30 天 100 次普通试穿</div>
        </div>
        <div className="text-2xl font-extrabold text-[#C9A24B]">¥99</div>
      </div>
      <div className="mt-3">
        <TryonPayButton productId="tryon_normal_month_99" title="普通月卡" price={99} sub="30天100次" />
      </div>

      <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between max-w-[720px] mx-auto z-20 shadow-[0_-4px_20px_rgba(0,0,0,.06)]">
        <div className="flex flex-col">
          <span className="text-xl font-extrabold text-[#C9A24B]">普通月卡 ¥99</span>
          <span className="text-xs text-gray-400">30 天 100 次普通试穿</span>
        </div>
        <Link
          href="/look-studio"
          className="py-3 px-8 rounded-xl bg-[#2d1b2e] text-[#C9A24B] font-extrabold text-base no-underline"
        >
          去普通版
        </Link>
      </div>
    </main>
  );
}
