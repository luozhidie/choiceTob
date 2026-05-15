"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Loader2,
  Crown,
} from "lucide-react";

interface VipTier {
  id: string;
  name: string;
  price: number;
  benefits: string;
  is_published: boolean;
  created_at: string;
}

export default function AdminVipPage() {
  const [tiers, setTiers] = useState<VipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTier, setEditingTier] = useState<VipTier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    benefits: "",
    is_published: false,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchTiers();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
    }
  };

  const fetchTiers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vip_tiers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tiers:", error);
    } else {
      setTiers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTier) {
      const { error } = await supabase
        .from("vip_tiers")
        .update(formData)
        .eq("id", editingTier.id);

      if (error) {
        alert("更新失败：" + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("vip_tiers")
        .insert([formData]);

      if (error) {
        alert("创建失败：" + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingTier(null);
    setFormData({ name: "", price: 0, benefits: "", is_published: false });
    fetchTiers();
  };

  const handleEdit = (tier: VipTier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      price: tier.price || 0,
      benefits: tier.benefits || "",
      is_published: tier.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个VIP等级吗？")) return;

    const { error } = await supabase
      .from("vip_tiers")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
      return;
    }

    fetchTiers();
  };

  const togglePublish = async (tier: VipTier) => {
    const { error } = await supabase
      .from("vip_tiers")
      .update({ is_published: !tier.is_published })
      .eq("id", tier.id);

    if (error) {
      alert("操作失败：" + error.message);
      return;
    }

    fetchTiers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">VIP管理</h1>
          <p className="text-muted-foreground mt-1">管理VIP等级与权益</p>
        </div>
        <button
          onClick={() => {
            setEditingTier(null);
            setFormData({ name: "", price: 0, benefits: "", is_published: false });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增等级
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : tiers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Crown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无VIP等级，点击"新增等级"开始设置</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">等级名称</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">价格</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">权益</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tiers.map((tier) => (
                <tr key={tier.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">{tier.name}</td>
                  <td className="px-6 py-4 text-sm">{tier.price > 0 ? `¥${tier.price}` : "免费"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">{tier.benefits}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(tier)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${tier.is_published ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}>
                      {tier.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(tier)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="编辑"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(tier.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-primary">{editingTier ? "编辑等级" : "新增等级"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">等级名称 <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="如：黄金会员" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">年费价格（元）</label>
                <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0=免费" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">会员权益</label>
                <textarea value={formData.benefits} onChange={(e) => setFormData({ ...formData, benefits: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="输入会员权益，用换行分隔" />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_published" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="w-4 h-4 text-accent focus:ring-accent rounded" />
                <label htmlFor="is_published" className="text-sm font-medium text-primary cursor-pointer">立即发布</label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingTier ? "保存修改" : "新增等级"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
