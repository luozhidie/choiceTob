"use client";

import { TrendingUp, Users, ShoppingBag, Shield } from "lucide-react";

const metricCards = [
  { title: "选品成功率", value: "62%", icon: TrendingUp, color: "#1a365d" },
  { title: "活跃买手", value: "128人", icon: Users, color: "#c9a84c" },
  { title: "本月推荐款", value: "1,250款", icon: ShoppingBag, color: "#1a365d" },
];

const tableData = [
  { style: "少女型", feature: "甜美可爱、娇小玲珑", direction: "蕾丝、蝴蝶结、粉嫩色系", ratio: "15%", count: 188 },
  { style: "优雅型", feature: "精致知性、柔和大方", direction: "真丝、羊绒、莫兰迪色", ratio: "18%", count: 225 },
  { style: "浪漫型", feature: "华美性感、成熟女人味", direction: "雪纺、珠绣、浓郁色彩", ratio: "12%", count: 150 },
  { style: "少年型", feature: "帅气干练、中性利落", direction: "西装、皮衣、黑白灰", ratio: "10%", count: 125 },
  { style: "时尚型", feature: "个性前卫、独特潮流", direction: "设计感单品、撞色搭配", ratio: "14%", count: 175 },
  { style: "古典型", feature: "端庄正统、高贵沉稳", direction: "套装、珍珠饰品、深色系", ratio: "11%", count: 138 },
  { style: "自然型", feature: "随性洒脱、质朴大方", direction: "棉麻、编织、大地色系", ratio: "10%", count: 125 },
  { style: "戏剧型", feature: "夸张醒目、气场强大", direction: "亮片、廓形、对比色", ratio: "10%", count: 124 },
];

export default function BuyerPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1a365d" }}>
          买手选品管理
        </h1>
        <p className="text-gray-500 mt-1">管理买手团队选品策略与风格体系，提升选品精准度</p>
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
            风格选品数据
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">风格类型</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">核心特征</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">推荐方向</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">进货占比</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">推荐款数</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.style} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium" style={{ color: "#1a365d" }}>
                    {row.style}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.feature}</td>
                  <td className="px-5 py-3 text-gray-600">{row.direction}</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: "#c9a84c20", color: "#c9a84c" }}
                    >
                      {row.ratio}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.count}</td>
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
            选品数据和风格体系属于核心商业机密，未经授权禁止外泄。所有数据仅限内部管理团队查阅，请遵守保密协议。
          </p>
        </div>
      </div>
    </div>
  );
}
