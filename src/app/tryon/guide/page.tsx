"use client";

import Link from "next/link";

const STEPS = [
  {
    n: "1",
    t: "上传照片",
    d: "拍一张正面半身照。照片只用于本次 AI 合成，不会留存或公开。",
    tip: "光线均匀、背景干净，效果更准",
  },
  {
    n: "2",
    t: "挑选衣服",
    d: "从店铺里挑想试的款，或让 AI 按你的风格推荐。也能上传自己的衣服图。",
    tip: "一次可多选几件对比",
  },
  {
    n: "3",
    t: "生成上身图",
    d: "点「试穿」，AI 把衣服「穿」到你身上，约 30 秒出图。",
    tip: "普通版一键合成，专业版带风格诊断",
  },
  {
    n: "4",
    t: "看效果做决定",
    d: "上身图、颜色、版型一眼可见，喜欢再下单，不踩雷。",
    tip: "专业版还能看 AI 搭配建议",
  },
];

export default function TryonGuidePage() {
  return (
    <main className="max-w-[720px] mx-auto min-h-screen bg-[#faf8f6] px-4 py-6">
      <h1 className="text-2xl font-extrabold text-[#2d1b2e]">怎么用 · 4 步穿上身</h1>
      <p className="text-sm text-gray-500 mt-2 mb-5">不用学，跟着走一遍就会。整个过程约 1 分钟。</p>

      <div className="space-y-3">
        {STEPS.map((s) => (
          <div key={s.n} className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 items-start">
            <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#2d1b2e] to-[#4a3a5a] text-[#C9A24B] font-extrabold text-lg flex items-center justify-center">
              {s.n}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#2d1b2e] text-base">{s.t}</h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{s.d}</p>
              <p className="text-xs text-[#C9A24B] mt-2">💡 {s.tip}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-[#2d1b2e] rounded-2xl p-5 text-center">
        <p className="text-white/80 text-sm">看懂了？去试一件看看</p>
        <Link
          href="/look-studio"
          className="inline-block mt-3 py-3 px-10 rounded-xl bg-[#C9A24B] text-[#2d1b2e] font-extrabold no-underline"
        >
          进入试衣台
        </Link>
      </div>
    </main>
  );
}
