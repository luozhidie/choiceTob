"use client";

import { LayoutGrid, Link2, Sparkles, Shield } from "lucide-react";

const metricCards = [
  { title: "方案执行率", value: "92%", icon: LayoutGrid, color: "#1a365d" },
  { title: "连带率", value: "2.8", icon: Link2, color: "#c9a84c" },
  { title: "搭配推荐数", value: "1,680", icon: Sparkles, color: "#1a365d" },
];

const statusColors: Record<string, { backgroundColor: string; color: string }> = {
  执行中: { backgroundColor: "#1a365d15", color: "#1a365d" },
  已上线: { backgroundColor: "#c9a84c20", color: "#c9a84c" },
  待审批: { backgroundColor: "#ef444420", color: "#ef4444" },
  已归档: { backgroundColor: "#9ca3af20", color: "#9ca3af" },
};

const tableData = [
  { name: "职场精英系列", scene: "商务通勤", pieces: 6, rate: "+35%", stores: 42, status: "执行中" },
  { name: "法式浪漫系列", scene: "约会派对", pieces: 5, rate: "+28%", stores: 38, status: "执行中" },
  { name: "度假风情系列", scene: "旅行出游", pieces: 7, rate: "+42%", stores: 35, status: "已上线" },
  { name: "极简主义系列", scene: "日常休闲", pieces: 4, rate: "+22%", stores: 45, status: "执行中" },
  { name: "运动活力系列", scene: "健身户外", pieces: 5, rate: "+30%", stores: 28, status: "已上线" },
  { name: "古典优雅系列", scene: "正式场合", pieces: 6, rate: "+38%", stores: 32, status: "执行中" },
  { name: "街头潮酷系列", scene: "潮流社交", pieces: 5, rate: "+25%", stores: 22, status: "待审批" },
  { name: "居家舒适系列", scene: "居家生活", pieces: 4, rate: "+18%", stores: 48, status: "已归档" },
];

export default function DisplayPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1a365d" }}>
          陈列搭配管理
        </h1>
        <p className="text-gray-500 mt-1">管理陈列方案与搭配推荐，提升门店连带率与视觉体验</p>
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
            陈列方案数据
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">方案名称</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">适用场景</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">搭配件数</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">连带提升率</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">执行店铺数</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">状态</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.name} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium" style={{ color: "#1a365d" }}>
                    {row.name}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.scene}</td>
                  <td className="px-5 py-3 text-gray-600">{row.pieces}件</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: "#22c55e20", color: "#22c55e" }}
                    >
                      {row.rate}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.stores}家</td>
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
            陈列搭配方案为公司独创的视觉营销资产，涉及核心销售策略。未经授权禁止对外展示或分享方案细节。
          </p>
        </div>
      </div>
    </div>
  );
}
