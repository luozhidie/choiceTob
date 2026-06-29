"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {  } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Video,
  Save,
  X,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  video_url: string;
  cover_url: string;
  price: number;
  is_published: boolean;
  created_at: string;
}

export default function AdminEducationPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    cover_url: "",
    price: 0,
    is_published: false,
  });
  const [uploading, setUploading] = useState(false);
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  useEffect(() => {
    
fetchCourses();
  }, []);
const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching courses:", error);
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("course-covers")
      .upload(filePath, file);

    if (uploadError) {
      alert("上传失败：" + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("course-covers")
      .getPublicUrl(filePath);

    setFormData({ ...formData, cover_url: data.publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCourse) {
      // 更新
      const { error } = await supabase
        .from("courses")
        .update(formData)
        .eq("id", editingCourse.id);

      if (error) {
        alert("更新失败：" + error.message);
        return;
      }
    } else {
      // 新建
      const { error } = await supabase
        .from("courses")
        .insert([formData]);

      if (error) {
        alert("创建失败：" + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingCourse(null);
    setFormData({
      title: "",
      description: "",
      video_url: "",
      cover_url: "",
      price: 0,
      is_published: false,
    });
    fetchCourses();
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || "",
      video_url: course.video_url || "",
      cover_url: course.cover_url || "",
      price: course.price,
      is_published: course.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个课程吗？")) return;

    try {
      const res = await fetch("/api/admin/common/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, table: "courses" }),
      });
      const json = await res.json();
      if (json.error) alert("删除失败：" + json.error);
      else fetchCourses();
    } catch (err: any) {
      alert("删除失败：" + err.message);
    }
  };

  const togglePublish = async (course: Course) => {
    const { error } = await supabase
      .from("courses")
      .update({ is_published: !course.is_published })
      .eq("id", course.id);

    if (error) {
      alert("操作失败：" + error.message);
      return;
    }

    fetchCourses();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">教学中心管理</h1>
          <p className="text-muted-foreground mt-1">上传和管理视频教学课件</p>
        </div>
        <button
          onClick={() => {
            setEditingCourse(null);
            setFormData({
              title: "",
              description: "",
              video_url: "",
              cover_url: "",
              price: 0,
              is_published: false,
            });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增课程
        </button>
      </div>

      {/* Courses Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无课程，点击"新增课程"开始上传</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  封面
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  课程标题
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  价格
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  创建时间
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {course.cover_url ? (
                      <img
                        src={course.cover_url}
                        alt={course.title}
                        className="w-16 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Video className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-primary">{course.title}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                      {course.description}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {course.price === 0 ? (
                      <span className="text-green-600 font-medium">会员免费</span>
                    ) : (
                      <span className="font-medium">¥{(course.price / 100).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePublish(course)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        course.is_published
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {course.is_published ? (
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
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(course.created_at).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
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
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">
                {editingCourse ? "编辑课程" : "新增课程"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 课程标题 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  课程标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  placeholder="输入课程标题"
                />
              </div>

              {/* 课程描述 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  课程描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none"
                  placeholder="输入课程描述"
                />
              </div>

              {/* 视频链接 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  视频链接 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  placeholder="B站或腾讯视频嵌入链接"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  支持 B站、腾讯视频等平台的嵌入链接
                </p>
              </div>

              {/* 封面图上传 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  课程封面
                </label>
                {formData.cover_url ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.cover_url}
                      alt="封面预览"
                      className="w-48 h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_url: "" })}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-48 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-muted-foreground">
                      {uploading ? "上传中..." : "点击上传封面"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* 价格设置 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  价格设置（分）
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.price === 0}
                      onChange={() => setFormData({ ...formData, price: 0 })}
                      className="w-4 h-4 text-accent focus:ring-accent"
                    />
                    <span className="text-sm">会员免费</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.price > 0}
                      onChange={() => setFormData({ ...formData, price: 9900 })}
                      className="w-4 h-4 text-accent focus:ring-accent"
                    />
                    <span className="text-sm">单独付费</span>
                  </label>
                  {formData.price > 0 && (
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      className="w-32 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                      placeholder="价格（分）"
                    />
                  )}
                </div>
                {formData.price > 0 && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    当前价格：¥{(formData.price / 100).toFixed(2)}
                  </p>
                )}
              </div>

              {/* 发布状态 */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 text-accent focus:ring-accent rounded"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-primary cursor-pointer">
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
                  {editingCourse ? "保存修改" : "创建课程"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
