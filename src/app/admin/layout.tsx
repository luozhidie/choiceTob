"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, PanelLeftClose, ChevronsDown, ChevronsUp } from "lucide-react";

// 菜单数据（定义在组件外部，避免每次渲染重建）
const menuGroups = [
  { label: "概览", items: [
    { label: "数据概览", href: "/admin/dashboard" },
    { label: "站点图片", href: "/admin/site-assets" },
  ]},
  { label: "店铺管理", items: [
    { label: "店铺列表", href: "/admin/stores" },
    { label: "品类管理", href: "/admin/categories" },
  ]},
  { label: "VIP会员", items: [
    { label: "VIP订单", href: "/admin/membership-orders" },
    { label: "VIP管理", href: "/admin/vip" },
    { label: "VIP加油包", href: "/admin/vip-addons" },
    { label: "色彩季型录入", href: "/admin/color-analysis" },
    { label: "色彩季型对比", href: "/admin/color-compare" },
    { label: "风格测试记录", href: "/admin/style-tests" },
    { label: "测试码管理", href: "/admin/test-codes" },
  ]},
  { label: "充值管理", items: [
    { label: "充值订单", href: "/admin/charge-orders" },
  ]},
  { label: "商品&企划", items: [
    { label: "企划需求处理", href: "/admin/planning-requests" },
    { label: "企划订单管理", href: "/admin/planning-orders" },
    { label: "商品企划", href: "/admin/product-plan" },
    { label: "企划报告与交付", href: "/admin/report" },
    { label: "商品管理", href: "/admin/products" },
    { label: "爆款样衣", href: "/admin/hot-products" },
    { label: "爆款货盘", href: "/admin/hot-picks" },
    { label: "爆款图片", href: "/admin/hot-picks-images" },
    { label: "买手选品", href: "/admin/buyer" },
    { label: "选品步骤", href: "/admin/planning-steps" },
    { label: "选品功能", href: "/admin/assortment" },
    { label: "买手功能", href: "/admin/buyer-features" },
    { label: "买手步骤", href: "/admin/buyer-steps" },
  ]},
  { label: "采购&供应链", items: [
    { label: "采购意向", href: "/admin/purchase-intents" },
    { label: "订单管理", href: "/admin/orders" },
    { label: "采购订单", href: "/admin/purchase-orders" },
    { label: "供应商管理", href: "/admin/supplier" },
    { label: "供应商图片", href: "/admin/supplier-images" },
  ]},
  { label: "库存&销售", items: [
    { label: "库存管理", href: "/admin/inventory" },
    { label: "销售数据", href: "/admin/sales-data" },
    { label: "门店经营数据", href: "/admin/store-reports" },
    { label: "市场需求统计", href: "/admin/market-demand" },
  ]},
  { label: "陈列&搭配", items: [
    { label: "陈列搭配", href: "/admin/collocation" },
    { label: "搭配方案", href: "/admin/display" },
    { label: "陈列图片", href: "/admin/display-images" },
    { label: "每日搭配", href: "/admin/daily-looks" },
    { label: "属性编码管理", href: "/admin/attribute-encoding" },
  ]},
  { label: "营销&内容", items: [
    { label: "营销策划", href: "/admin/marketing" },
    { label: "营销图片", href: "/admin/marketing-images" },
    { label: "销售服务", href: "/admin/sales" },
    { label: "Banner轮播图", href: "/admin/banners" },
    { label: "搭配灵感", href: "/admin/inspirations" },
    { label: "内容日历", href: "/admin/content-calendar" },
    { label: "沙龙活动", href: "/admin/salon" },
    { label: "沙龙流程", href: "/admin/salon-events" },
    { label: "爆款样衣(设计)", href: "/admin/designer" },
  ]},
  { label: "客户&线索", items: [
    { label: "客户管理", href: "/admin/customers" },
    { label: "线索管理", href: "/admin/leads" },
  ]},
  { label: "潜客管理", items: [
    { label: "门店信息管理", href: "/admin/crm/stores" },
    { label: "联系人管理", href: "/admin/crm/contacts" },
    { label: "跟进记录", href: "/admin/crm/follow-ups" },
    { label: "加微信管理", href: "/admin/crm/wechat-add" },
    { label: "微信话术模板", href: "/admin/crm/wechat-templates" },
    { label: "门店信息采集", href: "/admin/crm/scrape" },
    { label: "批量导入", href: "/admin/crm/import" },
    { label: "提醒中心", href: "/admin/crm/reminders" },
  ]},
  { label: "项目&预算", items: [
    { label: "项目进度", href: "/admin/project-tracker" },
    { label: "预算与成本", href: "/admin/budget-tracker" },
  ]},
  { label: "教学&资讯", items: [
    { label: "课程管理", href: "/admin/courses" },
    { label: "课程购买记录", href: "/admin/course-purchases" },
    { label: "流行资讯", href: "/admin/fashion-trends" },
  ]},
  { label: "趋势", items: [
    { label: "趋势预测", href: "/admin/trend-predict" },
    { label: "趋势中心", href: "/admin/trend-center" },
    { label: "明星同款", href: "/admin/celebrity" },
  ]},
  { label: "其他", items: [
    { label: "访客管理", href: "/admin/visitors" },
    { label: "配送管理", href: "/admin/deliveries" },
    { label: "教育", href: "/admin/education" },
    { label: "杂志", href: "/admin/magazine" },
    { label: "待审", href: "/admin/pending" },
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

  // 根据当前路径自动展开对应分组
  useEffect(() => {
    if (!mounted || collapsed) return;
    const autoExpand = new Set<string>();
    for (const group of menuGroups) {
      for (const item of group.items) {
        if (item.href === pathname) {
          autoExpand.add(group.label);
          break;
        }
      }
      if (autoExpand.has(group.label)) break; // 找到就停止外层循环
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
    for (const group of menuGroups) {
      const found = group.items.find(i => i.href === pathname);
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
        <nav style={{ padding: "8px", flex: 1 }}>
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
                      padding: "7px 12px 5px",
                      fontSize: 10, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      color: "#64748b", border: "none", background: "transparent",
                      cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <span style={{
                      display: "inline-block",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      fontSize: 10,
                    }}>▼</span>
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
                          style={{
                            display: "flex", alignItems: "center",
                            padding: collapsed ? "5px 0" : "5px 12px 5px 20px",
                            borderRadius: 4, marginBottom: 1,
                            textDecoration: "none",
                            fontSize: collapsed ? 0 : 13,
                            color: isActive ? "#fff" : "#94a3b8",
                            background: isActive ? "#3b82f6" : "transparent",
                            transition: "all 0.15s",
                            justifyContent: collapsed ? "center" : "flex-start",
                          }}
                        >
                          {collapsed
                            ? <span style={{ fontSize: 14 }}>{item.label.charAt(0)}</span>
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
