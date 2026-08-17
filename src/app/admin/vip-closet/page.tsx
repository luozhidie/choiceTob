"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  Sparkles,
  Shirt,
  Crown,
  Plus,
  UserCircle2,
} from "lucide-react";

const CAT_NAMES: Record<string, string> = {
  top: "上装", bottom: "下装", shoes: "鞋履", bag: "包袋", accessory: "配饰",
};

function fmtPrice(n: number | null) {
  if (n == null) return "0";
  const yuan = Math.round(n) / 100;
  return yuan % 1 === 0 ? String(yuan) : yuan.toFixed(2);
}

export default function AdminVipClosetPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [openid, setOpenid] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [selfItems, setSelfItems] = useState<any[]>([]);
  const [stylistItems, setStylistItems] = useState<any[]>([]);
  const [recos, setRecos] = useState<any[]>([]);

  const [candidates, setCandidates] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // 手动加图
  const [manual, setManual] = useState({ image_url: "", category: "top", recommend_note: "", recommended_by: "形象顾问" });

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const loadByOpenid = useCallback(async (oid: string) => {
    setLoading(true);
    setError("");
    setOpenid(oid);
    try {
      const res = await fetch("/api/admin/vip-closet?openid=" + encodeURIComponent(oid));
      const d = await res.json();
      if (d.error) {
        setError(d.error);
        return;
      }
      setProfile(d.profile);
      setSelfItems(d.selfItems || []);
      setStylistItems(d.stylistItems || []);
      setRecos(d.recommendations || []);
      setCandidates([]);
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const onSearch = async () => {
    const q = query.trim();
    if (!q) return;
    // 如果是 openid 形态，直接定位
    if (/^[\w-]{20,}$/.test(q) || q.startsWith("web_") || q.startsWith("o")) {
      // 仍先尝试按 openid 直接查；若为空再用 q 搜
    }
    setLoading(true);
    setError("");
    setCandidates([]);
    try {
      const res = await fetch("/api/admin/vip-closet?q=" + encodeURIComponent(q));
      const d = await res.json();
      if (d.error) {
        setError(d.error);
        return;
      }
      if (d.candidates && d.candidates.length) {
        setCandidates(d.candidates);
      } else {
        // 没有候选，可能是 openid 直查
        await loadByOpenid(q);
      }
    } catch (e: any) {
      setError(e.message || "搜索失败");
    } finally {
      setLoading(false);
    }
  };

  const onPickCandidate = (c: any) => {
    if (c.openid) {
      loadByOpenid(c.openid);
    } else {
      showToast("该客户尚未关联 openid（请在其小程序端产生数据后自动关联）");
    }
  };

  const pushProduct = async (p: any) => {
    if (!openid) return;
    try {
      const res = await fetch("/api/admin/vip-closet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openid,
          image_url: p.cover,
          category: p.category || "top",
          recommend_note: p.title,
          recommended_by: "形象顾问",
        }),
      });
      const d = await res.json();
      if (d.error) {
        showToast("推送失败：" + d.error);
        return;
      }
      showToast("已加入客户 VIP 衣橱");
      setStylistItems((prev) => [d.item, ...prev]);
    } catch (e: any) {
      showToast("推送失败：" + e.message);
    }
  };

  const pushManual = async () => {
    if (!openid) return;
    if (!manual.image_url.trim()) {
      showToast("请填写图片 URL");
      return;
    }
    try {
      const res = await fetch("/api/admin/vip-closet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openid, ...manual }),
      });
      const d = await res.json();
      if (d.error) {
        showToast("推送失败：" + d.error);
        return;
      }
      showToast("已加入客户 VIP 衣橱");
      setStylistItems((prev) => [d.item, ...prev]);
      setManual({ image_url: "", category: "top", recommend_note: "", recommended_by: "形象顾问" });
    } catch (e: any) {
      showToast("推送失败：" + e.message);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium bg-[#C9A24B]">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Crown className="w-6 h-6 text-[#C9A24B]" /> 客户衣橱 · 智能推送
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            云衣橱 × VIP形象设计 合并 · 按客户季型/风格智能推荐，一键推入客户衣橱
          </p>
        </div>
        <Link href="/admin/vip" className="text-sm text-[#C9A24B] hover:underline">← VIP客户管理</Link>
      </div>

      {/* 搜索 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              placeholder="输入客户 openid / 手机号 / 姓名 / 微信"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C9A24B]"
            />
          </div>
          <button
            onClick={onSearch}
            disabled={loading}
            className="px-5 py-2.5 bg-[#2d1b2e] text-white rounded-xl text-sm font-medium hover:opacity-95 disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} 定位客户
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        {candidates.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">匹配到的客户（点选带 openid 的记录即可加载其衣橱）：</p>
            {candidates.map((c: any) => (
              <div
                key={c.id}
                onClick={() => onPickCandidate(c)}
                className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-2.5 hover:border-[#C9A24B] cursor-pointer transition"
              >
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-primary">{c.name || "-"}</span>
                  {c.phone && <span className="text-gray-500">📱 {c.phone}</span>}
                  {c.color_season && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{c.color_season}</span>}
                  <span className="text-xs text-gray-400">{c._source}</span>
                </div>
                {c.openid ? (
                  <span className="text-xs text-[#C9A24B]">已关联 · 点击加载 →</span>
                ) : (
                  <span className="text-xs text-gray-300">未关联 openid</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {openid && (
        <>
          {/* 客户形象档案（智能底座） */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="text-base font-bold text-primary flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#C9A24B]" /> 客户形象档案
            </h2>
            {profile ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">色彩季型：</span>
                <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
                  {profile.season_name || profile.season_type || "未测"}
                </span>
                <span className="text-muted-foreground ml-3">风格标签：</span>
                {(profile.style_tags && profile.style_tags.length) ? (
                  profile.style_tags.map((t: string) => (
                    <span key={t} className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">{t}</span>
                  ))
                ) : (
                  <span className="text-gray-400">未测</span>
                )}
                <span className="text-xs text-gray-400 ml-auto">openid: {openid.slice(0, 16)}…</span>
              </div>
            ) : (
              <p className="text-sm text-gray-400">该客户暂无形象档案（未做风格测试）。推荐将按全量商品兜底展示。</p>
            )}
          </div>

          {/* 统一衣橱：双分区 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-bold text-primary flex items-center gap-2 mb-3">
                <Shirt className="w-4 h-4 text-blue-500" /> 我的云衣橱（自传）
                <span className="text-xs text-gray-400 font-normal">{selfItems.length} 件</span>
              </h2>
              {selfItems.length === 0 ? (
                <p className="text-sm text-gray-400">客户尚未上传自己的单品。</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {selfItems.map((it: any) => (
                    <div key={it.id} className="rounded-xl overflow-hidden border border-gray-100">
                      <img src={it.image_url} alt="" className="w-full h-28 object-cover" />
                      <div className="px-2 py-1 text-xs text-gray-500 truncate">{CAT_NAMES[it.category] || it.category}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-[#2d1b2e] to-[#4a3a5a] text-white rounded-2xl shadow-sm p-5">
              <h2 className="text-base font-bold flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-[#C9A24B]" /> 顾问推荐 · VIP 衣橱
                <span className="text-xs text-white/60 font-normal">{stylistItems.length} 件</span>
              </h2>
              {stylistItems.length === 0 ? (
                <p className="text-sm text-white/60">顾问还未推荐任何单品。从下方智能推荐或手动添加。</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {stylistItems.map((it: any) => (
                    <div key={it.id} className="rounded-xl overflow-hidden border border-white/15 bg-white/5">
                      <img src={it.image_url} alt="" className="w-full h-28 object-cover" />
                      <div className="px-2 py-1 text-xs text-white/70 truncate">{it.recommend_note || CAT_NAMES[it.category] || it.category}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 智能推荐 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="text-base font-bold text-primary flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#C9A24B]" /> 智能推荐（按客户季型/风格匹配）
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              打分逻辑与消费者试衣间完全一致——客户在自己小程序里看到的推荐就是这些。点「加入」即推入客户 VIP 衣橱。
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recos.map((p: any) => (
                <div key={p.id} className="border border-gray-100 rounded-xl overflow-hidden hover:border-[#C9A24B] transition">
                  <img src={p.cover} alt="" className="w-full h-32 object-cover" />
                  <div className="p-2">
                    <div className="text-xs text-primary font-medium truncate" title={p.title}>{p.title}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-[#C9A24B] font-bold">¥{fmtPrice(p.price)}</span>
                      {p.score > 0 && <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">匹配 {p.score}</span>}
                    </div>
                    <button
                      onClick={() => pushProduct(p)}
                      className="mt-2 w-full flex items-center justify-center gap-1 text-xs bg-[#2d1b2e] text-white rounded-lg py-1.5 hover:opacity-95"
                    >
                      <Plus className="w-3 h-3" /> 加入客户衣橱
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 手动加图 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-primary flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-[#C9A24B]" /> 手动推荐（图片 URL）
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={manual.image_url}
                onChange={(e) => setManual({ ...manual, image_url: e.target.value })}
                placeholder="图片 URL"
                className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C9A24B]"
              />
              <select
                value={manual.category}
                onChange={(e) => setManual({ ...manual, category: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C9A24B]"
              >
                {Object.entries(CAT_NAMES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button onClick={pushManual} className="px-4 py-2 bg-[#2d1b2e] text-white rounded-xl text-sm font-medium hover:opacity-95">
                加入客户衣橱
              </button>
              <input
                value={manual.recommend_note}
                onChange={(e) => setManual({ ...manual, recommend_note: e.target.value })}
                placeholder="推荐说明（可选）"
                className="md:col-span-3 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C9A24B]"
              />
              <input
                value={manual.recommended_by}
                onChange={(e) => setManual({ ...manual, recommended_by: e.target.value })}
                placeholder="推荐人"
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C9A24B]"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
