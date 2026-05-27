"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FEMALE_STYLES, MALE_STYLES, getStyleProLabel } from "@/lib/styles";
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
  BarChart3,
} from "lucide-react";

interface HotPick {
  id: string;
  name: string;
  description: string | null;
  style: string;
  price: number;
  inventory: string;
  image_url: string;
  is_published: boolean;
  created_at: string;
}

export default function AdminHotPicksPage() {
  const [hotPicks, setHotPicks] = useState<HotPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPick, setEditingPick] = useState<HotPick | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    style: "",
    price: 0,
    inventory: "充足",
    image_url: "",
    is_published: false,
  });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchHotPicks();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
    }
  };

  const fetchHotPicks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hot_picks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching hot picks:", error);
    } else {
      setHotPicks(data || []);
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
      .from("hot-picks-images")
      .upload(fileName, file);

    if (uploadError) {
      alert("上传失败：" + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("hot-picks-images")
      .getPublicUrl(fileName);

    setFormData({ ...formData, image_url: data.publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPick) {
      const { error } = await supabase
        .from("hot_picks")
        .update(formData)
        .eq("id", editingPick.id);

      if (error) {
        alert("更新失败：" + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("hot_picks")
        .insert([formData]);

      if (error) {
        alert("创建失败：" + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingPick(null);
    setFormData({ name: "", description: "", style: "", price: 0, inventory: "充足", image_url: "", is_published: false });
    fetchHotPicks();
  };

  const handleEdit = (pick: HotPick) => {
    setEditingPick(pick);
    setFormData({
      name: pick.name,
      description: pick.description || "",
      style: pick.style || "",
      price: pick.price || 0,
      inventory: pick.inventory || "充足",
      image_url: pick.image_url || "",
      is_published: pick.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个爆款吗？")) return;

    const { error } = await supabase
      .from("hot_picks")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
      return;
    }

    fetchHotPicks();
  };

  const togglePublish = async (pick: HotPick) => {
    const { error } = await supabase
      .from("hot_picks")
      .update({ is_published: !pick.is_published })
      .eq("id", pick.id);

    if (error) {
      alert("操作失败：" + error.message);
      return;
    }

    fetchHotPicks();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">爆款货盘管理</h1>
          <p className="text-muted-foreground mt-1">上传和管理爆款商品</p>
        </div>
        <button
          onClick={() => {
            setEditingPick(null);
            setFormData({ name: "", description: "", style: "", price: 0, inventory: "充足", image_url: "", is_published: false });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增爆款
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : hotPicks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无爆款数据，点击"新增爆款"开始上传</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">图片</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">名称</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">风格</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">价格</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">库存</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hotPicks.map((pick) => (
                <tr key={pick.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {pick.image_url ? (
                      <img src={pick.image_url} alt={pick.name} className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">{pick.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{getStyleProLabel(pick.style) || pick.style}</td>
                  <td className="px-6 py-4 text-sm">¥{pick.price}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      pick.inventory === "充足" ? "bg-green-100 text-green-700" :
                      pick.inventory === "紧张" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>{pick.inventory}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(pick)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${pick.is_published ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}>
                      {pick.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(pick)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="编辑"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(pick.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-primary">{editingPick ? "编辑爆款" : "新增爆款"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">商品名称 <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="输入商品名称" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">商品详情</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="填写商品详细信息、卖点描述..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">风格</label>
                  <select value={formData.style} onChange={(e) => setFormData({ ...formData, style: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors">
                    <option value="">请选择</option>
                    <optgroup label="── 女士八大风格 ──">
                      {FEMALE_STYLES.map(s => <option key={s.value} value={s.value}>{s.proLabel}</option>)}
                    </optgroup>
                    <optgroup label="── 男士五大风格 ──">
                      {MALE_STYLES.map(s => <option key={s.value} value={s.value}>{s.proLabel}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">价格（元）</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">库存状态</label>
                <div className="flex gap-3">
                  {["充足", "紧张", "缺货"].map((status) => (
                    <button key={status} type="button" onClick={() => setFormData({ ...formData, inventory: status })} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.inventory === status ? "bg-accent text-primary" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{status}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">商品图片</label>
                {formData.image_url ? (
                  <div className="relative inline-block">
                    <img src={formData.image_url} alt="预览" className="w-32 h-32 object-cover rounded-lg" />
                    <button type="button" onClick={() => setFormData({ ...formData, image_url: "" })} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-muted-foreground">{uploading ? "上传中..." : "上传图片"}</span>
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
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingPick ? "保存修改" : "新增爆款"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
