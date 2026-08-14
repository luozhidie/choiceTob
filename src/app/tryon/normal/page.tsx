"use client";

import TryonPayButton from "@/components/tryon/TryonPayButton";

export default function TryonNormalPage() {
  return (
    <main className="max-w-[720px] mx-auto min-h-screen bg-[#faf8f6] px-4 py-6">
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

      <div className="mt-4 bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
        <div>
          <div className="text-lg font-extrabold text-[#2d1b2e]">月卡</div>
          <div className="text-xs text-gray-500 mt-1">30 天 120 次 AI 试衣</div>
        </div>
        <div className="text-2xl font-extrabold text-[#C9A24B]">¥99</div>
      </div>
      <div className="mt-3">
        <TryonPayButton productId="tryon_monthly_99" title="月卡" price={99} sub="30天120次" />
      </div>

      <div className="mt-4 bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
        <div>
          <div className="text-lg font-extrabold text-[#2d1b2e]">季卡</div>
          <div className="text-xs text-gray-500 mt-1">90 天 280 次 AI 试衣</div>
        </div>
        <div className="text-2xl font-extrabold text-[#C9A24B]">¥199</div>
      </div>
      <div className="mt-3">
        <TryonPayButton productId="tryon_quarter_199" title="季卡" price={199} sub="90天280次" />
      </div>

      <div className="mt-4 bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between border-2 border-[#C9A24B]">
        <div>
          <div className="text-lg font-extrabold text-[#2d1b2e]">年卡</div>
          <div className="text-xs text-gray-500 mt-1">365 天 1000 次 AI 试衣</div>
        </div>
        <div className="text-2xl font-extrabold text-[#C9A24B]">¥699</div>
      </div>
      <div className="mt-3">
        <TryonPayButton productId="tryon_year_699" title="年卡" price={699} sub="365天1000次" />
      </div>
    </main>
  );
}
