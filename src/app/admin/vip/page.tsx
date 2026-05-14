"use client";

import { Crown, TrendingUp, Repeat, Shield } from "lucide-react";

const metricCards = [
  { title: "VIP客户数", value: "3,682", icon: Crown, color: "#1a365d" },
  { title: "VIP贡献率", value: "62%", icon: TrendingUp, color: "#c9a84c" },
  { title: "复购率", value: "82%", icon: Repeat, color: "#1a365d" },
];

const levelColors: Record<string, { backgroundColor: string; color: string }> = {
  V3: { backgroundColor: "#c9a84c20", color: "#c9a84c" },
  V2: { backgroundColor: "#1a365d15", color: "#1a365d" },
  V1: { backgroundColor: "#9ca3af20", color: "#9ca3af" },
};

const tableData = [
  { name: "赵女士", level: "V3", annual: 286000, discount: "8折", repurchase: 28, lastPurchase: "2026-05-12" },
  { name: "钱女士", level: "V3", annual: 235000, discount: "8折", repurchase: 24, lastPurchase: "2026-05-10" },
  { name: "孙女士", level: "V3", annual: 198000, discount: "8折", repurchase: 22, lastPurchase: "2026-05-08" },
  { name: "李女士", level: "V2", annual: 156000, discount: "85折", repurchase: 18, lastPurchase: "2026-05-06" },
  { name: "周女士", level: "V2", annual: 128000, discount: "85折", repurchase: 15, lastPurchase: "2026-04-28" },
  { name: "吴女士", level: "V2", annual: 96000, discount: "85折", repurchase: 12, lastPurchase: "2026-04-25" },
  { name: "郑女士", level: "V1", annual: 58000, discount: "9折", repurchase: 8, lastPurchase: "2026-04-20" },
  { name: "王女士", level: "V1", annual: 42000, discount: "9折", repurchase: 6, lastPurchase: "2026-04-15" },
];

export default function VipPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1a365d" }}>
          VIP管理
        </h1>
        <p className="text-gray-500 mt-1">管理VIP客户关系，提升客户忠诚度与复购表现</p>
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
            VIP客户数据
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">客户名称</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">等级</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">年消费额</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">折扣率</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">复购次数</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">最近消费</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.name} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium" style={{ color: "#1a365d" }}>
                    {row.name}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={levelColors[row.level]}
                    >
                      {row.level}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">¥{row.annual.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: "#c9a84c20", color: "#c9a84c" }}
                    >
                      {row.discount}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.repurchase}次</td>
                  <td className="px-5 py-3 text-gray-600">{row.lastPurchase}</td>
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
            VIP客户信息属于高度敏感的个人隐私数据，受《个人信息保护法》保护。严禁未经客户授权擅自使用、泄露或出售客户信息。
          </p>
        </div>
      </div>
    </div>
  );
}
