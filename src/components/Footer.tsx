"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { MapPin, Phone, Mail } from "lucide-react";

// 需要 VIP 会员才能访问的功能
const VIP_LINKS = new Set([
  "/planning", "/planning-tool", "/hot-picks", "/display",
  "/marketing", "/sales",
]);

const footerLinks = [
  // 核心服务
  { label: "买手选品", href: "/buyer" },
  { label: "时尚博主", href: "/magazine" },
  { label: "商品企划", href: "/planning", needVip: true },
  { label: "企划工具", href: "/planning-tool", needVip: true },
  { label: "爆款货盘", href: "/hot-picks", needVip: true },
  { label: "陈列搭配", href: "/display", needVip: true },
  // 增值服务
  { label: "营销策划", href: "/marketing", needVip: true },
  { label: "销售服务", href: "/sales", needVip: true },
  { label: "VIP管理", href: "/vip" },
  { label: "教学中心", href: "/education" },
  // 关于
  { label: "联系我们", href: "/contact" },
];

export default function Footer() {
  const { user, profile, signOut } = useAuth();
  const isMember = !!profile?.membership_type && profile.membership_type !== "";

  const handleVipLink = (href: string) => {
    if (isMember) return;
    window.location.href = `/vip?redirect=${encodeURIComponent(href)}`;
  };

  const coreServices = footerLinks.filter(l => !["营销策划", "销售服务", "VIP管理", "教学中心", "联系我们"].includes(l.label));
  const extraServices = footerLinks.filter(l => ["营销策划", "销售服务", "VIP管理", "教学中心"].includes(l.label));

  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent">
                <span className="text-primary font-bold text-sm">骆</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-lg tracking-wide">骆芷蝶智选</span>
                <span className="text-[10px] text-white/60 tracking-widest">LUOZHDIE ZHIXUAN</span>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm mb-6">
              骆芷蝶智选是专注服装行业的ToB供应链智选平台，以数据驱动选品、企划、营销全链路，助力服装品牌实现精准运营与高效增长。
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <span>广州市天河区珠江新城</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <span>400-888-6688</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span>contact@lzdzhixuan.com</span>
              </div>
            </div>
          </div>

          {/* 核心服务 */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-white/90">核心服务</h3>
            <ul className="flex flex-col gap-2.5">
              {coreServices.map((link) => (
                <li key={link.label}>
                  {link.needVip && !isMember ? (
                    <button onClick={() => handleVipLink(link.href)}
                      className="text-sm text-white/60 hover:text-accent transition-colors text-left cursor-pointer">
                      {link.label}
                      {!isMember && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-accent/20 text-[10px] text-accent">🔒 VIP</span>}
                    </button>
                  ) : (
                    <Link href={link.href} className="text-sm text-white/60 hover:text-accent transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 增值服务 */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-white/90">增值服务</h3>
            <ul className="flex flex-col gap-2.5">
              {extraServices.map((link) => (
                <li key={link.label}>
                  {(link.needVip && !isMember) || link.href === "/vip" ? (
                    link.href === "/vip" ? (
                      <Link href="/vip" className="text-sm text-white/60 hover:text-accent transition-colors">{link.label}</Link>
                    ) : (
                      <button onClick={() => handleVipLink(link.href)}
                        className="text-sm text-white/60 hover:text-accent transition-colors text-left cursor-pointer">
                        {link.label}
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-accent/20 text-[10px] text-accent">🔒 VIP</span>
                      </button>
                    )
                  ) : (
                    <Link href={link.href} className="text-sm text-white/60 hover:text-accent transition-colors">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 关于我们 */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-white/90">关于我们</h3>
            <ul className="flex flex-col gap-2.5">
              <li><Link href="/contact" className="text-sm text-white/60 hover:text-accent transition-colors">联系我们</Link></li>
              <li><Link href="/privacy" className="text-sm text-white/60 hover:text-accent transition-colors">隐私政策</Link></li>
              <li><Link href="/terms" className="text-sm text-white/60 hover:text-accent transition-colors">服务条款</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <p>&copy; 2026 骆芷蝶智选. 保留所有权利.</p>
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70 transition-colors"
          >
            粤ICP备2026073614号-1
          </a>
        </div>
      </div>
    </footer>
  );
}
