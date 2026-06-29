"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, Save, X, Loader2, Search,
  ChevronLeft, ChevronRight, Phone, User, MessageCircle,
  CheckCircle2, XCircle, Clock, AlertCircle, Eye, Filter,
  Copy, Check,
} from "lucide-react";

interface CrmContact {
  id: string;
  store_id: string;
  store_name?: string;
  name: string;
  phone: string;
  position: string | null;
  wechat_status: string;
  wechat_id: string | null;
  wechat_added_at: string | null;
  is_decision_maker: boolean;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

interface CrmStore {
  id: string;
  name: string;
  industry: string | null;
}

const WECHAT_STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  NOT_ADDED: { label: "未添加", color: "bg-gray-100 text-gray-600", icon: AlertCircle },
  ADDED: { label: "已添加", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  DEAL: { label: "已成交", color: "bg-purple-100 text-purple-700", icon: CheckCircle2 },
  REFUSED: { label: "已拒绝", color: "bg-red-100 text-red-700", icon: XCircle },
  INVALID: { label: "无效号码", color: "bg-gray-100 text-gray-500", icon: XCircle },
};

const POSITION_OPTIONS = ["老板", "店长", "采购", "店员", "其他"];

const PAGE_SIZE = 20;

// 手机号验证
const VALID_PREFIXES = [
  "130","131","132","133","134","135","136","137","138","139",
  "145","146","147","148","149",
  "150","151","152","153","155","156","157","158","159",
  "165","166","167","170","171","172","173","174","175","176","177","178",
  "180","181","182","183","184","185","186","187","188","189",
  "190","191","192","193","195","196","197","198","199",
];

function validatePhone(phone: string): { valid: boolean; wechatable: boolean; reason?: string } {
  const cleaned = phone.replace(/[\s\-]/g, "");
  if (!cleaned) return { valid: false, wechatable: false, reason: "号码为空" };
  const pureNumber = cleaned.replace(/^\+?86/, "");
  if (!/^\d+$/.test(pureNumber)) return { valid: false, wechatable: false, reason: "含非数字字符" };
  if (pureNumber.length !== 11) return { valid: false, wechatable: false, reason: "位数不对" };
  if (!pureNumber.startsWith("1")) return { valid: false, wechatable: false, reason: "非大陆手机号" };
  const prefix = pureNumber.substring(0, 3);
  if (!VALID_PREFIXES.includes(prefix)) return { valid: false, wechatable: false, reason: "号段不存在" };
  return { valid: true, wechatable: true };
}

const emptyForm = {
  store_id: "",
  name: "",
  phone: "",
  position: "",
  wechat_status: "NOT_ADDED",
  wechat_id: "",
  is_decision_maker: false,
  remark: "",
};

function CrmContactsPageInner() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [stores, setStores] = useState<CrmStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWechatModal, setShowWechatModal] = useState<CrmContact | null>(null);
  const [editingContact, setEditingContact] = useState<CrmContact | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterStoreId, setFilterStoreId] = useState("");
  const [filterWechatStatus, setFilterWechatStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  useEffect(() => {
    // URL参数中可能有storeId
    const storeId = searchParams.get("storeId");
    if (storeId) setFilterStoreId(storeId);
    fetchStores();
  }, []);

  useEffect(() => { fetchContacts(); }, [page, search, filterStoreId, filterWechatStatus]);

  const fetchStores = async () => {
    const { data } = await supabase.from("crm_stores").select("id, name, industry").is("deleted_at", null).order("name");
    setStores(data || []);
  };

  const fetchContacts = async () => {
    setLoading(true);
    let query = supabase
      .from("crm_contacts")
      .select("*, crm_stores!inner(name, industry)", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,wechat_id.ilike.%${search}%`);
    }
    if (filterStoreId) query = query.eq("store_id", filterStoreId);
    if (filterWechatStatus) query = query.eq("wechat_status", filterWechatStatus);

    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, error, count } = await query;
    if (!error && data) {
      const enriched = data.map((c: any) => ({
        ...c,
        store_name: c.crm_stores?.name || "未知门店",
      }));
      setContacts(enriched);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      wechat_added_at: formData.wechat_status !== "NOT_ADDED" && !editingContact ? new Date().toISOString() : editingContact?.wechat_added_at || null,
    };
    if (editingContact) {
      const { error } = await supabase.from("crm_contacts").update(payload).eq("id", editingContact.id);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("crm_contacts").insert([payload]);
      if (error) { alert("创建失败：" + error.message); return; }
    }
    setShowModal(false);
    setEditingContact(null);
    setFormData(emptyForm);
    fetchContacts();
  };

  const handleEdit = (contact: CrmContact) => {
    setEditingContact(contact);
    setFormData({
      store_id: contact.store_id,
      name: contact.name,
      phone: contact.phone,
      position: contact.position || "",
      wechat_status: contact.wechat_status,
      wechat_id: contact.wechat_id || "",
      is_decision_maker: contact.is_decision_maker,
      remark: contact.remark || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此联系人吗？")) return;
    const { error } = await supabase.from("crm_contacts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) { alert("删除失败：" + error.message); return; }
    fetchContacts();
  };

  const handleWechatStatusChange = async (contact: CrmContact, newStatus: string) => {
    const update: any = { wechat_status: newStatus };
    if (newStatus === "ADDED" && contact.wechat_status === "NOT_ADDED") {
      update.wechat_added_at = new Date().toISOString();
    }
    await supabase.from("crm_contacts").update(update).eq("id", contact.id);
    fetchContacts();
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 7) return phone;
    return phone.slice(0, 3) + "****" + phone.slice(-4);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 微信添加统计
  const wechatStats = {
    total: contacts.length,
    notAdded: contacts.filter(c => c.wechat_status === "NOT_ADDED").length,
    added: contacts.filter(c => c.wechat_status === "ADDED").length,
    deal: contacts.filter(c => c.wechat_status === "DEAL").length,
    addRate: contacts.length > 0 ? Math.round((contacts.filter(c => ["ADDED", "DEAL"].includes(c.wechat_status)).length / contacts.length) * 100) : 0,
  };

  const getStoreName = (storeId: string) => stores.find(s => s.id === storeId)?.name || "未知门店";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">联系人管理</h1>
          <p className="text-muted-foreground mt-1">管理门店联系人，跟踪微信添加状态</p>
        </div>
        <button onClick={() => {
          setEditingContact(null);
          setFormData({ ...emptyForm, store_id: filterStoreId || (stores[0]?.id || "") });
          setShowModal(true);
        }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> 新增联系人
        </button>
      </div>

      {/* 微信添加率统计 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground">总联系人</div>
          <div className="text-xl font-bold text-primary">{wechatStats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground">未添加微信</div>
          <div className="text-xl font-bold text-gray-500">{wechatStats.notAdded}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground">已添加</div>
          <div className="text-xl font-bold text-green-600">{wechatStats.added}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground">已成交</div>
          <div className="text-xl font-bold text-purple-600">{wechatStats.deal}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground">添加率</div>
          <div className="text-xl font-bold text-accent">{wechatStats.addRate}%</div>
        </div>
      </div>

      {/* 搜索 & 筛选 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索姓名/手机号/微信号..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={filterStoreId} onChange={(e) => { setFilterStoreId(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
          <option value="">全部门店</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterWechatStatus} onChange={(e) => { setFilterWechatStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
          <option value="">全部微信状态</option>
          {Object.entries(WECHAT_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" /></div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无联系人数据</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">姓名</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">手机号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">门店</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">职位</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">微信状态</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">微信号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">决策人</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contacts.map((contact) => {
                    const ws = WECHAT_STATUS_MAP[contact.wechat_status] || WECHAT_STATUS_MAP.NOT_ADDED;
                    const WsIcon = ws.icon;
                    return (
                      <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                              {contact.name.charAt(0)}
                            </div>
                            <span className="font-medium text-primary text-sm">{contact.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-mono">{maskPhone(contact.phone)}</span>
                            <button onClick={() => copyToClipboard(contact.phone, contact.id)} className="text-gray-400 hover:text-accent">
                              {copiedId === contact.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                            {(() => {
                              const v = validatePhone(contact.phone);
                              if (v.wechatable) return <span className="text-[10px] px-1 py-0.5 bg-green-50 text-green-600 rounded" title="可搜微信">✓</span>;
                              return <span className="text-[10px] px-1 py-0.5 bg-red-50 text-red-500 rounded" title={v.reason || "无效号码"}>✗</span>;
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm max-w-[120px] truncate">{contact.store_name || getStoreName(contact.store_id)}</td>
                        <td className="px-4 py-3 text-sm">{contact.position || "-"}</td>
                        <td className="px-4 py-3">
                          <select value={contact.wechat_status}
                            onChange={(e) => handleWechatStatusChange(contact, e.target.value)}
                            className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${ws.color}`}>
                            {Object.entries(WECHAT_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm">{contact.wechat_id || "-"}</td>
                        <td className="px-4 py-3 text-center">{contact.is_decision_maker ? <CheckCircle2 className="w-4 h-4 text-accent mx-auto" /> : "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/crm/follow-ups?contactId=${contact.id}`}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="跟进记录"><MessageCircle className="w-4 h-4" /></Link>
                            <button onClick={() => { setShowWechatModal(contact); }}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg" title="加微信提醒"><MessageCircle className="w-4 h-4" /></button>
                            <button onClick={() => handleEdit(contact)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg" title="编辑"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(contact.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg" title="删除"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

      {/* 加微信提醒弹窗 */}
      {showWechatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">加微信提醒</h2>
              <button onClick={() => setShowWechatModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">{showWechatModal.name.charAt(0)}</div>
                  <div>
                    <div className="font-medium text-primary">{showWechatModal.name}</div>
                    <div className="text-xs text-muted-foreground">{showWechatModal.store_name} · {showWechatModal.position || "未知职位"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono">{showWechatModal.phone}</span>
                  <button onClick={() => copyToClipboard(showWechatModal.phone, "phone-full")}
                    className="text-xs text-accent hover:underline">
                    {copiedId === "phone-full" ? "已复制" : "复制"}
                  </button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                <div className="text-sm font-medium text-green-800 mb-2">建议话术（点击复制）</div>
                <div className="space-y-2">
                  <button onClick={() => copyToClipboard(`您好！我是色彩智选的，想跟您聊聊合作可能，方便加个微信吗？我的手机号就是微信号～`, "t1")}
                    className="w-full text-left p-2 bg-white rounded-lg text-sm hover:bg-green-50 transition-colors">
                    {copiedId === "t1" ? "✅ 已复制" : "基础版：您好！我是色彩智选的，想跟您聊聊合作可能，方便加个微信吗？我的手机号就是微信号～"}
                  </button>
                  <button onClick={() => copyToClipboard(`老板好！我是做门店服务的，看到您店里很有特色，想跟您交流一下行业心得，方便通过一下微信吗？`, "t2")}
                    className="w-full text-left p-2 bg-white rounded-lg text-sm hover:bg-green-50 transition-colors">
                    {copiedId === "t2" ? "✅ 已复制" : "行业版：老板好！我是做门店服务的，看到您店里很有特色，想跟您交流一下行业心得，方便通过一下微信吗？"}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-xs text-yellow-800">
                <strong>提醒：</strong>添加微信后请及时更新联系人的微信状态，以便系统跟踪转化率
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新增/编辑联系人弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">{editingContact ? "编辑联系人" : "新增联系人"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">所属门店 <span className="text-red-500">*</span></label>
                <select value={formData.store_id} onChange={(e) => setFormData({ ...formData, store_id: e.target.value })} required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  <option value="">请选择门店</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">姓名 <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="联系人姓名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">手机号 <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="手机号码（必填）" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">职位</label>
                  <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option value="">请选择</option>
                    {POSITION_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">微信状态</label>
                  <select value={formData.wechat_status} onChange={(e) => setFormData({ ...formData, wechat_status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    {Object.entries(WECHAT_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">微信号</label>
                  <input type="text" value={formData.wechat_id} onChange={(e) => setFormData({ ...formData, wechat_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="微信号" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2.5">
                    <input type="checkbox" checked={formData.is_decision_maker} onChange={(e) => setFormData({ ...formData, is_decision_maker: e.target.checked })}
                      className="w-4 h-4 accent-accent" />
                    <span className="text-sm text-primary">是否决策人</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">备注</label>
                <textarea value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none" placeholder="备注信息" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingContact ? "保存修改" : "创建联系人"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


export default function CrmContactsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" /></div>}>
      <CrmContactsPageInner />
    </Suspense>
  );
}
