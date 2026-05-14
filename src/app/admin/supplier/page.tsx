"use client";

import { Building2, Award, Truck, Shield } from "lucide-react";

const metricCards = [
  { title: "合作供应商", value: "5,238", icon: Building2, color: "#1a365d" },
  { title: "A级供应商", value: "1,862", icon: Award, color: "#c9a84c" },
  { title: "准时交货率", value: "96.8%", icon: Truck, color: "#1a365d" },
];

const gradeColors: Record<string, { backgroundColor: string; color: string }> = {
  A: { backgroundColor: "#c9a84c20", color: "#c9a84c" },
  B: { backgroundColor: "#1a365d15", color: "#1a365d" },
  C: { backgroundColor: "#9ca3af20", color: "#9ca3af" },
};

const statusColors: Record<string, { backgroundColor: string; color: string }> = {
  合作中: { backgroundColor: "#22c55e20", color: "#22c55e" },
  评估中: { backgroundColor: "#c9a84c20", color: "#c9a84c" },
  待续约: { backgroundColor: "#1a365d15", color: "#1a365d" },
  已终止: { backgroundColor: "#ef444420", color: "#ef4444" },
};

const tableData = [
  { name: "杭州丝语时装有限公司", category: "真丝/雪纺", grade: "A", capacity: 50000, years: 8, status: "合作中" },
  { name: "广州风尚制衣厂", category: "裤装/牛仔", grade: "A", capacity: 80000, years: 12, status: "合作中" },
  { name: "内蒙古雪莲绒业集团", category: "羊绒/毛衫", grade: "A", capacity: 30000, years: 6, status: "合作中" },
  { name: "深圳名媛时装有限公司", category: "外套/套装", grade: "A", capacity: 45000, years: 5, status: "合作中" },
  { name: "东莞雅织服饰有限公司", category: "针织/蕾丝", grade: "B", capacity: 60000, years: 4, status: "评估中" },
  { name: "上海锦致服饰有限公司", category: "西装/职场", grade: "B", capacity: 35000, years: 3, status: "合作中" },
  { name: "福建晋江纺织有限公司", category: "基础款/T恤", grade: "B", capacity: 120000, years: 7, status: "待续约" },
  { name: "海南椰风工艺有限公司", category: "配饰/编织", grade: "C", capacity: 15000, years: 2, status: "评估中" },
];

export default function SupplierPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1a365d" }}>
          供应商中心管理
        </h1>
        <p className="text-gray-500 mt-1">管理供应商合作与评级，保障供应链质量与交货效率</p>
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
            供应商数据明细
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">供应商名称</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">主营品类</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">评级</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">年产能</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">合作年限</th>
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
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={gradeColors[row.grade]}
                    >
                      {row.grade}级
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.capacity.toLocaleString()}件</td>
                  <td className="px-5 py-3 text-gray-600">{row.years}年</td>
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
            供应商信息与评级数据属于核心商业机密，严禁向供应商或其他竞争对手透露。合作条款与产能数据仅限采购管理层查阅。
          </p>
        </div>
      </div>
    </div>
  );
}
