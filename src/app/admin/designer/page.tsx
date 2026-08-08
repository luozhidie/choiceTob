"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, Pencil, Trash2, Upload, Save, X, Eye, EyeOff, Loader2, Palette, Sparkles,
} from "lucide-react";

interface DesignerPackage {
  id: string;
  name: string;
  description: string;
  features: string;
  price_individual: number;
  price_group: number;
  image_url: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export default function AdminDesignerPage() {
  const [packages, setPackages] = useState<DesignerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DesignerPackage | null>(null);
  const [formData, setFormData] = useState({
    name: "", description: "", features: "", price_individual: 0, price_group: 0, image_url: "", is_published: false, sort_order: 0,
  });
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  // ── AI 爆款改款 ──
  const [showAI, setShowAI] = useState(false);
  const [aiForm, setAiForm] = useState({ productDesc: "", category: "", refStyle: "", color: "", fabric: "", season: "" });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState("");

  const runAI = async () => {
    if (!aiForm.productDesc && !aiForm.category) { alert("请填写爆款描述或品类"); return; }
    setAiLoading(true); setAiError(""); setAiResult(null);
    try {
      const res = await fetch("/api/ai/designer-redesign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(aiForm),
      });
      const d = await res.json();
      if (!res.ok) { setAiError(d.error || "生成失败"); return; }
      setAiResult(d.result);
    } catch (e: any) {
      setAiError("请求失败：" + (e.message || ""));
    } finally {
      setAiLoading(false);
    }
  };

  // 把 AI 结果保存为新套餐草稿
  const saveAsDraft = () => {
    if (!aiResult) return;
    const features = [
      ...(aiResult.colorOptions || []).map((x: string) => "换色：" + x),
      ...(aiResult.fabricOptions || []).map((x: string) => "换面料：" + x),
      ...(aiResult.silhouetteOptions || []).map((x: string) => "换版型：" + x),
      ...(aiResult.printOptions || []).map((x: string) => "印花：" + x),
      ...(aiResult.craftOptions || []).map((x: string) => "工艺：" + x),
    ].join("\n");
    setFormData({
      name: aiResult.name || "AI 改款草稿",
      description: (aiResult.summary || "") + (aiResult.targetPrice ? "　拿货价：" + aiResult.targetPrice : ""),
      features,
      price_individual: 0, price_group: 0, image_url: "", is_published: false, sort_order: 0,
    });
    setShowAI(false); setAiResult(null);
    setShowModal(true);
  };

  // 加载数据
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("designer_packages").select("*").order("sort_order", { ascending: true });
    if (error) console.error(error);
    else setPackages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 上传图片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("designer-images").upload(fileName, file);
    if (error) { alert("上传失败：" + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("designer-images").getPublicUrl(fileName);
    setFormData({ ...formData, image_url: data.publicUrl });
    setUploading(false);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from("designer_packages").update(formData).eq("id", editing.id);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("designer_packages").insert([formData]);
      if (error) { alert("创建失败：" + error.message); return; }
    }
    setShowModal(false); setEditing(null);
    setFormData({ name: "", description: "", features: "", price_individual: 0, price_group: 0, image_url: "", is_published: false, sort_order: 0 });
    fetchData();
  };

  // 编辑
  const handleEdit = (pkg: DesignerPackage) => {
    setEditing(pkg);
    setFormData({ name: pkg.name, description: pkg.description || "", features: pkg.features || "", price_individual: pkg.price_individual || 0, price_group: pkg.price_group || 0, image_url: pkg.image_url || "", is_published: pkg.is_published, sort_order: pkg.sort_order || 0 });
    setShowModal(true);
  };

  // 删除
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个套餐吗？")) return;
    const res = await fetch("/api/admin/common/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, table: "designer_packages" }),
    });
    const json = await res.json();
    if (json.error) { alert("删除失败：" + json.error); return; }
    fetchData();
  };

  // 切换发布状态
  const togglePublish = async (pkg: DesignerPackage) => {
    const { error } = await supabase.from("designer_packages").update({ is_published: !pkg.is_published }).eq("id", pkg.id);
    if (error) { alert("操作失败：" + error.message); return; }
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">爆款样衣管理</h1>
          <p className="text-muted-foreground mt-1">管理爆款样衣服务套餐</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAI(true)} className="btn-secondary flex items-center gap-2">
            <Sparkles className="w-4 h-4" />AI 爆款改款
          </button>
          <button onClick={() => { setEditing(null); setFormData({ name: "", description: "", features: "", price_individual: 0, price_group: 0, image_url: "", is_published: false, sort_order: 0 }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />新增套餐
          </button>
        </div>
      </div>

      {showAI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" />AI 爆款改款</h2>
              <button onClick={() => { setShowAI(false); setAiResult(null); setAiError(""); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {!aiResult ? (
              <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">输入一个爆款，AI 给出换色 / 换面料 / 换版型 / 印花 / 工艺 5 个方向的改款建议，可一键存为套餐草稿。</p>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">爆款描述 <span className="text-red-500">*</span></label>
                  <textarea value={aiForm.productDesc} onChange={(e) => setAiForm({ ...aiForm, productDesc: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none" placeholder="如：法式碎花茶歇连衣裙，收腰显瘦，浅色系" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">品类</label>
                    <input value={aiForm.category} onChange={(e) => setAiForm({ ...aiForm, category: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="连衣裙 / 卫衣 / 衬衫" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">参考风格</label>
                    <input value={aiForm.refStyle} onChange={(e) => setAiForm({ ...aiForm, refStyle: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="法式 / 韩系 / 通勤" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">希望主色</label>
                    <input value={aiForm.color} onChange={(e) => setAiForm({ ...aiForm, color: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="自由发挥留空" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">希望面料</label>
                    <input value={aiForm.fabric} onChange={(e) => setAiForm({ ...aiForm, fabric: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="自由发挥留空" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">季节</label>
                  <input value={aiForm.season} onChange={(e) => setAiForm({ ...aiForm, season: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="2026 春夏" />
                </div>
                {aiError && <p className="text-sm text-red-600">{aiError}</p>}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button onClick={() => { setShowAI(false); }} className="btn-secondary">取消</button>
                  <button onClick={runAI} disabled={aiLoading} className="btn-primary flex items-center gap-2">
                    {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" />生成中...</> : <><Sparkles className="w-4 h-4" />生成改款方案</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                  <p className="text-sm font-semibold text-primary mb-1">{aiResult.name}</p>
                  <p className="text-sm text-muted-foreground">{aiResult.summary}</p>
                  {aiResult.targetPrice && <p className="text-sm text-accent mt-2 font-medium">建议拿货价：{aiResult.targetPrice}</p>}
                </div>
                {[
                  { title: "换色方案", items: aiResult.colorOptions },
                  { title: "换面料方案", items: aiResult.fabricOptions },
                  { title: "换版型 / 廓形", items: aiResult.silhouetteOptions },
                  { title: "印花 / 图案", items: aiResult.printOptions },
                  { title: "工艺升级", items: aiResult.craftOptions },
                ].map((g) => (
                  <div key={g.title}>
                    <h3 className="text-sm font-semibold text-primary mb-2">{g.title}</h3>
                    <ul className="space-y-1">
                      {(g.items || []).map((it: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-accent mt-0.5">•</span><span>{it}</span></li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => { setAiResult(null); }} className="btn-secondary">返回重填</button>
                  <button onClick={saveAsDraft} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />存为套餐草稿</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" /><p className="text-muted-foreground">加载中...</p></div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100"><Palette className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-muted-foreground">暂无套餐，点击"新增套餐"开始创建</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">图片</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">套餐名称</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">个人价</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">团体价</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">排序</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">状态</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {pkg.image_url ? <img src={pkg.image_url} alt={pkg.name} className="w-12 h-12 object-cover rounded-lg" /> : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><Palette className="w-5 h-5 text-gray-400" /></div>}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">{pkg.name}</td>
                  <td className="px-6 py-4 text-sm">¥{pkg.price_individual}</td>
                  <td className="px-6 py-4 text-sm">¥{pkg.price_group}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{pkg.sort_order}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(pkg)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${pkg.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {pkg.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(pkg)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(pkg.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-primary">{editing ? "编辑套餐" : "新增套餐"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">套餐名称 <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="如：品牌全案设计套餐" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">套餐描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="输入套餐描述" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">包含服务（每行一项）</label>
                <textarea value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="品牌定位分析&#10;色彩方案设计&#10;款式开发指导" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">个人价格（元）</label>
                  <input type="number" value={formData.price_individual} onChange={(e) => setFormData({ ...formData, price_individual: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">团体价格（元）</label>
                  <input type="number" value={formData.price_group} onChange={(e) => setFormData({ ...formData, price_group: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">排序（数字越小越靠前）</label>
                <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">套餐封面</label>
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
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editing ? "保存修改" : "新增套餐"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
