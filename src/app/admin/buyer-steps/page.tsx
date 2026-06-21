"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {  } from "next/navigation";
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
  ImageIcon,
} from "lucide-react";

interface BuyerStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  image_url: string;
  detail_content: string;
  is_published: boolean;
  created_at: string;
}

export default function AdminBuyerStepsPage() {
  const [steps, setSteps] = useState<BuyerStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStep, setEditingStep] = useState<BuyerStep | null>(null);
  const [formData, setFormData] = useState({
    step_number: 1,
    title: "",
    description: "",
    image_url: "",
    detail_content: "",
    is_published: false,
  });
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    
fetchSteps();
  }, []);
const fetchSteps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("buyer_steps")
      .select("*")
      .order("step_number", { ascending: true });

    if (error) {
      console.error("Error fetching steps:", error);
    } else {
      setSteps(data || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("buyer-steps-images")
      .upload(fileName, file);

    if (uploadError) {
      alert("上传失败：" + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("buyer-steps-images")
      .getPublicUrl(fileName);

    setFormData({ ...formData, image_url: data.publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingStep) {
      const { error } = await supabase
        .from("buyer_steps")
        .update(formData)
        .eq("id", editingStep.id);

      if (error) {
        alert("更新失败：" + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("buyer_steps")
        .insert([formData]);

      if (error) {
        alert("创建失败：" + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingStep(null);
    setFormData({
      step_number: 1,
      title: "",
      description: "",
      image_url: "",
      detail_content: "",
      is_published: false,
    });
    fetchSteps();
  };

  const handleEdit = (step: BuyerStep) => {
    setEditingStep(step);
    setFormData({
      step_number: step.step_number,
      title: step.title,
      description: step.description || "",
      image_url: step.image_url || "",
      detail_content: step.detail_content || "",
      is_published: step.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个步骤吗？")) return;

    const { error } = await supabase
      .from("buyer_steps")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
      return;
    }

    fetchSteps();
  };

  const togglePublish = async (step: BuyerStep) => {
    const { error } = await supabase
      .from("buyer_steps")
      .update({ is_published: !step.is_published })
      .eq("id", step.id);

    if (error) {
      alert("操作失败：" + error.message);
      return;
    }

    fetchSteps();
  };

  const getStepNumberOptions = () => {
    const used = new Set(steps.map((s) => s.step_number));
    const options = [];
    for (let i = 1; i <= 8; i++) {
      if (!used.has(i) || (editingStep && editingStep.step_number === i)) {
        options.push(i);
      }
    }
    return options;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">选品步骤管理</h1>
          <p className="text-muted-foreground mt-1">上传和管理四步精准选品的图片与内容</p>
        </div>
        <button
          onClick={() => {
            setEditingStep(null);
            setFormData({
              step_number: getStepNumberOptions()[0] || 1,
              title: "",
              description: "",
              image_url: "",
              detail_content: "",
              is_published: false,
            });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增步骤
        </button>
      </div>

      {/* Steps Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : steps.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无步骤数据，点击"新增步骤"开始上传</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">步骤</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">图片</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">标题</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">描述</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {steps.map((step) => (
                <tr key={step.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white text-sm font-bold">
                      {step.step_number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {step.image_url ? (
                      <img src={step.image_url} alt={step.title} className="w-16 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">{step.title}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">{step.description}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePublish(step)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        step.is_published
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {step.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(step)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="编辑">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(step.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">{editingStep ? "编辑步骤" : "新增步骤"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">步骤序号 <span className="text-red-500">*</span></label>
                  <select
                    value={formData.step_number}
                    onChange={(e) => setFormData({ ...formData, step_number: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>第 {n} 步</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">步骤标题 <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="如：客户需求分析" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">简短描述 <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="一句话描述此步骤" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">步骤图片</label>
                {formData.image_url ? (
                  <div className="relative inline-block">
                    <img src={formData.image_url} alt="预览" className="w-40 h-28 object-cover rounded-lg" />
                    <button type="button" onClick={() => setFormData({ ...formData, image_url: "" })} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-40 h-28 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-muted-foreground">{uploading ? "上传中..." : "上传图片"}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  </label>
                )}
                <p className="text-xs text-muted-foreground mt-1">建议尺寸 800x600，用于前台步骤展示</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">详细内容（前台点击后展示）</label>
                <textarea
                  value={formData.detail_content}
                  onChange={(e) => setFormData({ ...formData, detail_content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"
                  placeholder="输入此步骤的详细说明内容..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_published" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4 text-accent focus:ring-accent rounded" />
                <label htmlFor="is_published" className="text-sm font-medium text-primary cursor-pointer">立即发布</label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingStep ? "保存修改" : "新增步骤"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
