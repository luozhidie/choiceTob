"use client";

import Link from "next/link";

const MODULES = [
  {
    group: "商品企划",
    items: [
      { name: "AI 商品企划", desc: "基于 VIP 画像 + 市场数据生成季节企划报告", href: "/admin/report" },
      { name: "企划需求/订单", desc: "企划需求处理与订单管理", href: "/admin/planning-orders" },
      { name: "商品企划(旧)", desc: "商品企划编辑页", href: "/admin/product-plan" },
    ],
  },
  {
    group: "设计研发",
    items: [
      { name: "AI 设计研发", desc: "爆款样衣设计（designer）", href: "/admin/designer" },
      { name: "爆款样衣", desc: "爆款样衣管理", href: "/admin/hot-products" },
      { name: "爆款货盘", desc: "爆款货盘管理", href: "/admin/hot-picks" },
    ],
  },
  {
    group: "营销获客",
    items: [
      { name: "AI 爆款文案", desc: "输入商品标题，生成朋友圈/小红书/抖音/社群文案和图片配文", href: "/admin/ai-marketing-copy" },
      { name: "AI 营销策划", desc: "营销策划与内容生成", href: "/admin/marketing" },
      { name: "服装股票监控", desc: "监控服装全产业链港股/美股行情，AI 解读行业景气度", href: "/admin/stock-monitor" },
      { name: "销售服务话术", desc: "销售服务脚本生成", href: "/admin/sales" },
      { name: "趋势预测", desc: "趋势预测与趋势中心", href: "/admin/trend-predict" },
    ],
  },
  {
    group: "搭配与买手",
    items: [
      { name: "AI 搭配推荐", desc: "单品自动搭配（generate-outfit-match）", href: "/admin/display" },
      { name: "买手中心", desc: "买手选品与决策", href: "/admin/buyer-center" },
      { name: "买手 AI 助手", desc: "买手对话式助手（buyer-assistant）", href: "/admin/buyer" },
    ],
  },
  {
    group: "生产协同（新增）",
    items: [
      { name: "AI 生产协同", desc: "企划→生产落地方案：方式/面料/成本/起订量/供应商/交接", href: "/admin/production-coordination" },
    ],
  },
];

export default function AICenterPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>AI 智能中心</h1>
      <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
        骆芷蝶智选 AI 能力矩阵总入口。所有能力基于现有 DeepSeek/OpenAI 大模型调用封装，结果可落库。
      </p>

      {MODULES.map((g) => (
        <div key={g.group} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#2d1b2e", borderLeft: "4px solid #2d1b2e", paddingLeft: 10, marginBottom: 14 }}>
            {g.group}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {g.items.map((it) => (
              <Link key={it.name} href={it.href}
                style={{ display: "block", background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 16, textDecoration: "none", transition: "all .15s" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>{it.name}</div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>{it.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
