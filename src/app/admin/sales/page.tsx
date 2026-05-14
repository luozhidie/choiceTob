"use client";

import { Heart, GraduationCap, DollarSign, Shield } from "lucide-react";

const metricCards = [
  { title: "客户满意度", value: "96%", icon: Heart, color: "#1a365d" },
  { title: "培训覆盖率", value: "88%", icon: GraduationCap, color: "#c9a84c" },
  { title: "月度销售额", value: "¥568万", icon: DollarSign, color: "#1a365d" },
];

const ratingColors: Record<string, { backgroundColor: string; color: string }> = {
  S: { backgroundColor: "#c9a84c20", color: "#c9a84c" },
  A: { backgroundColor: "#1a365d15", color: "#1a365d" },
  B: { backgroundColor: "#9ca3af20", color: "#9ca3af" },
  C: { backgroundColor: "#ef444420", color: "#ef4444" },
};

const tableData = [
  { name: "华东一区团队", clients: 1860, sales: 128, rate: "68%", satisfaction: "98%", rating: "S" },
  { name: "华东二区团队", clients: 1520, sales: 98, rate: "65%", satisfaction: "97%", rating: "A" },
  { name: "华南一区团队", clients: 1340, sales: 86, rate: "62%", satisfaction: "95%", rating: "A" },
  { name: "华北一区团队", clients: 1280, sales: 78, rate: "60%", satisfaction: "96%", rating: "A" },
  { name: "西南一区团队", clients: 960, sales: 62, rate: "58%", satisfaction: "94%", rating: "B" },
  { name: "张美琳顾问", clients: 320, sales: 48, rate: "72%", satisfaction: "99%", rating: "S" },
  { name: "李思颖顾问", clients: 280, sales: 42, rate: "70%", satisfaction: "98%", rating: "S" },
  { name: "王雅琪顾问", clients: 240, sales: 26, rate: "55%", satisfaction: "93%", rating: "B" },
];

export default function SalesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1a365d" }}>
          销售服务管理
        </h1>
        <p className="text-gray-500 mt-1">管理销售团队绩效与服务质量，提升客户满意度</p>
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
            销售团队数据
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">团队/顾问</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">客户数</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">月销售额(万)</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">成交率</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">满意度</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">评级</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.name} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium" style={{ color: "#1a365d" }}>
                    {row.name}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.clients.toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-600">¥{row.sales}</td>
                  <td className="px-5 py-3 text-gray-600">{row.rate}</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: "#22c55e20", color: "#22c55e" }}
                    >
                      {row.satisfaction}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={ratingColors[row.rating]}
                    >
                      {row.rating}
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
            销售数据与客户满意度信息属于内部经营数据，禁止对外泄露。团队绩效数据仅限管理层查阅，请遵守数据安全规范。
          </p>
        </div>
      </div>
    </div>
  );
}
