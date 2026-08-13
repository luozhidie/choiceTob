// 小程序 API 服务层
// 对接网页版后端 API（https://colour-choice.art/api）

import Taro from '@tarojs/taro'

const API_BASE = 'https://colour-choice.art/api'

// 获取 Token（从小程序登录态获取）
function getToken(): string | null {
  return Taro.getStorageSync('auth_token') || null
}

// 通用请求封装
async function request(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await Taro.request({
    url: `${API_BASE}${path}`,
    method: options.method as any || 'GET',
    data: options.body ? JSON.parse(options.body as string) : undefined,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.statusCode >= 400) {
    throw new Error(res.data?.error || '请求失败')
  }
  return res.data
}

// ==================== API ====================

// 首页数据
export async function getHomeData() {
  return request('/home/data')
}

// 课程列表
export async function getCourses(params?: { category?: string; page?: number }) {
  const qs = params ? '?' + new URLSearchParams(params as any).toString() : ''
  return request(`/courses${qs}`)
}

// 课程详情
export async function getCourseDetail(id: string) {
  return request(`/courses/${id}`)
}

// 爆款样衣列表
export async function getHotPicks(params?: { page?: number; category?: string }) {
  const qs = params ? '?' + new URLSearchParams(params as any).toString() : ''
  return request(`/hot-picks${qs}`)
}

// 爆款样衣详情
export async function getHotPickDetail(id: string) {
  return request(`/hot-picks/${id}`)
}

// 资讯列表
export async function getNews(params?: { category?: string; page?: number }) {
  const qs = params ? '?' + new URLSearchParams(params as any).toString() : ''
  return request(`/news${qs}`)
}

// 资讯详情
export async function getNewsDetail(id: string) {
  return request(`/news/${id}`)
}

// 登录
export async function login(phone: string, password: string) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  })
}

// 注册
export async function register(data: { name: string; phone: string; password: string }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// 获取当前用户信息
export async function getProfile() {
  return request('/vip/profile')
}

// 风格测试提交
export async function submitStyleTest(data: any) {
  return request('/style-test/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
