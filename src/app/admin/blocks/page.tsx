"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Edit3,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  Save,
  X,
  LayoutGrid,
  ShoppingBag,
  Users,
  Flame,
  Gift,
  Tag,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Grid3X3,
  CircleDot,
  ImageIcon,
  Image,
  ListFilter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Block {
  id: string;
  title: string;
  type: "products" | "promotion" | "custom" | "group_buy" | "flash_sale" | "recommendation" | "featured_banner"
    | "card_single" | "card_quad" | "circle_row" | "banner_large" | "banner_small" | "category_nav";
  content?: Record<string, any>;
  style?: {
    bgColor?: string;
    textColor?: string;
    padding?: number;
    borderRadius?: number;
  };
  section_title?: string | null;
  section_subtitle?: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const BLOCK_TYPES = [
  { value: "products", label: "商品展示", icon: ShoppingBag, description: "展示特定分类或推荐商品" },
  { value: "promotion", label: "营销活动", icon: Flame, description: "限时优惠、满减活动等" },
  { value: "custom", label: "自定义内容", icon: Tag, description: "富文本/图片/视频等自由内容" },
  { value: "group_buy", label: "团购拼单", icon: Users, description: "团购活动，多人拼单优惠" },
  { value: "flash_sale", label: "限时秒杀", icon: Clock, description: "倒计时秒杀活动" },
  { value: "recommendation", label: "智能推荐", icon: Star, description: "基于用户偏好的个性化推荐" },
  { value: "featured_banner", label: "精选横幅", icon: Gift, description: "大图+3小图，可跳转买手选品或商品" },
  { value: "card_single", label: "单格卡片", icon: LayoutGrid, description: "一张大图+标题+按钮（好评档口榜等）" },
  { value: "card_quad", label: "四宫格卡片", icon: Grid3X3, description: "4张卡片横排，每张含图+标题+副标题+链接" },
  { value: "circle_row", label: "圆形卡片行", icon: CircleDot, description: "圆形头像/品牌图+文字标签（十三行、沙河等）" },
  { value: "banner_large", label: "大横幅", icon: ImageIcon, description: "全宽大图Banner（新客指南、周年庆等）" },
  { value: "banner_small", label: "小横幅", icon: Image, description: "较小尺寸的横幅Banner（满减提示等）" },
  { value: "category_nav", label: "分类目录", icon: ListFilter, description: "横向标签导航栏（全部、十三行、24h发货等）" },
];

const DEFAULT_STYLES = {
  bgColor: "#ffffff",
  textColor: "#333333",
  padding: 16,
  borderRadius: 12,
};

/* ===== 商品选择器组件 ===== */
function ProductPicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const selectedIds = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

  // 加载商品列表
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/admin/products-data?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) setProducts(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // 过滤
  const filtered = products.filter(
    (p) =>
      !selectedIds.includes(p.id) &&
      (p.title || p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onChange(next.join(","));
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 已选商品 */}
      {selectedProducts.length > 0 && (
        <div className="p-2 bg-gray-50 flex flex-wrap gap-2 min-h-[44px]">
          {selectedProducts.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md text-xs"
            >
              {p.name || p.title || "商品"}
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className="text-gray-400 hover:text-red-500 ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 搜索 + 展开 */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          {selectedIds.length > 0
            ? `已选 ${selectedIds.length} 件，点击继续添加`
            : "点击选择商品"}
        </button>
      ) : (
        <div className="border-t border-gray-200">
          {/* 搜索框 */}
          <div className="px-3 pt-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索商品名称..."
              className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:border-primary outline-none mb-2"
              autoFocus
            />
          </div>

          {/* 商品列表 */}
          <div className="max-h-[220px] overflow-y-auto px-3 pb-2 space-y-1">
            {loading ? (
              <div className="py-6 text-center text-xs text-gray-400">加载中...</div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">没有更多可选商品</div>
            ) : (
              filtered.slice(0, 30).map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggle(p.id)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {p.image_url || p.cover_image ? (
                    <img
                      src={p.image_url || p.cover_image}
                      alt=""
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">图</div>
                  )}
                  <span className="flex-1 truncate">{p.name || p.title || "商品"}</span>
                  <span className="text-[10px] text-gray-400">¥{(p.price || 0) / 100}</span>
                </label>
              ))
            )}
          </div>

          {/* 底部操作栏 */}
          <div className="px-3 py-2 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-[11px] text-gray-500">已选 {selectedIds.length} 件</span>
            <button
              type="button"
              onClick={() => { setOpen(false); setSearch(""); }}
              className="px-3 py-1 text-xs font-medium text-primary hover:bg-primary/5 rounded"
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== 图片上传组件 ===== */
function BlockImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputId = "block-img-upload-" + Math.random().toString(36).slice(2, 8);

  const doUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { alert("请选择图片文件"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("图片不能超过 5MB"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const json = await res.json();
      if (json.success && json.url) {
        onChange(json.url);
      } else {
        alert("上传失败：" + (json.error || "未知错误"));
      }
    } catch (err: any) {
      alert("上传失败：" + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
  };

  return (
    <div>
      {/* 预览 */}
      {value && (
        <div className="mb-2 relative group">
          <img src={value} alt="" className="w-full h-auto rounded-lg border border-gray-200" />
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => document.getElementById(inputId)?.click()}
              className="bg-primary text-white w-6 h-6 rounded-full text-xs font-bold"
              title="更换图片"
            >✎</button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-black/50 text-white w-6 h-6 rounded-full text-xs"
              title="删除"
            >×</button>
          </div>
        </div>
      )}
      {/* 上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-gray-300"} ${value ? "mt-2" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) doUpload(f); }}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        {uploading ? (
          <div className="py-2"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /></div>
        ) : (
          <>
            <p className="text-xs text-gray-500">{value ? "点击更换图片" : "点击或拖拽上传图片"}</p>
            {!value && <p className="text-[10px] text-gray-400 mt-1">JPG/PNG/WEBP，≤5MB</p>}
          </>
        )}
        <input id={inputId} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

export default function BlocksAdminPage() {
  const supabase = createClient();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [saving, setSaving] = useState(false);

  // 表单状态
  const [form, setForm] = useState({
    title: "",
    type: "products" as Block["type"],
    content: {} as Record<string, any>,
    style: { ...DEFAULT_STYLES } as Block["style"],
    section_title: "",
    section_subtitle: "",
    is_published: true,
  });

  // 加载版块列表
  const fetchBlocks = async () => {
    try {
      setLoading(true);
      // 使用后端API获取（绕过RLS）
      const res = await fetch("/api/admin/page-blocks", { credentials: "include" });
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setBlocks(json.data);
      } else {
        setBlocks(getDefaultBlocks());
      }
    } catch (error) {
      console.error("[加载版块异常]", error);
      setBlocks(getDefaultBlocks());
    } finally {
      setLoading(false);
    }
  };

  // 默认示例数据（当数据库为空时）
  const getDefaultBlocks = (): Block[] => [
    {
      id: "demo-1",
      title: "爆款选品",
      type: "products",
      content: { category: "hot_picks", layout: "grid", columns: 4 },
      style: { ...DEFAULT_STYLES, bgColor: "#fef3c7" },
      is_published: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-2",
      title: "限时秒杀",
      type: "flash_sale",
      content: { duration: 3600, discount: 0.7 },
      style: { ...DEFAULT_STYLES, bgColor: "#fee2e2" },
      is_published: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-3",
      title: "团购拼单",
      type: "group_buy",
      content: { minPeople: 3, maxDiscount: 0.8 },
      style: { ...DEFAULT_STYLES, bgColor: "#dbeafe" },
      is_published: false,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    fetchBlocks();
  }, []);

  // 打开新建表单
  const handleNewBlock = () => {
    setEditingBlock(null);
    setForm({
      title: "",
      type: "products",
      content: {},
      style: { ...DEFAULT_STYLES },
      is_published: true,
    });
    setShowForm(true);
  };

  // 打开编辑表单
  const handleEditBlock = (block: Block) => {
    setEditingBlock(block);
    setForm({
      title: block.title,
      type: block.type || "products",
      content: block.content || {},
      style: block.style || { ...DEFAULT_STYLES },
      section_title: block.section_title || "",
      section_subtitle: block.section_subtitle || "",
      is_published: block.is_published,
    });
    setShowForm(true);
  };

  // 保存版块
  const handleSave = async () => {
    if (!form.type) return;

    setSaving(true);
    try {
      const blockData = {
        id: editingBlock?.id,
        title: form.title,
        type: form.type,
        content: form.content,
        style: form.style,
        section_title: form.section_title || null,
        section_subtitle: form.section_subtitle || null,
        is_published: form.is_published,
        sort_order: editingBlock ? editingBlock.sort_order : blocks.length + 1,
        updated_at: new Date().toISOString(),
      };

      // 使用后端API保存（绕过RLS）
      const res = await fetch("/api/admin/page-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(blockData),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      // 刷新列表
      await fetchBlocks();
      setShowForm(false);
    } catch (error: any) {
      console.error("[保存版块失败]", error);
      alert("保存失败：" + error.message);
    } finally {
      setSaving(false);
    }
  };

  // 删除版块
  const handleDelete = async (blockId: string) => {
    if (!confirm("确定要删除这个版块吗？")) return;

    try {
      const res = await fetch("/api/admin/common/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: blockId, table: "page_blocks" }),
      });
      const json = await res.json();
      if (json.error) {
        alert("删除失败：" + json.error);
        return;
      }
      await fetchBlocks();
    } catch (error) {
      console.error("[删除版块失败]", error);
      alert("删除失败，请稍后重试");
    }
  };

  // 调整排序
  const moveBlock = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];

    // 更新sort_order
    newBlocks.forEach((block, i) => (block.sort_order = i + 1));
    setBlocks(newBlocks);

    // 保存到数据库（使用后端API）
    try {
      await fetch("/api/admin/page-blocks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_sort",
          items: newBlocks.map(b => ({ id: b.id, sort_order: b.sort_order })),
        }),
      });
    } catch (error) {
      console.error("[更新排序失败]", error);
    }
  };

  // 切换发布状态
  const togglePublish = async (block: Block) => {
    const newStatus = !block.is_published;
    try {
      await fetch("/api/admin/page-blocks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: block.id, action: "toggle_publish" }),
      });

      setBlocks((prev) =>
        prev.map((b) => (b.id === block.id ? { ...b, is_published: newStatus } : b))
      );
    } catch (error) {
      console.error("[切换发布状态失败]", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <LayoutGrid className="w-7 h-7 text-primary" />
              版块管理器
            </h1>
            <p className="text-gray-500 mt-2">
              自定义网站首页版块布局，支持添加团购、秒杀等活动板块
            </p>
          </div>
          <button
            onClick={handleNewBlock}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            添加新版块
          </button>
        </div>

        {/* 版块列表 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                  block.is_published ? "border-gray-200" : "border-gray-200 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between p-4">
                  {/* 左侧：拖拽+类型图标+信息 */}
                  <div className="flex items-center gap-4 flex-1">
                    <GripVertical className="w-5 h-5 text-gray-300 cursor-move" />

                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: block.style?.bgColor || "#f3f4f6",
                        color: block.style?.textColor || "#374151",
                      }}
                    >
                      {(() => {
                        const IconComp = BLOCK_TYPES.find((t) => t.value === block.type)?.icon || Tag;
                        return <IconComp className="w-5 h-5" />;
                      })()}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{block.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {BLOCK_TYPES.find((t) => t.value === block.type)?.label ||
                            block.type}
                        </span>
                        {!block.is_published && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            已下架
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        排序：#{block.sort_order} · 创建于{" "}
                        {new Date(block.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* 右侧：操作按钮 */}
                  <div className="flex items-center gap-2">
                    {/* 排序调整 */}
                    <button
                      onClick={() => moveBlock(index, "up")}
                      disabled={index === 0}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                      title="上移"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveBlock(index, "down")}
                      disabled={index === blocks.length - 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                      title="下移"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* 发布切换 */}
                    <button
                      onClick={() => togglePublish(block)}
                      className={`p-2 rounded-lg transition-colors ${
                        block.is_published
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-yellow-50"
                      }`}
                      title={block.is_published ? "点击下架" : "点击发布"}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* 编辑 */}
                    <button
                      onClick={() => handleEditBlock(block)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* 删除 */}
                    <button
                      onClick={() => handleDelete(block.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {blocks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无版块</p>
                <p className="text-sm text-gray-400 mt-1">点击上方"添加新版块"开始创建</p>
              </div>
            )}
          </div>
        )}

        {/* 新建/编辑弹窗 */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingBlock ? "编辑版块" : "新建版块"}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* 基本信息 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      版块名称（选填）
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="如：爆款选品、团购拼单..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  {/* 板块标题（首页显示） */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        板块大标题（可选）
                      </label>
                      <input
                        type="text"
                        value={form.section_title}
                        onChange={(e) => setForm({ ...form, section_title: e.target.value })}
                        placeholder="如：今日特惠"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        板块小标题（可选）
                      </label>
                      <input
                        type="text"
                        value={form.section_subtitle}
                        onChange={(e) => setForm({ ...form, section_subtitle: e.target.value })}
                        placeholder="如：限时限量，先到先得"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* 版块类型选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      版块类型 *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {BLOCK_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setForm({ ...form, type: type.value as any })}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            form.type === type.value
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <type.icon className="w-5 h-5 mb-1.5" />
                          <div className="font-medium text-sm text-gray-900">
                            {type.label}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {type.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 内容配置 - 根据类型动态渲染 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      内容配置
                    </label>

                    {/* 展示位置（所有类型通用） */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl mb-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">展示位置 *</label>
                        <select
                          value={(form.content as any)?.position || "product_bottom"}
                          onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), position: e.target.value } as any })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none bg-white"
                        >
                          <option value="hero_bottom">轮播图下方</option>
                          <option value="product_top">商品列表上方</option>
                          <option value="product_bottom">商品列表下方</option>
                          <option value="buyer_page">买手选品页</option>
                          <option value="footer_top">底部上方</option>
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1">选择该版块在首页或买手选品页的展示位置</p>
                      </div>
                    </div>

                    {/* products 商品展示 */}
                    {form.type === "products" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">商品分类</label>
                          <select
                            value={(form.content as any)?.category || ""}
                            onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), category: e.target.value || undefined } as any })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none bg-white"
                          >
                            <option value="">全部分类</option>
                            <option value="hot_picks">爆款选品</option>
                            <option value="new_arrivals">新品上架</option>
                            <option value="sale">折扣专区</option>
                            <option value="clothing">服装</option>
                            <option value="accessories">配饰</option>
                            <option value="shoes">鞋靴</option>
                            <option value="lingerie">内衣</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">布局方式</label>
                          <div className="flex gap-2">
                            {["grid", "waterfall", "carousel"].map(layout => (
                              <button
                                key={layout}
                                type="button"
                                onClick={() => setForm({ ...form, content: { ...(form.content as object || {}), layout } as any })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${((form.content as any)?.layout || "grid") === layout ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-primary"}`}
                              >
                                {{ grid: "网格", waterfall: "瀑布流", carousel: "轮播" }[layout]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-gray-500">每行</label>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={(form.content as any)?.columns || 4}
                            onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), columns: parseInt(e.target.value) || 4 } as any })}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:border-primary outline-none"
                          />
                          <label className="text-xs text-gray-500">列</label>
                        </div>
                        {/* 版块宣传横幅图 */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">版块宣传横幅（可选，显示在商品上方）</label>
                          <BlockImageUpload
                            value={(form.content as any)?.promoBanner || ""}
                            onChange={(url) => setForm({ ...form, content: { ...(form.content as object || {}), promoBanner: url } as any })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">选择商品（可选）</label>
                          <ProductPicker
                            value={(form.content as any)?.productIds || ""}
                            onChange={(val: string) => setForm({ ...form, content: { ...(form.content as object || {}), productIds: val } as any })}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">不选则自动按分类加载；选中后只显示这些商品</p>
                        </div>
                      </div>
                    )}

                    {/* group_buy 团购拼单 */}
                    {form.type === "group_buy" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">活动描述</label>
                          <input
                            type="text"
                            value={(form.content as any)?.desc || ""}
                            onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), desc: e.target.value } as any })}
                            placeholder="如：满5人成团，超值优惠"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                          />
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">最低人数</label>
                            <input
                              type="number"
                              min={2}
                              value={(form.content as any)?.minPeople || 3}
                              onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), minPeople: parseInt(e.target.value) || 3 } as any })}
                              className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:border-primary outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">折扣（0.1-1）</label>
                            <input
                              type="number"
                              min={0.1}
                              max={1}
                              step={0.1}
                              value={(form.content as any)?.discount || 0.8}
                              onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), discount: parseFloat(e.target.value) || 0.8 } as any })}
                              className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:border-primary outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">挂载商品（可选）</label>
                          <ProductPicker
                            value={(form.content as any)?.productIds || ""}
                            onChange={(val: string) => setForm({ ...form, content: { ...(form.content as object || {}), productIds: val } as any })}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">选中的商品将显示在团购卡片下方</p>
                        </div>
                      </div>
                    )}

                    {/* flash_sale 限时秒杀 */}
                    {form.type === "flash_sale" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">活动描述</label>
                          <input
                            type="text"
                            value={(form.content as any)?.desc || ""}
                            onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), desc: e.target.value } as any })}
                            placeholder="如：每日10点准时开抢"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                          />
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">活动时长（秒）</label>
                            <input
                              type="number"
                              min={60}
                              value={(form.content as any)?.duration || 3600}
                              onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), duration: parseInt(e.target.value) || 3600 } as any })}
                              className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:border-primary outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">折扣（0.1-1）</label>
                            <input
                              type="number"
                              min={0.1}
                              max={1}
                              step={0.1}
                              value={(form.content as any)?.discount || 0.7}
                              onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), discount: parseFloat(e.target.value) || 0.7 } as any })}
                              className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:border-primary outline-none"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">⚠️ 商品关联功能开发中</p>
                      </div>
                    )}

                    {/* promotion 营销活动 / 宣传主题 */}
                    {form.type === "promotion" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">宣传标题 <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            value={(form.content as any)?.promoTitle || ""}
                            onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), promoTitle: e.target.value } as any })}
                            placeholder="如：新品首发 · 限时特惠"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">宣传描述</label>
                          <textarea
                            value={(form.content as any)?.promoDesc || ""}
                            onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), promoDesc: e.target.value } as any })}
                            placeholder="吸引人的活动文案..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none h-20 resize-y"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">封面图片</label>
                          <BlockImageUpload
                            value={(form.content as any)?.imageUrl || ""}
                            onChange={(url: string) => setForm({ ...form, content: { ...(form.content as object || {}), imageUrl: url } as any })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">按钮文字</label>
                            <input
                              type="text"
                              value={(form.content as any)?.buttonText || ""}
                              onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), buttonText: e.target.value } as any })}
                              placeholder="如：立即查看"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">跳转链接</label>
                            <input
                              type="text"
                              value={(form.content as any)?.linkUrl || ""}
                              onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), linkUrl: e.target.value } as any })}
                              placeholder="/buyer"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* custom 自定义内容（富编辑器 + 挂商品） */}
                    {form.type === "custom" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        {/* 富文本工具栏 */}
                        <div className="flex flex-wrap items-center gap-1 border border-gray-200 rounded-t-lg px-2 py-1.5 bg-white">
                          {[
                            { cmd: "bold", label: "B", title: "粗体" },
                            { cmd: "italic", label: "I", title: "斜体" },
                            { cmd: "underline", label: "U", title: "下划线" },
                          ].map(btn => (
                            <button key={btn.cmd} type="button" onClick={(e) => { e.preventDefault(); document.execCommand(btn.cmd, false, ""); }} title={btn.title} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-sm font-bold" style={{ fontStyle: btn.cmd === "italic" ? "italic" : "normal", textDecoration: btn.cmd === "underline" ? "underline" : "none" }}>{btn.label}</button>
                          ))}
                          <span className="w-px h-5 bg-gray-200 mx-1"></span>
                          <select onChange={(e) => document.execCommand("formatBlock", false, e.target.value)} className="h-7 text-xs border border-gray-200 rounded px-1">
                            <option value="">正文</option>
                            <option value="h2">标题H2</option>
                            <option value="h3">标题H3</option>
                          </select>
                          <span className="w-px h-5 bg-gray-200 mx-1"></span>
                          <label className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer" title="插入图片">
                            🖼️
                            <input type="file" accept="image/*" className="hidden" onChange={async(e) => {
                              const file = e.target.files?.[0]; if(!file)return;
                              const fd = new FormData(); fd.append("file",file);
                              const res = await fetch("/api/upload",{method:"POST",body:fd,credentials:"include"});
                              const json=await res.json();
                              if(json.success&&json.url){ document.execCommand("insertImage",false,json.url); }
                              e.target.value="";
                            }} />
                          </label>
                          <button type="button" onClick={() => {
                            const url = prompt("输入视频URL：");
                            if(url){
                              const html = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:8px 0"><iframe src="${url}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div><p></p>`;
                              document.execCommand("insertHTML", false, html);
                            }
                          }} title="插入视频(YouTube/Bilibili)" className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-sm">▶</button>
                          <button type="button" onClick={() => {
                            const url=prompt("输入链接URL:"),text=prompt("显示文字:");
                            if(url)document.execCommand("createLink",false,url);
                          }} title="插入链接" className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-sm">🔗</button>
                        </div>
                        {/* 编辑区 */}
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          dangerouslySetInnerHTML={{ __html: (form.content as any)?.html || "<p>在此编辑内容，支持文字、图片、视频混排...</p>" }}
                          onInput={(e) => setForm({ ...form, content: { ...(form.content as object || {}), html: (e.target as HTMLElement).innerHTML } as any })}
                          className="w-full min-h-[160px] px-3 py-3 border-x border-b border-gray-200 rounded-b-lg text-sm focus:border-primary focus:outline-none bg-white prose max-w-none"
                          style={{ minHeight: "160px" }}
                        />
                        {/* 挂载商品 */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">挂载商品（可选，显示在内容下方）</label>
                          <ProductPicker
                            value={(form.content as any)?.productIds || ""}
                            onChange={(val: string) => setForm({ ...form, content: { ...(form.content as object || {}), productIds: val } as any })}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">选中的商品将以卡片形式展示在自定义内容下方</p>
                        </div>
                      </div>
                    )}

                    {/* recommendation 智能推荐 */}
                    {form.type === "recommendation" && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400">🤖 智能推荐版块将根据用户浏览历史、购买偏好自动推荐商品，无需额外配置。</p>
                      </div>
                    )}

                    {/* featured_banner 精选横幅（大图+3小图） */}
                    {form.type === "featured_banner" && (
                      <div className="space-y-5 p-4 bg-gray-50 rounded-xl">
                        <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
                          📌 主横幅（大图）
                          <span className="font-normal text-gray-400">— 点击跳转到买手选品页</span>
                        </div>
                        <BlockImageUpload
                          value={(form.content as any)?.mainImage || ""}
                          onChange={(url: string) => setForm({ ...form, content: { ...(form.content as object || {}), mainImage: url } as any })}
                        />
                        <div>
                          <label className="block text-[11px] text-gray-500 mb-1">主图跳转链接</label>
                          <input
                            type="text"
                            value={(form.content as any)?.mainLink || ""}
                            onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), mainLink: e.target.value } as any })}
                            placeholder="/buyer"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                          />
                        </div>

                        <hr className="border-gray-200" />

                        <div className="text-xs font-semibold text-primary">📷 副图（3张小图，点击跳转商品）</div>

                        {[0, 1, 2].map((i) => {
          const subKey = `sub${i + 1}`;
          const defaults = (form.content as any) || {};
          return (
            <div key={subKey} className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">副图 {i + 1}</span>
                {(defaults[subKey]?.image || defaults[subKey]?.title || defaults[subKey]?.price) && (
                  <button
                    type="button"
                    onClick={() => {
                      const nc = { ...defaults };
                      delete nc[subKey];
                      setForm({ ...form, content: nc as any });
                    }}
                    className="text-[10px] text-red-500 hover:text-red-700"
                  >删除</button>
                )}
              </div>
              <BlockImageUpload
                value={(defaults[subKey] as any)?.image || ""}
                onChange={(url: string) => setForm({
                  ...form,
                  content: { ...defaults, [subKey]: { ...((defaults[subKey] as object) || {}), image: url } } as any
                })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={(defaults[subKey] as any)?.title || ""}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...defaults, [subKey]: { ...((defaults[subKey] as object) || {}), title: e.target.value } } as any
                  })}
                  placeholder={`副图${i+1}标题`}
                  className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none"
                />
                <input
                  type="text"
                  value={(defaults[subKey] as any)?.price || ""}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...defaults, [subKey]: { ...((defaults[subKey] as object) || {}), price: e.target.value } } as any
                  })}
                  placeholder="价格如 ¥99 或留空"
                  className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none"
                />
              </div>
              <input
                type="text"
                value={(defaults[subKey] as any)?.link || ""}
                onChange={(e) => setForm({
                  ...form,
                  content: { ...defaults, [subKey]: { ...((defaults[subKey] as object) || {}), link: e.target.value } } as any
                })}
                placeholder={`跳转链接，如 /shop/xxx`}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none"
              />
            </div>
          );
        }        )}

                      </div>
                    )}

                    {/* card_single 单格卡片 */}
                    {form.type === "card_single" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <BlockImageUpload
                          value={(form.content as any)?.image || ""}
                          onChange={(url: string) => setForm({ ...form, content: { ...(form.content as object || {}), image: url } as any })}
                        />
                        <input
                          type="text"
                          value={(form.content as any)?.title || ""}
                          onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), title: e.target.value } as any })}
                          placeholder="主标题，如：好评档口榜"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                        />
                        <input
                          type="text"
                          value={(form.content as any)?.subtitle || ""}
                          onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), subtitle: e.target.value } as any })}
                          placeholder="副标题，如：高评分店铺>"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={(form.content as any)?.buttonText || ""}
                            onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), buttonText: e.target.value } as any })}
                            placeholder="按钮文字"
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                          />
                          <input
                            type="text"
                            value={(form.content as any)?.link || ""}
                            onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), link: e.target.value } as any })}
                            placeholder="跳转链接 /buyer"
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* card_quad 四宫格 */}
                    {/* card_quad 四宫格 */}
                    {/* card_quad 四宫格 */}
                    {form.type === "card_quad" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        {[0,1,2,3].map((i) => {
                          const k = "card" + i;
                          const d = (form.content as any) || {};
                          return (
                            <div key={k} className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                                <span>Card {i+1}</span>
                                {(d[k]?.title || d[k]?.image) && (
                                  <button type="button" onClick={() => {
                                    const nc = { ...d }; delete nc[k]; setForm({ ...form, content: nc as any });
                                  }} className="text-red-500">X</button>
                                )}
                              </div>
                              <BlockImageUpload
                                value={(d[k] as any)?.image || ""}
                                onChange={(url: string) => setForm({ ...form, content: { ...d, [k]: { ...((d[k] as object)||{}), image:url } } as any })}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={(d[k] as any)?.title||""} onChange={(e)=>setForm({...form,content:{...d,[k]:{...((d[k] as object)||{}),title:e.target.value}}as any })} placeholder={"Title_" + String(i+1)} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                                <input type="text" value={(d[k] as any)?.subtitle||""} onChange={(e)=>setForm({...form,content:{...d,[k]:{...((d[k] as object)||{}),subtitle:e.target.value}}as any })} placeholder="Subtitle/Price" className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                              </div>
                              <input type="text" value={(d[k] as any)?.link||""} onChange={(e)=>setForm({...form,content:{...d,[k]:{...((d[k] as object)||{}),link:e.target.value}}as any })} placeholder="Link URL" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* circle_row 圆形卡片行（动态增减） */}
                    {form.type === "circle_row" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        {(() => {
                          const d = (form.content as any) || {};
                          const itemKeys = Object.keys(d).filter(k => k.startsWith("item") && /^\d+$/.test(k.replace("item",""))).sort((a,b) => parseInt(a.replace("item","")) - parseInt(b.replace("item","")));
                          if (itemKeys.length === 0) itemKeys.push("item0");
                          return itemKeys.map((k, idx) => (
                            <div key={k} className="flex items-center gap-3 border border-dashed border-gray-300 rounded-xl p-2">
                              <span className="text-xs text-gray-500 w-8 shrink-0">{String(idx+1)}</span>
                              <BlockImageUpload
                                value={d[k]?.image || ""}
                                onChange={(url: string) => setForm({ ...form, content: { ...d, [k]: { ...(d[k]||{}), image:url } } as any })}
                              />
                              <div className="flex-1 space-y-1.5 min-w-0">
                                <input type="text" value={d[k]?.label||""} onChange={(e) => setForm({ ...form, content: { ...d, [k]: { ...(d[k]||{}), label:e.target.value } } as any })} placeholder="Label name" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
                                <input type="text" value={d[k]?.link||""} onChange={(e) => setForm({ ...form, content: { ...d, [k]: { ...(d[k]||{}), link:e.target.value } } as any })} placeholder="Link URL" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
                              </div>
                              <button type="button" onClick={() => { const nd = { ...d }; delete nd[k]; setForm({ ...form, content: nd as any }); }} className="shrink-0 w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-lg">−</button>
                            </div>
                          ));
                        })()}
                        <button type="button" onClick={() => {
                          const d = (form.content as any) || {};
                          const keys = Object.keys(d).filter(k => k.startsWith("item") && /^\d+$/.test(k.replace("item","")));
                          const nextIdx = keys.length > 0 ? Math.max(...keys.map(k => parseInt(k.replace("item","")))) + 1 : 0;
                          setForm({ ...form, content: { ...d, [`item${nextIdx}`]: {} } as any });
                        }} className="w-full py-2.5 border-2 border-dashed border-primary/30 text-primary rounded-xl text-sm font-medium hover:bg-primary/5 transition-colors">
                          + 添加圆形卡片
                        </button>
                      </div>
                    )}

                    {/* banner_large 大横幅 */}
                    {form.type === "banner_large" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <BlockImageUpload
                          value={(form.content as any)?.image || ""}
                          onChange={(url: string) => setForm({ ...form, content: { ...(form.content as object || {}), image: url } as any })}
                        />
                        <input
                          type="text"
                          value={(form.content as any)?.title || ""}
                          onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), title: e.target.value } as any })}
                          placeholder="大标题（叠加在图上），如：一手新客拿货指南"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none font-bold"
                        />
                        <input
                          type="text"
                          value={(form.content as any)?.subtitle || ""}
                          onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), subtitle: e.target.value } as any })}
                          placeholder="副标题，如：一件起批 · 真实货源 · 1w+档口 · 自动化售后"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                        />
                        <input
                          type="text"
                          value={(form.content as any)?.link || ""}
                          onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), link: e.target.value } as any })}
                          placeholder="点击跳转链接"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                        />
                      </div>
                    )}

                    {/* banner_small 小横幅 */}
                    {form.type === "banner_small" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <BlockImageUpload
                          value={(form.content as any)?.image || ""}
                          onChange={(url: string) => setForm({ ...form, content: { ...(form.content as object || {}), image: url } as any })}
                        />
                        <input
                          type="text"
                          value={(form.content as any)?.title || ""}
                          onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), title: e.target.value } as any })}
                          placeholder="标题，如：满339减30 首单包邮"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                        />
                        <input
                          type="text"
                          value={(form.content as any)?.link || ""}
                          onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), link: e.target.value } as any })}
                          placeholder="跳转链接"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                        />
                      </div>
                    )}

                    {/* category_nav 分类目录 */}
                    {form.type === "category_nav" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        {[0,1,2,3,4,5,6,7,8,9].map((i) => {
                          const k = `tab${i}`;
                          const d = (form.content as any) || {};
                          return (
                            <div key={k} className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 w-6 shrink-0">{i+1}</span>
                              <input
                                type="text"
                                value={(d[k] as any)?.label || ""}
                                onChange={(e) => setForm({ ...form, content: { ...d, [k]: { ...((d[k] as object)||{}), label:e.target.value } } as any })}
                                placeholder="标签名（全部、猜你喜欢、十三行...）"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                              />
                              <input
                                type="text"
                                value={(d[k] as any)?.link || ""}
                                onChange={(e) => setForm({ ...form, content: { ...d, [k]: { ...((d[k] as object)||{}), link:e.target.value } } as any })}
                                placeholder="链接"
                                className="w-32 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                    {/* card_single 单格卡片 */}
                    {form.type === "card_single" && (
                      <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                        <BlockImageUpload
                          value={(form.content as any)?.image || ""}
                          onChange={(url: string) => setForm({ ...form, content: { ...((form.content as object)||{}), image: url } as any })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={(form.content as any)?.title||""} onChange={(e)=>setForm({...form,content:{...(form.content as object)||{},title:e.target.value}} as any)} placeholder="Main title" className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                          <input type="text" value={(form.content as any)?.subtitle||""} onChange={(e)=>setForm({...form,content:{...(form.content as object)||{},subtitle:e.target.value}} as any)} placeholder="Subtitle / CTA" className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={(form.content as any)?.btn_text||""} onChange={(e)=>setForm({...form,content:{...(form.content as object)||{},btn_text:e.target.value}} as any)} placeholder="Button text" className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                          <input type="text" value={(form.content as any)?.link||""} onChange={(e)=>setForm({...form,content:{...(form.content as object)||{},link:e.target.value}} as any)} placeholder="Link URL" className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                        </div>
                      </div>
                    )}

                    {/* card_quad 四宫格 */}
                    {form.type === "card_quad" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        {[0,1,2,3].map((i) => {
                          const k = "card" + i;
                          const d = (form.content as any) || {};
                          return (
                            <div key={k} className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                                <span>Card {i+1}</span>
                                {(d[k]?.title || d[k]?.image) && (
                                  <button type="button" onClick={() => {
                                    const nc = { ...d }; delete nc[k]; setForm({ ...form, content: nc as any });
                                  }} className="text-red-500 text-xs">X</button>
                                )}
                              </div>
                              <BlockImageUpload
                                value={(d[k] as any)?.image || ""}
                                onChange={(url: string) => setForm({ ...form, content: { ...d, [k]: { ...((d[k] as object)||{}), image:url } } as any })}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={(d[k] as any)?.title||""} onChange={(e)=>setForm({...form,content:{...d,[k]:{...((d[k] as object)||{}),title:e.target.value}} as any })} placeholder={"Title " + String(i+1)} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                                <input type="text" value={(d[k] as any)?.subtitle||""} onChange={(e)=>setForm({...form,content:{...d,[k]:{...((d[k] as object)||{}),subtitle:e.target.value}} as any })} placeholder="Subtitle / Price" className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                              </div>
                              <input type="text" value={(d[k] as any)?.link||""} onChange={(e)=>setForm({...form,content:{...d,[k]:{...((d[k] as object)||{}),link:e.target.value}} as any })} placeholder="Link URL" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* banner_large 大横幅 */}
                    {form.type === "banner_large" && (
                      <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                        <BlockImageUpload
                          value={(form.content as any)?.image || ""}
                          onChange={(url: string) => setForm({ ...form, content: { ...((form.content as object)||{}), image: url } as any })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={(form.content as any)?.title||""} onChange={(e)=>setForm({...form,content:{...(form.content as object)||{},title:e.target.value}} as any)} placeholder="Main title (on image)" className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                          <input type="text" value={(form.content as any)?.subtitle||""} onChange={(e)=>setForm({...form,content:{...(form.content as object)||{},subtitle:e.target.value}} as any)} placeholder="Subtitle" className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                        </div>
                        <input type="text" value={(form.content as any)?.link||""} onChange={(e)=>setForm({...form,content:{...(form.content as object)||{},link:e.target.value}} as any)} placeholder="Click link" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                      </div>
                    )}

                    {/* banner_small 小横幅 */}
                    {form.type === "banner_small" && (
                      <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                        <BlockImageUpload
                          value={(form.content as any)?.image || ""}
                          onChange={(url: string) => setForm({ ...form, content: { ...((form.content as object)||{}), image: url } as any })}
                        />
                        <input type="text" value={(form.content as any)?.title||""} onChange={(e)=>setForm({...form,content:{...(form.content as object)||{},title:e.target.value}} as any)} placeholder="Title" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                        <input type="text" value={(form.content as any)?.link||""} onChange={(e)=>setForm({...form,content:{...(form.content as object)||{},link:e.target.value}} as any)} placeholder="Link URL" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                      </div>
                    )}

                    {/* category_nav 分类目录 */}
                    {form.type === "category_nav" && (
                      <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs font-semibold text-primary">Category tabs</p>
                        {[0,1,2,3,4].map((i) => {
                          const k = "tab" + i;
                          const d = (form.content as any) || {};
                          return (
                            <div key={k} className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg p-2">
                              <span className="text-xs text-gray-400 w-6 shrink-0">{i+1}</span>
                              <input type="text" value={(d[k] as any)?.label||""} onChange={(e)=>setForm({...form,content:{...d,[k]:{...((d[k] as object)||{}),label:e.target.value}} as any })} placeholder="Tab label" className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                              <input type="text" value={(d[k] as any)?.link||""} onChange={(e)=>setForm({...form,content:{...d,[k]:{...((d[k] as object)||{}),link:e.target.value}} as any })} placeholder="Link" className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-primary outline-none" />
                            </div>
                          );
                        })}
                      </div>
                    )}


                  {/* 样式设置 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      样式配置
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          背景色
                        </label>
                        <input
                          type="color"
                          value={form.style.bgColor}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              style: { ...form.style, bgColor: e.target.value },
                            })
                          }
                          className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          文字颜色
                        </label>
                        <input
                          type="color"
                          value={form.style.textColor}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              style: { ...form.style, textColor: e.target.value },
                            })
                          }
                          className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 预览 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      效果预览
                    </label>
                    <div
                      className="rounded-xl p-4 border-2 border-dashed border-gray-200"
                      style={{
                        backgroundColor: form.style.bgColor,
                        color: form.style.textColor,
                        borderRadius: `${form.style.borderRadius}px`,
                        padding: `${form.style.padding}px`,
                      }}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        {(() => {
                          const IconComp = BLOCK_TYPES.find((t) => t.value === form.type)?.icon || Tag;
                          return <IconComp className="w-5 h-5" />;
                        })()}
                        {form.title || "未命名版块"}
                      </div>
                      <p className="text-sm opacity-70 mt-1">
                        {BLOCK_TYPES.find((t) => t.value === form.type)
                          ?.description || "自定义内容区域"}
                      </p>
                    </div>
                  </div>

                  {/* 发布状态 */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={form.is_published}
                      onChange={(e) =>
                        setForm({ ...form, is_published: e.target.checked })
                      }
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <label htmlFor="is_published" className="text-sm text-gray-700">
                      立即发布到前台
                    </label>
                  </div>
                </div>

                {/* 底部操作栏 */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.type}
                    className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        保存版块
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 提示说明 */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-3">💡 版块管理说明</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>商品展示</strong>: 展示指定分类的商品，支持网格/瀑布流等布局</li>
            <li>• <strong>营销活动</strong>: 限时优惠、满减、优惠券等活动模块</li>
            <li>• <strong>团购拼单</strong>: 设置最低人数和折扣，用户可发起拼团</li>
            <li>• <strong>限时秒杀</strong>: 倒计时抢购活动，营造紧迫感</li>
            <li>• <strong>智能推荐</strong>: 基于算法的个性化商品推荐</li>
            <li>• 所有版块支持拖拽排序、独立样式定制</li>
            <li>• 修改后立即生效，前台自动刷新显示</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
