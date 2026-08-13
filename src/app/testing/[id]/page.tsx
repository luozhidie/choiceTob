// testing/[id]/page.tsx - 测款活动公开分享落地页
// 访问方式：/testing/任务ID
// 一个链接展示整个测款活动的所有商品，自动记录浏览/点击/加购/询价
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Eye, MousePointerClick, ShoppingCart, MessageCircle, BarChart3 } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
}

interface TestItem {
  id: string;
  product_id: string;
  product_title: string | null;
  product_image: string | null;
  views: number;
  clicks: number;
  cart_adds: number;
  inquiries: number;
  orders: number;
}

// 获取或创建 visitor_id（存在 localStorage，标识同一访客）
function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("visitor_id");
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem("visitor_id", id);
  }
  return id;
}

async function trackEvent(campaignId: string, productId: string, eventType: string) {
  try {
    await fetch("/api/product-test/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaign_id: campaignId,
        product_id: productId,
        event_type: eventType,
        visitor_id: getVisitorId(),
      }),
    });
  } catch (e) {
    console.error("[测款追踪] 上报失败:", e);
  }
}

export default function TestingLandingPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [items, setItems] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    const supabase = createClient();
    (async () => {
      const { data: c } = await supabase
        .from("product_test_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();
      if (!c) { setNotFound(true); setLoading(false); return; }
      setCampaign(c);

      const { data: its } = await supabase
        .from("product_test_items")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("clicks", { ascending: false });
      setItems(its || []);
      setLoading(false);

      // 进入页面：为每个商品记录一次浏览（曝光）
      for (const it of its || []) {
        trackEvent(campaignId, it.product_id, "view");
      }
    })();
  }, [campaignId]);

  const total = items.reduce(
    (a, it) => ({
      views: a.views + (it.views || 0),
      clicks: a.clicks + (it.clicks || 0),
      cart: a.cart + (it.cart_adds || 0),
      inquiries: a.inquiries + (it.inquiries || 0),
      orders: a.orders + (it.orders || 0),
    }),
    { views: 0, clicks: 0, cart: 0, inquiries: 0, orders: 0 }
  );

  const goProduct = (productId: string) => {
    trackEvent(campaignId, productId, "click");
    router.push(`/shop/${productId}/testing?campaign_id=${campaignId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-lg text-gray-400">测款活动不存在或已结束</div>
      </div>
    );
  }

  const funnel = [
    { label: "浏览", value: total.views, icon: Eye, color: "text-blue-500" },
    { label: "点击", value: total.clicks, icon: MousePointerClick, color: "text-purple-500" },
    { label: "加购", value: total.cart, icon: ShoppingCart, color: "text-amber-500" },
    { label: "询盘", value: total.inquiries, icon: MessageCircle, color: "text-rose-500" },
    { label: "下单", value: total.orders, icon: BarChart3, color: "text-green-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部品牌栏 */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-2 text-center text-sm font-medium">
        📊 测款进行中 — 您的每次点击都在帮助商家选出好款
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 活动标题 */}
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">{campaign?.title}</h1>
        {campaign?.description && (
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{campaign.description}</p>
        )}

        {/* 漏斗概览 */}
        <div className="grid grid-cols-5 gap-2 mb-8">
          {funnel.map((f) => (
            <div key={f.label} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <f.icon className={`w-5 h-5 mx-auto mb-1 ${f.color}`} />
              <div className="text-lg font-bold text-gray-900">{f.value}</div>
              <div className="text-xs text-gray-400">{f.label}</div>
            </div>
          ))}
        </div>

        {/* 商品列表 */}
        <div className="space-y-4">
          {items.map((it) => {
            const ctr = it.views > 0 ? (it.clicks / it.views) * 100 : 0;
            return (
              <div
                key={it.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => goProduct(it.product_id)}
              >
                <div className="w-24 h-24 shrink-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl overflow-hidden">
                  {it.product_image ? (
                    <img src={it.product_image} alt={it.product_title || "商品"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/30 text-xs">无图</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{it.product_title || "未命名商品"}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>👁 {it.views}</span>
                    <span>🔗 {it.clicks}</span>
                    <span>🛒 {it.cart_adds}</span>
                    {ctr > 0 && <span className={ctr > 3 ? "text-green-600" : ""}>CTR {ctr.toFixed(1)}%</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); trackEvent(campaignId, it.product_id, "add_cart"); goProduct(it.product_id); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border-2 border-accent text-accent"
                    >
                      加购
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); trackEvent(campaignId, it.product_id, "inquire"); goProduct(it.product_id); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white"
                    >
                      询价
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center text-gray-400 py-12">该测款活动暂无商品</div>
        )}
      </div>
    </div>
  );
}
