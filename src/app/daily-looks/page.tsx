"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Palette, Sparkles, Calendar, ChevronRight,
  Lock, Unlock, Crown, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

/* ── 搭配类型 ── */
interface DailyLook {
  id: string;
  title: string;
  colors: string[];
  image_url: string | null;
  style: string;
  description: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

/* ── 风格筛选标签 ── */
const STYLE_TABS = ["全部", "温柔知性", "职场通勤", "休闲随性", "优雅气质", "活力潮流"];

/* 非会员免费查看数量 */
const FREE_LOOKS_LIMIT = 3;

/* 套餐定义 */
const PLANS = [
  { id: "daily_looks_monthly", name: "搭配灵感·月度会员", price: 99900, label: "¥999/月", desc: "30天" },
  { id: "daily_looks_yearly", name: "搭配灵感·年度会员", price: 1198000, label: "¥11,980/年", desc: "365天（省¥199/年）" },
];

export default function DailyLooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [looks, setLooks] = useState<DailyLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStyle, setActiveStyle] = useState("全部");
  const [visible, setVisible] = useState(false);

  /* 会员状态 */
  const [user, setUser] = useState<any>(null);
  const [isDailyLooksMember, setIsDailyLooksMember] = useState(false);

  /* 支付状态 */
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);
  /* 标记是否已经自动触发过支付（防止重复） */
  const autoPayTriggered = useRef(false);

  const supabase = createClient();

  useEffect(() => {
    setVisible(true);
    fetchUser();
    fetchLooks();
  }, []);

  /* 登录完成后，检测 URL 上是否有 ?plan=xxx 参数，自动触发支付 */
  useEffect(() => {
    if (user && !autoPayTriggered.current) {
      const pendingPlan = searchParams.get("plan");
      if (pendingPlan && PLANS.some(p => p.id === pendingPlan)) {
        autoPayTriggered.current = true;
        // 清除 URL 参数（避免刷新重复触发）
        window.history.replaceState({}, "", "/daily-looks");
        // 延迟一点确保状态已更新
        setTimeout(() => handleBuyNow(pendingPlan), 500);
      }
    }
  }, [user]);

  /* 获取用户登录状态 + 每日搭配会员状态 */
  const fetchUser = async () => {
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      setUser(u);

      // 检查是否购买了每日搭配套餐 或 是VIP会员
      const { data: memberOrders } = await supabase
        .from("membership_orders")
        .select("plan_id, status")
        .eq("user_id", u.id)
        .in("status", ["paid", "completed", "confirmed"]);

      if (memberOrders && memberOrders.length > 0) {
        const hasDailyLookAccess = memberOrders.some(
          (o: any) =>
            ["daily_looks", "daily_looks_monthly", "daily_looks_yearly",
             "price_trial", "price_1y", "price_2y", "price_3y",
             "view_price_trial", "view_price_year1", "view_price_year2", "view_price_year3",
             "basic", "pro", "premium",
             "wholesale_5w", "wholesale_10w", "wholesale_30w"].includes(o.plan_id)
        );
        setIsDailyLooksMember(hasDailyLookAccess);
      }
    } catch {
      // 静默处理
    }
  };

  const fetchLooks = async () => {
    setLoading(true);
    try {
      // 使用公共 API 查询（服务端绕过 RLS）
      const res = await fetch("/api/public/daily-looks");
      const json = await res.json();

      if (json.success && json.data) {
        setLooks(json.data);
      }
    } catch {
      // 查询失败时静默处理
    } finally {
      setLoading(false);
    }
  };

  /* 直接购买：创建订单 + 调起微信支付 */
  const handleBuyNow = async (planId: string) => {
    // 未登录 → 跳登录页，带上返回路径 + 要购买的套餐
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/daily-looks")}&plan=${planId}`);
      return;
    }

    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return;

    setPayingPlanId(planId);

    try {
      // 1. 创建会员订单
      const { error: insertError } = await supabase.from("membership_orders").insert({
        user_id: user.id,
        plan_id: plan.id,
        plan_name: plan.name,
        price: plan.price,
        payment_method: "wechat_pay",
        status: "pending",
      });
      if (insertError) throw insertError;

      // 2. 调用微信支付统一下单（NATIVE模式，不需要openid）
      const payRes = await fetch("/api/wechat-pay/unified-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: plan.id,
          product_title: plan.name,
          total_fee: plan.price,
          quantity: 1,
          platform: "native",
        }),
      });
      const payResult = await payRes.json();

      setPayingPlanId(null);

      if (payResult.error) {
        alert("支付发起失败：" + (payResult.error || "未知错误"));
        return;
      }

      // 3. 根据环境处理（和商品结算页一致）
      const isWeChatBrowser = /MicroMessenger/i.test(navigator.userAgent);

      if (isWeChatBrowser && payResult.code_url) {
        /* ── 微信内浏览器：用 iframe 触发 weixin:// 协议跳转 → 自动唤起支付密码框 ── */
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = payResult.code_url;
        document.body.appendChild(iframe);
        // 5秒后清理 iframe
        setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 5000);
      } else if (payResult.code_url) {
        /* ── 普通浏览器/电脑：显示支付二维码弹窗 ── */
        // 弹窗提示 + 打开二维码页面
        const confirmed = confirm(
          `订单已创建！\n\n套餐：${plan.name}\n金额：${plan.label}\n订单号：${payResult.order_no || ""}\n\n请使用微信「扫一扫」功能扫描即将打开的二维码完成支付。\n\n点击「确定」打开支付二维码`
        );
        if (confirmed) {
          const qrUrl = `https://cli.im/api/qrcode/code?data=${encodeURIComponent(payResult.code_url)}&size=280&margins=0`;
          window.open(qrUrl, "_blank");
        }
        // 复制 code_url 到剪贴板
        try { navigator.clipboard?.writeText(payResult.code_url); } catch {}
      } else {
        alert("支付链接生成失败，请联系客服");
      }
    } catch (err: any) {
      console.error("支付错误:", err);
      alert("支付出错：" + (err.message || "请重试"));
      setPayingPlanId(null);
    }
  };

  const filteredLooks =
    activeStyle === "全部"
      ? looks
      : looks.filter((l) => l.style?.includes(activeStyle));

  /* 今日日期 */
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDay = ["日", "一", "二", "三", "四", "五", "六"][today.getDay()];

  /* 是否需要限制（非会员且超过3条） */
  const needLimit = !user || !isDailyLooksMember;

  /* 支付按钮组件 */
  const PayButtons = ({ size = "normal" }: { size?: "normal" | "small" }) => (
    <div className={`flex items-center gap-2 ${size === "small" ? "flex-wrap" : ""}`}>
      {PLANS.map((plan) => (
        <button
          key={plan.id}
          onClick={() => handleBuyNow(plan.id)}
          disabled={!!payingPlanId}
          className={`
            ${size === "normal"
              ? "px-4 py-2 text-xs font-bold rounded-full shadow-sm"
              : "px-3 py-1.5 text-[11px] font-bold rounded-lg"}
            bg-gradient-to-r from-red-500 to-pink-500
            text-white
            hover:from-red-600 hover:to-pink-600
            transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            inline-flex items-center gap-1 shrink-0
          `}
        >
          {payingPlanId === plan.id ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> 支付中</>
          ) : (
            <>{plan.label} 立即开通</>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
        </div>
        <div
          className={`container mx-auto px-4 text-center relative z-10 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm mb-6 backdrop-blur-sm">
            <Calendar className="w-4 h-4" />
            {dateStr} 星期{weekDay}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">每日色彩搭配灵感</h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            每一天都值得精心搭配，让色彩为你点亮好心情
          </p>
        </div>
      </section>

      {/* ── 会员专享提示栏 ── */}
      {!isDailyLooksMember && (
        <div className="bg-gradient-to-r from-red-50 via-pink-50 to-orange-50 border-b border-red-100">
          <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <Lock className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-sm font-semibold text-gray-800">每日搭配灵感 · 会员专享</span>
              <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                进阶VIP 8折
                <span className="text-gray-300">·</span>
                高阶VIP 7折
              </span>
            </div>
            <PayButtons size="small" />
          </div>
        </div>
      )}

      {/* ── 已开通提示 ── */}
      {isDailyLooksMember && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-green-500" />
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-green-700">已解锁全部搭配灵感</span>
            </div>
            <Link href="/vip" className="text-xs text-green-600 font-medium hover:text-green-700">
              管理订阅 →
            </Link>
          </div>
        </div>
      )}

      {/* ── 风格筛选 ── */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
            {STYLE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveStyle(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeStyle === tab
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 搭配卡片 ── */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-4 text-sm text-muted-foreground">加载搭配灵感中...</p>
            </div>
          ) : filteredLooks.length === 0 ? (
            <div className="text-center py-20">
              <Palette className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary mb-2">暂无搭配灵感</h3>
              <p className="text-sm text-muted-foreground">搭配灵感正在筹备中，敬请期待</p>
              <Link href="/courses" className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors">
                <Sparkles className="w-4 h-4" />
                浏览教学课程
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLooks.map((look, i) => {
                const isLocked = needLimit && i >= FREE_LOOKS_LIMIT;

                return (
                  <motion.div
                    key={look.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.08, 0.4) }}
                    className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30 ${
                      isLocked ? "pointer-events-none" : ""
                    }`}
                  >
                    {/* 图片区 */}
                    {look.image_url ? (
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={look.image_url}
                          alt={look.title}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                            isLocked ? "blur-sm scale-110 brightness-75" : ""
                          }`}
                        />
                        {/* 锁定遮罩 */}
                        {isLocked && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 backdrop-blur-[2px] z-10">
                            <Lock className="w-10 h-10 text-white mb-3 drop-shadow-md" />
                            <span className="text-white font-bold text-sm drop-shadow-md">订阅后查看完整搭配</span>
                            <span className="text-white/80 text-xs mt-1 drop-shadow-md">进阶VIP 8折 · 高阶VIP 7折</span>
                          </div>
                        )}
                        {/* 色彩条 */}
                        <div className="absolute bottom-2 right-2 flex gap-1 z-10">
                          {look.colors.slice(0, isLocked ? 0 : undefined).map((c: string) => (
                            <div key={c} className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={`aspect-[4/3] bg-gradient-to-br from-primary/5 to-accent/10 flex items-center justify-center ${isLocked ? "blur-sm brightness-75" : ""}`}>
                        {isLocked ? (
                          <Lock className="w-10 h-10 text-gray-300" />
                        ) : (
                          <div className="flex gap-2">
                            {look.colors.map((c: string) => (
                              <div key={c} className="w-10 h-10 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 文字区 */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                          {isLocked ? "···" : look.style}
                        </span>
                      </div>
                      <h3 className={`font-bold text-primary group-hover:text-accent transition-colors ${isLocked ? "text-transparent select-none" : ""}`}>
                        {isLocked ? "已锁定" : look.title}
                      </h3>
                      {look.description && !isLocked && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{look.description}</p>
                      )}
                      {isLocked && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 text-transparent select-none">{" ".repeat(20)}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
                        {look.colors.slice(0, isLocked ? 0 : undefined).map((c: string) => (
                          <div key={c} className="w-4 h-4 rounded-full shadow-sm border border-gray-100" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>

                    {/* 锁定角标 */}
                    {isLocked && (
                      <div className="absolute top-3 right-3 z-20 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                        <Lock className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* 非会员末尾：解锁引导卡（含支付按钮） */}
              {needLimit && filteredLooks.length > FREE_LOOKS_LIMIT && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="group relative bg-white rounded-2xl border-2 border-dashed border-red-200 hover:border-red-300 transition-all overflow-hidden flex flex-col items-center justify-center p-6 min-h-[360px]"
                >
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
                    <Unlock className="w-7 h-7 text-red-500" />
                  </div>

                  <h3 className="font-bold text-gray-900 mb-1.5 text-center">解锁更多搭配灵感</h3>
                  <p className="text-sm text-gray-500 mb-1 leading-relaxed text-center">
                    订阅后查看完整搭配方案 · 每日更新
                  </p>
                  <p className="text-xs text-gray-400 text-center mb-4">
                    专业买手精选 · 风格陈列 · 场景搭配 · 门店布局
                  </p>

                  {/* 套餐价格信息 */}
                  <div className="space-y-2 text-center mb-5 w-full max-w-[220px]">
                    <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-left">
                        <div className="text-sm font-bold text-gray-900">月度会员</div>
                        <div className="text-[11px] text-gray-400">30天有效期</div>
                      </div>
                      <span className="text-base font-black text-red-500">¥999</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-bold">推荐</div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-gray-900">年度会员</div>
                        <div className="text-[11px] text-gray-400">365天 · 省¥199/年</div>
                      </div>
                      <span className="text-base font-black text-red-600">¥11,980</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center text-[11px] text-gray-400">
                      <span>进阶VIP 8折</span> <span className="text-gray-200">|</span> <span>高阶VIP 7折</span>
                    </div>
                  </div>

                  {/* 直接支付按钮 */}
                  <PayButtons />
                </motion.div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── 底部引导 ── */}
      <section className="py-12 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-lg font-bold text-primary">想学习更多搭配技巧？</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            从色彩诊断到风格定位，专业课程帮你系统提升穿搭能力
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
              <Sparkles className="w-4 h-4" />
              浏览教学课程
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/style-test" className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-primary text-primary text-sm font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors">
              <Palette className="w-4 h-4" />
              风格测试
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
