import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "骆芷蝶智选 — 内测中",
  description: "骆芷蝶智选正在内测打磨，暂未公开。",
};

export default function ComingSoonPage() {
  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-16"
      style={{
        background:
          "radial-gradient(120% 120% at 50% 0%, #faf8f6 0%, #f3ece6 45%, #ece2da 100%)",
      }}
    >
      {/* 顶部细线装饰 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#b8945a] to-transparent opacity-70" />

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <span
          className="mb-6 text-[12px] font-medium uppercase tracking-[0.45em]"
          style={{ color: "#b8945a" }}
        >
          Internal Preview · 内测打磨中
        </span>

        <h1
          className="mb-3 font-serif text-4xl font-semibold leading-tight sm:text-5xl"
          style={{ color: "#2d1b2e" }}
        >
          骆芷蝶智选
        </h1>

        <p
          className="mb-8 text-sm tracking-wide sm:text-base"
          style={{ color: "#8a7e7b" }}
        >
          服装门店一站式赋能平台
        </p>

        <div
          className="mb-9 h-px w-16"
          style={{ background: "#b8945a" }}
        />

        <p
          className="mb-3 text-base leading-relaxed sm:text-lg"
          style={{ color: "#2d1b2e" }}
        >
          网站正在内测打磨，暂未对外公开。
        </p>
        <p
          className="mb-10 text-sm leading-relaxed"
          style={{ color: "#8a7e7b" }}
        >
          我们以 CMB 十二色彩季型与穿衣风格为基底，构建「数据驱动 · 组货运营」的选品体系，
          <br className="hidden sm:block" />
          与单纯依赖市场信息差的同行形成差异化，为门店提供更精准的企划与转化服务。
        </p>

        <Link
          href="/admin/login"
          className="group inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm transition-colors"
          style={{ borderColor: "#2d1b2e", color: "#2d1b2e" }}
        >
          管理入口
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>

        <p
          className="mt-14 text-[11px] tracking-wide"
          style={{ color: "#b9aaa3" }}
        >
          © 2026 骆芷蝶智选 · Colour Choice
        </p>
      </div>
    </div>
  );
}
