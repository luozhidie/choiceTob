"use client";

const FAQS = [
  { q: "照片会被保存或公开吗？", a: "不会。照片仅用于本次 AI 试衣合成，处理后不保留、不公开。" },
  { q: "试衣效果能当真实试穿看吗？", a: "AI 合成效果仅供参考，帮助你判断款式、颜色是否适合自己。" },
  { q: "专业版可以随时取消吗？", a: "可以。到期不续费自动回到基础版，已购权益不受影响。" },
  { q: "普通版和专业版能同时用吗？", a: "能。专业版包含普通版全部功能，开通专业版后两者权益合并计算。" },
];

export default function TryonFaqPage() {
  return (
    <main className="max-w-[720px] mx-auto min-h-screen bg-[#faf8f6] px-4 py-6">
      <h1 className="text-2xl font-extrabold text-[#2d1b2e]">常见问题</h1>
      <p className="text-sm text-gray-500 mt-2 mb-5">还有疑问？这里先答。</p>
      <div className="space-y-3">
        {FAQS.map((f) => (
          <div key={f.q} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="font-bold text-[#2d1b2e] text-[15px] mb-1.5">{f.q}</div>
            <div className="text-sm text-gray-600 leading-relaxed">{f.a}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
