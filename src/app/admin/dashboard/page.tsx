"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
  BookOpen,
  ArrowRight,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: "easeOut" as const },
  }),
};

const quickLinks = [
  { label: "买手选品", href: "/admin/buyer", icon: TrendingUp, desc: "选品数据与推荐管理", table: "buyer_products" },
  { label: "商品企划", href: "/admin/planning", icon: Lightbulb, desc: "商品结构与节奏规划", table: "planning_reports" },
  { label: "爆款货盘", href: "/admin/hot-picks", icon: BarChart3, desc: "热销数据实时追踪", table: "hot_picks" },
  { label: "陈列搭配", href: "/admin/display", icon: LayoutGrid, desc: "智能陈列方案管理", table: "displays" },
  { label: "营销策划", href: "/admin/marketing", icon: Megaphone, desc: "全渠道营销方案", table: "marketing_campaigns" },
  { label: "销售服务", href: "/admin/sales", icon: Headphones, desc: "销售赋能与培训", table: "sales_services" },
  { label: "VIP管理", href: "/admin/vip", icon: Crown, desc: "客户分层精细运营", table: "vip_tiers" },
  { label: "供应商中心", href: "/admin/supplier", icon: Truck, desc: "供应商资源管理", table: "suppliers" },
  { label: "教学中心", href: "/admin/education", icon: GraduationCap, desc: "课程内容管理", table: "courses" },
  { label: "流行资讯", href: "/admin/magazine", icon: BookOpen, desc: "资讯文章管理", table: "articles" },
];

interface ModuleCount {
  label: string;
  count: number;
  table: string;
  icon: any;
  color: string;
}

interface Suggestion {
  id: string;
  module: string;
  issue: string;
  suggestion: string;
  priority: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [moduleCounts, setModuleCounts] = useState<ModuleCount[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // 获取各模块数据量
    const counts: ModuleCount[] = [];
    for (const link of quickLinks) {
      const { count } = await supabase
        .from(link.table)
        .select("*", { count: "exact", head: true });

      counts.push({
        label: link.label,
        count: count || 0,
        table: link.table,
        icon: link.icon,
        color: getModuleColor(link.table),
      });
    }
    setModuleCounts(counts);

    // 获取经营改善建议
    const { data: suggestionsData } = await supabase
      .from("improvement_suggestions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    setSuggestions(suggestionsData || []);
    setLoading(false);
  };

  const getModuleColor = (table: string) => {
    const colors: Record<string, string> = {
      buyer_products: "bg-blue-50 text-blue-600",
      planning_reports: "bg-purple-50 text-purple-600",
      hot_picks: "bg-amber-50 text-amber-600",
      displays: "bg-pink-50 text-pink-600",
      marketing_campaigns: "bg-green-50 text-green-600",
      sales_services: "bg-orange-50 text-orange-600",
      vip_tiers: "bg-red-50 text-red-600",
      suppliers: "bg-cyan-50 text-cyan-600",
      courses: "bg-indigo-50 text-indigo-600",
      articles: "bg-teal-50 text-teal-600",
    };
    return colors[table] || "bg-gray-50 text-gray-600";
  };

  const generateSuggestions = async () => {
    setGenerating(true);

    // 基于各模块数据量生成改善建议
    const newSuggestions = [];

    // 检查各模块是否有数据
    for (const mod of moduleCounts) {
      if (mod.count === 0) {
        newSuggestions.push({
          module: mod.label,
          issue: `${mod.label}模块暂无数据上传`,
          suggestion: `请前往${mod.label}管理页面上传相关数据，完善经营数据基础。`,
          priority: "高",
        });
      } else if (mod.count < 5) {
        newSuggestions.push({
          module: mod.label,
          issue: `${mod.label}模块数据量偏少（仅${mod.count}条）`,
          suggestion: `建议增加${mod.label}相关数据录入，提升数据完整度，便于后续分析。`,
          priority: "中",
        });
      }
    }

    // 检查爆款货盘与买手选品的匹配度
    const hotPicksCount = moduleCounts.find(m => m.table === "hot_picks")?.count || 0;
    const buyerCount = moduleCounts.find(m => m.table === "buyer_products")?.count || 0;
    if (hotPicksCount > 0 && buyerCount === 0) {
      newSuggestions.push({
        module: "买手选品",
        issue: "爆款货盘有数据但买手选品为空",
        suggestion: "爆款数据应与买手选品体系联动，建议上传选品数据，建立爆款选品关联。",
        priority: "高",
      });
    }

    // 检查VIP管理
    const vipCount = moduleCounts.find(m => m.table === "vip_tiers")?.count || 0;
    if (vipCount === 0) {
      newSuggestions.push({
        module: "VIP管理",
        issue: "未设置VIP会员体系",
        suggestion: "建议设置VIP等级与权益，建立客户分层运营体系，提升客户留存。",
        priority: "高",
      });
    }

    // 检查供应商
    const supplierCount = moduleCounts.find(m => m.table === "suppliers")?.count || 0;
    if (supplierCount === 0) {
      newSuggestions.push({
        module: "供应商中心",
        issue: "供应商资源库为空",
        suggestion: "建议录入核心供应商信息，建立供应链管理体系，保障货源稳定。",
        priority: "高",
      });
    }

    // 保存到数据库
    if (newSuggestions.length > 0) {
      const { error } = await supabase
        .from("improvement_suggestions")
        .insert(newSuggestions);

      if (error) {
        console.error("Error saving suggestions:", error);
      }
    }

    // 重新获取建议列表
    const { data } = await supabase
      .from("improvement_suggestions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    setSuggestions(data || []);
    setGenerating(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("improvement_suggestions")
      .update({ is_read: true })
      .eq("id", id);

    setSuggestions(suggestions.map(s => s.id === id ? { ...s, is_read: true } : s));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "高": return "bg-red-100 text-red-700";
      case "中": return "bg-amber-100 text-amber-700";
      case "低": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">数据概览</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            实时采集各模块数据，自动生成经营改善建议
          </p>
        </div>
        <button
          onClick={generateSuggestions}
          disabled={generating || loading}
          className="btn-primary flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              生成改善方案
            </>
          )}
        </button>
      </div>

      {/* Module Data Stats */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">各模块数据量</h2>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-2" />
            <p className="text-sm text-muted-foreground">加载数据中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {moduleCounts.map((mod, i) => (
              <motion.div
                key={mod.table}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {mod.label}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mod.color}`}>
                    <mod.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">{mod.count}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {mod.count === 0 ? "待上传" : "条数据"}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Improvement Suggestions */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">经营改善建议</h2>
        {suggestions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-muted-foreground">暂无改善建议</p>
            <p className="text-sm text-muted-foreground mt-1">
              点击上方"生成改善方案"按钮，系统将基于您的数据分析并生成建议
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <motion.div
                key={s.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
                className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
                  s.is_read ? "border-gray-100 opacity-60" : "border-amber-200 bg-amber-50/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${s.is_read ? "text-gray-400" : "text-amber-500"}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-primary">
                        {s.module}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(s.priority)}`}>
                        {s.priority}优先级
                      </span>
                      {!s.is_read && (
                        <span className="text-xs text-amber-600 font-medium">未读</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 font-medium mb-1">{s.issue}</p>
                    <p className="text-sm text-muted-foreground">{s.suggestion}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("zh-CN")}
                      </span>
                      {!s.is_read && (
                        <button
                          onClick={() => markAsRead(s.id)}
                          className="text-xs text-accent hover:text-accent/80 font-medium"
                        >
                          标记已读
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
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
    </div>
  );
}
