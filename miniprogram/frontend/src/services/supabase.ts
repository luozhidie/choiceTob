// 轻量 Supabase REST 客户端（小程序端）
import Taro from '@tarojs/taro';

const SUPABASE_URL = 'https://fxeknwkmytzedkhplozn.supabase.co';
// 注意：实际 ANON_KEY 需要在部署时配置
const SUPABASE_ANON_KEY = '';

class SupabaseClient {
  private url: string;
  private key: string;
  private token: string = '';

  constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
  }

  setAuthToken(token: string) {
    this.token = token;
    Taro.setStorageSync('supabase_token', token);
  }

  from(table: string) {
    return new SupabaseQueryBuilder(this.url, this.key, this.token, table);
  }
}

class SupabaseQueryBuilder {
  private url: string;
  private key: string;
  private token: string;
  private table: string;
  private filters: string[] = [];
  private selectFields: string = '*';
  private orderField: string = '';
  private orderAsc: boolean = true;
  private limitCount: number = 0;

  constructor(url: string, key: string, token: string, table: string) {
    this.url = url;
    this.key = key;
    this.token = token;
    this.table = table;
  }

  select(fields: string = '*') { this.selectFields = fields; return this; }
  eq(col: string, val: any) { this.filters.push(`${col}=eq.${val}`); return this; }
  order(field: string, opts?: { ascending?: boolean }) { this.orderField = field; this.orderAsc = opts?.ascending !== false; return this; }
  limit(count: number) { this.limitCount = count; return this; }

  private getHeaders() {
    const h: Record<string, string> = {
      'apikey': this.key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  async getList<T>(): Promise<{ data: T[] | null; error: any }> {
    let path = `/rest/v1/${this.table}?select=${this.selectFields}`;
    this.filters.forEach(f => path += `&${f}`);
    if (this.orderField) path += `&order=${this.orderField}.${this.orderAsc ? 'asc' : 'desc'}`;
    if (this.limitCount) path += `&limit=${this.limitCount}`;
    try {
      const res = await Taro.request({
        url: `${this.url}${path}`,
        method: 'GET',
        header: this.getHeaders(),
      });
      if (res.statusCode >= 200 && res.statusCode < 300) return { data: res.data, error: null };
      return { data: null, error: res.data };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  }

  async insert<T>(body: any): Promise<{ data: T | null; error: any }> {
    try {
      const res = await Taro.request({
        url: `${this.url}/rest/v1/${this.table}`,
        method: 'POST',
        data: body,
        header: this.getHeaders(),
      });
      if (res.statusCode >= 200 && res.statusCode < 300) return { data: res.data, error: null };
      return { data: null, error: res.data };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  }

  async update<T>(body: any): Promise<{ data: T | null; error: any }> {
    let path = `/rest/v1/${this.table}?`;
    this.filters.forEach((f, i) => { if (i > 0) path += '&'; path += f; });
    try {
      const res = await Taro.request({
        url: `${this.url}${path}`,
        method: 'PATCH',
        data: body,
        header: this.getHeaders(),
      });
      if (res.statusCode >= 200 && res.statusCode < 300) return { data: res.data, error: null };
      return { data: null, error: res.data };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  }

  async delete(): Promise<{ error: any }> {
    let path = `/rest/v1/${this.table}?`;
    this.filters.forEach((f, i) => { if (i > 0) path += '&'; path += f; });
    try {
      const res = await Taro.request({
        url: `${this.url}${path}`,
        method: 'DELETE',
        header: this.getHeaders(),
      });
      if (res.statusCode >= 200 && res.statusCode < 300) return { error: null };
      return { error: res.data };
    } catch (e: any) {
      return { error: e.message };
    }
  }
}

export const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
