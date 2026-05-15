"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Star,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  is_free: boolean;
  category: string | null;
  level: string;
  duration_minutes: number | null;
  content: string | null;
  is_published: boolean;
  created_at: string;
}

const categoryMap: Record<string, string> = {
  cmb_color: "CMB色彩诊断",
  styling: "搭配技巧",
  wardrobe: "衣橱管理",
  image: "形象提升",
};

const levelMap: Record<string, string> = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "高级",
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    cover_image: "",
    price: "",
    is_free: false,
    category: "",
    level: "beginner",
    duration_minutes: "",
    content: "",
    is_published: false,
  });

  const supabase = createClient();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCourses = async () => {
    setLoading(true);
    let query = supabase.from("courses").select("*").order("sort_order", { ascending: true });
    if (filterCategory) query = query.eq("category", filterCategory);
    const { data, error } = await query;
    if (!error && data) setCourses(data as Course[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, [filterCategory]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      cover_image: "",
      price: "",
      is_free: false,
      category: "",
      level: "beginner",
      duration_minutes: "",
      content: "",
      is_published: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("请填写课程标题");
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      cover_image: form.cover_image.trim() || null,
      price: form.is_free ? 0 : parseInt(form.price) * 100 || 0,
      is_free: form.is_free,
      category: form.category || null,
      level: form.level,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      content: form.content.trim() || null,
      is_published: form.is_published,
    };

    if (editingCourse) {
      const { error } = await supabase.from("courses").update(payload).eq("id", editingCourse.id);
      if (error) showToast("error", "更新失败");
      else { showToast("success", "课程已更新"); setShowForm(false); setEditingCourse(null); resetForm(); fetchCourses(); }
    } else {
      const { error } = await supabase.from("courses").insert([payload]);
      if (error) showToast("error", "创建失败：" + error.message);
      else { showToast("success", "课程已创建"); setShowForm(false); resetForm(); fetchCourses(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此课程？")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) showToast("error", "删除失败");
    else { showToast("success", "已删除"); fetchCourses(); }
  };

  const handleTogglePublish = async (course: Course) => {
    const { error } = await supabase.from("courses").update({ is_published: !course.is_published }).eq("id", course.id);
    if (error) showToast("error", "操作失败");
    else { showToast("success", course.is_published ? "已下架" : "已发布"); fetchCourses(); }
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      title: course.title,
      description: course.description || "",
      cover_image: course.cover_image || "",
      price: course.price ? (course.price / 100).toString() : "",
      is_free: course.is_free,
      category: course.category || "",
      level: course.level,
      duration_minutes: course.duration_minutes?.toString() || "",
      content: course.content || "",
      is_published: course.is_published,
    });
    setShowForm(true);
  };

  const filteredCourses = courses.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.title.toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-primary" : "bg-red-500"}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">课程管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理平台线上课程，支持免费/付费</p>
        </div>
        <button
          onClick={() => { setEditingCourse(null); resetForm(); setShowForm(true); }}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl"
        >
          <Plus className="w-4 h-4" />
          新建课程
        </button>
      </div>

      {/* Search & Filter */}
      <div className="max-w-7xl mx-auto mb-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索课程标题..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${showFilters ? "border-primary text-primary bg-primary/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <Filter className="w-4 h-4" />
            筛选
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>
        {showFilters && (
          <div className="flex gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部分类</option>
              <option value="cmb_color">CMB色彩诊断</option>
              <option value="styling">搭配技巧</option>
              <option value="wardrobe">衣橱管理</option>
              <option value="image">形象提升</option>
            </select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "全部课程", value: courses.length, color: "bg-primary/10 text-primary" },
          { label: "已发布", value: courses.filter((c) => c.is_published).length, color: "bg-green-50 text-green-600" },
          { label: "草稿", value: courses.filter((c) => !c.is_published).length, color: "bg-gray-100 text-gray-500" },
          { label: "付费课程", value: courses.filter((c) => !c.is_free && c.is_published).length, color: "bg-accent/10 text-accent" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs opacity-70 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <p className="mt-3 text-sm">加载中...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {searchTerm || filterCategory ? "没有匹配的课程" : "暂无课程，点击上方按钮创建"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">课程标题</th>
                  <th className="px-5 py-3 font-medium">分类</th>
                  <th className="px-5 py-3 font-medium">难度</th>
                  <th className="px-5 py-3 font-medium">价格</th>
                  <th className="px-5 py-3 font-medium">时长</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{course.title}</div>
                      {course.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {course.category ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {categoryMap[course.category] || course.category}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      {levelMap[course.level] || course.level}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-accent">
                      {course.is_free ? "免费" : `¥${(course.price / 100).toFixed(0)}`}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {course.duration_minutes ? `${Math.floor(course.duration_minutes / 60)}h${course.duration_minutes % 60}m` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleTogglePublish(course)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${course.is_published ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                      >
                        {course.is_published ? <CheckCircle2 className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                        {course.is_published ? "已发布" : "草稿"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/courses/${course.id}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                          title="预览"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEdit(course)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors" title="编辑">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(course.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="删除">
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
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-primary mb-6">{editingCourse ? "编辑课程" : "新建课程"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程标题 *</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="课程标题" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">未分类</option>
                    <option value="cmb_color">CMB色彩诊断</option>
                    <option value="styling">搭配技巧</option>
                    <option value="wardrobe">衣橱管理</option>
                    <option value="image">形象提升</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="beginner">入门</option>
                    <option value="intermediate">进阶</option>
                    <option value="advanced">高级</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格（元）</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} disabled={form.is_free} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50" placeholder="如 99" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">时长（分钟）</label>
                  <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="如 90" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_free" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} className="w-4 h-4 text-accent rounded focus:ring-accent" />
                <label htmlFor="is_free" className="text-sm text-gray-700">免费课程</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">封面图URL</label>
                <input type="text" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="简短描述..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程内容（详细介绍）</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="详细课程内容..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_published" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 text-accent rounded focus:ring-accent" />
                <label htmlFor="is_published" className="text-sm text-gray-700">立即发布</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingCourse(null); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90">{editingCourse ? "保存修改" : "创建课程"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
