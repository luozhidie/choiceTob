"use client";

import Link from "next/link";
import TryonPayButton from "@/components/tryon/TryonPayButton";

export default function TryonProPage() {
  return (
    <main className="max-w-[720px] mx-auto min-h-screen bg-[#faf8f6] px-4 py-6 pb-28">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-extrabold text-[#2d1b2e]">专业版</h1>
        <span className="text-sm text-gray-400">诊断 + 搭配</span>
      </div>
      <p className="text-sm text-gray-600 mt-2 mb-4">
        在普通版基础上，加 14 题风格诊断与 AI 智能搭配。
      </p>

      <div className="bg-gradient-to-br from-[#2d1b2e] to-[#4a3a5a] text-white rounded-2xl shadow-sm p-5">
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A24B] text-[#2d1b2e] font-bold">
          专业版
        </span>
        <div className="space-y-1.5 text-sm mt-3">
          {[
            "普通版全部功能",
            "14 题穿衣风格诊断",
            "AI 按风格自动生成造型",
            "风格匹配 + 场合搭配建议",
          ].map((t) => (
            <div key={t}>✓ {t}</div>
          ))}
        </div>
      </div>

      <div className="mt-4 bg-gradient-to-br from-[#2d1b2e] to-[#4a3a5a] text-white rounded-2xl shadow-sm p-5 flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[#C9A24B] text-[#2d1b2e] text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">含风格测试</div>
        <div>
          <div className="text-lg font-extrabold">专业版</div>
          <div className="text-xs text-white/70 mt-1">100 次专业诊断 · 含 14 题风格测试 / 八大风格真人试穿</div>
        </div>
        <div className="text-2xl font-extrabold text-[#C9A24B]">¥998</div>
      </div>
      <div className="mt-3">
        <TryonPayButton productId="tryon_pro_998" title="专业版" price={998} sub="100次·含风格测试" />
      </div>

      <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between max-w-[720px] mx-auto z-20 shadow-[0_-4px_20px_rgba(0,0,0,.06)]">
        <div className="flex flex-col">
          <span className="text-xl font-extrabold text-[#C9A24B]">专业版 ¥998</span>
          <span className="text-xs text-gray-400">100 次专业诊断 · 含风格测试</span>
        </div>
        <Link
          href="/look-studio"
          className="py-3 px-8 rounded-xl bg-[#2d1b2e] text-[#C9A24B] font-extrabold text-base no-underline"
        >
          去专业版
        </Link>
      </div>
    </main>
  );
}
