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

/* ========== 公开接口 ========== */

export async function getBlocks() {
  return request('/public/blocks');
}

export async function getPromotions(limit = 4) {
  return request(`/promotions?status=active&limit=${limit}`);
}

export async function getProducts(params) {
  const qs = new URLSearchParams();
  if (params && params.category) qs.set('category', params.category);
  if (params && params.search) qs.set('search', params.search);
  if (params && params.limit) qs.set('limit', String(params.limit));
  if (params && params.page) qs.set('page', String(params.page));
  const q = qs.toString();
  return request(`/products${q ? '?' + q : ''}`);
}

export async function getProduct(id) {
  return request(`/products/${id}`);
}

export async function getCourses(params) {
  const qs = new URLSearchParams();
  if (params && params.category) qs.set('category', params.category);
  const q = qs.toString();
  return request(`/courses${q ? '?' + q : ''}`);
}

export async function getDailyLooks() {
  return request('/daily-looks');
}

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
