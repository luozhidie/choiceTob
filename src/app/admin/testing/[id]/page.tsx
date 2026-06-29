"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, BarChart3, TrendingUp, Eye, ShoppingCart, MessageSquare } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  test_duration: number;
  start_date: string;
  end_date: string | null;
  status: string;
}

interface TestItem {
  id: string;
  product_id: string;
  product_title: string;
  product_image: string | null;
  impressions: number;
  clicks: number;
  inquiries: number;
  add_to_cart_count: number;
  orders_count: number;
  ctr: number;
  inquiry_rate: number;
  conversion_rate: number;
  is_winner: boolean;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [items, setItems] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const campaignId = params.id as string;

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载任务信息
      const { data: campaignData } = await supabase
        .from("product_test_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (campaignData) setCampaign(campaignData);

      // 加载测试商品
      const { data: itemsData } = await supabase
        .from("product_test_items")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("clicks", { ascending: false });

      if (itemsData) setItems(itemsData);
    } catch (error: any) {
      alert("加载失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) loadData();
  }, [campaignId]);

  // 模拟添加测试数据（演示用）
  const addMockData = async () => {
    if (!confirm("是否添加模拟测试数据？")) return;
    
    try {
      for (const item of items) {
        const impressions = Math.floor(Math.random() * 1000) + 100;
        const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
        const inquiries = Math.floor(clicks * (Math.random() * 0.1 + 0.01));
        const addToCart = Math.floor(clicks * (Math.random() * 0.2 + 0.05));
        const orders = Math.floor(inquiries * (Math.random() * 0.3 + 0.05));

        await supabase
          .from("product_test_items")
          .update({
            impressions,
            clicks,
            inquiries,
            add_to_cart_count: addToCart,
            orders_count: orders,
            ctr: clicks / impressions,
            inquiry_rate: inquiries / clicks,
            conversion_rate: orders / inquiries,
          })
          .eq("id", item.id);
      }
      
      alert("模拟数据已添加！");
      loadData();
    } catch (error: any) {
      alert("添加失败: " + error.message);
    }
  };

  // 确定胜出产品
  const markWinner = async (itemId: string) => {
    try {
      await supabase
        .from("product_test_items")
        .update({ is_winner: true })
        .eq("id", itemId);
      
      alert("已标记为胜出产品！");
      loadData();
    } catch (error: any) {
      alert("操作失败: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">任务不存在</p>
          <Link href="/admin/testing" className="text-primary hover:underline">
            返回测款管理
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/testing"
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
            <p className="text-gray-500 mt-1">
              开始日期：{new Date(campaign.start_date).toLocaleDateString("zh-CN")}
              {campaign.end_date && ` · 结束日期：${new Date(campaign.end_date).toLocaleDateString("zh-CN")}`}
            </p>
          </div>
          <button
            onClick={addMockData}
            className="px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors text-sm"
          >
            添加模拟数据（测试用）
          </button>
        </div>

        {/* 数据对比表格 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">数据对比</h2>
            <p className="text-sm text-gray-500 mt-1">对比各产品的测试数据，找出潜力爆款</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Eye className="w-4 h-4 inline-block mr-1" />
                    曝光
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Eye className="w-4 h-4 inline-block mr-1" />
                    点击
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 inline-block mr-1" />
                    点击率
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <ShoppingCart className="w-4 h-4 inline-block mr-1" />
                    加购
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 inline-block mr-1" />
                    询盘
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    下单
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.is_winner ? "bg-green-50" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </span>
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{item.product_title}</p>
                          {item.is_winner && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 mt-1">
                              <BarChart3 className="w-3 h-3" />
                              胜出产品
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">{item.impressions}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">{item.clicks}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${item.ctr > 0.03 ? "text-green-600" : item.ctr > 0.01 ? "text-yellow-600" : "text-gray-900"}`}>
                        {(item.ctr * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">{item.add_to_cart_count}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">{item.inquiries}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">{item.orders_count}</td>
                    <td className="px-6 py-4 text-center">
                      {!item.is_winner && (
                        <button
                          onClick={() => markWinner(item.id)}
                          className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors"
                        >
                          标记为胜出
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-3">💡 如何判断潜力爆款？</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li><strong>点击率高</strong>：说明主图吸引人，产品有吸引力（&gt;3% 优秀）</li>
            <li><strong>加购多</strong>：说明价格合理，用户有购买意向</li>
            <li><strong>询盘多</strong>：说明产品有市场需求，值得重点推广</li>
            <li><strong>下单转化高</strong>：说明产品综合表现好，是真正的爆款</li>
            <li className="mt-3 pt-3 border-t border-blue-200">
              ✅ <strong>建议</strong>：测试周期结束后，重点推广"胜出产品"，淘汰表现差的款式
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
