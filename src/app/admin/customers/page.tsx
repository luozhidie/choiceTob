"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Mail,
  Phone,
  Tag,
  Star,
} from "lucide-react";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  wechat_id: string;
  membership_level: string;
  status: string;
  total_spent: number;
  order_count: number;
  created_at: string;
  tags: string[];
}

// 添加客户弹窗组件（真正写入数据库）
function AddCustomerModal({ supabase, onClose, onAdded }: {
  supabase: any;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      // 写入 customers 表
      const { error } = await supabase.from("customers").insert([{
        full_name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        membership_level: "normal",
        status: "active",
        total_spent: 0,
        order_count: 0,
      }]);
      if (error) throw error;
      onAdded();
    } catch (err: any) {
      alert("添加失败：" + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6">添加客户</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="客户姓名" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="手机号" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
              {saving ? "保存中..." : "添加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  
  const router = useRouter();
  const limit = 20;
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  // 加载客户数据
  const loadCustomers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("customers")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      setCustomers(data || []);
      setTotal(count || 0);
    } catch (err: any) {
      console.error("Load customers error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, statusFilter]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCustomers();
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个客户吗？")) return;
    
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
      const result = await res.json();
      
      if (result.success) {
        alert("删除成功");
        loadCustomers();
      } else {
        alert("删除失败：" + result.error);
      }
    } catch (error) {
      console.error("Delete customer error:", error);
      alert("删除失败");
    }
  };
  
  const totalPages = Math.ceil(total / limit);
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 顶部 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">客户管理</h1>
            <p className="text-gray-500 mt-1">管理注册会员和客户信息</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            添加客户
          </button>
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
              <option value="active">活跃</option>
              <option value="inactive">不活跃</option>
              <option value="blocked">已拉黑</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              搜索
            </button>
          </form>
        </div>
        
        {/* 客户列表 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无客户数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">姓名</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">联系方式</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">会员等级</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">消费金额</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">订单数</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">状态</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">注册时间</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{customer.full_name}</div>
                        {customer.tags && customer.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {customer.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          customer.membership_level === 'premium' ? 'bg-purple-50 text-purple-700' :
                          customer.membership_level === 'vip' ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          <Star className="w-3 h-3" />
                          {customer.membership_level === 'premium' ? '高级会员' :
                           customer.membership_level === 'vip' ? 'VIP会员' : '普通会员'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">¥{customer.total_spent.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{customer.order_count}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          customer.status === 'active' ? 'bg-green-50 text-green-700' :
                          customer.status === 'inactive' ? 'bg-gray-50 text-gray-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {customer.status === 'active' ? '活跃' :
                           customer.status === 'inactive' ? '不活跃' : '已拉黑'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(customer.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/customers/${customer.id}`)}
                            className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
      
      {/* 添加客户弹窗 */}
      {showAddModal && (
        <AddCustomerModal
          supabase={supabase}
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); loadCustomers(); }}
        />
      )}
    </div>
  );
}
