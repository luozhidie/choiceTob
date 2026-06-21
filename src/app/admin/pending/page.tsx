"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PendingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    // 检查是否通过后台登录（cookie 方式）
    if (typeof document !== "undefined") {
      const isAdmin = document.cookie.includes("admin_logged_in=true");
      if (!isAdmin) {
        router.push("/admin/login");
        return;
      }

      // 从 cookie 获取管理员邮箱
      const match = document.cookie.match(/admin_email=([^;]+)/);
      setEmail(match?.[1] || "");
      setChecking(false);
    }
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f4c3a]"></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ width: 448, maxWidth: "90vw", textAlign: "center" }}>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9", padding: 32 }}>
          {/* 图标 */}
          <div style={{ width: 80, height: 80, margin: "0 auto 24px", borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={40} color="#d97706" />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>
            等待管理员审批
          </h1>

          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 4 }}>
            您的账号注册申请已提交，需要管理员审批通过后才能登录使用后台系统。
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 32 }}>
            审批结果将发送至您的邮箱{" "}
            <span style={{ fontWeight: 500, color: "#475569" }}>{email}</span>
            ，<br />
            通常处理时间为{" "}
            <span style={{ fontWeight: 500, color: "#475569" }}>1-2 个工作日</span>。
          </p>

          {/* 流程说明 */}
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 32, textAlign: "left" }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Mail size={14} color="#94a3b8" />
              审批流程说明
            </h3>
            <ol style={{ fontSize: 12, color: "#64748b", paddingLeft: 20, margin: 0, lineHeight: 2 }}>
              <li>管理员收到您的审批申请通知</li>
              <li>管理员审核您的注册信息</li>
              <li>审批通过后，您会收到邮件通知</li>
              <li>之后即可使用注册邮箱登录后台</li>
            </ol>
          </div>

          {/* 按钮 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href="/admin/dashboard"
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 16px",
                background: "#1e293b",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
              }}
            >
              返回后台首页
            </Link>
            <Link
              href="/"
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: "#64748b",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
            >
              返回网站首页 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
