/**
 * API 服务 - 对接网站后端（同一个 Supabase 数据库）
 * BASE_URL: https://colour-choice.art
 *
 * 使用方式：
 *   import { getBlocks, getProducts } from './api';
 *   import api from './api'; // api.request 支持带 token
 */
import Taro from '@tarojs/taro';

const API_BASE = 'https://colour-choice.art/api';

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
}

// 获取存储的 token
function getToken(): string {
  try {
    return Taro.getStorageSync('auth_token') || '';
  } catch {
    return '';
  }
}

// 通用请求方法
async function request<T>(
  path: string,
  options: {
    method?: string;
    data?: any;
    needToken?: boolean;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', data, needToken = false } = options;
  const url = `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 如果需要 token，加到 header
  if (needToken) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const res: any = await Taro.request({
      url,
      method: method as any,
      data,
      header: headers,
      timeout: 15000,
    });

    // Taro.request 返回 { data, statusCode, header }
    // res.data 已经是解析后的 JSON
    return res.data || { error: '空响应' };
  } catch (err: any) {
    console.error(`[API] ${path} error:`, err);
    return { error: err.message || '网络请求失败' };
  }
}

export default request;
export { API_BASE, getToken };

/* ========== 公开接口（不需要 token）========== */

// 首页版块
export async function getBlocks() {
  return request('/public/blocks');
}

// 营销活动
export async function getPromotions(limit = 4) {
  return request(`/promotions?status=active&limit=${limit}`);
}

// 商品列表
export async function getProducts(params?: {
  category?: string;
  search?: string;
  limit?: number;
  page?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  if (params?.search) qs.set('search', params.search);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.page) qs.set('page', String(params.page));
  const q = qs.toString();
  return request(`/products${q ? '?' + q : ''}`);
}

// 商品详情
export async function getProduct(id: string) {
  return request(`/products/${id}`);
}

// 课程列表
export async function getCourses(params?: { category?: string }) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  const q = qs.toString();
  return request(`/courses${q ? '?' + q : ''}`);
}

// 每日穿搭
export async function getDailyLooks() {
  return request('/daily-looks');
}

// 分类列表
export async function getCategories() {
  return request('/categories');
}

/* ========== 需要登录的接口 ========== */

// 微信小程序登录（POST /api/auth/wechat-login）
export async function wechatLogin(code: string, nickName?: string, avatarUrl?: string) {
  return request('/auth/wechat-login', {
    method: 'POST',
    data: { code, nickName, avatarUrl },
  });
}

// 更新用户资料
export async function updateProfile(data: { nickName?: string; avatarUrl?: string }) {
  return request('/auth/update-profile', {
    method: 'POST',
    data,
    needToken: true,
  });
}

// 获取我的订单
export async function getMyOrders() {
  return request('/orders/my', { needToken: true });
}
