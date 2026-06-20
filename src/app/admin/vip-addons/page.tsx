"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Save, X, Eye, EyeOff, Loader2, Crown,
} from "lucide-react";

interface VipAddon {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string;
  price_individual: number;
  price_group: number;
  image_url: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

const categories = ["色彩季型", "风格诊断", "形象管理", "衣橱规划"];

export default function AdminVipAddonsPage() {
  const [addons, setAddons] = useState<VipAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<VipAddon | null>(null);
  const [formData, setFormData] = useState({
    name: "", category: "色彩季型", description: "", features: "", price_individual: 0, price_group: 0, image_url: "", is_published: false, sort_order: 0,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { checkUser(); fetchData(); }, []);

  const checkUser = async () => {

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("vip_addon_packages").select("*").order("sort_order", { ascending: true });
    if (error) console.error(error);
    else setAddons(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from("vip_addon_packages").update(formData).eq("id", editing.id);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("vip_addon_packages").insert([formData]);
      if (error) { alert("创建失败：" + error.message); return; }
    }
    setShowModal(false); setEditing(null);
    setFormData({ name: "", category: "色彩季型", description: "", features: "", price_individual: 0, price_group: 0, image_url: "", is_published: false, sort_order: 0 });
    fetchData();
  };

  const handleEdit = (addon: VipAddon) => {
    setEditing(addon);
    setFormData({ name: addon.name, category: addon.category || "色彩季型", description: addon.description || "", features: addon.features || "", price_individual: addon.price_individual || 0, price_group: addon.price_group || 0, image_url: addon.image_url || "", is_published: addon.is_published, sort_order: addon.sort_order || 0 });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个加油包吗？")) return;
    const { error } = await supabase.from("vip_addon_packages").delete().eq("id", id);
    if (error) { alert("删除失败：" + error.message); return; }
    fetchData();
  };

  const togglePublish = async (addon: VipAddon) => {
    const { error } = await supabase.from("vip_addon_packages").update({ is_published: !addon.is_published }).eq("id", addon.id);
    if (error) { alert("操作失败：" + error.message); return; }
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">VIP加油包管理</h1>
          <p className="text-muted-foreground mt-1">管理色彩季型、风格套餐加油包</p>
        </div>
        <button onClick={() => { setEditing(null); setFormData({ name: "", category: "色彩季型", description: "", features: "", price_individual: 0, price_group: 0, image_url: "", is_published: false, sort_order: 0 }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />新增加油包
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" /><p className="text-muted-foreground">加载中...</p></div>
      ) : addons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100"><Crown className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-muted-foreground">暂无加油包，点击"新增加油包"开始创建</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">名称</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">分类</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">个人价</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">团体价</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">状态</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {addons.map((addon) => (
                <tr key={addon.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">{addon.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">{addon.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">¥{addon.price_individual}</td>
                  <td className="px-6 py-4 text-sm">¥{addon.price_group}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(addon)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${addon.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {addon.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(addon)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(addon.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">{editing ? "编辑加油包" : "新增加油包"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">套餐名称 <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="如：春季色彩诊断加油包" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">套餐分类</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button key={c} type="button" onClick={() => setFormData({ ...formData, category: c })} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.category === c ? "bg-accent text-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">套餐描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="输入套餐描述" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">包含服务（每行一项）</label>
                <textarea value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="个人色彩季型诊断&#10;专属色彩搭配方案&#10;季度色彩更新" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">个人价格（元）</label>
                  <input type="number" value={formData.price_individual} onChange={(e) => setFormData({ ...formData, price_individual: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">团体价格（元）</label>
                  <input type="number" value={formData.price_group} onChange={(e) => setFormData({ ...formData, price_group: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">排序</label>
                <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_published" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4 text-accent focus:ring-accent rounded" />
                <label htmlFor="is_published" className="text-sm font-medium text-primary cursor-pointer">立即发布</label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editing ? "保存修改" : "新增加油包"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
}
