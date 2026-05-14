"use client";

import { Rocket, Megaphone, Users, Shield } from "lucide-react";

const metricCards = [
  { title: "活动ROI", value: "3.8x", icon: Rocket, color: "#1a365d" },
  { title: "进行中活动", value: "15个", icon: Megaphone, color: "#c9a84c" },
  { title: "月均引流", value: "12.8万", icon: Users, color: "#1a365d" },
];

const statusColors: Record<string, { backgroundColor: string; color: string }> = {
  进行中: { backgroundColor: "#1a365d15", color: "#1a365d" },
  已结束: { backgroundColor: "#9ca3af20", color: "#9ca3af" },
  待上线: { backgroundColor: "#c9a84c20", color: "#c9a84c" },
  已暂停: { backgroundColor: "#ef444420", color: "#ef4444" },
};

const tableData = [
  { name: "520心动季", type: "节日营销", channel: "全渠道", invest: 28, output: 112, roi: "4.0x", status: "进行中" },
  { name: "夏日焕新节", type: "主题促销", channel: "线上+门店", invest: 35, output: 119, roi: "3.4x", status: "进行中" },
  { name: "VIP私享日", type: "会员活动", channel: "门店", invest: 12, output: 60, roi: "5.0x", status: "进行中" },
  { name: "母亲节特惠", type: "节日营销", channel: "全渠道", invest: 18, output: 72, roi: "4.0x", status: "已结束" },
  { name: "新品首发直播", type: "直播带货", channel: "抖音+视频号", invest: 8, output: 32, roi: "4.0x", status: "进行中" },
  { name: "618年中大促", type: "大促活动", channel: "全渠道", invest: 50, output: 175, roi: "3.5x", status: "待上线" },
  { name: "社群拼团周", type: "社群营销", channel: "微信社群", invest: 5, output: 18, roi: "3.6x", status: "进行中" },
  { name: "跨品牌联名", type: "品牌合作", channel: "线下快闪", invest: 22, output: 55, roi: "2.5x", status: "已暂停" },
];

export default function MarketingPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1a365d" }}>
          营销策划管理
        </h1>
        <p className="text-gray-500 mt-1">统筹营销活动策划与执行，追踪ROI与引流效果</p>
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
            活动数据明细
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">活动名称</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">类型</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">渠道</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">投入(万)</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">产出(万)</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">ROI</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">状态</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.name} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium" style={{ color: "#1a365d" }}>
                    {row.name}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.type}</td>
                  <td className="px-5 py-3 text-gray-600">{row.channel}</td>
                  <td className="px-5 py-3 text-gray-600">¥{row.invest}</td>
                  <td className="px-5 py-3 text-gray-600">¥{row.output}</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: "#c9a84c20", color: "#c9a84c" }}
                    >
                      {row.roi}
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
            营销投入产出数据与渠道策略属于核心商业机密，严禁向外部人员泄露。活动预算与ROI数据仅限管理层和营销团队查看。
          </p>
        </div>
      </div>
    </div>
  );
}
