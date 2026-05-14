"use client";

import { BookOpen, Users, CheckCircle, Shield } from "lucide-react";

const metricCards = [
  { title: "课程总数", value: "86", icon: BookOpen, color: "#1a365d" },
  { title: "学员数", value: "12,580", icon: Users, color: "#c9a84c" },
  { title: "课程完成率", value: "74%", icon: CheckCircle, color: "#1a365d" },
];

const levelColors: Record<string, { backgroundColor: string; color: string }> = {
  高级: { backgroundColor: "#c9a84c20", color: "#c9a84c" },
  进阶: { backgroundColor: "#1a365d15", color: "#1a365d" },
  入门: { backgroundColor: "#22c55e20", color: "#22c55e" },
};

const tableData = [
  { name: "风格诊断师认证课程", teacher: "陈雅文", level: "高级", price: 6980, students: 860, rating: 4.9 },
  { name: "色彩搭配实战训练营", teacher: "林若曦", level: "进阶", price: 3980, students: 1280, rating: 4.8 },
  { name: "个人形象设计入门", teacher: "王诗涵", level: "入门", price: 1980, students: 2350, rating: 4.7 },
  { name: "买手选品决策力课程", teacher: "赵明远", level: "高级", price: 5980, students: 520, rating: 4.8 },
  { name: "门店陈列与视觉营销", teacher: "刘梦瑶", level: "进阶", price: 3280, students: 980, rating: 4.6 },
  { name: "VIP客户关系管理", teacher: "张晓峰", level: "进阶", price: 2980, students: 1100, rating: 4.7 },
  { name: "时尚趋势分析与解读", teacher: "周天琪", level: "高级", price: 4980, students: 680, rating: 4.9 },
  { name: "穿搭基础与身材修饰", teacher: "孙婉清", level: "入门", price: 1680, students: 2810, rating: 4.5 },
];

export default function EducationPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1a365d" }}>
          知识付费管理
        </h1>
        <p className="text-gray-500 mt-1">管理知识付费课程体系，追踪学员成长与课程质量</p>
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
            课程数据明细
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">课程名称</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">讲师</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">等级</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">价格</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">学员数</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">评分</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.name} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium" style={{ color: "#1a365d" }}>
                    {row.name}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.teacher}</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={levelColors[row.level]}
                    >
                      {row.level}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">¥{row.price.toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-600">{row.students.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: "#c9a84c20", color: "#c9a84c" }}
                    >
                      ★ {row.rating}
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
            课程内容与知识产权受法律保护，禁止未经授权的录制、传播或抄袭。学员数据属于个人隐私，应严格遵守信息保护相关法规。
          </p>
        </div>
      </div>
    </div>
  );
}
