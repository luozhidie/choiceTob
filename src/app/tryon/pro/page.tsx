"use client";

import TryonPayButton from "@/components/tryon/TryonPayButton";

export default function TryonProPage() {
  return (
    <main className="max-w-[720px] mx-auto min-h-screen bg-[#faf8f6] px-4 py-6">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-extrabold text-[#2d1b2e]">专业版</h1>
        <span className="text-sm text-gray-400">诊断 + 搭配</span>
      </div>
      <p className="text-sm text-gray-600 mt-2 mb-4">
        在普通版基础上，加 21 题风格诊断与 AI 智能搭配，买手还帮你挑。
      </p>

      <div className="bg-gradient-to-br from-[#2d1b2e] to-[#4a3a5a] text-white rounded-2xl shadow-sm p-5">
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A24B] text-[#2d1b2e] font-bold">
          专业版
        </span>
        <div className="space-y-1.5 text-sm mt-3">
          {[
            "普通版全部功能",
            "21 题穿衣风格诊断",
            "AI 按风格自动生成造型",
            "专属买手推荐 + 优先新款",
          ].map((t) => (
            <div key={t}>✓ {t}</div>
          ))}
        </div>
      </div>

      <div className="mt-4 bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
        <div>
          <div className="text-lg font-extrabold text-[#2d1b2e]">月卡</div>
          <div className="text-xs text-gray-500 mt-1">30 天 120 次专业诊断</div>
        </div>
        <div className="text-2xl font-extrabold text-[#C9A24B]">¥99</div>
      </div>
      <div className="mt-3">
        <TryonPayButton productId="tryon_monthly_99" title="月卡" price={99} sub="30天120次" />
      </div>

      <div className="mt-4 bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between border-2 border-[#C9A24B] relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[#C9A24B] text-[#2d1b2e] text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">推荐</div>
        <div>
          <div className="text-lg font-extrabold text-[#2d1b2e]">季卡</div>
          <div className="text-xs text-gray-500 mt-1">90 天 280 次专业诊断</div>
        </div>
        <div className="text-2xl font-extrabold text-[#C9A24B]">¥199</div>
      </div>
      <div className="mt-3">
        <TryonPayButton productId="tryon_quarter_199" title="季卡" price={199} sub="90天280次" />
      </div>

      <div className="mt-4 bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
        <div>
          <div className="text-lg font-extrabold text-[#2d1b2e]">年卡</div>
          <div className="text-xs text-gray-500 mt-1">365 天 1000 次专业诊断</div>
        </div>
        <div className="text-2xl font-extrabold text-[#C9A24B]">¥699</div>
      </div>
      <div className="mt-3">
        <TryonPayButton productId="tryon_year_699" title="年卡" price={699} sub="365天1000次" />
      </div>
    </main>
  );
}
