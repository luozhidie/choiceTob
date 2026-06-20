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
  ImageIcon,
  GripVertical,
} from "lucide-react";

interface BuyerFeature {
  id: string;
  sort_order: number;
  title: string;
  description: string;
  image_url: string;
  is_published: boolean;
  created_at: string;
}

export default function AdminBuyerFeaturesPage() {
  const [features, setFeatures] = useState<BuyerFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<BuyerFeature | null>(null);
  const [formData, setFormData] = useState({
    sort_order: 0,
    title: "",
    description: "",
    image_url: "",
    is_published: false,
  });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchFeatures();
  }, []);

  const checkUser = async () => {
  };

  const fetchFeatures = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("buyer_features")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching features:", error);
    } else {
      setFeatures(data || []);
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
      .from("buyer-features-images")
      .upload(fileName, file);

    if (uploadError) {
      alert("上传失败：" + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("buyer-features-images")
      .getPublicUrl(fileName);

    setFormData({ ...formData, image_url: data.publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingFeature) {
      const { error } = await supabase
        .from("buyer_features")
        .update(formData)
        .eq("id", editingFeature.id);

      if (error) {
        alert("更新失败：" + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("buyer_features")
        .insert([formData]);

      if (error) {
        alert("创建失败：" + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingFeature(null);
    setFormData({
      sort_order: 0,
      title: "",
      description: "",
      image_url: "",
      is_published: false,
    });
    fetchFeatures();
  };

  const handleEdit = (feature: BuyerFeature) => {
    setEditingFeature(feature);
    setFormData({
      sort_order: feature.sort_order,
      title: feature.title,
      description: feature.description || "",
      image_url: feature.image_url || "",
      is_published: feature.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个功能吗？")) return;

    const { error } = await supabase
      .from("buyer_features")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
      return;
    }

    fetchFeatures();
  };

  const togglePublish = async (feature: BuyerFeature) => {
    const { error } = await supabase
      .from("buyer_features")
      .update({ is_published: !feature.is_published })
      .eq("id", feature.id);

    if (error) {
      alert("操作失败：" + error.message);
      return;
    }

    fetchFeatures();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">选品功能管理</h1>
          <p className="text-muted-foreground mt-1">上传和管理平台选品功能的图片与内容</p>
        </div>
        <button
          onClick={() => {
            setEditingFeature(null);
            setFormData({
              sort_order: features.length,
              title: "",
              description: "",
              image_url: "",
              is_published: false,
            });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增功能
        </button>
      </div>

      {/* Features Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : features.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无功能数据，点击"新增功能"开始上传</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">排序</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">图片</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">标题</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">描述</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {features.map((feature) => (
                <tr key={feature.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {feature.sort_order + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {feature.image_url ? (
                      <img src={feature.image_url} alt={feature.title} className="w-16 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">{feature.title}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">{feature.description}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePublish(feature)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        feature.is_published
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {feature.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(feature)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="编辑">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(feature.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除">
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
              <h2 className="text-lg font-bold text-primary">{editingFeature ? "编辑功能" : "新增功能"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">排序序号 <span className="text-red-500">*</span></label>
                  <input type="number" min="0" required value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">功能标题 <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="如：款式库" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">功能描述 <span className="text-red-500">*</span></label>
                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="描述此功能的核心价值..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">功能图片</label>
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
                <p className="text-xs text-muted-foreground mt-1">建议尺寸 600x400，用于前台功能卡片展示</p>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_published" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4 text-accent focus:ring-accent rounded" />
                <label htmlFor="is_published" className="text-sm font-medium text-primary cursor-pointer">立即发布</label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingFeature ? "保存修改" : "新增功能"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
