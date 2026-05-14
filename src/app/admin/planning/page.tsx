"use client";

import { Target, FileText, Percent, Shield } from "lucide-react";

const metricCards = [
  { title: "企划完成率", value: "87%", icon: Target, color: "#1a365d" },
  { title: "在执行企划", value: "42个", icon: FileText, color: "#c9a84c" },
  { title: "平均毛利率", value: "45.2%", icon: Percent, color: "#1a365d" },
];

const statusColors: Record<string, { backgroundColor: string; color: string }> = {
  进行中: { backgroundColor: "#1a365d15", color: "#1a365d" },
  已完成: { backgroundColor: "#c9a84c20", color: "#c9a84c" },
  待审核: { backgroundColor: "#ef444420", color: "#ef4444" },
};

const tableData = [
  { name: "2026春夏女装企划", category: "女装", season: "春夏", sku: 320, target: 15000, margin: "48.5%", status: "进行中" },
  { name: "2026秋冬外套系列", category: "外套", season: "秋冬", sku: 180, target: 8000, margin: "52.3%", status: "进行中" },
  { name: "2025年度基础款补充", category: "基础款", season: "全季", sku: 260, target: 20000, margin: "38.6%", status: "已完成" },
  { name: "2026春季连衣裙企划", category: "裙装", season: "春夏", sku: 150, target: 6500, margin: "46.8%", status: "进行中" },
  { name: "2026夏季防晒系列", category: "功能装", season: "夏季", sku: 90, target: 5000, margin: "42.1%", status: "待审核" },
  { name: "2025秋冬皮具企划", category: "配饰", season: "秋冬", sku: 120, target: 4000, margin: "55.2%", status: "已完成" },
  { name: "2026年度童装拓展", category: "童装", season: "全季", sku: 200, target: 10000, margin: "40.8%", status: "待审核" },
  { name: "2026春款针织系列", category: "针织", season: "春夏", sku: 110, target: 5500, margin: "44.0%", status: "进行中" },
];

export default function PlanningPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1a365d" }}>
          商品企划管理
        </h1>
        <p className="text-gray-500 mt-1">管理商品企划全流程，跟踪企划执行与毛利表现</p>
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
            企划数据明细
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">企划名称</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">品类</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">季节</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">SKU数</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">目标销量</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">毛利率</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">状态</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.name} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium" style={{ color: "#1a365d" }}>
                    {row.name}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.category}</td>
                  <td className="px-5 py-3 text-gray-600">{row.season}</td>
                  <td className="px-5 py-3 text-gray-600">{row.sku}</td>
                  <td className="px-5 py-3 text-gray-600">{row.target.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: "#c9a84c20", color: "#c9a84c" }}
                    >
                      {row.margin}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={statusColors[row.status]}
                    >
                      {row.status}
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
            企划数据包含核心商业策略与毛利信息，属于公司机密。未经授权不得复制、转发或外泄，违者将承担法律责任。
          </p>
        </div>
      </div>
    </div>
  );
}
