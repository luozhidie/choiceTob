"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  User,
  Shield,
  MapPin,
  FileText,
  Lock,
  ScrollText,
  Info,
  LogOut,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => {
      setUser(data?.user || null);
      setLoading(false);
    });
  }, [supabase]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setLoggingOut(false);
    router.push("/my");
  };

  const menuGroups = [
    {
      title: "账户设置",
      items: [
        { icon: User, label: "个人信息", href: "/my", show: true },
        { icon: Shield, label: "账户与安全", href: "/my", show: true },
        { icon: MapPin, label: "收货地址", href: "/address", show: true },
      ],
    },
    {
      title: "协议与规则",
      items: [
        { icon: Lock, label: "隐私政策", href: "/privacy", show: true },
        { icon: FileText, label: "平台服务协议", href: "/terms", show: true },
        { icon: ScrollText, label: "平台规则", href: "/rules", show: true },
        { icon: Info, label: "关于我们", href: "/about", show: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/my"
            className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-base font-bold text-gray-900">设置</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 pb-12 space-y-6">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {menuGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-semibold text-gray-500 mb-3 px-1">{group.title}</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {group.items
                    .filter((item) => item.show)
                    .map((item, idx, arr) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center justify-between px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                          idx !== arr.length - 1 ? "border-b border-gray-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-gray-500" />
                          <span className="text-sm text-gray-800">{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </Link>
                    ))}
                </div>
              </div>
            ))}

            {/* 退出登录 */}
            {user ? (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-red-500 font-medium text-sm hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-60"
              >
                {loggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                退出登录
              </button>
            ) : (
              <Link
                href="/login?redirect=/my"
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-medium text-sm hover:bg-primary/90 active:scale-[0.99] transition-all"
              >
                <LogOut className="w-4 h-4 rotate-180" />
                登录 / 注册
              </Link>
            )}

            <p className="text-center text-xs text-gray-400 pt-2">
              登录即表示同意《平台服务协议》和《隐私政策》
            </p>
          </>
        )}
      </div>
    </div>
  );
}
