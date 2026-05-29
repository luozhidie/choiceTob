"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Loader2, Check, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";

interface OutfitMatch {
  id: string;
  title: string;
  description: string | null;
  product_ids: string[];
  style_tags: string[] | null;
  season_tags: string[] | null;
  occasion: string | null;
  match_rule_code: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function AdminCollocationPage() {
  const [outfits, setOutfits] = useState<OutfitMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 生成表单
  const [form, setForm] = useState({
    store_id: "",
    occasion: "日常",
    style_tag: "",
    season_tag: "",
    match_rule: "R01",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchOutfits();
    loadStores();
  }, []);

  const loadStores = async () => {
    const { data } = await supabase.from("stores").select("id, name");
    if (data && data.length > 0) {
      setForm(f => ({ ...f, store_id: data[0].id }));
    }
  };

  const fetchOutfits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("outfit_matches")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setOutfits(data as OutfitMatch[]);
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setGenResult(null);

    try {
      const res = await fetch("/api/generate-outfit-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: form.store_id,
          occasion: form.occasion,
          style_tag: form.style_tag || null,
          season_tag: form.season_tag || null,
          match_rule: form.match_rule,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");

      setGenResult(data);
      fetchOutfits(); // 刷新列表
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleTogglePublish = async (outfit: OutfitMatch) => {
    const { error } = await supabase
      .from("outfit_matches")
      .update({
        is_published: !outfit.is_published,
        published_at: !outfit.is_published ? new Date().toISOString() : null,
      })
      .eq("id", outfit.id);

    if (error) alert("操作失败：" + error.message);
    else fetchOutfits();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-primary">搭配方案管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          生成并管理自动搭配方案，发布到每日搭配灵感
        </p>
      </div>

      {/* 生成表单 */}
      <div className="max-w-7xl mx-auto mb-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-primary mb-4">生成新搭配方案</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">场合</label>
            <select
              value={form.occasion}
              onChange={(e) => setForm({ ...form, occasion: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              <option value="日常">日常</option>
              <option value="职场">职场</option>
              <option value="晚宴">晚宴</option>
              <option value="休闲">休闲</option>
              <option value="约会">约会</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">风格标签（可选）</label>
            <select
              value={form.style_tag}
              onChange={(e) => setForm({ ...form, style_tag: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">全部风格</option>
              {["少女型", "优雅型", "浪漫型", "少年型", "时尚型", "古典型", "自然型", "戏剧型"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">色彩季型（可选）</label>
            <select
              value={form.season_tag}
              onChange={(e) => setForm({ ...form, season_tag: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">全部季型</option>
              {["S01-浅暖", "S02-浅冷", "S03-深暖", "S04-深冷", "S05-暖亮", "S06-暖柔", "S07-冷亮", "S08-冷柔", "S09-净冷", "S10-净暖", "S11-柔冷", "S12-柔暖"].map((s) => (
                <option key={s} value={s.split("-")[0]}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">搭配原则</label>
            <select
              value={form.match_rule}
              onChange={(e) => setForm({ ...form, match_rule: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              <option value="R01">R01-色调配色</option>
              <option value="R02">R02-近似配色</option>
              <option value="R03">R03-渐进配色</option>
              <option value="R04">R04-对比配色</option>
              <option value="R05">R05-单重点配色</option>
              <option value="R06">R06-分离式配色</option>
              <option value="R07">R07-夜配色</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  生成搭配方案
                </>
              )}
            </button>
          </div>
        </div>

        {/* 生成结果 */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm mb-4">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            {error}
          </div>
        )}
        {genResult && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <Check className="w-4 h-4" />
              搭配方案已生成！
            </div>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {JSON.stringify(genResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* 搭配方案列表 */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-lg font-bold text-primary mb-4">已有搭配方案</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无搭配方案，点击上方按钮生成</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outfits.map((outfit) => (
              <div key={outfit.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{outfit.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    outfit.is_published ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                  }`}>
                    {outfit.is_published ? "已发布" : "草稿"}
                  </span>
                </div>
                {outfit.description && (
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">{outfit.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mb-3">
                  {outfit.style_tags?.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{t}</span>
                  ))}
                  {outfit.season_tags?.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent">{t}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTogglePublish(outfit)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      outfit.is_published
                        ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {outfit.is_published ? "取消发布" : "发布"}
                  </button>
                  <Link
                    href={`/admin/collocation/${outfit.id}`}
                    className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-500 text-xs font-medium text-center hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    查看
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
