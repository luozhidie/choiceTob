"use client";

import { useState, type ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  Crown,
  Award,
  Gem,
  ChevronRight,
  Check,
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  TrendingUp,
  Gift,
  Shield,
} from "lucide-react";

const VIP_LEVELS: {
  level: string;
  name: string;
  icon: ComponentType<LucideProps>;
  annualSpend: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  coreBenefits: string[];
}[] = [
  {
    level: "V1",
    name: "银卡会员",
    icon: Award,
    annualSpend: "0 - 5万",
    color: "from-gray-300 to-gray-400",
    textColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    coreBenefits: ["批发价采购", "基础退换服务", "新品优先通知"],
  },
  {
    level: "V2",
    name: "金卡会员",
    icon: Crown,
    annualSpend: "5万 - 30万",
    color: "from-yellow-400 to-yellow-600",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    coreBenefits: ["折扣价采购(9.5折)", "优先退换服务", "专属买手顾问", "季度选品报告"],
  },
  {
    level: "V3",
    name: "黑卡会员",
    icon: Gem,
    annualSpend: "30万以上",
    color: "from-gray-700 to-gray-900",
    textColor: "text-gray-900",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    coreBenefits: [
      "最优折扣价(9折)",
      "无理由退换",
      "1对1企划顾问",
      "新品首发体验",
      "年度品牌赋能课程",
    ],
  },
];

const SPEND_TIERS = [
  {
    tier: "5万",
    discount: "9.8折",
    returnRate: "7天无理由退换",
    extra: "基础权益",
  },
  {
    tier: "10万",
    discount: "9.5折",
    returnRate: "15天无理由退换",
    extra: "专属选品顾问",
  },
  {
    tier: "30万",
    discount: "9.0折",
    returnRate: "30天无理由退换",
    extra: "1对1企划顾问+免费课程",
  },
];

const BENEFITS_TABLE = [
  { benefit: "批发价采购", v1: true, v2: true, v3: true },
  { benefit: "折扣优惠", v1: false, v2: true, v3: true },
  { benefit: "基础退换服务", v1: true, v2: true, v3: true },
  { benefit: "优先退换服务", v1: false, v2: true, v3: true },
  { benefit: "无理由退换", v1: false, v2: false, v3: true },
  { benefit: "新品优先通知", v1: true, v2: true, v3: true },
  { benefit: "专属买手顾问", v1: false, v2: true, v3: true },
  { benefit: "1对1企划顾问", v1: false, v2: false, v3: true },
  { benefit: "季度选品报告", v1: false, v2: true, v3: true },
  { benefit: "年度品牌赋能课程", v1: false, v2: false, v3: true },
];

const MOCK_CONSUMPTION = [
  { date: "2025-01-15", item: "法式方领碎花连衣裙 x20", amount: 2560 },
  { date: "2025-02-08", item: "经典黑色西装外套 x10", amount: 2350 },
  { date: "2025-03-22", item: "优雅真丝印花衬衫 x15", amount: 2970 },
  { date: "2025-04-10", item: "浪漫蕾丝拼接长裙 x12", amount: 2016 },
];

export default function MembersPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">VIP会员中心</h1>
          <p className="text-white/80 text-lg">
            尊享专属权益，开启精准选品之旅
          </p>
        </div>
      </div>

      {/* VIP Level Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VIP_LEVELS.map((lvl) => {
            const Icon = lvl.icon;
            return (
              <div
                key={lvl.level}
                className={`bg-white rounded-2xl border ${lvl.borderColor} p-6 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${lvl.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-2xl font-bold ${lvl.textColor}`}>
                    {lvl.level}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {lvl.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  年消费 {lvl.annualSpend}
                </p>
                <ul className="space-y-2">
                  {lvl.coreBenefits.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Annual Spend Tiers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          年度VIP货款阶梯
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          消费越多，权益越丰厚
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SPEND_TIERS.map((tier, idx) => (
            <div
              key={tier.tier}
              className={`relative bg-white rounded-2xl border p-6 text-center ${
                idx === 2
                  ? "border-accent ring-2 ring-accent/20"
                  : "border-gray-200"
              }`}
            >
              {idx === 2 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                  推荐
                </span>
              )}
              <div className="text-3xl font-bold text-primary mb-2">
                ¥{tier.tier}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                年度累计货款
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">{tier.discount}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">{tier.returnRate}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Gift className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">{tier.extra}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth / Profile Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              {/* Tab switch */}
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setAuthMode("login")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                    authMode === "login"
                      ? "bg-white text-primary shadow-sm"
                      : "text-muted-foreground hover:text-gray-700"
                  }`}
                >
                  <LogIn className="w-4 h-4" /> 登录
                </button>
                <button
                  onClick={() => setAuthMode("register")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                    authMode === "register"
                      ? "bg-white text-primary shadow-sm"
                      : "text-muted-foreground hover:text-gray-700"
                  }`}
                >
                  <UserPlus className="w-4 h-4" /> 注册
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsLoggedIn(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="请输入邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {authMode === "login" ? (
                    <>
                      <LogIn className="w-4 h-4" /> 登录
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> 注册
                    </>
                  )}
                </button>
              </form>
              {/* 后续对接Supabase Auth */}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Member Info Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">张女士</h3>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                      V2 金卡会员
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    年度累计消费 ¥89,600 | 距离V3还需 ¥210,400
                  </p>
                </div>
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  退出
                </button>
              </div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full"
                  style={{ width: "30%" }}
                />
              </div>
            </div>

            {/* Quick Benefits */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: TrendingUp, label: "9.5折采购", color: "text-green-600" },
                { icon: Shield, label: "15天退换", color: "text-blue-600" },
                { icon: User, label: "买手顾问", color: "text-purple-600" },
                { icon: Gift, label: "季度报告", color: "text-accent" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-sm transition-shadow"
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Consumption History */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">消费记录</h3>
              <div className="space-y-3">
                {MOCK_CONSUMPTION.map((record, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {record.item}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.date}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      ¥{record.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Benefits Comparison Table */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            会员权益对比
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            不同等级享有的权益一览
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                    权益项目
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-gray-500">
                    V1 银卡
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-yellow-700">
                    V2 金卡
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-gray-900">
                    V3 黑卡
                  </th>
                </tr>
              </thead>
              <tbody>
                {BENEFITS_TABLE.map((row) => (
                  <tr
                    key={row.benefit}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3.5 px-4 text-sm text-gray-700">
                      {row.benefit}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.v1 ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.v2 ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.v3 ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Login Prompt */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl text-center">
            <div className="max-w-xl mx-auto px-6">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-bold text-primary">完整数据与深度分析</h3>
              <p className="mt-2 text-sm text-muted-foreground">详细商业数据、供应链信息与专业分析报告，仅对授权用户开放</p>
              <a href="/admin/login" className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                登录管理后台
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            开启您的VIP之旅
          </h2>
          <p className="text-white/70 mb-6">
            注册即可成为V1银卡会员，享受批发价采购权益
          </p>
          <button
            onClick={() => {
              setAuthMode("register");
              setIsLoggedIn(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg"
          >
            注册成为会员
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
