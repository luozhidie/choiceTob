"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  updateDate: string;
  backHref?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function LegalPage({
  title,
  updateDate,
  backHref = "/settings",
  children,
  footer,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href={backHref}
            className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-base font-bold text-gray-900">{title}</h1>
        </div>
      </div>

      {/* 内容 */}
      <div className="max-w-3xl mx-auto px-4 py-5 pb-12">
        <p className="text-xs text-gray-400 mb-4">更新日期：{updateDate}</p>
        <article className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-6 text-sm text-gray-700 leading-relaxed">
          {children}
        </article>

        {footer && (
          <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
