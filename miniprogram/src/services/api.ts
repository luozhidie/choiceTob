import Taro from '@tarojs/taro';

const API_BASE = 'https://colour-choice.art/api';

function getToken() {
  try {
    return Taro.getStorageSync('auth_token') || '';
  } catch {
    return '';
  }
}

async function request(path, options = {}) {
  const method = options.method || 'GET';
  const data = options.data;
  const needToken = options.needToken || false;
  const url = `${API_BASE}${path}`;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (needToken) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const res = await Taro.request({
      url,
      method,
      data,
      header: headers,
      timeout: 15000,
    });
    return res.data || { error: '空响应' };
  } catch (err) {
    console.error(`[API] ${path} error:`, err);
    return { error: err.message || '网络请求失败' };
  }
}

export default request;
export { API_BASE, getToken };

/* ========== 公开接口（使用正确的后端路由路径）========== */

// 首页版块
export async function getBlocks() {
  return request('/public/blocks');
}

// 营销活动
export async function getPromotions(limit = 4) {
  return request(`/promotions?status=active&limit=${limit}`);
}

// 商品列表 - 使用 /public/products 路由
export async function getProducts(params) {
  const qs = new URLSearchParams();
  if (params && params.category) qs.set('category', params.category);
  if (params && params.search) qs.set('search', params.search);
  if (params && params.limit) qs.set('limit', String(params.limit));
  if (params && params.page) qs.set('page', String(params.page));
  const q = qs.toString();
  return request(`/public/products${q ? '?' + q : ''}`);
}

// 商品详情
export async function getProduct(id) {
  return request(`/public/products/${id}`);
}

// 课程列表
export async function getCourses(params) {
  const qs = new URLSearchParams();
  if (params && params.category) qs.set('category', params.category);
  const q = qs.toString();
  return request(`/public/daily-looks${q ? '?' + q : ''}`);
}

// 每日穿搭
export async function getDailyLooks() {
  return request('/public/daily-looks');
}

// 分类列表
export async function getCategories() {
  return request('/categories');
}

/* ========== 需要登录的接口 ========== */

export async function wechatLogin(code, nickName, avatarUrl) {
  return request('/auth/wechat-login', {
    method: 'POST',
    data: { code, nickName, avatarUrl },
  });
}

export async function updateProfile(data) {
  return request('/auth/update-profile', {
    method: 'POST',
    data,
    needToken: true,
  });
}

export async function getMyOrders() {
  return request('/orders/my', { needToken: true });
}
