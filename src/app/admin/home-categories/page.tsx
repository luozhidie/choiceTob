"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Edit2, GripVertical } from "lucide-react";

interface HomeCategory {
  id: string;
  label: string;
  icon: string;
  link: string;
  sort_order: number;
  is_active: boolean;
}

export default function HomeCategoriesPage() {
  const supabase = createClient();
  const [list, setList] = useState<HomeCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HomeCategory | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ label: "", icon: "", link: "", sort_order: 0, is_active: true });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("home_categories")
      .select("*")
      .order("sort_order");
    setList(data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.label.trim()) { alert("标签名称不能为空"); return; }
    const payload = {
      label: form.label.trim(),
      icon: form.icon.trim(),
      link: form.link.trim(),
      sort_order: form.sort_order,
      is_active: form.is_active,
    };
    if (editing?.id && !editing.id.startsWith("default-")) {
      const { error } = await supabase.from("home_categories").update(payload).eq("id", editing.id);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("home_categories").insert(payload);
      if (error) { alert("新增失败：" + error.message); return; }
    }
    setShowForm(false); setEditing(null);
    setForm({ label: "", icon: "", link: "", sort_order: 0, is_active: true });
    load();
  };

  const del = async (item: HomeCategory) => {
    if (item.id.startsWith("default-")) {
      // 默认数据只用软删除
      await supabase.from("home_categories").update({ is_active: false }).eq("id", item.id);
    } else {
      if (!confirm("确定删除该标签？")) return;
      await supabase.from("home_categories").delete().eq("id", item.id);
    }
    load();
  };

  const toggleActive = async (item: HomeCategory) => {
    await supabase.from("home_categories").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  };

  const openEdit = (c: HomeCategory) => {
    setForm({
      label: c.label, icon: c.icon || "", link: c.link || "",
      sort_order: c.sort_order || 0, is_active: c.is_active
    });
    setEditing(c);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">首页行业标签</h1>
            <p className="text-sm text-gray-500 mt-1">管理小程序首页顶部分类标签，和商品品类互不干扰</p>
          </div>
          <button onClick={() => { setForm({ label: "", icon: "", link: "", sort_order: list.length, is_active: true }); setEditing(null); setShowForm(true); }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> 新增标签
          </button>
        </div>

        {/* 说明 */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-sm text-amber-800">
          ⚠️ 这是<b>首页行业标签</b>（全部/穿搭/护肤等），和「品类管理」里的商品细分品类（T恤/半身裙等）是两套独立数据，互不影响。
        </div>

        {/* 列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 text-center w-12">排序</th>
                <th className="p-3 text-left">标签名称</th>
                <th className="p-3 text-left">图标/Emoji</th>
                <th className="p-3 text-left">点击跳转</th>
                <th className="p-3 text-center w-16">显示</th>
                <th className="p-3 text-center w-24">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map(c => (
                <tr key={c.id} className={"border-t border-gray-100 hover:bg-gray-50 " + (c.is_active ? "" : "opacity-40")}>
                  <td className="p-3 text-center text-gray-400"><GripVertical className="w-4 h-4 inline" />{c.sort_order}</td>
                  <td className="p-3 font-bold text-gray-800">{c.label}</td>
                  <td className="p-3">{c.icon || "—"}</td>
                  <td className="p-3 text-xs text-gray-500 max-w-[160px] truncate">{c.link || "无"}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleActive(c)}
                      className={"w-10 h-6 rounded-full transition " + (c.is_active ? "bg-green-500" : "bg-gray-300")}>
                      <span className={"inline-block w-4 h-4 bg-white rounded-full transition transform " + (c.is_active ? "translate-x-5" : "translate-x-0.5")}></span>
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs">编辑</button>
                    <button onClick={() => del(c)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && !loading && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">暂无标签，点击右上角新增</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">{editing ? "编辑" : "新增"}首页标签</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">标签名称 *</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：穿搭" />
              </div>
              <div>
                <label className="text-xs text-gray-500">图标/Emoji（可选）</label>
                <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：👗 留空不显示" />
              </div>
              <div>
                <label className="text-xs text-gray-500">点击跳转路径（可选）</label>
                <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：/pages/buyer/index" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">排序</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: +e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} id="hc-active" />
                  <label htmlFor="hc-active" className="text-sm text-gray-600">显示</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">保存</button>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2.5 bg-gray-200 rounded-xl text-sm">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
