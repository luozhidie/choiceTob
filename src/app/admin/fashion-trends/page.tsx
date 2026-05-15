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
  ImageIcon,
  Loader2,
} from "lucide-react";

interface FashionTrend {
  id: string;
  category: string;
  title: string;
  content: string;
  images: string[];
  date: string;
  price: number;
  is_published: boolean;
  created_at: string;
}

const categories = ["色彩趋势", "面料趋势", "款式趋势", "灵感图册"];

export default function AdminFashionTrendsPage() {
  const [trends, setTrends] = useState<FashionTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrend, setEditingTrend] = useState<FashionTrend | null>(null);
  const [formData, setFormData] = useState({
    category: "色彩趋势",
    title: "",
    content: "",
    images: [] as string[],
    date: new Date().toISOString().split("T")[0],
    price: 0,
    is_published: false,
  });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchTrends();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
    }
  };

  const fetchTrends = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fashion_trends")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching trends:", error);
    } else {
      setTrends(data || []);
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
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("trend-images")
        .upload(filePath, file);

      if (uploadError) {
        alert(`上传失败：${uploadError.message}`);
        continue;
      }

      const { data } = supabase.storage
        .from("trend-images")
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    setFormData({
      ...formData,
      images: [...formData.images, ...uploadedUrls],
    });
    setUploading(false);
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.images.length === 0) {
      alert("请至少上传一张图片");
      return;
    }

    if (editingTrend) {
      const { error } = await supabase
        .from("fashion_trends")
        .update(formData)
        .eq("id", editingTrend.id);

      if (error) {
        alert("更新失败：" + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("fashion_trends")
        .insert([formData]);

      if (error) {
        alert("创建失败：" + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingTrend(null);
    setFormData({
      category: "色彩趋势",
      title: "",
      content: "",
      images: [],
      date: new Date().toISOString().split("T")[0],
      price: 0,
      is_published: false,
    });
    fetchTrends();
  };

  const handleEdit = (trend: FashionTrend) => {
    setEditingTrend(trend);
    setFormData({
      category: trend.category,
      title: trend.title,
      content: trend.content || "",
      images: trend.images || [],
      date: trend.date || new Date().toISOString().split("T")[0],
      price: trend.price || 0,
      is_published: trend.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个趋势报告吗？")) return;

    const { error } = await supabase
      .from("fashion_trends")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
      return;
    }

    fetchTrends();
  };

  const togglePublish = async (trend: FashionTrend) => {
    const { error } = await supabase
      .from("fashion_trends")
      .update({ is_published: !trend.is_published })
      .eq("id", trend.id);

    if (error) {
      alert("操作失败：" + error.message);
      return;
    }

    fetchTrends();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">服装趋势管理</h1>
          <p className="text-muted-foreground mt-1">发布趋势报告，上传多张图片</p>
        </div>
        <button
          onClick={() => {
            setEditingTrend(null);
            setFormData({
              category: "色彩趋势",
              title: "",
              content: "",
              images: [],
              date: new Date().toISOString().split("T")[0],
              price: 0,
              is_published: false,
            });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增趋势
        </button>
      </div>

      {/* Trends Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : trends.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无趋势报告，点击"新增趋势"开始发布</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  图片
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  标题
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  分类
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  价格
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  日期
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  状态
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trends.map((trend) => (
                <tr key={trend.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {trend.images && trend.images.length > 0 ? (
                      <img
                        src={trend.images[0]}
                        alt={trend.title}
                        className="w-16 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-primary max-w-xs truncate">
                      {trend.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trend.images?.length || 0} 张图片
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                      {trend.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {trend.price === 0 ? (
                      <span className="text-green-600 font-medium text-sm">免费</span>
                    ) : (
                      <span className="font-bold text-accent text-sm">¥{(trend.price / 100).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {trend.date}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePublish(trend)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        trend.is_published
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {trend.is_published ? (
                        <>
                          <Eye className="w-3 h-3" />
                          已发布
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          草稿
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(trend)}
                        className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(trend.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
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
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">
                {editingTrend ? "编辑趋势报告" : "新增趋势报告"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 分类 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  趋势分类 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.category === cat
                          ? "bg-accent text-primary"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 标题 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  报告标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  placeholder="输入趋势报告标题"
                />
              </div>

              {/* 日期 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  发布日期
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                />
              </div>

              {/* 价格设置 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  价格设置
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.price === 0}
                      onChange={() => setFormData({ ...formData, price: 0 })}
                      className="w-4 h-4 text-accent focus:ring-accent"
                    />
                    <span className="text-sm">免费</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.price > 0}
                      onChange={() => setFormData({ ...formData, price: 9900 })}
                      className="w-4 h-4 text-accent focus:ring-accent"
                    />
                    <span className="text-sm">付费查看</span>
                  </label>
                  {formData.price > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">¥</span>
                      <input
                        type="number"
                        value={formData.price / 100}
                        onChange={(e) => setFormData({ ...formData, price: Math.round(parseFloat(e.target.value) || 0) * 100 })}
                        min="0"
                        step="0.01"
                        className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {formData.price === 0 ? "用户可免费查看此趋势报告" : `用户需支付 ¥${(formData.price / 100).toFixed(2)} 查看此报告`}
                </p>
              </div>

              {/* 内容描述 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  内容描述
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"
                  placeholder="输入趋势报告内容描述"
                />
              </div>

              {/* 多图上传 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  趋势图片 <span className="text-red-500">*</span>
                </label>

                {/* 已上传图片预览 */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`图片 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 上传按钮 */}
                <label className="flex flex-col items-center justify-center w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? "上传中..." : "点击上传图片（支持多张）"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 发布状态 */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_published_trend"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 text-accent focus:ring-accent rounded"
                />
                <label htmlFor="is_published_trend" className="text-sm font-medium text-primary cursor-pointer">
                  立即发布（勾选后用户可见）
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingTrend ? "保存修改" : "发布趋势"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
