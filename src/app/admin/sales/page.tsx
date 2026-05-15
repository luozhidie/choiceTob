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
  Headphones,
} from "lucide-react";

interface SalesService {
  id: string;
  title: string;
  type: string;
  price: number;
  description: string;
  is_published: boolean;
  created_at: string;
}

const serviceTypes = ["话术培训", "服务套餐", "诊断工具", "销售流程"];

export default function AdminSalesPage() {
  const [services, setServices] = useState<SalesService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<SalesService | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "话术培训",
    price: 0,
    description: "",
    is_published: false,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchServices();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales_services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingService) {
      const { error } = await supabase
        .from("sales_services")
        .update(formData)
        .eq("id", editingService.id);

      if (error) {
        alert("更新失败：" + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("sales_services")
        .insert([formData]);

      if (error) {
        alert("创建失败：" + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingService(null);
    setFormData({ title: "", type: "话术培训", price: 0, description: "", is_published: false });
    fetchServices();
  };

  const handleEdit = (service: SalesService) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      type: service.type || "话术培训",
      price: service.price || 0,
      description: service.description || "",
      is_published: service.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个服务吗？")) return;

    const { error } = await supabase
      .from("sales_services")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
      return;
    }

    fetchServices();
  };

  const togglePublish = async (service: SalesService) => {
    const { error } = await supabase
      .from("sales_services")
      .update({ is_published: !service.is_published })
      .eq("id", service.id);

    if (error) {
      alert("操作失败：" + error.message);
      return;
    }

    fetchServices();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">销售服务管理</h1>
          <p className="text-muted-foreground mt-1">上传和管理销售服务内容</p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setFormData({ title: "", type: "话术培训", price: 0, description: "", is_published: false });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增服务
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Headphones className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无销售服务，点击"新增服务"开始上传</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">标题</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">类型</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">价格</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary max-w-xs truncate">{service.title}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">{service.type}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">{service.price > 0 ? `¥${service.price}` : "免费"}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(service)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${service.is_published ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}>
                      {service.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(service)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="编辑"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(service.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-primary">{editingService ? "编辑服务" : "新增服务"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">服务标题 <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="输入服务标题" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">服务类型</label>
                <div className="flex flex-wrap gap-2">
                  {serviceTypes.map((t) => (
                    <button key={t} type="button" onClick={() => setFormData({ ...formData, type: t })} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.type === t ? "bg-accent text-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">价格（元）</label>
                <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0=免费" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">服务描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="输入服务描述" />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_published" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4 text-accent focus:ring-accent rounded" />
                <label htmlFor="is_published" className="text-sm font-medium text-primary cursor-pointer">立即发布</label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingService ? "保存修改" : "新增服务"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
