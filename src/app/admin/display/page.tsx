"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Upload, Save, X, Eye, EyeOff,
  Loader2, LayoutGrid,
} from "lucide-react";

interface Display {
  id: string;
  title: string;
  label: string;
  section: string;
  scenario: string | null;
  description: string | null;
  color_season: string | null;
  style_type: string | null;
  image_url: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

const SECTIONS = [
  { value: "styles", label: "风格陈列" },
  { value: "scenarios", label: "场景搭配" },
  { value: "layouts", label: "门店布局" },
];

const SCENARIOS = [
  { value: "workplace", label: "职场通勤" },
  { value: "date", label: "周末约会" },
  { value: "casual", label: "休闲出行" },
  { value: "party", label: "晚宴社交" },
  { value: "vacation", label: "度假旅行" },
];

const COLOR_SEASONS = [
  { value: "light_warm", label: "浅暖型" },
  { value: "warm_bright", label: "暖亮型" },
  { value: "clear_warm", label: "净暖型" },
  { value: "light_cool", label: "浅冷型" },
  { value: "soft_cool", label: "柔冷型" },
  { value: "cool_soft", label: "冷柔型" },
  { value: "warm_soft", label: "暖柔型" },
  { value: "soft_warm", label: "柔暖型" },
  { value: "deep_warm", label: "深暖型" },
  { value: "clear_cool", label: "净冷型" },
  { value: "cool_bright", label: "冷亮型" },
  { value: "deep_cool", label: "深冷型" },
];

const STYLES = [
  { value: "shao_nv", label: "少女型" },
  { value: "you_ya", label: "优雅型" },
  { value: "lang_man_f", label: "浪漫型" },
  { value: "shao_nian_f", label: "少年型" },
  { value: "shi_shang_f", label: "时尚型" },
  { value: "gu_dian_f", label: "古典型" },
  { value: "zi_ran_f", label: "自然型" },
  { value: "xi_ju_f", label: "戏剧型" },
];

export default function AdminDisplayPage() {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDisplay, setEditingDisplay] = useState<Display | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    label: "",
    section: "styles",
    scenario: "",
    description: "",
    color_season: "",
    style_type: "",
    image_url: "",
    is_published: false,
    sort_order: 0,
  });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { checkUser(); fetchDisplays(); }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push("/admin/login");
  };

  const fetchDisplays = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("display_images").select("*").order("sort_order", { ascending: true });
    if (!error && data) setDisplays(data as Display[]);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const file = files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("display-images").upload(fileName, file);
    if (uploadError) { alert(`上传失败：${uploadError.message}`); setUploading(false); return; }
    const { data } = supabase.storage.from("display-images").getPublicUrl(fileName);
    setFormData({ ...formData, image_url: data.publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      label: formData.label || formData.title,
      section: formData.section,
      scenario: formData.scenario || null,
      description: formData.description || null,
      color_season: formData.color_season || null,
      style_type: formData.style_type || null,
      image_url: formData.image_url,
      is_published: formData.is_published,
      sort_order: formData.sort_order,
    };

    if (editingDisplay) {
      const { error } = await supabase.from("display_images").update(payload).eq("id", editingDisplay.id);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("display_images").insert([payload]);
      if (error) { alert("创建失败：" + error.message); return; }
    }

    setShowModal(false);
    setEditingDisplay(null);
    setFormData({ title: "", label: "", section: "styles", scenario: "", description: "", color_season: "", style_type: "", image_url: "", is_published: false, sort_order: 0 });
    fetchDisplays();
  };

  const handleEdit = (display: Display) => {
    setEditingDisplay(display);
    setFormData({
      title: display.title,
      label: display.label || "",
      section: display.section || "styles",
      scenario: display.scenario || "",
      description: display.description || "",
      color_season: display.color_season || "",
      style_type: display.style_type || "",
      image_url: display.image_url || "",
      is_published: display.is_published,
      sort_order: display.sort_order || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个陈列方案吗？")) return;
    const { error } = await supabase.from("display_images").delete().eq("id", id);
    if (error) { alert("删除失败：" + error.message); return; }
    fetchDisplays();
  };

  const togglePublish = async (display: Display) => {
    const { error } = await supabase.from("display_images").update({ is_published: !display.is_published }).eq("id", display.id);
    if (error) { alert("操作失败：" + error.message); return; }
    fetchDisplays();
  };

  const sectionLabels: Record<string, string> = { styles: "风格陈列", scenarios: "场景搭配", layouts: "门店布局" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">陈列搭配管理</h1>
          <p className="text-muted-foreground mt-1">管理陈列案例图片和搭配方案</p>
        </div>
        <button
          onClick={() => {
            setEditingDisplay(null);
            setFormData({ title: "", label: "", section: "styles", scenario: "", description: "", color_season: "", style_type: "", image_url: "", is_published: false, sort_order: 0 });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增陈列
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : displays.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无陈列方案，点击"新增陈列"开始上传</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">图片</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">标题</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">分类</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">色彩/风格</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displays.map((display) => (
                <tr key={display.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    {display.image_url ? (
                      <img src={display.image_url} alt={display.title} className="w-14 h-10 object-cover rounded-lg" />
                    ) : (
                      <div className="w-14 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <LayoutGrid className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary max-w-[200px] truncate text-sm">{display.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {sectionLabels[display.section] || display.section}
                      </span>
                      {display.scenario && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          {SCENARIOS.find(s => s.value === display.scenario)?.label || display.scenario}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {display.color_season && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {COLOR_SEASONS.find(c => c.value === display.color_season)?.label || display.color_season}
                        </span>
                      )}
                      {display.style_type && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                          {STYLES.find(s => s.value === display.style_type)?.label || display.style_type}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish(display)} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${display.is_published ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}>
                      {display.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(display)} className="p-1.5 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="编辑"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(display.id)} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-primary">{editingDisplay ? "编辑陈列" : "新增陈列"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">标题 <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="陈列案例标题" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">标签（简短）</label>
                  <input type="text" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="如：优雅型陈列" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">陈列分类</label>
                  <div className="flex flex-wrap gap-2">
                    {SECTIONS.map((s) => (
                      <button key={s.value} type="button" onClick={() => setFormData({ ...formData, section: s.value })} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${formData.section === s.value ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{s.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">适用场景</label>
                  <select value={formData.scenario} onChange={(e) => setFormData({ ...formData, scenario: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent">
                    <option value="">不指定</option>
                    {SCENARIOS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">色彩季型</label>
                  <select value={formData.color_season} onChange={(e) => setFormData({ ...formData, color_season: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent">
                    <option value="">不指定</option>
                    {COLOR_SEASONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">风格类型</label>
                  <select value={formData.style_type} onChange={(e) => setFormData({ ...formData, style_type: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent">
                    <option value="">不指定</option>
                    {STYLES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none" placeholder="陈列方案描述" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">陈列图片</label>
                {formData.image_url && (
                  <div className="mb-3">
                    <img src={formData.image_url} alt="预览" className="w-32 h-24 object-cover rounded-lg" />
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full h-28 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-muted-foreground">{uploading ? "上传中..." : "点击上传图片"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_published" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4 text-accent focus:ring-accent rounded" />
                  <label htmlFor="is_published" className="text-sm font-medium text-primary cursor-pointer">立即发布</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">排序</label>
                  <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingDisplay ? "保存修改" : "新增陈列"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
