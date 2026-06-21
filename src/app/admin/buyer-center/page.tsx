"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {  } from "next/navigation";
import {
  Plus, Pencil, Trash2, Upload, Save, X, Eye, EyeOff, Loader2, ShoppingBag,
} from "lucide-react";

interface BuyerPackage {
  id: string;
  name: string;
  description: string;
  features: string;
  price_individual: number;
  price_group: number;
  image_url: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export default function AdminBuyerCenterPage() {
  const [packages, setPackages] = useState<BuyerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BuyerPackage | null>(null);
  const [formData, setFormData] = useState({
    name: "", description: "", features: "", price_individual: 0, price_group: 0, image_url: "", is_published: false, sort_order: 0,
  });
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => { 
fetchData(); }, []);
const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("buyer_packages").select("*").order("sort_order", { ascending: true });
    if (error) console.error(error);
    else setPackages(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `${Math.random()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("buyer-center-images").upload(fileName, file);
    if (error) { alert("上传失败：" + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("buyer-center-images").getPublicUrl(fileName);
    setFormData({ ...formData, image_url: data.publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from("buyer_packages").update(formData).eq("id", editing.id);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("buyer_packages").insert([formData]);
      if (error) { alert("创建失败：" + error.message); return; }
    }
    setShowModal(false); setEditing(null);
    setFormData({ name: "", description: "", features: "", price_individual: 0, price_group: 0, image_url: "", is_published: false, sort_order: 0 });
    fetchData();
  };

  const handleEdit = (pkg: BuyerPackage) => {
    setEditing(pkg);
    setFormData({ name: pkg.name, description: pkg.description || "", features: pkg.features || "", price_individual: pkg.price_individual || 0, price_group: pkg.price_group || 0, image_url: pkg.image_url || "", is_published: pkg.is_published, sort_order: pkg.sort_order || 0 });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个套餐吗？")) return;
    const { error } = await supabase.from("buyer_packages").delete().eq("id", id);
    if (error) { alert("删除失败：" + error.message); return; }
    fetchData();
  };

  const togglePublish = async (pkg: BuyerPackage) => {
    const { error } = await supabase.from("buyer_packages").update({ is_published: !pkg.is_published }).eq("id", pkg.id);
    if (error) { alert("操作失败：" + error.message); return; }
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">买手中心管理</h1>
          <p className="text-muted-foreground mt-1">管理买手招募套餐</p>
        </div>
        <button onClick={() => { setEditing(null); setFormData({ name: "", description: "", features: "", price_individual: 0, price_group: 0, image_url: "", is_published: false, sort_order: 0 }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />新增套餐
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" /><p className="text-muted-foreground">加载中...</p></div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100"><ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-muted-foreground">暂无套餐，点击"新增套餐"开始创建</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">图片</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">套餐名称</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">个人价</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">团体价</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">排序</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">状态</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {pkg.image_url ? <img src={pkg.image_url} alt={pkg.name} className="w-12 h-12 object-cover rounded-lg" /> : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-gray-400" /></div>}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">{pkg.name}</td>
                  <td className="px-6 py-4 text-sm">¥{pkg.price_individual}</td>
                  <td className="px-6 py-4 text-sm">¥{pkg.price_group}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{pkg.sort_order}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(pkg)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${pkg.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {pkg.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(pkg)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(pkg.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-primary">{editing ? "编辑套餐" : "新增套餐"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">套餐名称 <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="如：精准找款套餐" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">套餐描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="输入套餐描述" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">包含服务（每行一项）</label>
                <textarea value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="款式趋势分析&#10;供应链对接&#10;采购指导" />
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
                <label className="block text-sm font-medium text-primary mb-2">排序（数字越小越靠前）</label>
                <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">套餐封面</label>
                {formData.image_url ? (
                  <div className="relative inline-block">
                    <img src={formData.image_url} alt="预览" className="w-32 h-32 object-cover rounded-lg" />
                    <button type="button" onClick={() => setFormData({ ...formData, image_url: "" })} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-muted-foreground">{uploading ? "上传中..." : "上传封面"}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  </label>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_published" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4 text-accent focus:ring-accent rounded" />
                <label htmlFor="is_published" className="text-sm font-medium text-primary cursor-pointer">立即发布</label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editing ? "保存修改" : "新增套餐"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
