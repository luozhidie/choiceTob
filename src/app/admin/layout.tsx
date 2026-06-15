"use client";

import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  // 确保只在客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#666" }}>加载中...</div>
      </div>
    );
  }

  const pathname = window.location.pathname;

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex" }}>
      {/* 侧边栏 - 极简版 */}
      <aside style={{ width: 240, background: "#1e293b", color: "white", flexShrink: 0, overflow: "auto" }}>
        <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <a href="/admin/dashboard" style={{ textDecoration: "none", color: "white", fontSize: 16, fontWeight: "bold" }}>
            骆芷蝶智选 · 后台
          </a>
        </div>
        <nav style={{ padding: 8 }}>
          {[
            { label: "数据概览", href: "/admin/dashboard" },
            { label: "VIP 订单", href: "/admin/membership-orders" },
            { label: "企划需求", href: "/admin/planning-requests" },
            { label: "商品管理", href: "/admin/products" },
            { label: "爆款预测", href: "/admin/trend-predict" },
            { label: "明星同款", href: "/admin/celebrity" },
            { label: "客户管理", href: "/admin/customers" },
            { label: "访客管理", href: "/admin/visitors" },
          ].map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: "block",
                  padding: "8px 12px",
                  borderRadius: 6,
                  marginBottom: 2,
                  textDecoration: "none",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                  background: isActive ? "#3b82f6" : "transparent",
                  fontSize: 14,
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <a href="/admin/login" style={{ display: "block", padding: 8, textAlign: "center", background: "rgba(255,255,255,0.1)", borderRadius: 6, color: "white", textDecoration: "none", fontSize: 13 }}>退出</a>
          <a href="/" style={{ display: "block", marginTop: 8, padding: 8, textAlign: "center", borderRadius: 6, color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 13 }}>返回前台</a>
        </div>
      </aside>

      {/* 主内容区 */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {/* 顶栏 */}
        <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 24px", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, color: "#666" }}>管理后台</span>
            <span style={{ fontSize: 14, color: "#333", fontWeight: 500 }}>
              {(() => {
                try {
                  const item = [
                    { label: "数据概览", href: "/admin/dashboard" },
                    { label: "VIP 订单", href: "/admin/membership-orders" },
                    { label: "企划需求", href: "/admin/planning-requests" },
                    { label: "商品管理", href: "/admin/products" },
                    { label: "爆款预测", href: "/admin/trend-predict" },
                    { label: "明星同款", href: "/admin/celebrity" },
                    { label: "客户管理", href: "/admin/customers" },
                    { label: "访客管理", href: "/admin/visitors" },
                  ].find(i => i.href === pathname);
                  return item?.label || "数据概览";
                } catch {
                  return "数据概览";
                }
              })()}
            </span>
          </div>
        </header>

        {/* 页面内容 */}
        <div style={{ padding: 24 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
