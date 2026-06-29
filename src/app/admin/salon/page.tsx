"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, Pencil, Trash2, Upload, Save, X, Eye, EyeOff, Loader2, Calendar,
} from "lucide-react";

interface SalonEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  price_individual: number;
  price_group: number;
  capacity: number;
  registered: number;
  image_url: string;
  is_published: boolean;
  created_at: string;
}

export default function AdminSalonPage() {
  const [events, setEvents] = useState<SalonEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SalonEvent | null>(null);
  const [formData, setFormData] = useState({
    title: "", description: "", event_date: "", location: "", price_individual: 0, price_group: 0, capacity: 30, registered: 0, image_url: "", is_published: false,
  });
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("salon_events").select("*").order("event_date", { ascending: false });
    if (error) console.error(error);
    else setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `${Math.random()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("salon-images").upload(fileName, file);
    if (error) { alert("上传失败：" + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("salon-images").getPublicUrl(fileName);
    setFormData({ ...formData, image_url: data.publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from("salon_events").update(formData).eq("id", editing.id);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("salon_events").insert([formData]);
      if (error) { alert("创建失败：" + error.message); return; }
    }
    setShowModal(false); setEditing(null);
    setFormData({ title: "", description: "", event_date: "", location: "", price_individual: 0, price_group: 0, capacity: 30, registered: 0, image_url: "", is_published: false });
    fetchData();
  };

  const handleEdit = (event: SalonEvent) => {
    setEditing(event);
    setFormData({ title: event.title, description: event.description || "", event_date: event.event_date || "", location: event.location || "", price_individual: event.price_individual || 0, price_group: event.price_group || 0, capacity: event.capacity || 30, registered: event.registered || 0, image_url: event.image_url || "", is_published: event.is_published });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个沙龙活动吗？")) return;
    const res = await fetch("/api/admin/common/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, table: "salon_events" }),
    });
    const json = await res.json();
    if (json.error) { alert("删除失败：" + json.error); return; }
    fetchData();
  };

  const togglePublish = async (event: SalonEvent) => {
    const { error } = await supabase.from("salon_events").update({ is_published: !event.is_published }).eq("id", event.id);
    if (error) { alert("操作失败：" + error.message); return; }
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">沙龙活动管理</h1>
          <p className="text-muted-foreground mt-1">管理线下沙龙活动与报名</p>
        </div>
        <button onClick={() => { setEditing(null); setFormData({ title: "", description: "", event_date: "", location: "", price_individual: 0, price_group: 0, capacity: 30, registered: 0, image_url: "", is_published: false }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />新增沙龙
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" /><p className="text-muted-foreground">加载中...</p></div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-muted-foreground">暂无沙龙活动，点击"新增沙龙"开始创建</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">图片</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">活动名称</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">日期</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">地点</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">报名/容量</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">状态</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {event.image_url ? <img src={event.image_url} alt={event.title} className="w-12 h-12 object-cover rounded-lg" /> : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><Calendar className="w-5 h-5 text-gray-400" /></div>}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">{event.title}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{event.event_date}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{event.location}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-medium text-accent">{event.registered}</span>
                    <span className="text-muted-foreground">/{event.capacity}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(event)} className={`inline-flex items-center gap-1 px-[10px] py-[2px] rounded-full text-xs font-medium transition-colors ${event.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {event.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(event)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-primary">{editing ? "编辑沙龙" : "新增沙龙"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">活动名称 <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-[10px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="如：春季色彩搭配沙龙" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">活动日期 <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} className="w-full px-4 py-[10px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">活动地点</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-[10px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="如：深圳市南山区" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">活动描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-[10px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="输入活动描述" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">个人价格（元）</label>
                  <input type="number" value={formData.price_individual} onChange={(e) => setFormData({ ...formData, price_individual: parseInt(e.target.value) || 0 })} className="w-full px-4 py-[10px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">团体价格（元）</label>
                  <input type="number" value={formData.price_group} onChange={(e) => setFormData({ ...formData, price_group: parseInt(e.target.value) || 0 })} className="w-full px-4 py-[10px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">容量（人数）</label>
                  <input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 30 })} className="w-full px-4 py-[10px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="30" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">活动封面</label>
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
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editing ? "保存修改" : "新增沙龙"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
