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
  Search,
} from "lucide-react";

interface BuyerProduct {
  id: string;
  name: string;
  style: string;
  color: string;
  price: number;
  score: number;
  market_heat: string;
  image_url: string;
  is_published: boolean;
  created_at: string;
}

export default function AdminBuyerPage() {
  const [products, setProducts] = useState<BuyerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BuyerProduct | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    style: "",
    color: "",
    price: 0,
    score: 80,
    market_heat: "中",
    image_url: "",
    is_published: false,
  });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchProducts();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("buyer_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data || []);
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
      .from("buyer-images")
      .upload(fileName, file);

    if (uploadError) {
      alert("上传失败：" + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("buyer-images")
      .getPublicUrl(fileName);

    setFormData({ ...formData, image_url: data.publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      const { error } = await supabase
        .from("buyer_products")
        .update(formData)
        .eq("id", editingProduct.id);

      if (error) {
        alert("更新失败：" + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("buyer_products")
        .insert([formData]);

      if (error) {
        alert("创建失败：" + error.message);
        return;
      }
    }

    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      style: "",
      color: "",
      price: 0,
      score: 80,
      market_heat: "中",
      image_url: "",
      is_published: false,
    });
    fetchProducts();
  };

  const handleEdit = (product: BuyerProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      style: product.style || "",
      color: product.color || "",
      price: product.price || 0,
      score: product.score || 80,
      market_heat: product.market_heat || "中",
      image_url: product.image_url || "",
      is_published: product.is_published,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个选品吗？")) return;

    const { error } = await supabase
      .from("buyer_products")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
      return;
    }

    fetchProducts();
  };

  const togglePublish = async (product: BuyerProduct) => {
    const { error } = await supabase
      .from("buyer_products")
      .update({ is_published: !product.is_published })
      .eq("id", product.id);

    if (error) {
      alert("操作失败：" + error.message);
      return;
    }

    fetchProducts();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">买手选品管理</h1>
          <p className="text-muted-foreground mt-1">上传和管理选品数据</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: "",
              style: "",
              color: "",
              price: 0,
              score: 80,
              market_heat: "中",
              image_url: "",
              is_published: false,
            });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增选品
        </button>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无选品数据，点击"新增选品"开始上传</p>
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
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">评分</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">热度</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Search className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{product.style}</td>
                  <td className="px-6 py-4 text-sm">¥{product.price}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-accent">{product.score}分</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      product.market_heat === "高" ? "bg-red-100 text-red-700" :
                      product.market_heat === "中" ? "bg-amber-100 text-amber-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {product.market_heat}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePublish(product)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        product.is_published
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {product.is_published ? <><Eye className="w-3 h-3" />已发布</> : <><EyeOff className="w-3 h-3" />草稿</>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(product)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="编辑">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除">
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
              <h2 className="text-lg font-bold text-primary">{editingProduct ? "编辑选品" : "新增选品"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">选品名称 <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="输入选品名称" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">风格</label>
                  <input type="text" value={formData.style} onChange={(e) => setFormData({ ...formData, style: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="如：法式优雅" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">颜色</label>
                  <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="如：米白色" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">价格（元）</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">评分（0-100）</label>
                  <input type="number" min="0" max="100" value={formData.score} onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="80" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">市场热度</label>
                  <select value={formData.market_heat} onChange={(e) => setFormData({ ...formData, market_heat: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors">
                    <option value="高">高</option>
                    <option value="中">中</option>
                    <option value="低">低</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">选品图片</label>
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
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingProduct ? "保存修改" : "新增选品"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
