"use client";

import { Clock, Mail } from "lucide-react";
import Link from "next/link";

/**
 * 待审页面 - 已通过 middleware 认证才可访问
 * 无需额外检查 cookie（middleware 已拦截未登录请求）
 */
export default function PendingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ width: 480, maxWidth: "90vw", textAlign: "center" }}>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9", padding: 40 }}>
          {/* 图标 */}
          <div style={{ width: 80, height: 80, margin: "0 auto 24px", borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={40} color="#d97706" />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>
            待审批管理
          </h1>

          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 8 }}>
            此页面用于管理待审核的用户注册申请。
          </p>
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 28 }}>
            管理员可在此查看、批准或拒绝新用户的后台访问申请。
          </p>

          {/* 流程说明 */}
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, marginBottom: 32, textAlign: "left" }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={14} color="#94a3b8" />
              审批流程
            </h3>
            <ol style={{ fontSize: 13, color: "#64748b", paddingLeft: 20, margin: 0, lineHeight: 2.2 }}>
              <li>新用户注册后提交后台访问申请</li>
              <li>管理员在此页面查看待审申请</li>
              <li>确认信息无误后点击「批准」</li>
              <li>系统自动通知用户审批结果</li>
            </ol>
          </div>

          {/* 按钮 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href="/admin/dashboard"
              style={{
                textAlign: "center",
                padding: "12px 20px",
                background: "#1e293b",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
              }}
            >
              返回后台首页 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
