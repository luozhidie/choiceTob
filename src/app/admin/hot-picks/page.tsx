"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, X, BarChart3, TrendingUp, Flame, Clock, Search, Loader2 } from "lucide-react";

/* ==================== 类型 ==================== */
type HotPickType = "全网爆款" | "潜在爆款" | "爆款微调款" | "设计师款" | "原创款";
type SourceChannel = "电商平台" | "社交平台" | "批发市场" | "买手店" | "小众品牌" | "轻奢品牌";

interface HotPick {
  id: string;
  style_number: string;
  name: string;
  price: number;
  colors: string;
  style: string;
  source_channel: SourceChannel;
  hot_pick_type: HotPickType;
  created_at: string;
}

const HOT_PICK_TYPES: HotPickType[] = ["全网爆款", "潜在爆款", "爆款微调款", "设计师款", "原创款"];
const SOURCE_CHANNELS: SourceChannel[] = ["电商平台", "社交平台", "批发市场", "买手店", "小众品牌", "轻奢品牌"];

/* ==================== 页面 ==================== */
export default function AdminHotPicksDataPage() {
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  useEffect(() => { fetchData(); }, [supabase]);

  /* 统计 */
  const stats = useMemo(() => {
    const total = hotPicks.length;
    const hotAll = hotPicks.filter((h) => h.hot_pick_type === "全网爆款").length;
    const hotPotential = hotPicks.filter((h) => h.hot_pick_type === "潜在爆款").length;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekNew = hotPicks.filter((h) => new Date(h.created_at) >= weekAgo).length;
    return { total, hotAll, hotPotential, weekNew };
  }, [hotPicks]);

  /* 筛选后的数据 */
  const filteredData = useMemo(() => {
    return hotPicks.filter((h) => {
      if (filterType && h.hot_pick_type !== filterType) return false;
      if (filterChannel && h.source_channel !== filterChannel) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (h.style_number || "").toLowerCase().includes(q) ||
          (h.name || "").toLowerCase().includes(q) ||
          (h.style || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [hotPicks, filterType, filterChannel, search]);

  /* 打开新增 */
  const openAdd = () => {
    setEditingPick(null);
    setForm({ styleNumber: "", name: "", price: "", colors: "", style: "", sourceChannel: "", hotPickType: "" });
    setShowModal(true);
  };

  /* 打开编辑 */
  const openEdit = (pick: HotPick) => {
    setEditingPick(pick);
    setForm({
      styleNumber: pick.style_number,
      name: pick.name,
      price: String(pick.price),
      colors: pick.colors,
      style: pick.style,
      sourceChannel: pick.source_channel,
      hotPickType: pick.hot_pick_type,
    });
    setShowModal(true);
  };

  /* 保存（新增或编辑） */
  const handleSave = async () => {
    if (!form.styleNumber.trim() || !form.name.trim()) {
      alert("款号和名称不能为空");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        style_number: form.styleNumber.trim(),
        name: form.name.trim(),
        price: parseInt(form.price) || 0,
        colors: form.colors.trim(),
        style: form.style.trim(),
        source_channel: form.sourceChannel,
        hot_pick_type: form.hotPickType,
      };

      if (editingPick) {
        // 编辑
        const { error } = await supabase
          .from("hot_picks")
          .update(payload)
          .eq("id", editingPick.id);
        if (error) throw error;
        setToast({ type: "success", message: "修改成功" });
      } else {
        // 新增
        const { error } = await supabase
          .from("hot_picks")
          .insert([{ ...payload }]);
        if (error) throw error;
        setToast({ type: "success", message: "添加成功" });
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setToast({ type: "error", message: "保存失败: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  /* 删除 */
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条爆款记录吗？此操作不可恢复！")) return;
    try {
      const res = await fetch("/api/admin/common/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, table: "hot_picks" }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setToast({ type: "success", message: "删除成功" });
      fetchData();
    } catch (err: any) {
      setToast({ type: "error", message: "删除失败：" + err.message });
    }
  };

  /* 标签颜色映射 */
  const typeColorMap: Record<HotPickType, string> = {
    "全网爆款": "bg-red-100 text-red-700",
    "潜在爆款": "bg-amber-100 text-amber-700",
    "爆款微调款": "bg-blue-100 text-blue-700",
    "设计师款": "bg-purple-100 text-purple-700",
    "原创款": "bg-green-100 text-green-700",
  };

  const channelColorMap: Record<SourceChannel, string> = {
    "电商平台": "bg-orange-100 text-orange-700",
    "社交平台": "bg-pink-100 text-pink-700",
    "批发市场": "bg-gray-100 text-gray-700",
    "买手店": "bg-indigo-100 text-indigo-700",
    "小众品牌": "bg-teal-100 text-teal-700",
    "轻奢品牌": "bg-yellow-100 text-yellow-700",
  };

  /* ==================== 渲染 ==================== */
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg animate-in fade-in slide-in-from-right ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Flame className="w-6 h-6 text-accent" /> 爆款数据中心
          </h1>
          <p className="text-sm text-muted-foreground mt-1">录入和分析爆款数据，驱动商品企划决策</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> 新增爆款
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "总爆款数", value: stats.total, icon: BarChart3, color: "text-blue-600 bg-blue-50" },
          { label: "全网爆款", value: stats.hotAll, icon: Flame, color: "text-red-500 bg-red-50" },
          { label: "潜在爆款", value: stats.hotPotential, icon: TrendingUp, color: "text-amber-500 bg-amber-50" },
          { label: "本周新增", value: stats.weekNew, icon: Clock, color: "text-green-600 bg-green-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-10 h-10 ${card.color?.split(" ")[1]} rounded-lg flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.color?.split(" ")[0]}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{card.value}</div>
              <div className="text-xs text-muted-foreground">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-100 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索款号、名称、风格..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as HotPickType | "")}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white min-w-[140px]">
          <option value="">全部爆款类型</option>
          {HOT_PICK_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>
        <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value as SourceChannel | "")}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white min-w-[140px]">
          <option value="">全部来源渠道</option>
          {SOURCE_CHANNELS.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        {(filterType || filterChannel || search) && (
          <button onClick={() => { setFilterType(""); setFilterChannel(""); setSearch(""); }}
            className="text-xs text-accent hover:underline">清除筛选</button>
        )}
      </div>

      {/* 数据表格 */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-3" />
          <p className="text-muted-foreground text-sm">加载中...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Flame className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">暂无爆款数据</p>
          <p className="text-xs text-gray-400 mt-1">点击右上角「新增爆款」开始录入</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">款号</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">名称</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">价格</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">颜色</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">风格</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">来源渠道</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">爆款类型</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">录入时间</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((pick) => (
                <tr key={pick.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-primary">{pick.style_number}</td>
                  <td className="px-6 py-4 font-medium text-primary">{pick.name}</td>
                  <td className="px-6 py-4 text-sm">¥{pick.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-[120px] truncate">{pick.colors}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{pick.style}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${channelColorMap[pick.source_channel] || "bg-gray-100 text-gray-600"}`}>
                      {pick.source_channel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColorMap[pick.hot_pick_type] || "bg-gray-100 text-gray-600"}`}>
                      {pick.hot_pick_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(pick.created_at).toLocaleDateString("zh-CN")}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(pick)}
                        className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="编辑">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(pick.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="删除">
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

      {/* ==================== 新增/编辑弹窗 ==================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl mb-10">
            {/* 头部 */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="font-bold text-lg text-primary">{editingPick ? "编辑爆款" : "新增爆款"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* 款号 + 名称 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">款号 <span className="text-red-500">*</span></label>
                  <input type="text" value={form.styleNumber}
                    onChange={(e) => setForm({ ...form, styleNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                    placeholder="如：JK-2024-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">名称 <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                    placeholder="输入商品名称" />
                </div>
              </div>

              {/* 价格 + 颜色 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">价格（元）</label>
                  <input type="number" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">颜色</label>
                  <input type="text" value={form.colors}
                    onChange={(e) => setForm({ ...form, colors: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                    placeholder="如：黑色、白色、卡其" />
                </div>
              </div>

              {/* 风格 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">风格</label>
                <input type="text" value={form.style}
                  onChange={(e) => setForm({ ...form, style: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  placeholder="如：优雅型、自然型" />
              </div>

              {/* 来源渠道 + 爆款类型 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">来源渠道</label>
                  <select value={form.sourceChannel}
                    onChange={(e) => setForm({ ...form, sourceChannel: e.target.value as SourceChannel | "" })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors">
                    <option value="">请选择</option>
                    {SOURCE_CHANNELS.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">爆款类型</label>
                  <select value={form.hotPickType}
                    onChange={(e) => setForm({ ...form, hotPickType: e.target.value as HotPickType | "" })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors">
                    <option value="">请选择</option>
                    {HOT_PICK_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </div>
              </div>
            </div>

            {/* 底部 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                取消
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />保存中...</> : (editingPick ? "保存修改" : "新增爆款")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// force rebuild Sun Jun 21 07:52:25 AM UTC 2026
