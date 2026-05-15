"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Loader2,
  Truck,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  level: string;
  rating: number;
  description: string;
  is_published: boolean;
  created_at: string;
}

const levels = ["核心供应商", "优选供应商", "认证供应商", "观察供应商"];

export default function AdminSupplierPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    level: "认证供应商",
    rating: 4.0,
    description: "",
    is_published: false,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchSuppliers();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
    }
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching suppliers:", error);
    } else {
      setSuppliers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSupplier) {
      const { error } = await supabase
        .from("suppliers")
        .update(formData)
        .eq("id", editingSupplier.id);

      if (error) {
        alert("更新失败：" + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("suppliers")
        .insert([formData]);

      if (error) {
        alert("创建失败：" + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingSupplier(null);
    setFormData({ name: "", level: "认证供应商", rating: 4.0, description: "", is_published: false });
    fetchSuppliers();
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      level: supplier.level || "认证供应商",
      rating: supplier.rating || 4.0,
      description: supplier.description || "",
      is_published: supplier.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个供应商吗？")) return;

    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
      return;
    }

    fetchSuppliers();
  };

  const togglePublish = async (supplier: Supplier) => {
    const { error } = await supabase
      .from("suppliers")
      .update({ is_published: !supplier.is_published })
      .eq("id", supplier.id);

    if (error) {
      alert("操作失败：" + error.message);
      return;
    }

    fetchSuppliers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">供应商中心管理</h1>
          <p className="text-muted-foreground mt-1">管理供应商资源</p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setFormData({ name: "", level: "认证供应商", rating: 4.0, description: "", is_published: false });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增供应商
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无供应商，点击"新增供应商"开始录入</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">供应商名称</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">等级</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">评分</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">{supplier.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      supplier.level === "核心供应商" ? "bg-red-100 text-red-700" :
                      supplier.level === "优选供应商" ? "bg-amber-100 text-amber-700" :
                      supplier.level === "认证供应商" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>{supplier.level}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-accent">{supplier.rating}分</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(supplier)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${supplier.is_published ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}>
                      {supplier.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(supplier)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="编辑"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(supplier.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-primary">{editingSupplier ? "编辑供应商" : "新增供应商"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">供应商名称 <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="输入供应商名称" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">供应商等级</label>
                <div className="flex flex-wrap gap-2">
                  {levels.map((l) => (
                    <button key={l} type="button" onClick={() => setFormData({ ...formData, level: l })} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.level === l ? "bg-accent text-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">评分（0-5）</label>
                <input type="number" min="0" max="5" step="0.1" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="4.0" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">供应商描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="输入供应商描述" />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_published" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4 text-accent focus:ring-accent rounded" />
                <label htmlFor="is_published" className="text-sm font-medium text-primary cursor-pointer">立即发布</label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingSupplier ? "保存修改" : "新增供应商"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
