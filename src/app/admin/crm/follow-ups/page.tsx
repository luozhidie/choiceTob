"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus, Save, X, Loader2, Search, Phone, MessageCircle,
  MapPin, ChevronLeft, ChevronRight, Clock, CheckCircle2,
  XCircle, MinusCircle, AlertCircle, Calendar, Filter, User,
} from "lucide-react";

interface FollowUp {
  id: string;
  store_id: string;
  contact_id: string;
  follow_time: string;
  method: string;
  content: string;
  result: string;
  next_remind_at: string | null;
  reminded: boolean;
  created_at: string;
  store_name?: string;
  contact_name?: string;
}

interface CrmContact {
  id: string;
  name: string;
  store_id: string;
}

interface CrmStore {
  id: string;
  name: string;
}

const METHOD_MAP: Record<string, { label: string; icon: any; color: string }> = {
  PHONE: { label: "电话", icon: Phone, color: "text-blue-600" },
  WECHAT: { label: "微信", icon: MessageCircle, color: "text-green-600" },
  VISIT: { label: "到店", icon: MapPin, color: "text-purple-600" },
  OTHER: { label: "其他", icon: Clock, color: "text-gray-600" },
};

const RESULT_MAP: Record<string, { label: string; icon: any; color: string }> = {
  POSITIVE: { label: "积极", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  NEUTRAL: { label: "中性", icon: MinusCircle, color: "bg-yellow-100 text-yellow-700" },
  NEGATIVE: { label: "消极", icon: XCircle, color: "bg-red-100 text-red-700" },
  NO_RESPONSE: { label: "未回复", icon: AlertCircle, color: "bg-gray-100 text-gray-600" },
};

const PAGE_SIZE = 15;

const emptyForm = {
  store_id: "",
  contact_id: "",
  follow_time: "",
  method: "PHONE",
  content: "",
  result: "NEUTRAL",
  next_remind_at: "",
};

function CrmFollowUpsPageInner() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [stores, setStores] = useState<CrmStore[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterStoreId, setFilterStoreId] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  useEffect(() => {
    const storeId = searchParams.get("storeId");
    const contactId = searchParams.get("contactId");
    if (storeId) { setFilterStoreId(storeId); setFormData(f => ({ ...f, store_id: storeId })); }
    if (contactId) setFormData(f => ({ ...f, contact_id: contactId }));
    fetchStores();
  }, []);

  useEffect(() => { fetchFollowUps(); }, [page, search, filterStoreId, filterMethod]);

  useEffect(() => {
    if (formData.store_id) fetchContacts(formData.store_id);
  }, [formData.store_id]);

  const fetchStores = async () => {
    const { data } = await supabase.from("crm_stores").select("id, name").is("deleted_at", null).order("name");
    setStores(data || []);
  };

  const fetchContacts = async (storeId: string) => {
    const { data } = await supabase.from("crm_contacts").select("id, name, store_id").eq("store_id", storeId).is("deleted_at", null);
    setContacts(data || []);
    if (data && data.length > 0 && !formData.contact_id) {
      setFormData(f => ({ ...f, contact_id: data![0].id }));
    }
  };

  const fetchFollowUps = async () => {
    setLoading(true);
    let query = supabase
      .from("crm_follow_ups")
      .select("*, crm_stores!inner(name), crm_contacts!inner(name)", { count: "exact" })
      .order("follow_time", { ascending: false });

    if (search) {
      query = query.ilike("content", `%${search}%`);
    }
    if (filterStoreId) query = query.eq("store_id", filterStoreId);
    if (filterMethod) query = query.eq("method", filterMethod);

    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, error, count } = await query;
    if (!error && data) {
      const enriched = data.map((f: any) => ({
        ...f,
        store_name: f.crm_stores?.name,
        contact_name: f.crm_contacts?.name,
      }));
      setFollowUps(enriched);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      follow_time: formData.follow_time || new Date().toISOString(),
      next_remind_at: formData.next_remind_at || null,
    };
    const { error } = await supabase.from("crm_follow_ups").insert([payload]);
    if (error) { alert("创建失败：" + error.message); return; }

    // 如果有下次提醒，创建通知
    if (payload.next_remind_at) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("crm_notifications").insert([{
          user_id: userData.user.id,
          type: "FOLLOW_UP_REMINDER",
          title: "跟进提醒",
          content: `${payload.store_id ? '门店' : ''} - 跟进提醒`,
          related_type: "follow_up",
          is_read: false,
        }]);
      }
    }

    setShowModal(false);
    setFormData(emptyForm);
    fetchFollowUps();
  };

  const getStoreName = (id: string) => stores.find(s => s.id === id)?.name || "未知";
  const getContactName = (id: string) => contacts.find(c => c.id === id)?.name || "未知";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">跟进记录</h1>
          <p className="text-muted-foreground mt-1">记录每次客户跟进，设置下次提醒</p>
        </div>
        <button onClick={() => {
          setFormData({
            ...emptyForm,
            store_id: filterStoreId || (stores[0]?.id || ""),
          });
          setShowModal(true);
        }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> 新增跟进
        </button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground">总跟进次数</div>
          <div className="text-xl font-bold text-primary">{total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground">电话跟进</div>
          <div className="text-xl font-bold text-blue-600">{followUps.filter(f => f.method === "PHONE").length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground">微信跟进</div>
          <div className="text-xl font-bold text-green-600">{followUps.filter(f => f.method === "WECHAT").length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground">到店拜访</div>
          <div className="text-xl font-bold text-purple-600">{followUps.filter(f => f.method === "VISIT").length}</div>
        </div>
      </div>

      {/* 搜索 & 筛选 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索跟进内容..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={filterStoreId} onChange={(e) => { setFilterStoreId(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
          <option value="">全部门店</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterMethod} onChange={(e) => { setFilterMethod(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
          <option value="">全部方式</option>
          {Object.entries(METHOD_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* 跟进时间线 */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" /></div>
      ) : followUps.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无跟进记录</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {followUps.map((fu) => {
              const method = METHOD_MAP[fu.method] || METHOD_MAP.OTHER;
              const result = RESULT_MAP[fu.result] || RESULT_MAP.NO_RESPONSE;
              const MethodIcon = method.icon;
              const ResultIcon = result.icon;
              return (
                <div key={fu.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        fu.method === "PHONE" ? "bg-blue-50" : fu.method === "WECHAT" ? "bg-green-50" : fu.method === "VISIT" ? "bg-purple-50" : "bg-gray-50"
                      }`}>
                        <MethodIcon className={`w-5 h-5 ${method.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-primary text-sm">{fu.contact_name || getContactName(fu.contact_id)}</span>
                          <span className="text-xs text-muted-foreground">@</span>
                          <span className="text-sm text-muted-foreground">{fu.store_name || getStoreName(fu.store_id)}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${result.color}`}>
                            <ResultIcon className="w-3 h-3" />{result.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-wrap">{fu.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(fu.follow_time).toLocaleString("zh-CN")}</span>
                          {fu.next_remind_at && (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Calendar className="w-3 h-3" />下次提醒：{new Date(fu.next_remind_at).toLocaleString("zh-CN")}
                              {fu.reminded ? "(已提醒)" : "(待提醒)"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">共 {total} 条，第 {page}/{totalPages} 页</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 新增跟进弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">新增跟进记录</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">门店 <span className="text-red-500">*</span></label>
                  <select value={formData.store_id} onChange={(e) => setFormData({ ...formData, store_id: e.target.value, contact_id: "" })} required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option value="">请选择门店</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">联系人 <span className="text-red-500">*</span></label>
                  <select value={formData.contact_id} onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })} required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option value="">请选择联系人</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">跟进方式</label>
                  <select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    {Object.entries(METHOD_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">跟进结果</label>
                  <select value={formData.result} onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    {Object.entries(RESULT_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">跟进时间</label>
                <input type="datetime-local" value={formData.follow_time} onChange={(e) => setFormData({ ...formData, follow_time: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">跟进内容 <span className="text-red-500">*</span></label>
                <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none" placeholder="详细记录本次跟进的内容..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">下次跟进提醒</label>
                <input type="datetime-local" value={formData.next_remind_at} onChange={(e) => setFormData({ ...formData, next_remind_at: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                <p className="text-xs text-muted-foreground mt-1">设置后系统会在该时间提醒您跟进</p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />保存跟进</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


export default function CrmFollowUpsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" /></div>}>
      <CrmFollowUpsPageInner />
    </Suspense>
  );
}
