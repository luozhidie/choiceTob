"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {  } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  wechat: string;
  company: string;
  source: "paywall" | "contact" | "style_test" | "supplier";
  interested_service: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  notes: string;
  created_at: string;
}

const SOURCE_MAP: Record<string, string> = {
  paywall: "付费墙",
  contact: "联系表单",
  style_test: "风格测试",
  supplier: "供应商",
};

const STATUS_MAP: Record<string, string> = {
  new: "新线索",
  contacted: "已联系",
  qualified: "已合格",
  converted: "已转化",
  lost: "已流失",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  qualified: "bg-green-100 text-green-800 hover:bg-green-200",
  converted: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  lost: "bg-gray-100 text-gray-800 hover:bg-gray-200",
};

const STATUS_FLOW: Record<string, string[]> = {
  new: ["contacted", "lost"],
  contacted: ["qualified", "lost"],
  qualified: ["converted", "lost"],
  converted: [],
  lost: [],
};

const PAGE_SIZE = 10;

const emptyForm = {
  name: "",
  phone: "",
  wechat: "",
  company: "",
  source: "contact" as Lead["source"],
  interested_service: "",
  status: "new" as Lead["status"],
  notes: "",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    
}, []);

  useEffect(() => {
    fetchLeads();
  }, [page, search, filterSource, filterStatus]);
const fetchLeads = async () => {
    setLoading(true);
    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (filterSource) {
      query = query.eq("source", filterSource);
    }
    if (filterStatus) {
      query = query.eq("status", filterStatus);
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching leads:", error);
    } else {
      setLeads(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingLead) {
      const { error } = await supabase
        .from("leads")
        .update(formData)
        .eq("id", editingLead.id);
      if (error) {
        alert("更新失败：" + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("leads").insert([formData]);
      if (error) {
        alert("创建失败：" + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingLead(null);
    setFormData(emptyForm);
    fetchLeads();
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || "",
      phone: lead.phone || "",
      wechat: lead.wechat || "",
      company: lead.company || "",
      source: lead.source,
      interested_service: lead.interested_service || "",
      status: lead.status,
      notes: lead.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条线索吗？")) return;
    const res = await fetch("/api/admin/common/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, table: "leads" }),
    });
    const json = await res.json();
    if (json.error) {
      alert("删除失败：" + json.error);
      return;
    }
    fetchLeads();
  };

  const handleStatusChange = async (lead: Lead, nextStatus: string) => {
    const { error } = await supabase
      .from("leads")
      .update({ status: nextStatus })
      .eq("id", lead.id);
    if (error) {
      alert("状态更新失败：" + error.message);
      return;
    }
    fetchLeads();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">线索管理</h1>
          <p className="text-muted-foreground mt-1">查看和管理客户留资信息</p>
        </div>
        <button
          onClick={() => {
            setEditingLead(null);
            setFormData(emptyForm);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增线索
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索姓名/手机号..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-sm"
          />
        </div>
        <select
          value={filterSource}
          onChange={(e) => {
            setFilterSource(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-sm"
        >
          <option value="">全部来源</option>
          <option value="paywall">付费墙</option>
          <option value="contact">联系表单</option>
          <option value="style_test">风格测试</option>
          <option value="supplier">供应商</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-sm"
        >
          <option value="">全部状态</option>
          <option value="new">新线索</option>
          <option value="contacted">已联系</option>
          <option value="qualified">已合格</option>
          <option value="converted">已转化</option>
          <option value="lost">已流失</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无线索数据</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">姓名</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">手机号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">微信</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">企业</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">来源</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">感兴趣服务</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">创建时间</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary text-sm">{lead.name || "-"}</td>
                      <td className="px-4 py-3 text-sm">{lead.phone || "-"}</td>
                      <td className="px-4 py-3 text-sm">{lead.wechat || "-"}</td>
                      <td className="px-4 py-3 text-sm">{lead.company || "-"}</td>
                      <td className="px-4 py-3 text-sm">{SOURCE_MAP[lead.source] || lead.source}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[120px] truncate">{lead.interested_service || "-"}</td>
                      <td className="px-4 py-3">
                        {STATUS_FLOW[lead.status]?.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${STATUS_COLORS[lead.status]}`} onClick={() => handleStatusChange(lead, STATUS_FLOW[lead.status][0])} title={`点击切换至：${STATUS_MAP[STATUS_FLOW[lead.status][0]]}`}>
                              {STATUS_MAP[lead.status]}
                            </span>
                            {STATUS_FLOW[lead.status].length > 1 && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${STATUS_COLORS[STATUS_FLOW[lead.status][1]]}`} onClick={() => handleStatusChange(lead, STATUS_FLOW[lead.status][1])} title={`点击切换至：${STATUS_MAP[STATUS_FLOW[lead.status][1]]}`}>
                                {STATUS_MAP[STATUS_FLOW[lead.status][1]]}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
                            {STATUS_MAP[lead.status]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{new Date(lead.created_at).toLocaleDateString("zh-CN")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(lead)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="编辑"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(lead.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                共 {total} 条，第 {page}/{totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">{editingLead ? "编辑线索" : "新增线索"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">姓名 <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="客户姓名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">手机号 <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="手机号码" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">微信号</label>
                  <input type="text" value={formData.wechat} onChange={(e) => setFormData({ ...formData, wechat: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="微信号" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">所属企业</label>
                  <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="企业名称" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">来源</label>
                  <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value as Lead["source"] })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors">
                    <option value="paywall">付费墙</option>
                    <option value="contact">联系表单</option>
                    <option value="style_test">风格测试</option>
                    <option value="supplier">供应商</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">状态</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead["status"] })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors">
                    <option value="new">新线索</option>
                    <option value="contacted">已联系</option>
                    <option value="qualified">已合格</option>
                    <option value="converted">已转化</option>
                    <option value="lost">已流失</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">感兴趣的服务</label>
                <input type="text" value={formData.interested_service} onChange={(e) => setFormData({ ...formData, interested_service: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="如：形象设计、衣橱整理" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">备注</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="备注信息" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingLead ? "保存修改" : "新增线索"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
