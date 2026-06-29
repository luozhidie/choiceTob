"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Save, X, Loader2, Search,
  Copy, Check, Filter, MessageCircle, ChevronDown, ChevronUp,
} from "lucide-react";

interface WechatTemplate {
  id: string;
  category: string;
  industry: string;
  title: string;
  content: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ["首次添加", "节日问候", "服务推荐", "跟进维护", "活动邀请"];
const INDUSTRIES = ["通用", "服装店", "轮胎店", "滋补行"];

const emptyForm = {
  category: "首次添加",
  industry: "通用",
  title: "",
  content: "",
  is_default: false,
  sort_order: 0,
};

export default function CrmWechatTemplatesPage() {
  const [templates, setTemplates] = useState<WechatTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WechatTemplate | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>("首次添加");
  const router = useRouter();
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [filterCategory, filterIndustry]);

  const fetchTemplates = async () => {
    setLoading(true);
    let query = supabase.from("crm_wechat_templates").select("*").order("sort_order").order("created_at");

    if (filterCategory) query = query.eq("category", filterCategory);
    if (filterIndustry) query = query.eq("industry", filterIndustry);

    const { data, error } = await query;
    if (!error) setTemplates(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      const { error } = await supabase.from("crm_wechat_templates").update(formData).eq("id", editingTemplate.id);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("crm_wechat_templates").insert([formData]);
      if (error) { alert("创建失败：" + error.message); return; }
    }
    setShowModal(false);
    setEditingTemplate(null);
    setFormData(emptyForm);
    fetchTemplates();
  };

  const handleEdit = (t: WechatTemplate) => {
    setEditingTemplate(t);
    setFormData({
      category: t.category,
      industry: t.industry,
      title: t.title,
      content: t.content,
      is_default: t.is_default,
      sort_order: t.sort_order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此话术模板吗？")) return;
    const { error } = await supabase.from("crm_wechat_templates").delete().eq("id", id);
    if (error) { alert("删除失败：" + error.message); return; }
    fetchTemplates();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 按分类分组
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = templates.filter(t => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, WechatTemplate[]>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">微信话术模板</h1>
          <p className="text-muted-foreground mt-1">管理加微信和日常沟通话术，按行业和场景分类</p>
        </div>
        <button onClick={() => { setEditingTemplate(null); setFormData(emptyForm); setShowModal(true); }}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> 新增话术
        </button>
      </div>

      {/* 搜索 & 筛选 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索话术内容..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
          <option value="">全部分类</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
          <option value="">全部行业</option>
          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {/* 行业标签 */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-muted-foreground">快速筛选：</span>
        {INDUSTRIES.map(ind => (
          <button key={ind} onClick={() => setFilterIndustry(filterIndustry === ind ? "" : ind)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterIndustry === ind ? "bg-accent text-primary" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>{ind}</button>
        ))}
      </div>

      {/* 按分类展示 */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无话术模板</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([category, items]) => {
            const isExpanded = expandedCategory === category;
            const filteredItems = items.filter(t => !search || t.content.includes(search) || t.title.includes(search));
            if (filteredItems.length === 0) return null;
            return (
              <div key={category} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button onClick={() => setExpandedCategory(isExpanded ? "" : category)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-accent" />
                    <span className="font-semibold text-primary">{category}</span>
                    <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">{filteredItems.length}条</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {filteredItems.map(t => (
                      <div key={t.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-medium text-primary text-sm">{t.title}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{t.industry}</span>
                              {t.is_default && <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">默认</span>}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">{t.content}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => copyToClipboard(t.content, t.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                copiedId === t.id ? "bg-green-50 text-green-600" : "text-gray-400 hover:text-accent hover:bg-accent/10"
                              }`} title="复制">
                              {copiedId === t.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleEdit(t)} className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg" title="编辑"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="删除"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">{editingTemplate ? "编辑话术" : "新增话术"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">分类 <span className="text-red-500">*</span></label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">适用行业</label>
                  <select value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">话术标题 <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="如：基础版-自我介绍" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">话术内容 <span className="text-red-500">*</span></label>
                <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows={5}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none"
                  placeholder="话术内容，支持[姓名]等占位符" />
                <p className="text-xs text-muted-foreground mt-1">可用占位符：[姓名]、[附近某店]、[具体优惠内容]</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">排序</label>
                  <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2.5">
                    <input type="checkbox" checked={formData.is_default} onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="w-4 h-4 accent-accent" />
                    <span className="text-sm text-primary">设为默认话术</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingTemplate ? "保存修改" : "创建话术"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
