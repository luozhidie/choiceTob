"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/tryon/guide", label: "怎么用" },
  { href: "/tryon/normal", label: "普通版" },
  { href: "/tryon/pro", label: "专业版" },
  { href: "/tryon/faq", label: "常见问题" },
];

export default function TryonLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#faf8f6]">
      <header className="bg-[#2d1b2e] text-white">
        <div className="max-w-[720px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold tracking-wide">
            骆芷蝶智选
          </Link>
          <Link href="/tryon" className="text-xs text-[#C9A24B]">
            AI 试衣首页
          </Link>
        </div>
      </header>

      <nav className="sticky top-0 z-30 bg-white border-b border-[#eee5df]">
        <div className="max-w-[720px] mx-auto px-4 flex gap-1 overflow-x-auto">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "text-[#2d1b2e] border-[#C9A24B]"
                    : "text-gray-500 border-transparent"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {children}
    </div>
  );
}
