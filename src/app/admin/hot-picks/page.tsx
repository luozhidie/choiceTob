"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, X, BarChart3, TrendingUp, Flame, Clock, Search } from "lucide-react";

/* ==================== 类型 ==================== */
type HotPickType = "全网爆款" | "潜在爆款" | "爆款微调款" | "设计师款" | "原创款";
type SourceChannel = "电商平台" | "社交平台" | "批发市场" | "买手店" | "小众品牌" | "轻奢品牌";

interface HotPick {
  id: string;
  styleNumber: string;
  name: string;
  price: number;
  colors: string;
  style: string;
  sourceChannel: SourceChannel;
  hotPickType: HotPickType;
  createdAt: string;
}

const HOT_PICK_TYPES: HotPickType[] = ["全网爆款", "潜在爆款", "爆款微调款", "设计师款", "原创款"];
const SOURCE_CHANNELS: SourceChannel[] = ["电商平台", "社交平台", "批发市场", "买手店", "小众品牌", "轻奢品牌"];

/* ==================== 模拟初始数据 ==================== */
const INITIAL_DATA: HotPick[] = [
  {
    id: "1",
    styleNumber: "JK-2024-001",
    name: "法式复古连衣裙",
    price: 399,
    colors: "黑色、酒红、卡其",
    style: "优雅型",
    sourceChannel: "社交平台",
    hotPickType: "全网爆款",
    createdAt: "2025-01-10",
  },
  {
    id: "2",
    styleNumber: "JK-2024-002",
    name: "新中式盘扣上衣",
    price: 299,
    colors: "月白、青黛",
    style: "自然型",
    sourceChannel: "电商平台",
    hotPickType: "潜在爆款",
    createdAt: "2025-01-12",
  },
  {
    id: "3",
    styleNumber: "JK-2024-003",
    name: "廓形西装外套",
    price: 699,
    colors: "黑色、灰色",
    style: "古典型",
    sourceChannel: "轻奢品牌",
    hotPickType: "设计师款",
    createdAt: "2025-01-15",
  },
];

/* ==================== 页面 ==================== */
export default function AdminHotPicksDataPage() {
  const [hotPicks, setHotPicks] = useState<HotPick[]>(INITIAL_DATA);
  const [showModal, setShowModal] = useState(false);
  const [editingPick, setEditingPick] = useState<HotPick | null>(null);

  /* 筛选 */
  const [filterType, setFilterType] = useState<HotPickType | "">("");
  const [filterChannel, setFilterChannel] = useState<SourceChannel | "">("");
  const [search, setSearch] = useState("");

  /* 表单 */
  const [form, setForm] = useState({
    styleNumber: "",
    name: "",
    price: 0,
    colors: "",
    style: "",
    sourceChannel: "" as SourceChannel | "",
    hotPickType: "" as HotPickType | "",
  });

  /* 统计 */
  const stats = useMemo(() => {
    const total = hotPicks.length;
    const hotAll = hotPicks.filter((h) => h.hotPickType === "全网爆款").length;
    const hotPotential = hotPicks.filter((h) => h.hotPickType === "潜在爆款").length;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekNew = hotPicks.filter((h) => new Date(h.createdAt) >= weekAgo).length;
    return { total, hotAll, hotPotential, weekNew };
  }, [hotPicks]);

  /* 筛选后的数据 */
  const filteredData = useMemo(() => {
    return hotPicks.filter((h) => {
      if (filterType && h.hotPickType !== filterType) return false;
      if (filterChannel && h.sourceChannel !== filterChannel) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          h.styleNumber.toLowerCase().includes(q) ||
          h.name.toLowerCase().includes(q) ||
          h.style.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [hotPicks, filterType, filterChannel, search]);

  /* 打开新增 */
  const openAdd = () => {
    setEditingPick(null);
    setForm({
      styleNumber: "",
      name: "",
      price: 0,
      colors: "",
      style: "",
      sourceChannel: "",
      hotPickType: "",
    });
    setShowModal(true);
  };

  /* 打开编辑 */
  const openEdit = (pick: HotPick) => {
    setEditingPick(pick);
    setForm({
      styleNumber: pick.styleNumber,
      name: pick.name,
      price: pick.price,
      colors: pick.colors,
      style: pick.style,
      sourceChannel: pick.sourceChannel,
      hotPickType: pick.hotPickType,
    });
    setShowModal(true);
  };

  /* 保存 */
  const handleSave = () => {
    if (!form.styleNumber.trim() || !form.name.trim()) {
      alert("款号和名称不能为空");
      return;
    }
    if (editingPick) {
      setHotPicks((prev) =>
        prev.map((h) =>
          h.id === editingPick.id
            ? {
                ...h,
                styleNumber: form.styleNumber,
                name: form.name,
                price: form.price,
                colors: form.colors,
                style: form.style,
                sourceChannel: form.sourceChannel as SourceChannel,
                hotPickType: form.hotPickType as HotPickType,
              }
            : h
        )
      );
    } else {
      const newPick: HotPick = {
        id: Date.now().toString(),
        styleNumber: form.styleNumber,
        name: form.name,
        price: form.price,
        colors: form.colors,
        style: form.style,
        sourceChannel: form.sourceChannel as SourceChannel,
        hotPickType: form.hotPickType as HotPickType,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setHotPicks((prev) => [newPick, ...prev]);
    }
    setShowModal(false);
  };

  /* 删除 */
  const handleDelete = (id: string) => {
    if (!confirm("确定要删除这条爆款记录吗？")) return;
    setHotPicks((prev) => prev.filter((h) => h.id !== id));
  };

  /* 爆款类型标签颜色 */
  const typeColorMap: Record<HotPickType, string> = {
    "全网爆款": "bg-red-100 text-red-700",
    "潜在爆款": "bg-amber-100 text-amber-700",
    "爆款微调款": "bg-blue-100 text-blue-700",
    "设计师款": "bg-purple-100 text-purple-700",
    "原创款": "bg-green-100 text-green-700",
  };

  /* 来源渠道标签颜色 */
  const channelColorMap: Record<SourceChannel, string> = {
    "电商平台": "bg-orange-100 text-orange-700",
    "社交平台": "bg-pink-100 text-pink-700",
    "批发市场": "bg-gray-100 text-gray-700",
    "买手店": "bg-indigo-100 text-indigo-700",
    "小众品牌": "bg-teal-100 text-teal-700",
    "轻奢品牌": "bg-yellow-100 text-yellow-700",
  };

  /* ==================== 渲染 ==================== */
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Flame className="w-6 h-6 text-accent" /> 爆款数据中心
          </h1>
          <p className="text-sm text-muted-foreground mt-1">录入和分析爆款数据，驱动商品企划决策</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> 新增爆款
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">总爆款数</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{stats.hotAll}</div>
            <div className="text-xs text-muted-foreground">全网爆款</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{stats.hotPotential}</div>
            <div className="text-xs text-muted-foreground">潜在爆款</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{stats.weekNew}</div>
            <div className="text-xs text-muted-foreground">本周新增</div>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-100 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索款号、名称、风格..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as HotPickType | "")}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white min-w-[140px]"
        >
          <option value="">全部爆款类型</option>
          {HOT_PICK_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value as SourceChannel | "")}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white min-w-[140px]"
        >
          <option value="">全部来源渠道</option>
          {SOURCE_CHANNELS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(filterType || filterChannel || search) && (
          <button
            onClick={() => {
              setFilterType("");
              setFilterChannel("");
              setSearch("");
            }}
            className="text-xs text-accent hover:underline"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* 数据表格 */}
      {filteredData.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Flame className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">暂无爆款数据</p>
          <p className="text-xs text-gray-400 mt-1">点击右上角「新增爆款」开始录入</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">款号</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">名称</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">价格</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">颜色</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">风格</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">来源渠道</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">爆款类型</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">录入时间</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((pick) => (
                <tr key={pick.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-primary">{pick.styleNumber}</td>
                  <td className="px-6 py-4 font-medium text-primary">{pick.name}</td>
                  <td className="px-6 py-4 text-sm">¥{pick.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-[120px] truncate">{pick.colors}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{pick.style}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${channelColorMap[pick.sourceChannel] || "bg-gray-100 text-gray-600"}`}>
                      {pick.sourceChannel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColorMap[pick.hotPickType] || "bg-gray-100 text-gray-600"}`}>
                      {pick.hotPickType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{pick.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(pick)}
                        className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(pick.id)}
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

      {/* ==================== 新增/编辑弹窗 ==================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl mb-10">
            {/* 头部 */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="font-bold text-lg text-primary">{editingPick ? "编辑爆款" : "新增爆款"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* 款号 + 名称 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">款号 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.styleNumber}
                    onChange={(e) => setForm({ ...form, styleNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                    placeholder="如：JK-2024-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">名称 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                    placeholder="输入商品名称"
                  />
                </div>
              </div>

              {/* 价格 + 颜色 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">价格（元）</label>
                  <input
                    type="number"
                    value={form.price || ""}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">颜色</label>
                  <input
                    type="text"
                    value={form.colors}
                    onChange={(e) => setForm({ ...form, colors: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                    placeholder="如：黑色、白色、卡其"
                  />
                </div>
              </div>

              {/* 风格 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">风格</label>
                <input
                  type="text"
                  value={form.style}
                  onChange={(e) => setForm({ ...form, style: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  placeholder="如：优雅型、自然型"
                />
              </div>

              {/* 来源渠道 + 爆款类型 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">来源渠道</label>
                  <select
                    value={form.sourceChannel}
                    onChange={(e) => setForm({ ...form, sourceChannel: e.target.value as SourceChannel | "" })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  >
                    <option value="">请选择</option>
                    {SOURCE_CHANNELS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">爆款类型</label>
                  <select
                    value={form.hotPickType}
                    onChange={(e) => setForm({ ...form, hotPickType: e.target.value as HotPickType | "" })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  >
                    <option value="">请选择</option>
                    {HOT_PICK_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 底部 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
              >
                {editingPick ? "保存修改" : "新增爆款"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
