"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Gift, Search, Users, Send, Ticket, Power } from "lucide-react";

// 分→元格式化（内联，避免import问题）
const fmt = (p: number) => `¥${(p / 100).toFixed(0)}`;

// 优惠券类型标签
const couponTypeLabels: Record<string, string> = {
  general: "通用",
  vip_gift: "VIP赠送",
  festival: "节日活动",
  invite_reward: "邀请奖励",
};

export default function AdminCouponsPage() {
  const [tab, setTab] = useState<"user" | "template">("user");

  // ===== 用户券 =====
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // 用户券 新增/编辑表单
  const [form, setForm] = useState({
    user_id: "",
    title: "",
    discount_desc: "",
    min_amount: 0,      // 分
    discount_amount: 0,   // 分
    coupon_type: "general",
    expire_days: 30,
    batch_send: false,
    quantity: 1,         // 发放数量（每人）
  });

  // 发放对象（用户列表）
  const [profiles, setProfiles] = useState<any[]>([]);

  // ===== 可领券模板 =====
  const [templates, setTemplates] = useState<any[]>([]);
  const [tplLoading, setTplLoading] = useState(true);
  const [showTplModal, setShowTplModal] = useState(false);
  const [editingTpl, setEditingTpl] = useState<any>(null);
  const [tplSaving, setTplSaving] = useState(false);

  const [tplForm, setTplForm] = useState({
    title: "",
    discount_desc: "",
    min_amount: 0,        // 元（界面输入）
    discount_amount: 0,   // 元（界面输入）
    coupon_type: "general",
    valid_days: 30,
    per_user_limit: 1,
    total_limit: 0,
    is_active: true,
  });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ---------- 用户券 ----------
  async function loadCoupons() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(keyword && { keyword }),
      });
      const res = await fetch(`/api/admin/coupons?${params}`, { credentials: "include" });
      const json = await res.json();
      if (json.data) {
        setCoupons(json.data);
        setTotalPages(json.totalPages || 1);
      }
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (tab === "user") loadCoupons(); }, [page, statusFilter, tab]);
  useEffect(() => { if (!showModal) { setPage(1); loadCoupons(); } }, [keyword]);

  // 加载发放对象列表
  async function loadProfiles() {
    try {
      const res = await fetch(`/api/admin/profiles`, { credentials: "include" });
      const json = await res.json();
      if (json.data) setProfiles(json.data);
    } catch (e: any) { /* 忽略 */ }
  }
  useEffect(() => { loadProfiles(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ user_id: "", title: "", discount_desc: "", min_amount: 0, discount_amount: 0, coupon_type: "general", expire_days: 30, batch_send: false, quantity: 1 });
    setShowModal(true);
  }

  function openEdit(c: any) {
    setEditing(c);
    setForm({
      user_id: c.user_id || "",
      title: c.title || "",
      discount_desc: c.discount_desc || "",
      min_amount: c.min_amount || 0,
      discount_amount: c.discount_amount || 0,
      coupon_type: c.coupon_type || "general",
      expire_days: 30,
      batch_send: false,
      quantity: 1,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title || !form.discount_amount) {
      showToast("error", "请填写标题和抵扣金额");
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        title: form.title,
        discount_desc: form.discount_desc,
        min_amount: Number(form.min_amount),
        discount_amount: Number(form.discount_amount),
        coupon_type: form.coupon_type,
        expire_days: Number(form.expire_days),
        quantity: Math.max(1, Number(form.quantity) || 1),
      };

      if (form.batch_send) {
        body.batch_send = true;
      } else {
        if (!form.user_id || form.user_id === "placeholder") {
          showToast("error", "请选择发放对象或勾选全部用户");
          setSaving(false);
          return;
        }
        body.user_id = form.user_id;
      }

      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "保存失败");

      showToast("success", form.batch_send ? `已批量发放${json.count}张` : "发放成功");
      setShowModal(false);
      loadCoupons();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此优惠券？")) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "删除成功");
        loadCoupons();
      }
    } catch (e: any) {
      showToast("error", e.message);
    }
  }

  // ---------- 可领券模板 ----------
  async function loadTemplates() {
    setTplLoading(true);
    try {
      const res = await fetch(`/api/admin/coupon-templates`, { credentials: "include" });
      const json = await res.json();
      if (json.success) setTemplates(json.data || []);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setTplLoading(false);
    }
  }

  useEffect(() => { if (tab === "template") loadTemplates(); }, [tab]);

  function openAddTpl() {
    setEditingTpl(null);
    setTplForm({ title: "", discount_desc: "", min_amount: 0, discount_amount: 0, coupon_type: "general", valid_days: 30, per_user_limit: 1, total_limit: 0, is_active: true });
    setShowTplModal(true);
  }

  function openEditTpl(t: any) {
    setEditingTpl(t);
    setTplForm({
      title: t.title || "",
      discount_desc: t.discount_desc || "",
      min_amount: t.min_amount ? Math.round(t.min_amount / 100) : 0,
      discount_amount: t.discount_amount ? Math.round(t.discount_amount / 100) : 0,
      coupon_type: t.coupon_type || "general",
      valid_days: t.valid_days || 30,
      per_user_limit: t.per_user_limit || 1,
      total_limit: t.total_limit || 0,
      is_active: t.is_active !== false,
    });
    setShowTplModal(true);
  }

  async function handleSaveTpl() {
    if (!tplForm.title || !tplForm.discount_amount) {
      showToast("error", "请填写标题和抵扣金额");
      return;
    }
    setTplSaving(true);
    try {
      const body: any = {
        title: tplForm.title,
        discount_desc: tplForm.discount_desc,
        min_amount: Number(tplForm.min_amount) * 100,
        discount_amount: Number(tplForm.discount_amount) * 100,
        coupon_type: tplForm.coupon_type,
        valid_days: Number(tplForm.valid_days),
        per_user_limit: Number(tplForm.per_user_limit),
        total_limit: Number(tplForm.total_limit),
        is_active: tplForm.is_active,
      };
      const res = await fetch("/api/admin/coupon-templates", {
        method: editingTpl ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editingTpl ? { id: editingTpl.id, ...body } : body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "保存失败");
      showToast("success", editingTpl ? "模板已更新" : "模板已新增");
      setShowTplModal(false);
      loadTemplates();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setTplSaving(false);
    }
  }

  async function handleDeleteTpl(id: string) {
    if (!confirm("确定删除此模板？已领取的券不受影响。")) return;
    try {
      const res = await fetch(`/api/admin/coupon-templates?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "模板已删除");
        loadTemplates();
      }
    } catch (e: any) {
      showToast("error", e.message);
    }
  }

  async function toggleTplActive(t: any) {
    try {
      const res = await fetch("/api/admin/coupon-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: t.id, is_active: !t.is_active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "操作失败");
      showToast("success", t.is_active ? "已停用" : "已启用");
      loadTemplates();
    } catch (e: any) {
      showToast("error", e.message);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">优惠券管理</h1>
          <p className="text-sm text-muted-foreground mt-1">发放用户券与管理可领取模板</p>
        </div>
      </div>

      {/* 选项卡 */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("user")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "user" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Gift className="w-4 h-4 inline mr-1" />用户券
        </button>
        <button
          onClick={() => setTab("template")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "template" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Ticket className="w-4 h-4 inline mr-1" />可领券模板
        </button>
      </div>

      {/* ===== 用户券 ===== */}
      {tab === "user" && (
        <>
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadCoupons()}
                placeholder="搜索优惠券标题..."
                className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border rounded-xl text-sm"
            >
              <option value="all">全部状态</option>
              <option value="unused">未使用</option>
              <option value="used">已使用</option>
              <option value="expired">已过期</option>
            </select>
            <button onClick={openAdd} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-1">
              <Plus className="w-4 h-4" /> 发放优惠券
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : coupons.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>暂无优惠券记录</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">标题</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">抵扣说明</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">满减条件</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">类型</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">状态</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">过期日</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">用户</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-20">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {coupons.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">{c.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.discount_desc || "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        {c.min_amount > 0 ? `满${fmt(c.min_amount)}元` : "无门槛"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          {couponTypeLabels[c.coupon_type] || c.coupon_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.status === "unused" && <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">未使用</span>}
                        {c.status === "used" && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">已使用</span>}
                        {c.status === "expired" && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500">已过期</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{c.expire_at || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[120px] truncate">
                        {c.profiles?.full_name || c.profiles?.email || c.user_id?.slice(0, 8) || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 text-sm">
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30">上一页</button>
                  <span className="text-sm text-gray-600">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30">下一页</button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ===== 可领券模板 ===== */}
      {tab === "template" && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={openAddTpl} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-1">
              <Plus className="w-4 h-4" /> 新增模板
            </button>
          </div>

          {tplLoading ? (
            <div className="text-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>暂无可领券模板，点击右上角新增</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">标题</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">抵扣说明</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">门槛</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">类型</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">有效期</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">限领</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">已领/总量</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">状态</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {templates.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">{t.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.discount_desc || "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        {t.min_amount > 0 ? `满${fmt(t.min_amount)}元` : "无门槛"}
                        <span className="text-accent font-medium"> 减{fmt(t.discount_amount)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          {couponTypeLabels[t.coupon_type] || t.coupon_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{t.valid_days || 30}天</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{t.per_user_limit || 1}张/人</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {t.claimed_count || 0}
                        {t.total_limit > 0 ? ` / ${t.total_limit}` : " / ∞"}
                      </td>
                      <td className="px-4 py-3">
                        {t.is_active ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">已启用</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">已停用</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => toggleTplActive(t)} title={t.is_active ? "停用" : "启用"} className="text-gray-400 hover:text-accent">
                            <Power className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditTpl(t)} className="text-blue-400 hover:text-blue-600">
                            <Users className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteTpl(t.id)} className="text-red-400 hover:text-red-600">
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
        </>
      )}

      {/* 用户券 新增/发放弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-primary mb-4">{editing ? "编辑优惠券" : "发放优惠券"}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="如：新客首单立减30元"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">抵扣说明</label>
                <input
                  value={form.discount_desc}
                  onChange={e => setForm(f => ({ ...f, discount_desc: e.target.value }))}
                  placeholder="如：满339减30"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">满多少元可用（元）</label>
                  <input
                    type="number"
                    value={form.min_amount > 0 ? Math.round(form.min_amount / 100) : ""}
                    onChange={e => setForm(f => ({ ...f, min_amount: Number(e.target.value) * 100 }))}
                    placeholder="0=无门槛"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">抵扣金额（元）*</label>
                  <input
                    type="number"
                    value={form.discount_amount > 0 ? Math.round(form.discount_amount / 100) : ""}
                    onChange={e => setForm(f => ({ ...f, discount_amount: Number(e.target.value) * 100 }))}
                    placeholder="如：30"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优惠券类型</label>
                  <select
                    value={form.coupon_type}
                    onChange={e => setForm(f => ({ ...f, coupon_type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="general">通用</option>
                    <option value="vip_gift">VIP赠送</option>
                    <option value="festival">节日活动</option>
                    <option value="invite_reward">邀请奖励</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">有效期（天）</label>
                  <input
                    type="number"
                    value={form.expire_days}
                    onChange={e => setForm(f => ({ ...f, expire_days: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">发放对象 *</label>
                <select
                  value={form.batch_send ? "all" : (form.user_id || "placeholder")}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === "all") setForm(f => ({ ...f, batch_send: true, user_id: "" }));
                    else setForm(f => ({ ...f, batch_send: false, user_id: v }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="placeholder" disabled>请选择发放对象</option>
                  <option value="all">全部用户（每人 1 张起）</option>
                  {profiles.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email || u.phone || u.id}
                      {u.phone ? `（${u.phone}）` : u.email ? `（${u.email}）` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {form.batch_send ? "将发放给全部用户" : "将发放给选定用户"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">发放数量（每人）</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: Math.max(1, Number(e.target.value) || 1) }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">每个发放对象获得的张数，默认 1</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-xl text-sm">取消</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {form.batch_send ? "批量发放" : "发放"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 可领券模板 新增/编辑弹窗 */}
      {showTplModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-primary mb-4">{editingTpl ? "编辑可领券模板" : "新增可领券模板"}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                <input
                  value={tplForm.title}
                  onChange={e => setTplForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="如：新人专享立减券"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">抵扣说明</label>
                <input
                  value={tplForm.discount_desc}
                  onChange={e => setTplForm(f => ({ ...f, discount_desc: e.target.value }))}
                  placeholder="如：满199减30"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">满多少元可用（元）</label>
                  <input
                    type="number"
                    value={tplForm.min_amount > 0 ? tplForm.min_amount : ""}
                    onChange={e => setTplForm(f => ({ ...f, min_amount: Number(e.target.value) }))}
                    placeholder="0=无门槛"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">抵扣金额（元）*</label>
                  <input
                    type="number"
                    value={tplForm.discount_amount > 0 ? tplForm.discount_amount : ""}
                    onChange={e => setTplForm(f => ({ ...f, discount_amount: Number(e.target.value) }))}
                    placeholder="如：30"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优惠券类型</label>
                  <select
                    value={tplForm.coupon_type}
                    onChange={e => setTplForm(f => ({ ...f, coupon_type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="general">通用</option>
                    <option value="vip_gift">VIP赠送</option>
                    <option value="festival">节日活动</option>
                    <option value="invite_reward">邀请奖励</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">有效期（天）</label>
                  <input
                    type="number"
                    value={tplForm.valid_days}
                    onChange={e => setTplForm(f => ({ ...f, valid_days: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">每人限领（张）</label>
                  <input
                    type="number"
                    value={tplForm.per_user_limit}
                    onChange={e => setTplForm(f => ({ ...f, per_user_limit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">总发放量（0=不限）</label>
                  <input
                    type="number"
                    value={tplForm.total_limit}
                    onChange={e => setTplForm(f => ({ ...f, total_limit: Number(e.target.value) }))}
                    placeholder="0=不限量"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tplActive"
                  checked={tplForm.is_active}
                  onChange={e => setTplForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="tplActive" className="text-sm text-gray-700">立即启用（用户可在商品页领取）</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowTplModal(false)} className="flex-1 px-4 py-2 border rounded-xl text-sm">取消</button>
              <button
                onClick={handleSaveTpl}
                disabled={tplSaving}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {tplSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {editingTpl ? "保存" : "新增"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
