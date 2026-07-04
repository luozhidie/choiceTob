"use client";

import { useState } from "react";

// 默认首页标签数据（和数据库同步后改为从 API 读取）
const DEFAULT_TAGS = [
  { id: "1", label: "全部", icon: "", link: "", sort_order: 0, is_active: true },
  { id: "2", label: "穿搭", icon: "", link: "", sort_order: 1, is_active: true },
  { id: "3", label: "护肤", icon: "", link: "", sort_order: 2, is_active: true },
  { id: "4", label: "彩妆", icon: "", link: "", sort_order: 3, is_active: true },
  { id: "5", label: "养生", icon: "", link: "", sort_order: 4, is_active: true },
  { id: "6", label: "食品", icon: "", link: "", sort_order: 5, is_active: true },
  { id: "7", label: "家居", icon: "", link: "", sort_order: 6, is_active: true },
  { id: "8", label: "文创", icon: "", link: "", sort_order: 7, is_active: true },
  { id: "9", label: "艺术", icon: "", link: "", sort_order: 8, is_active: true },
];

export default function HomeCategoriesPage() {
  const [list, setList] = useState(DEFAULT_TAGS);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ label: "", icon: "", link: "", sort_order: 0, is_active: true });

  const save = () => {
    if (!form.label.trim()) { alert("标签名称不能为空"); return; }
    if (editing) {
      setList(list.map(t => t.id === editing.id ? { ...t, ...form } : t));
    } else {
      setList([...list, { ...form, id: Date.now().toString() }]);
    }
    setShowForm(false); setEditing(null);
    setForm({ label: "", icon: "", link: "", sort_order: list.length, is_active: true });
    alert("⚠️ 页面已更新，但数据库表还未创建，刷新后数据会丢失。请先在 Supabase 建表。");
  };

  const del = (id: string) => {
    if (!confirm("确定删除？")) return;
    setList(list.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">首页行业标签</h1>
            <p className="text-sm text-gray-500 mt-1">管理小程序首页顶部分类标签</p>
          </div>
          <button onClick={() => { setForm({ label: "", icon: "", link: "", sort_order: list.length, is_active: true }); setEditing(null); setShowForm(true); }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
            + 新增标签
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-sm text-amber-800">
          ⚠️ 当前为<b>前端临时模式</b>，数据存在浏览器内存中，刷新会丢失。<br/>
          需要先在 Supabase 执行建表 SQL，然后刷新页面切换到数据库模式。
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 text-left">标签名称</th>
                <th className="p-3 text-center w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-bold text-gray-800">{t.label}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => { setForm(t); setEditing(t); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 mr-3 text-xs">编辑</button>
                    <button onClick={() => del(t.id)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-4">{editing ? "编辑" : "新增"}标签</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">标签名称 *</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
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
