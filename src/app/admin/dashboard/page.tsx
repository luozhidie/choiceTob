"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp,
  Lightbulb,
  BarChart3,
  LayoutGrid,
  Megaphone,
  Headphones,
  Crown,
  Truck,
  GraduationCap,
  ArrowRight,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: "easeOut" as const },
  }),
};

const statsCards = [
  {
    label: "合作品牌",
    value: "5,238",
    change: "+12%",
    icon: Users,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "活跃订单",
    value: "1,842",
    change: "+8%",
    icon: ShoppingCart,
    color: "bg-green-50 text-green-600",
  },
  {
    label: "本月营收",
    value: "¥328.5万",
    change: "+23%",
    icon: DollarSign,
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "SKU覆盖",
    value: "52.8万",
    change: "+5%",
    icon: Package,
    color: "bg-purple-50 text-purple-600",
  },
];

const quickLinks = [
  { label: "买手选品", href: "/admin/buyer", icon: TrendingUp, desc: "选品数据与推荐管理" },
  { label: "商品企划", href: "/admin/planning", icon: Lightbulb, desc: "商品结构与节奏规划" },
  { label: "爆款货盘", href: "/admin/hot-picks", icon: BarChart3, desc: "热销数据实时追踪" },
  { label: "陈列搭配", href: "/admin/display", icon: LayoutGrid, desc: "智能陈列方案管理" },
  { label: "营销策划", href: "/admin/marketing", icon: Megaphone, desc: "全渠道营销方案" },
  { label: "销售服务", href: "/admin/sales", icon: Headphones, desc: "销售赋能与培训" },
  { label: "VIP管理", href: "/admin/vip", icon: Crown, desc: "客户分层精细运营" },
  { label: "供应商中心", href: "/admin/supplier", icon: Truck, desc: "供应商资源管理" },
  { label: "知识付费", href: "/admin/education", icon: GraduationCap, desc: "课程内容管理" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-primary">数据概览</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          欢迎回来，以下是您的业务数据概览
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, i) => (
          <motion.div
            key={card.label}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={i}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">
                {card.label}
              </span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-primary">{card.value}</div>
            <div className="mt-1 text-xs text-green-600 font-medium">
              {card.change} ↑ 较上月
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">快速访问</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((item, i) => (
            <motion.div
              key={item.href}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <Link
                href={item.href}
                className="group flex items-start gap-4 p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-accent transition-colors shrink-0 mt-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-semibold text-amber-800 text-sm">🔒 安全提醒</h3>
        <p className="mt-1 text-xs text-amber-700 leading-relaxed">
          管理后台包含商业机密数据，请勿将登录凭证分享给他人。建议定期修改密码，并启用两步验证。
        </p>
      </div>
    </div>
  );
}
