"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, BarChart3, Calendar, Package, CheckCircle2, Clock, XCircle, Eye } from "lucide-react";
import Link from "next/link";

interface TestCampaign {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  test_duration: number;
  start_date: string;
  end_date: string | null;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  product_count?: number;
}

export default function TestingPage() {
  const [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [supabase]);

  const cancelCampaign = async (id: string) => {
    if (!confirm("确定要取消这个测款任务吗？")) return;
    try {
      const { error } = await supabase
        .from("product_test_campaigns")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      alert("任务已取消");
      loadCampaigns();
    } catch (error: any) {
      alert("操作失败: " + error.message);
    }
  };

  const completeCampaign = async (id: string) => {
    if (!confirm("确定要结束这个测款任务吗？")) return;
    try {
      const { error } = await supabase
        .from("product_test_campaigns")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      alert("任务已完成");
      loadCampaigns();
    } catch (error: any) {
      alert("操作失败: " + error.message);
    }
  };

  const filteredCampaigns = filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter);

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">进行中</span>;
    } else if (status === "completed") {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">已完成</span>;
    } else {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">已取消</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-primary" />
              测款管理
            </h1>
            <p className="text-gray-500 mt-2">通过数据测试找出潜力爆款，优化选品策略</p>
          </div>
          <Link
            href="/admin/testing/new"
            className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            创建测款任务
          </Link>
        </div>

        {/* 过滤标签 */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all", label: "全部" },
            { key: "active", label: "进行中" },
            { key: "completed", label: "已完成" },
            { key: "cancelled", label: "已取消" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 任务列表 */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">暂无测款任务</p>
            <Link
              href="/admin/testing/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              创建第一个测款任务
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className={`h-1.5 ${campaign.status === "active" ? "bg-green-500" : campaign.status === "completed" ? "bg-blue-500" : "bg-gray-300"}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-lg flex-1 pr-2">{campaign.title}</h3>
                    {getStatusBadge(campaign.status)}
                  </div>

                  {campaign.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{campaign.description}</p>
                  )}

                  <div className="text-xs text-gray-400 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      开始：{new Date(campaign.start_date).toLocaleDateString("zh-CN")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" />
                      测试周期：{campaign.test_duration}天
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/testing/${campaign.id}`}
                      className="flex-1 px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors text-center flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      查看数据
                    </Link>

                    {campaign.status === "active" && (
                      <>
                        <button
                          onClick={() => completeCampaign(campaign.id)}
                          className="px-4 py-2 bg-green-50 text-green-600 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors"
                        >
                          完成
                        </button>
                        <button
                          onClick={() => cancelCampaign(campaign.id)}
                          className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                        >
                          取消
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-3">💡 测款功能说明</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li><strong>测款目的</strong>：用数据找出潜力爆款，避免盲目大量备货</li>
            <li><strong>操作步骤</strong>：创建任务 → 添加同类产品 → 均匀分配流量 → 收集数据 → 分析结论</li>
            <li><strong>关键指标</strong>：曝光量、点击率、加购率、询盘数、下单转化率</li>
            <li><strong>建议周期</strong>：7-14天，收集足够数据后做出决策</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
