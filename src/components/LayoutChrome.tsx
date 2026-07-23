"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * 根据路由决定是否渲染整站导航/页脚。
 * /coming-soon 等"裸页"不显示导航，保持干净的占位/落地效果。
 */
export default function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname === "/coming-soon";

  if (bare) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </>
  );
}
