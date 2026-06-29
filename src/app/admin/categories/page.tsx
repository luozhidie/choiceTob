"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Edit2, Save, X, Tag, Upload } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/styles";

interface Category {
  id?: string;
  code: string;
  label: string;
  description: string;
  sort_order: number;
  is_default?: boolean;
}

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ code: "", label: "", description: "", sort_order: 0 });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.code.trim() || !form.label.trim()) { alert("编号和名称不能为空"); return; }
    const payload = { code: form.code.trim().toUpperCase(), label: form.label.trim(), description: form.description, sort_order: form.sort_order };

    if (editing?.id) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) { alert("新增失败：" + error.message); return; }
    }
    setShowForm(false); setEditing(null);
    setForm({ code: "", label: "", description: "", sort_order: 0 });
    loadCategories();
  };

  const del = async (id: string) => {
    if (!confirm("确定删除该品类？")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadCategories();
  };

  const openEdit = (c: Category) => {
    setForm({ code: c.code, label: c.label, description: c.description || "", sort_order: c.sort_order || 0 });
    setEditing(c); setShowForm(true);
  };

  const resetForm = () => {
    setForm({ code: "", label: "", description: "", sort_order: 0 });
    setEditing(null);
  };

  /* ── 一键导入默认品类 ── */
  const importDefaults = async () => {
    if (!confirm(`将导入 ${PRODUCT_CATEGORIES.length} 个默认品类，已存在的会跳过。继续？`)) return;
    setLoading(true);
    let imported = 0;
    for (let i = 0; i < PRODUCT_CATEGORIES.length; i++) {
      const c = PRODUCT_CATEGORIES[i];
      // 检查是否已存在
      const exists = categories.some(cat => cat.code === c.code);
      if (exists) continue;
      await supabase.from("categories").insert({
        code: c.code,
        label: c.label,
        description: "",
        sort_order: i,
        is_default: true,
      });
      imported++;
    }
    loadCategories();
    alert(`✅ 导入完成！新增 ${imported} 个品类`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">品类管理</h1>
            <p className="text-sm text-gray-500 mt-1">管理商品品类编号和名称，全站共用</p>
          </div>
          <div className="flex gap-3">
            <button onClick={importDefaults} disabled={loading}
              className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              <Upload className="w-4 h-4" /> 导入默认品类
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> 新增品类
            </button>
          </div>
        </div>

        {/* 统计 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{categories.length}</div>
            <div className="text-xs text-gray-500">品类总数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{categories.filter(c => c.is_default).length}</div>
            <div className="text-xs text-gray-500">系统预设</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{categories.filter(c => !c.is_default).length}</div>
            <div className="text-xs text-gray-500">自定义</div>
          </div>
        </div>

        {/* 弹窗 */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-lg font-bold mb-4">{editing ? "编辑" : "新增"}品类</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs text-gray-500">编号 *</label>
                    <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" placeholder="如：TX" maxLength={6} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">名称 *</label>
                    <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：T恤针织衫" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">说明（可选）</label>
                    <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：含普洗/缩水" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">排序</label>
                    <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: +e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
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

        {/* 品类列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 text-left w-16">编号</th>
                <th className="p-3 text-left">品类名称</th>
                <th className="p-3 text-left">说明</th>
                <th className="p-3 text-center w-16">排序</th>
                <th className="p-3 text-center w-16">来源</th>
                <th className="p-3 text-center w-24">操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-mono font-bold text-blue-700">{c.code}</td>
                  <td className="p-3 font-semibold">{c.label}</td>
                  <td className="p-3 text-gray-500 text-xs">{c.description || "—"}</td>
                  <td className="p-3 text-center text-gray-400">{c.sort_order}</td>
                  <td className="p-3 text-center">
                    {c.is_default
                      ? <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">预设</span>
                      : <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">自定义</span>}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-800 mr-2 text-xs">
                      <Edit2 className="w-3.5 h-3.5 inline" />
                    </button>
                    <button onClick={() => del(c.id!)} className="text-red-500 hover:text-red-700 text-xs">
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">
                  暂无品类，点击「导入默认品类」一键导入33个预设品类，或点击「新增品类」手动添加
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 说明 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <h4 className="font-bold text-blue-800 text-sm mb-2">品类编号规则</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• 编号用大写字母，2-6位，如 <code className="bg-white px-1 rounded">TX</code> <code className="bg-white px-1 rounded">HSLF</code></li>
            <li>• 编号一旦创建不建议修改，因为商品企划、库存、采购中已使用旧编号</li>
            <li>• 新增品类会立即在全站下拉框中生效</li>
            <li>• 排序号越小越靠前，建议按重要程度排列</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
