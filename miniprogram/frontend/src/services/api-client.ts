import Taro from '@tarojs/taro';

const BASE_URL = 'https://colour-choice.art';

class ApiClient {
  private baseUrl: string;
  private token: string = '';

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = Taro.getStorageSync('auth_token') || '';
  }

  setToken(token: string) {
    this.token = token;
    Taro.setStorageSync('auth_token', token);
  }

  private async request<T>(method: string, path: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      header['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await Taro.request({ url, method, data, header, timeout: 15000 });
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return res.data as T;
      }
      throw new Error(`请求失败: ${res.statusCode}`);
    } catch (err: any) {
      console.error(`[API] ${method} ${path} error:`, err.message);
      throw err;
    }
  }

  get<T>(path: string) { return this.request<T>('GET', path); }
  post<T>(path: string, data?: any) { return this.request<T>('POST', path, data); }
  put<T>(path: string, data?: any) { return this.request<T>('PUT', path, data); }
  delete<T>(path: string) { return this.request<T>('DELETE', path); }
}

export const apiClient = new ApiClient(BASE_URL);
export default apiClient;
