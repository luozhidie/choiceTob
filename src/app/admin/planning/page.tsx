"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Save,
  X,
  Eye,
  EyeOff,
  Loader2,
  Lightbulb,
} from "lucide-react";

interface PlanningReport {
  id: string;
  title: string;
  category: string;
  content: string;
  images: string[];
  is_published: boolean;
  created_at: string;
}

const categories = ["商品结构", "风格企划", "色彩企划", "价格带企划", "季度企划"];

export default function AdminPlanningPage() {
  const [reports, setReports] = useState<PlanningReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState<PlanningReport | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "商品结构",
    content: "",
    images: [] as string[],
    is_published: false,
  });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchReports();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("planning_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("planning-images")
        .upload(fileName, file);

      if (uploadError) {
        alert(`上传失败：${uploadError.message}`);
        continue;
      }

      const { data } = supabase.storage
        .from("planning-images")
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    setFormData({ ...formData, images: [...formData.images, ...uploadedUrls] });
    setUploading(false);
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingReport) {
      const { error } = await supabase
        .from("planning_reports")
        .update(formData)
        .eq("id", editingReport.id);

      if (error) {
        alert("更新失败：" + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("planning_reports")
        .insert([formData]);

      if (error) {
        alert("创建失败：" + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingReport(null);
    setFormData({ title: "", category: "商品结构", content: "", images: [], is_published: false });
    fetchReports();
  };

  const handleEdit = (report: PlanningReport) => {
    setEditingReport(report);
    setFormData({
      title: report.title,
      category: report.category || "商品结构",
      content: report.content || "",
      images: report.images || [],
      is_published: report.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个企划报告吗？")) return;

    const { error } = await supabase
      .from("planning_reports")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
      return;
    }

    fetchReports();
  };

  const togglePublish = async (report: PlanningReport) => {
    const { error } = await supabase
      .from("planning_reports")
      .update({ is_published: !report.is_published })
      .eq("id", report.id);

    if (error) {
      alert("操作失败：" + error.message);
      return;
    }

    fetchReports();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">商品企划管理</h1>
          <p className="text-muted-foreground mt-1">上传和管理企划报告</p>
        </div>
        <button
          onClick={() => {
            setEditingReport(null);
            setFormData({ title: "", category: "商品结构", content: "", images: [], is_published: false });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增企划
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无企划报告，点击"新增企划"开始上传</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">图片</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">标题</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">分类</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {report.images && report.images.length > 0 ? (
                      <img src={report.images[0]} alt={report.title} className="w-16 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Lightbulb className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary max-w-xs truncate">{report.title}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">{report.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(report)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${report.is_published ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}>
                      {report.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(report)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="编辑"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(report.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
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
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">{editingReport ? "编辑企划" : "新增企划"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">企划标题 <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="输入企划标题" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">企划分类</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button key={cat} type="button" onClick={() => setFormData({ ...formData, category: cat })} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.category === cat ? "bg-accent text-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{cat}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">内容描述</label>
                <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="输入企划内容描述" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">企划图片</label>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt={`图片 ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-muted-foreground">{uploading ? "上传中..." : "点击上传图片（支持多张）"}</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" />
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_published" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4 text-accent focus:ring-accent rounded" />
                <label htmlFor="is_published" className="text-sm font-medium text-primary cursor-pointer">立即发布</label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingReport ? "保存修改" : "新增企划"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
