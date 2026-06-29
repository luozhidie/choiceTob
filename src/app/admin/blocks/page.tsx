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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Block {
  id: string;
  title: string;
  type: "products" | "promotion" | "custom" | "group_buy" | "flash_sale" | "recommendation";
  content?: Record<string, any>;
  style?: {
    bgColor?: string;
    textColor?: string;
    padding?: number;
    borderRadius?: number;
  };
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
];

const DEFAULT_STYLES = {
  bgColor: "#ffffff",
  textColor: "#333333",
  padding: 16,
  borderRadius: 12,
};

export default function BlocksAdminPage() {
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

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
      is_published: block.is_published,
    });
    setShowForm(true);
  };

  // 保存版块
  const handleSave = async () => {
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      const blockData = {
        id: editingBlock?.id,
        title: form.title,
        type: form.type,
        content: form.content,
        style: form.style,
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
                      版块名称 *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="如：爆款选品、团购拼单..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
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

                    {/* 通用：显示位置选择 */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <label className="block text-xs text-blue-700 font-medium mb-2">📍 显示位置</label>
                      <select
                        value={(form.content as any)?.position || "product_top"}
                        onChange={(e) => {
                          const pos = e.target.value;
                          setForm({ ...form, content: { ...(form.content as object || {}), position: pos } as any });
                        }}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:border-primary outline-none"
                      >
                        <option value="hero_bottom">轮播图下方</option>
                        <option value="product_top">商品列表上方 ✨ 默认</option>
                        <option value="product_bottom">商品列表下方</option>
                        <option value="footer_top">底部上方</option>
                      </select>
                      <p className="text-[10px] text-blue-400 mt-1">选择此版块在首页的显示位置</p>
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
                      </div>
                    )}

                    {/* group_buy 团购拼单 */}
                    {form.type === "group_buy" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
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
                        <p className="text-xs text-gray-400">⚠️ 商品关联功能开发中，保存后前台将显示参与团购的商品</p>
                      </div>
                    )}

                    {/* flash_sale 限时秒杀 */}
                    {form.type === "flash_sale" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
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

                    {/* promotion 营销活动 */}
                    {form.type === "promotion" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">活动标题</label>
                          <input
                            type="text"
                            value={(form.content as any)?.promoTitle || ""}
                            onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), promoTitle: e.target.value } as any })}
                            placeholder="如：满300减50"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">活动描述</label>
                          <textarea
                            value={(form.content as any)?.promoDesc || ""}
                            onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), promoDesc: e.target.value } as any })}
                            placeholder="活动详细说明..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none h-20 resize-y"
                          />
                        </div>
                      </div>
                    )}

                    {/* custom 自定义内容 */}
                    {form.type === "custom" && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">自定义内容（HTML）</label>
                          <textarea
                            value={(form.content as any)?.html || ""}
                            onChange={(e) => setForm({ ...form, content: { ...(form.content as object || {}), html: e.target.value } as any })}
                            placeholder="<p>自定义 HTML 内容</p>"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:border-primary outline-none h-32 resize-y"
                          />
                        </div>
                      </div>
                    )}

                    {/* recommendation 智能推荐 */}
                    {form.type === "recommendation" && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400">🤖 智能推荐版块将根据用户浏览历史、购买偏好自动推荐商品，无需额外配置。</p>
                      </div>
                    )}
                  </div>

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
                    disabled={saving || !form.title.trim()}
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
