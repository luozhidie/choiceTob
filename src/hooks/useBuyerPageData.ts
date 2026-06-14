// hooks/useBuyerPageData.ts
// 带降级容错的数据获取Hook - 即使数据库表未创建也能正常展示
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Promotion {
  id: string;
  title: string;
  description: string;
  promo_type: string;
  discount_rate: number | null;
  start_date: string;
  end_date: string;
  status: string;
  banner_image_url: string | null;
  link_url: string | null;
}

interface NewProductCalendar {
  id: string;
  product_id: string;
  release_date: string;
  is_featured: boolean;
  products: { id: string; title: string; price: number; cover_image: string } | null;
}

interface ProductTag {
  id: string;
  product_id: string;
  tag_type: string;
  tag_text: string;
}

interface Recommendation {
  id: string;
  user_id: string;
  product_id: string;
  recommendation_score: number;
  reason: string | null;
  is_clicked: boolean;
  products: { id: string; title: string; price: number; cover_image: string } | null;
}

// ====== Fallback 降级数据（数据库表不存在时使用）=====
const FALLBACK_PROMOTIONS: Promotion[] = [
  { id: 'fp-1', title: '618大促', description: '全场2.8折起', promo_type: 'seasonal', discount_rate: 0.28, start_date: '2026-06-01', end_date: '2026-06-20', status: 'active', banner_image_url: null, link_url: '/promotion/618' },
  { id: 'fp-2', title: '新品特惠', description: '首单立减50元', promo_type: 'new_user', discount_rate: 0.30, start_date: '2026-06-10', end_date: '2026-06-30', status: 'active', banner_image_url: null, link_url: '/promotion/new' },
  { id: 'fp-3', title: '爆款返场', description: '昨日热销TOP10', promo_type: 'flash_sale', discount_rate: 0.25, start_date: '2026-06-12', end_date: '2026-06-15', status: 'active', banner_image_url: null, link_url: '/promotion/hot' },
  { id: 'fp-4', title: '邀请有礼', description: '邀友得会员权益', promo_type: 'invite', discount_rate: null, start_date: '2026-06-01', end_date: '2026-12-31', status: 'active', banner_image_url: null, link_url: '/promotion/invite' },
];

const PROMO_TYPE_COLOR_MAP: Record<string, string> = {
  flash_sale: 'from-red-500 to-pink-500',
  new_user: 'from-amber-500 to-orange-500',
  invite: 'from-green-500 to-teal-500',
  seasonal: 'from-purple-500 to-indigo-500',
  clearance: 'from-gray-400 to-gray-300',
};

export function getPromoColor(type: string): string {
  return PROMO_TYPE_COLOR_MAP[type] || 'from-blue-500 to-indigo-500';
}

export function useBuyerPageData() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [newProductCalendar, setNewProductCalendar] = useState<NewProductCalendar[]>([]);
  const [productTags, setProductTags] = useState<Record<string, ProductTag[]>>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  // 获取营销活动（带容错）
  const fetchPromotions = useCallback(async () => {
    try {
      const response = await fetch('/api/promotions?status=active&limit=4');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setPromotions(data.data);
        return true;
      }
      throw new Error('empty data');
    } catch (err: any) {
      console.warn('[promotions] 使用降级数据:', err.message?.substring(0, 60));
      setPromotions(FALLBACK_PROMOTIONS);
      setUsingFallback(true);
      return false;
    }
  }, []);

  // 获取新品日历（带容错）
  const fetchNewProductCalendar = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await fetch(`/api/new-product-calendar?start_date=${today}&end_date=${nextWeek}&limit=50`);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setNewProductCalendar(data.data);
        return true;
      }
      throw new Error('empty data');
    } catch (err: any) {
      console.warn('[calendar] 新品日历表可能尚未创建:', err.message?.substring(0, 60));
      // 返回空数组，前端会根据此显示"暂无新品"状态
      setNewProductCalendar([]);
      return false;
    }
  }, []);

  // 获取商品标签
  const fetchProductTags = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return;
    try {
      const response = await fetch(`/api/product-tags?product_ids=${productIds.join(',')}`);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const tagsMap: Record<string, ProductTag[]> = {};
      data.data?.forEach((tag: ProductTag) => {
        if (!tagsMap[tag.product_id]) tagsMap[tag.product_id] = [];
        tagsMap[tag.product_id].push(tag);
      });
      setProductTags(prev => ({ ...prev, ...tagsMap }));
    } catch {
      console.warn('[tags] 商品标签表可能尚未创建');
    }
  }, []);

  // 获取用户推荐
  const fetchRecommendations = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/recommendations?user_id=${userId}&limit=6`);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setRecommendations(data.data);
        return;
      }
    } catch {
      console.warn('[recommendations] 推荐表可能尚未创建');
    }
    setRecommendations([]);
  }, []);

  // 记录页面浏览（静默失败）
  const trackPageView = useCallback(async (pagePath: string, userId?: string) => {
    try {
      await fetch('/api/page-view-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_path: pagePath,
          user_id: userId || null,
          session_id: `session_${Date.now()}`,
          referrer: typeof document !== 'undefined' ? document.referrer : '',
          duration: 0,
        }),
      });
    } catch { /* 静默 */ }
  }, []);

  // 更新页面浏览时长
  const updatePageViewDuration = useCallback(async (_pageViewId: string, _duration: number) => {
    // 暂不实现，等数据库表创建后启用
  }, []);

  // 初始化
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPromotions(), fetchNewProductCalendar()]);
      if (mounted) setLoading(false);
    };
    init();
    return () => { mounted = false; };
  }, [fetchPromotions, fetchNewProductCalendar]);

  return {
    promotions,
    newProductCalendar,
    productTags,
    recommendations,
    loading,
    usingFallback,
    fetchProductTags,
    fetchRecommendations,
    trackPageView,
    updatePageViewDuration,
    FALLBACK_PROMOTIONS,
    getPromoColor,
  };
}