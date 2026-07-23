"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, PanelLeftClose, ChevronsDown, ChevronsUp } from "lucide-react";

// 菜单数据（定义在组件外部，避免每次渲染重建）
const menuGroups = [
  // ─── 概览 ───
  { label: "概览", items: [
    { label: "数据概览", href: "/admin/dashboard" },
    { label: "站点图片", href: "/admin/site-assets" },
    { label: "页面背景", href: "/admin/page-background" },
  ]},

  // ─── 店铺管理 ───
  { label: "店铺管理", items: [
    { label: "店铺列表", href: "/admin/stores" },
    { label: "品类管理", href: "/admin/categories" },
    { label: "分类筛选项", href: "/admin/category-filters" },
    { label: "首页行业标签", href: "/admin/home-categories" },
    { label: "店铺买手决策", href: "/admin/buyer-features" },
    { label: "店铺内容", href: "/admin/store-content" },
  ]},

  // ─── 会员权益 ───
  { label: "会员权益", items: [
    { label: "会员等级配置", href: "/admin/membership-levels" },
    { label: "优惠券管理", href: "/admin/coupons" },
    { label: "红包管理", href: "/admin/red-packets" },
  ]},

  // ─── VIP会员 ───
    { label: "VIP会员", items: [
      { label: "VIP订单", href: "/admin/membership-orders" },
      { label: "VIP管理", href: "/admin/vip" },
      { label: "VIP加油包", href: "/admin/vip-addons" },
      { label: "形象诊断管理", href: "/admin/vip-diagnosis" },
      { label: "色彩季型录入", href: "/admin/color-analysis" },
    { label: "色彩季型对比", href: "/admin/color-compare" },
    { label: "风格测试记录", href: "/admin/style-tests" },
    { label: "风格测试结果", href: "/admin/style-test-results" },
    { label: "测试码管理", href: "/admin/test-codes" },
  ]},

  // ─── 充值管理（保留） ───
  { label: "充值管理", items: [
    { label: "充值订单", href: "/admin/charge-orders" },
  ]},

  // ─── 商品&企划 ───
  { label: "商品&企划", items: [
    { label: "企划需求处理", href: "/admin/planning-requests" },
    { label: "企划订单管理", href: "/admin/planning-orders" },
    { label: "商品企划", href: "/admin/product-plan" },
    { label: "生成企划报告", href: "/admin/report" },
    { label: "商品管理", href: "/admin/products" },
    { label: "测款管理", href: "/admin/testing" },
    { label: "轮播图管理", href: "/admin/banners" },
    { label: "爆款样衣", href: "/admin/hot-products" },
    { label: "爆款货盘", href: "/admin/hot-picks" },
    { label: "爆款图片", href: "/admin/hot-picks-images" },
    { label: "买手选品", href: "/admin/buyer" },
    { label: "选品步骤", href: "/admin/planning-steps" },
    { label: "自动组货", href: "/admin/assortment" },
    { label: "买手中心", href: "/admin/buyer-center" },
    { label: "买手步骤", href: "/admin/buyer-steps" },
    { label: "货盘规划", href: "/admin/product-evaluation" },
    { label: "CMB打标管理", href: "/admin/cmb" },
  ]},

  // ─── 采购&供应链 ───
  { label: "采购&供应链", items: [
    { label: "采购意向", href: "/admin/purchase-intents" },
    { label: "订单管理", href: "/admin/orders" },
    { label: "采购订单", href: "/admin/purchase-orders" },
    { label: "供应商管理", href: "/admin/supplier" },
    { label: "供应商图片", href: "/admin/supplier-images" },
  ]},

  // ─── 库存&销售 ───
  { label: "库存&销售", items: [
    { label: "库存管理", href: "/admin/inventory" },
    { label: "销售数据", href: "/admin/sales-data" },
    { label: "门店经营数据", href: "/admin/store-reports" },
    { label: "市场需求统计", href: "/admin/market-demand" },
  ]},

  // ─── 陈列&搭配 ───
  { label: "陈列&搭配", items: [
    { label: "陈列搭配", href: "/admin/collocation" },
    { label: "搭配方案", href: "/admin/display" },
    { label: "陈列图片", href: "/admin/display-images" },
    { label: "每日搭配", href: "/admin/daily-looks" },
    { label: "属性编码管理", href: "/admin/attribute-encoding" },
  ]},

  // ─── 同行档口货架 ───
  { label: "同行档口货架", items: [
    { label: "市场/商圈", href: "/admin/markets" },
    { label: "同行档口", href: "/admin/stalls" },
    { label: "档口评价", href: "/admin/stall-reviews" },
  ]},

  // ─── 营销&内容 ───
  { label: "营销&内容", items: [
    { label: "营销策划", href: "/admin/marketing" },
    { label: "营销图片", href: "/admin/marketing-images" },
    { label: "搭配灵感", href: "/admin/inspirations" },
    { label: "销售服务", href: "/admin/sales" },
    { label: "销售图片", href: "/admin/sales-images" },
    { label: "内容日历", href: "/admin/content-calendar" },
    { label: "营销活动", href: "/admin/promotions" },
    { label: "沙龙活动", href: "/admin/salon" },
    { label: "沙龙流程", href: "/admin/salon-events" },
    { label: "爆款样衣(设计)", href: "/admin/designer" },
  ]},

  // ─── 客户&线索 ───
  { label: "客户&线索", items: [
    { label: "客户管理", href: "/admin/customers" },
    { label: "线索管理", href: "/admin/leads" },
    { label: "交付方案", href: "/admin/deliveries" },
  ]},

  // ─── 陪购管理 ───
    { label: "陪购管理", items: [
      { label: "形象顾问", href: "/admin/booking-consultants" },
      { label: "陪购设置", href: "/admin/booking-settings" },
      { label: "智能形象诊断", href: "/admin/style-test" },
      { label: "营销方案", href: "/admin/marketing-plans" },
      { label: "预约订单", href: "/admin/bookings" },
    ]},

  // ─── 潜客管理 ───
  { label: "潜客管理", items: [
    { label: "门店信息", href: "/admin/crm/stores" },
    { label: "联系人管理", href: "/admin/crm/contacts" },
    { label: "跟进记录", href: "/admin/crm/follow-ups" },
    { label: "加微信", href: "/admin/crm/wechat-add" },
    { label: "微信话术", href: "/admin/crm/wechat-templates" },
    { label: "门后采集", href: "/admin/crm/scrape" },
    { label: "提醒中心", href: "/admin/crm/reminders" },
    { label: "批量导入", href: "/admin/crm/import" },
  ]},

  // ─── 项目&预算 ───
  { label: "项目&预算", items: [
    { label: "项目进度", href: "/admin/project-tracker" },
    { label: "预算与成本", href: "/admin/budget-tracker" },
  ]},

  // ─── 教学&资讯 ───
  { label: "教学&资讯", items: [
    { label: "教学中心", href: "/admin/education" },
    { label: "课程管理", href: "/admin/courses" },
    { label: "课程购买记录", href: "/admin/course-purchases" },
    { label: "流行资讯", href: "/admin/fashion-trends" },
    { label: "杂志", href: "/admin/magazine" },
  ]},

  // ─── 趋势（保留额外分组） ───
  { label: "趋势", items: [
    { label: "趋势预测", href: "/admin/trend-predict" },
    { label: "趋势中心", href: "/admin/trend-center" },
    { label: "明星同款", href: "/admin/celebrity" },
    { label: "品牌秀场采集", href: "/admin/runway" },
  ]},

  // ─── 其他（保留） ───
  { label: "其他", items: [
    { label: "访客管理", href: "/admin/visitors" },
    { label: "待审", href: "/admin/pending" },
    { label: "图片抓取工具", href: "/admin/image-grabber" },
    { label: "版块管理器", href: "/admin/blocks" },
    { label: "弹窗管理", href: "/admin/popups" },
  ]},

  // ─── AI 智能中心 ───
  { label: "AI 智能中心", items: [
    { label: "AI 中心首页", href: "/admin/ai-center" },
    { label: "AI 爆款文案", href: "/admin/ai-marketing-copy" },
    { label: "服装股票监控", href: "/admin/stock-monitor" },
    { label: "模拟交易", href: "/admin/simulation" },
    { label: "福利彩票概率统计", href: "/admin/lottery" },
    { label: "AI 生产协同", href: "/admin/production-coordination" },
    { label: "商品企划", href: "/admin/report" },
    { label: "AI 设计研发", href: "/admin/designer" },
    { label: "AI 营销策划", href: "/admin/marketing" },
    { label: "趋势预测", href: "/admin/trend-predict" },
    { label: "买手中心", href: "/admin/buyer-center" },
  ]},

  // ─── 独立服务（经主站反向代理内嵌，国内可访问） ───
  { label: "独立服务", items: [
    { label: "区块链溯源", href: "/admin/services/trace" },
    { label: "数字藏品", href: "/admin/services/collectible" },
    { label: "虚拟试衣", href: "/admin/services/tryon" },
  ]},
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── 所有 hooks 必须在组件顶层无条件调用 ──
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  // 根据当前路径自动展开对应分组（优先用户点击进入的分组，避免同一页面归属多个分组时高亮错位）
  useEffect(() => {
    if (!mounted || collapsed) return;
    const autoExpand = new Set<string>();
    // 优先：用户上次点击进入时记录的分组
    const preferred =
      typeof window !== "undefined" ? sessionStorage.getItem("activeMenuGroup") : null;
    if (preferred) {
      const grp = menuGroups.find((g) => g.label === preferred);
      if (grp && grp.items.some((i) => i.href === pathname)) {
        autoExpand.add(preferred);
      }
    }
    // fallback：取第一个匹配的分组
    if (autoExpand.size === 0) {
      for (const group of menuGroups) {
        if (group.items.some((i) => i.href === pathname)) {
          autoExpand.add(group.label);
          break;
        }
      }
    }
    setExpandedGroups(autoExpand);
  }, [pathname, mounted, collapsed]);

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedGroups(new Set(menuGroups.map(g => g.label)));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  // 登录页直接渲染子内容（无侧边栏）
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // 首次渲染未挂载时显示加载占位（SSR安全）
  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#666" }}>加载中...</div>
      </div>
    );
  }

  const findTitle = () => {
    const preferred =
      typeof window !== "undefined" ? sessionStorage.getItem("activeMenuGroup") : null;
    if (preferred) {
      const grp = menuGroups.find((g) => g.label === preferred);
      const found = grp?.items.find((i) => i.href === pathname);
      if (found) return found.label;
    }
    for (const group of menuGroups) {
      const found = group.items.find((i) => i.href === pathname);
      if (found) return found.label;
    }
    return "数据概览";
  };

  // ── 主布局 ──
  return (
    <div style={{ minHeight: "100vh", background: "#1a1a2e", display: "flex" }}>
      {/* 侧边栏 */}
      <aside
        style={{
          width: collapsed ? 56 : 240,
          background: "#16162b",
          color: "#94a3b8",
          flexShrink: 0,
          overflowY: "auto",
          overflowX: "hidden",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          transition: "width 0.2s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? "14px 10px" : "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <a
              href="/admin/dashboard"
              style={{ textDecoration: "none", color: "#fff", fontSize: 14, fontWeight: 700 }}
            >
              骆芷蝶智选 · 后台
            </a>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "展开菜单" : "收起菜单"}
            style={{
              padding: 6, borderRadius: 4,
              background: "rgba(255,255,255,0.08)", border: "none",
              color: "#94a3b8", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {collapsed ? <PanelLeftClose size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* 折叠控制按钮 */}
        {!collapsed && (
          <div style={{ padding: "6px 12px 0", display: "flex", gap: 4, flexShrink: 0 }}>
            <button
              onClick={expandAll}
              style={{
                padding: "2px 8px", borderRadius: 4,
                background: "rgba(255,255,255,0.06)", border: "none",
                color: "#94a3b8", cursor: "pointer", fontSize: 11,
                display: "flex", alignItems: "center", gap: 2,
              }}
            >
              <ChevronsDown size={12} /> 全部展开
            </button>
            <button
              onClick={collapseAll}
              style={{
                padding: "2px 8px", borderRadius: 4,
                background: "rgba(255,255,255,0.06)", border: "none",
                color: "#94a3b8", cursor: "pointer", fontSize: 11,
                display: "flex", alignItems: "center", gap: 2,
              }}
            >
              <ChevronsUp size={12} /> 全部收起
            </button>
          </div>
        )}

        {/* 菜单导航 */}
        <nav style={{ padding: "4px 8px", flex: 1, overflowY: "auto" }}>
          {menuGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.label);

            return (
              <div key={group.label} style={{ marginBottom: 2 }}>
                {/* 分组标题 */}
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    style={{
                      width: "100%",
                      padding: "6px 12px 4px",
                      fontSize: 11, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                      color: "#64748b", border: "none", background: "transparent",
                      cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <span style={{
                      display: "inline-block",
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      fontSize: 10,
                    }}>▶</span>
                    {group.label}
                  </button>
                )}

                {/* 菜单项 */}
                {(isExpanded || collapsed) && (
                  <div style={{ opacity: 1 }}>
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          onClick={() => {
                            try { sessionStorage.setItem("activeMenuGroup", group.label); } catch {}
                          }}
                          style={{
                            display: "flex", alignItems: "center",
                            padding: collapsed ? "6px 0" : "5px 12px 5px 20px",
                            borderRadius: 4, marginBottom: 1,
                            textDecoration: "none",
                            fontSize: collapsed ? 0 : 13,
                            color: isActive ? "#fff" : "#94a3b8",
                            background: isActive ? "#3b82f6" : "transparent",
                            transition: "all 0.15s",
                            justifyContent: collapsed ? "center" : "flex-start",
                            lineHeight: "20px",
                          }}
                        >
                          {collapsed
                            ? <span style={{ fontSize: 14, width: 24, textAlign: "center" }}>{item.label.charAt(0)}</span>
                            : item.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 底部按钮 */}
        <div
          style={{
            padding: collapsed ? "8px 4px" : "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            flexShrink: 0,
          }}
        >
          <a
            href="/admin/login"
            style={{
              padding: 7, textAlign: "center", borderRadius: 5,
              background: "rgba(239,68,68,0.12)", color: "#ef4444",
              textDecoration: "none", fontSize: collapsed ? 0 : 12, fontWeight: 500,
              width: collapsed ? undefined : "100%",
            }}
          >
            {!collapsed && "退出登录"}
            {collapsed && "\u2715"}
          </a>
          <a
            href="/"
            style={{
              padding: 7, textAlign: "center", borderRadius: 5,
              color: "#64748b", textDecoration: "none",
              fontSize: collapsed ? 0 : 12,
              width: collapsed ? undefined : "100%",
            }}
          >
            {!collapsed && "返回前台 \u2192"}
            {collapsed && "\uD83C\uDFE1"}
          </a>
        </div>
      </aside>

      {/* 主内容区 */}
      <main style={{ flex: 1, overflow: "auto", background: "#f8fafc" }}>
        <header
          style={{
            background: "#fff", borderBottom: "1px solid #e2e8f0",
            padding: "12px 24px", position: "sticky", top: 0, zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, color: "#64748b" }}>管理后台</span>
          <span style={{ fontSize: 14, color: "#1e293b", fontWeight: 600 }}>{findTitle()}</span>
        </header>
        <div style={{ padding: 24 }}>{children}</div>
      </main>
    </div>
  );
}
