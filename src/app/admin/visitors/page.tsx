"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Search,
  Filter,
  Users,
  Clock,
  MapPin,
  Tag,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface Visitor {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  visit_count: number;
  page_views: number;
  last_visit_at: string;
  converted_at: string;
  tags: string[];
  interests: string[];
}

export default function AdminVisitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [checking, setChecking] = useState(true);
  
  const router = useRouter();
  const limit = 20;
  
  // 权限检查
  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/admin/login"); return; }
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "luozhidie@live.cn").split(",").map(e => e.trim());
      if (!adminEmails.includes(user.email || "")) { router.push("/admin/login"); return; }
      setChecking(false);
    };
    check();
  }, [router]);
  
  if (checking) return null;
  
  // 加载访客数据
  const loadVisitors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(sourceFilter && { source: sourceFilter }),
        ...(search && { search }),
      });
      
      const res = await fetch(`/api/admin/visitors?${params}`);
      const result = await res.json();
      
      if (result.success) {
        setVisitors(result.data);
        setTotal(result.total);
      }
    } catch (error) {
      console.error("Load visitors error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadVisitors();
  }, [page, statusFilter, sourceFilter]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadVisitors();
  };
  
  const totalPages = Math.ceil(total / limit);
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 顶部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">访客管理</h1>
          <p className="text-gray-500 mt-1">查看网站访客和潜在客户信息</p>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">总访客</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{total}</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">潜在客户</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {visitors.filter(v => v.status === 'lead').length}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">已转化</span>
              <Tag className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {visitors.filter(v => v.status === 'converted').length}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">平均访问</span>
              <Eye className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {visitors.length > 0 
                ? Math.round(visitors.reduce((sum, v) => sum + v.visit_count, 0) / visitors.length)
                : 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">次/人</div>
          </div>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索姓名、邮箱、电话..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">全部状态</option>
              <option value="visitor">访客</option>
              <option value="lead">潜在客户</option>
              <option value="converted">已转化</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">全部来源</option>
              <option value="direct">直接访问</option>
              <option value="wechat">微信</option>
              <option value="search">搜索引擎</option>
              <option value="social">社交媒体</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              搜索
            </button>
          </form>
        </div>
        
        {/* 访客列表 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : visitors.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无访客数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">访客</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">联系方式</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">来源</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">访问次数</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">页面浏览</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">状态</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">最近访问</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visitors.map((visitor) => (
                    <tr key={visitor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{visitor.full_name || "匿名访客"}</div>
                        {visitor.interests && visitor.interests.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {visitor.interests.slice(0, 2).map((interest, i) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                                {interest}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {visitor.email && (
                            <div>{visitor.email}</div>
                          )}
                          {visitor.phone && (
                            <div className="mt-1">{visitor.phone}</div>
                          )}
                          {!visitor.email && !visitor.phone && (
                            <span className="text-gray-400">未留信息</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
                          <MapPin className="w-3 h-3" />
                          {visitor.source === 'direct' ? '直接访问' :
                           visitor.source === 'wechat' ? '微信' :
                           visitor.source === 'search' ? '搜索引擎' :
                           visitor.source === 'social' ? '社交媒体' : visitor.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{visitor.visit_count}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{visitor.page_views}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          visitor.status === 'converted' ? 'bg-purple-50 text-purple-700' :
                          visitor.status === 'lead' ? 'bg-green-50 text-green-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {visitor.status === 'converted' ? '已转化' :
                           visitor.status === 'lead' ? '潜在客户' : '访客'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(visitor.last_visit_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/admin/visitors/${visitor.id}`)}
                          className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                共 {total} 条记录，第 {page}/{totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg ${
                        page === pageNum ? 'bg-primary text-white' : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
