"use client";

import { useParams } from "next/navigation";

// 各独立服务经主站 /svc 反向代理内嵌，iframe 走主站同域，国内可访问
const SERVICES: Record<string, { title: string; src: string }> = {
  trace: { title: "区块链溯源", src: "/svc/trace/trace" },
  collectible: { title: "数字藏品", src: "/svc/collectible/collectible" },
  tryon: { title: "虚拟试衣", src: "/svc/tryon/tryon" },
};

export default function ServiceEmbedPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const svc = SERVICES[slug];

  if (!svc) {
    return (
      <div style={{ padding: 24, color: "#64748b" }}>未知服务：{slug}</div>
    );
  }

  return (
    <iframe
      key={slug}
      src={svc.src}
      title={svc.title}
      style={{
        width: "100%",
        height: "calc(100vh - 112px)",
        border: "none",
        background: "#fff",
        borderRadius: 8,
        display: "block",
      }}
    />
  );
}
