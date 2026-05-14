"use client";

import { Flame, Package, BarChart3, Shield } from "lucide-react";

const metricCards = [
  { title: "爆款命中率", value: "45%", icon: Flame, color: "#1a365d" },
  { title: "在售爆款", value: "386款", icon: Package, color: "#c9a84c" },
  { title: "爆款贡献率", value: "68%", icon: BarChart3, color: "#1a365d" },
];

const trendIcons: Record<string, string> = { "↑": "↑", "↓": "↓", "→": "→" };
const trendColors: Record<string, string> = { "↑": "#22c55e", "↓": "#ef4444", "→": "#c9a84c" };

const tableData = [
  { name: "法式碎花连衣裙", category: "裙装", supplier: "巴黎春天服饰", wholesale: 168, retail: 398, weekly: 1280, trend: "↑" },
  { name: "真丝印花衬衫", category: "上衣", supplier: "杭州丝语时装", wholesale: 220, retail: 580, weekly: 960, trend: "↑" },
  { name: "高腰阔腿裤", category: "裤装", supplier: "广州风尚制衣", wholesale: 135, retail: 328, weekly: 850, trend: "→" },
  { name: "羊绒双面大衣", category: "外套", supplier: "内蒙古雪莲绒业", wholesale: 680, retail: 1680, weekly: 620, trend: "↑" },
  { name: "蕾丝拼接针织衫", category: "针织", supplier: "东莞雅织服饰", wholesale: 148, retail: 368, weekly: 540, trend: "↓" },
  { name: "小香风短外套", category: "外套", supplier: "深圳名媛时装", wholesale: 320, retail: 798, weekly: 780, trend: "↑" },
  { name: "莫兰迪色西装", category: "套装", supplier: "上海锦致服饰", wholesale: 280, retail: 698, weekly: 430, trend: "→" },
  { name: "手工编织草帽", category: "配饰", supplier: "海南椰风工艺", wholesale: 58, retail: 168, weekly: 360, trend: "↓" },
];

export default function HotPicksPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1a365d" }}>
          爆款货盘管理
        </h1>
        <p className="text-gray-500 mt-1">追踪爆款商品表现，优化货盘结构与趋势研判</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4"
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${card.color}15` }}
            >
              <card.icon size={24} style={{ color: card.color }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold" style={{ color: card.color }}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold" style={{ color: "#1a365d" }}>
            爆款商品数据
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">商品名称</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">品类</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">供应商</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">批发价</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">零售价</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">周销量</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">趋势</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.name} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium" style={{ color: "#1a365d" }}>
                    {row.name}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.category}</td>
                  <td className="px-5 py-3 text-gray-600">{row.supplier}</td>
                  <td className="px-5 py-3 text-gray-600">¥{row.wholesale}</td>
                  <td className="px-5 py-3 text-gray-600">¥{row.retail}</td>
                  <td className="px-5 py-3 text-gray-600">{row.weekly.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span
                      className="text-lg font-bold"
                      style={{ color: trendColors[row.trend] }}
                    >
                      {trendIcons[row.trend]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="rounded-xl border p-4 flex items-start gap-3"
        style={{ backgroundColor: "#1a365d08", borderColor: "#1a365d20" }}
      >
        <Shield size={20} style={{ color: "#1a365d" }} className="mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-sm" style={{ color: "#1a365d" }}>
            安全提醒
          </p>
          <p className="text-sm text-gray-500 mt-1">
            爆款货盘数据涉及定价策略与供应链信息，属于高度机密。禁止向竞争对手或第三方泄露任何价格和供应商信息。
          </p>
        </div>
      </div>
    </div>
  );
}
