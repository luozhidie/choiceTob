"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Crown, Sparkles, Package, TrendingUp, Megaphone,
  Lock, CheckCircle2, ArrowRight, User, Shield, Star,
} from "lucide-react";

/** 会员功能卡片 */
const MEMBER_FEATURES = [
  {
    key: "vip",
    title: "VIP 会员服务",
    desc: "专属选品权、设计稿优先、大数据爆款推荐",
    icon: Crown,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200",
    href: "/vip",
    badge: "热门",
    requiresMembership: false,
  },
  {
    key: "planning",
    title: "商品企划中心",
    desc: "AI驱动的商品开发决策、96格货盘矩阵、采购清单生成",
    icon: Package,
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
    href: "/planning",
    badge: "AI驱动",
    requiresMembership: true,
  },
  {
    key: "hotpicks",
    title: "爆款样衣展厅",
    desc: "精选市场最新爆款样衣，会员可查看详情与价格，看中即咨询下单",
    icon: Sparkles,
    color: "from-accent to-pink-500",
    bgColor: "bg-gradient-to-br from-accent-light/30 to-pink-50 border-pink-200",
    href: "/hot-picks",
    badge: "独家",
    requiresMembership: true,
  },
  {
    key: "trend",
    title: "爆款预测分析",
    desc: "AI趋势预测、色彩/面料/款式趋势、明星同款货源搜索",
    icon: TrendingUp,
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200",
    href: "/trend-predict",
    badge: "AI分析",
    requiresMembership: true,
  },
  {
    key: "marketing",
    title: "营销策划工具",
    desc: "AI营销方案生成、推广策略建议、投放效果预估",
    icon: Megaphone,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200",
    href: "/marketing",
    badge: "智能",
    requiresMembership: true,
  },
];

export default function MembersPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.push("/login?redirect=/members");
        return;
      }
      setUser(u);
      // 获取 profile
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .single();
      setProfile(p || {});
      setChecking(false);
    };
    init();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isMember = profile?.membership_type && profile?.membership_type !== "";
  const memberType = profile?.membership_type === "view_price" ? "基础VIP（查价特权）"
    : profile?.membership_type === "deposit_discount" ? "高阶VIP（拿货折扣）" : null;

  // 检查是否有买手选品记录或订单记录（放宽条件：只要注册了就可以看到，部分功能需会员）
  const hasBuyerAccess = !!user; // 已登录即可访问基础功能

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <span className="text-primary font-medium">会员中心</span>
          </nav>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-purple-600 to-accent text-white py-14">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-yellow-300 rounded-full blur-3xl translate-y-1/2" />
        </div>
        <div className="container mx-auto px-4 relative z-10 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-4 border border-white/20">
            <Shield className="w-4 h-4" /> 会员专享服务中心
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">骆芷蝶智选 · 会员中心</h1>
          <p className="text-white/80 text-base max-w-xl mx-auto">
            整合VIP服务、商品企划、爆款样衣、营销策划的一站式赋能平台
          </p>

          {/* 会员状态卡 */}
          <div className="mt-8 inline-flex items-center gap-6 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{profile?.full_name || profile?.email || "会员用户"}</p>
                <p className="text-xs text-white/60">{isMember ? `· ${memberType}` : "· 未开通VIP"}</p>
              </div>
            </div>
            {!isMember && (
              <Link
                href="/vip"
                className="px-5 py-2.5 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-colors text-sm flex items-center gap-2"
              >
                <Crown className="w-4 h-4" /> 开通 VIP
              </Link>
            )}
            {isMember && (
              <span className="px-5 py-2.5 bg-green-500/90 text-white font-bold rounded-xl text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> VIP 已激活
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 功能入口 */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">

          <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent" /> 会员专享功能
          </h2>

          {/* 权限说明 */}
          {!isMember && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">部分功能需要开通 VIP 会员才能使用</p>
                <p className="text-xs text-amber-600 mt-1">标注「🔒 需要会员」的功能仅限已开通会员的用户使用。立即开通享受全部权益。</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {MEMBER_FEATURES.map((feature) => {
              const Icon = feature.icon;
              const locked = feature.requiresMembership && !isMember;

              return (
                <div
                  key={feature.key}
                  className={`group relative rounded-2xl p-6 transition-all duration-300 ${feature.bgColor} ${
                    locked
                      ? "opacity-75 grayscale-[0.3]"
                      : "shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                  }`}
                  onClick={() => !locked && router.push(feature.href)}
                >
                  {feature.badge && (
                    <span className={`absolute -top-2.5 right-4 px-3 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${feature.color}`}>
                      {feature.badge}
                    </span>
                  )}

                  <div className={`w-12 h-12 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center mb-4 ${
                    locked ? "opacity-50" : ""
                  }`}>
                    <Icon className={`w-6 h-6 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`} />
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{feature.desc}</p>

                  {locked ? (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-600">
                      <Lock className="w-3.5 h-3.5" />
                      需要 VIP 会员
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium bg-white/60 backdrop-blur-sm rounded-lg px-3 py-1.5 group-hover:bg-white/90 transition-colors text-gray-700">
                      立即进入
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 底部提示 */}
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-400">
              如有疑问或需要帮助，请
              <Link href="/contact" className="text-accent hover:underline ml-1">联系客服</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
