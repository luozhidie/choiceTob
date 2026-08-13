"use client";

import Link from "next/link";
import { Construction } from "lucide-react";

export default function AddressPage() {
  return (
    <div className="min-h-screen bg-[#f5f3f0] flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-white rounded-3xl p-10 shadow-sm max-w-md w-full">
        <Construction className="w-16 h-16 text-[#C9A24B] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#2d1b2e]">地址管理</h1>
        <p className="text-gray-500 mt-3 text-sm">该功能正在开发中，敬请期待。</p>
        <Link href="/my" className="inline-block mt-6 px-6 py-2.5 bg-[#2d1b2e] text-white rounded-full text-sm font-semibold">
          返回我的
        </Link>
      </div>
    </div>
  );
}
