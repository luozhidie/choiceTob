"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shirt, Crown, Sparkles, Trash2 } from "lucide-react";

const CAT_NAMES: Record<string, string> = {
  top: "上装", bottom: "下装", shoes: "鞋履", bag: "包袋", accessory: "配饰",
};

export default function WardrobePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [openid, setOpenid] = useState("");
  const [closet, setCloset] = useState<any[]>([]);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"mine" | "cloud">("mine");
  const [needs, setNeeds] = useState("");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const oid = user.id;
    setOpenid(oid);

    // 衣橱（顾问推荐 + 我的单品）
    fetch("/api/closet?openid=" + encodeURIComponent(oid))
      .then((r) => r.json())
      .then((d) => {
        setCloset(
          (d.items || []).map((it: any) => ({
            ...it,
            catName: CAT_NAMES[it.category] || it.category,
            isStylist: (it.source || "self") === "stylist",
          }))
        );
      });

    // 按场合搭配（基于形象档案）
    fetch("/api/wardrobe/outfits?openid=" + encodeURIComponent(oid))
      .then((r) => r.json())
      .then((d) => {
        setOutfits(d.occasions || []);
        setProfile(d.profile || null);
      })
      .catch(() => {});

    // 商城推荐
    fetch("/api/public/look-studio")
      .then((r) => r.json())
      .then((d) => {
        setStoreProducts(
          (d.products || []).slice(0, 12).map((p: any) => ({
            id: p.id,
            title: p.title || p.name || "商品",
            cover: p.cover || p.image_url || "",
          })).filter((p: any) => p.cover)
        );
      })
      .catch(() => {});

    // 搭配需求（本地按 openid 存）
    try {
      const v = localStorage.getItem("wardrobe_needs_" + oid);
      if (v) setNeeds(v);
    } catch (e) {}
  }, [user, authLoading]);

  const onCloset = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      const url = d.url || (d.data && d.data.url);
      if (!url) {
        setMsg("上传失败：" + (d.error || ""));
        setUploading(false);
        return;
      }
      const r2 = await fetch("/api/closet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openid, image_url: url, category: "top", source: "self" }),
      });
      const d2 = await r2.json();
      if (d2.item) {
        setCloset([{ ...d2.item, catName: CAT_NAMES[d2.item.category] || d2.item.category, isStylist: false }, ...closet]);
        setMsg("已加入我的云衣橱 ✓");
      }
    } catch (err: any) {
      setMsg("上传失败：" + err.message);
    } finally {
      setUploading(false);
    }
  };

  const delCloset = async (id: string) => {
    await fetch("/api/closet?openid=" + encodeURIComponent(openid) + "&id=" + id, { method: "DELETE" });
    setCloset(closet.filter((x) => x.id !== id));
  };

  const onNeedsInput = (e: any) => {
    const v = e.target.value;
    setNeeds(v);
    try { localStorage.setItem("wardrobe_needs_" + openid, v); } catch (e2) {}
  };

  const goTryon = () => router.push("/look-studio");

  if (authLoading) {
    return (
      <main className="max-w-[720px] mx-auto px-4 py-12 text-center text-sm text-gray-500">加载中…</main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-[720px] mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-[#2d1b2e] mb-2">请先登录</h1>
        <p className="text-sm text-gray-500 mb-6">衣橱属于个人数据，登录后才能保存与查看。</p>
        <button onClick={() => router.push("/login")} className="px-6 py-2.5 rounded-xl bg-[#2d1b2e] text-white text-sm font-semibold">
          去登录 ›
        </button>
      </main>
    );
  }

  const selfItems = closet.filter((x) => !x.isStylist);
  const stylistItems = closet.filter((x) => x.isStylist);

  return (
    <main className="max-w-[720px] mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#2d1b2e] flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#C9A24B]" /> 我的衣橱
        </h1>
      </div>

      {/* 顶部双 Tab */}
      <div className="flex bg-white rounded-xl p-1 mb-4 shadow-sm">
        <button
          onClick={() => setActiveTab("mine")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === "mine" ? "bg-gradient-to-r from-[#2d1b2e] to-[#4a3a5a] text-[#C9A24B]" : "text-gray-500"}`}
        >
          我的衣橱
        </button>
        <button
          onClick={() => setActiveTab("cloud")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === "cloud" ? "bg-gradient-to-r from-[#2d1b2e] to-[#4a3a5a] text-[#C9A24B]" : "text-gray-500"}`}
        >
          我的云衣橱
        </button>
      </div>

      {msg && <div className="mb-3 text-sm text-[#C9A24B] font-semibold">{msg}</div>}

      {/* ============ 我的衣橱 ============ */}
      {activeTab === "mine" && (
        <>
          {/* 顾问推荐 · VIP 衣橱 */}
          <section className="bg-gradient-to-br from-[#2d1b2e] to-[#4a3a5a] text-white rounded-2xl p-4 mb-4 shadow-sm">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-[#C9A24B]" /> 顾问推荐 · VIP 衣橱
              <span className="text-xs text-white/60 font-normal">{stylistItems.length} 件</span>
            </h2>
            <p className="text-xs text-white/70 mb-3">形象顾问根据你的色彩季型与风格，挑选并推入的专属单品，可直接试穿。</p>
            {stylistItems.length === 0 ? (
              <p className="text-xs text-white/50 text-center py-4">顾问还未推荐单品。完成色彩季型与风格测试后，顾问会为你搭好专属衣橱。</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {stylistItems.map((it) => (
                  <div key={it.id} className="relative rounded-xl overflow-hidden border border-white/15">
                    <img src={it.image_url} alt="" className="w-full h-32 object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-[11px] px-1.5 py-0.5 truncate">
                      {it.recommend_note || it.catName}
                    </span>
                    <button onClick={() => delCloset(it.id)} className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full">×</button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={goTryon} className="mt-3 inline-block text-xs text-[#C9A24B] hover:underline">去虚拟试衣试穿 ›</button>
          </section>

          {/* 按场合搭配（限量） */}
          <section className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <h2 className="text-sm font-bold text-[#2d1b2e] flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#C9A24B]" /> 按场合搭配（为你定制）
              <span className="text-xs text-gray-400 font-normal">{outfits.length} 套 · 限量</span>
            </h2>
            <p className="text-xs text-gray-500 mb-3">基于你的形象档案（色彩季型 + 风格 + 场合），从在售商品智能搭配。</p>
            {!profile ? (
              <p className="text-xs text-gray-400 text-center py-4">
                先去「我的」→ 形象档案 完善色彩季型与风格，才能生成专属搭配。
              </p>
            ) : outfits.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">暂未匹配到合适单品，顾问会持续为你补充。</p>
            ) : (
              outfits.map((o) => (
                <div key={o.code} className="mb-3">
                  <div className="text-xs font-bold text-[#2d1b2e] mb-2 pl-2 border-l-4 border-[#C9A24B]">{o.name}场合</div>
                  <div className="grid grid-cols-3 gap-3">
                    {o.items.map((p: any) => (
                      <button key={p.id} onClick={goTryon} className="relative rounded-xl overflow-hidden border">
                        <img src={p.image_url} alt="" className="w-full h-32 object-cover" />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-[11px] px-1.5 py-0.5 truncate">{p.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>

          {/* 更多搭配灵感 → 每日搭配灵感 */}
          <Link href="/daily-looks" className="block bg-gradient-to-br from-[#f6efe2] to-[#f3e6d0] border border-[#e7d3ad] rounded-2xl p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-[#2d1b2e]">✨ 更多搭配灵感</div>
                <div className="text-xs text-[#9a8358] mt-1">开通「每日搭配灵感」，顾问每日为你推送专属造型</div>
              </div>
              <span className="text-sm text-[#b8893f] font-bold whitespace-nowrap">去开通 ›</span>
            </div>
          </Link>
        </>
      )}

      {/* ============ 我的云衣橱 ============ */}
      {activeTab === "cloud" && (
        <>
          <section className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <h2 className="text-sm font-bold text-[#2d1b2e] flex items-center gap-2 mb-1">
              <Shirt className="w-4 h-4 text-blue-500" /> 我的单品
              <span className="text-xs text-gray-400 font-normal">{selfItems.length} 件</span>
            </h2>
            <p className="text-xs text-gray-500 mb-3">上传你自己的衣服 / 配饰 / 鞋 / 包，参与 AI 搭配与虚拟试衣。</p>
            <label className="inline-block px-4 py-2 mb-3 bg-gradient-to-r from-[#2d1b2e] to-[#7b4dff] text-white text-sm rounded-lg cursor-pointer">
              {uploading ? "上传中…" : "＋ 上传单品到衣橱"}
              <input type="file" accept="image/*" className="hidden" onChange={onCloset} disabled={uploading} />
            </label>
            <div className="grid grid-cols-3 gap-3">
              {selfItems.map((it) => (
                <div key={it.id} className="relative">
                  <img src={it.image_url} alt={it.catName} className="w-full h-32 object-cover rounded-xl border" />
                  <span className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 rounded">{it.catName}</span>
                  <button onClick={() => delCloset(it.id)} className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full">
                    <Trash2 className="w-3 h-3 mx-auto" />
                  </button>
                </div>
              ))}
            </div>
            {selfItems.length === 0 && <p className="text-xs text-gray-400 text-center py-4">衣橱空空，先上传你的单品吧</p>}
          </section>

          {/* 搭配需求 */}
          <section className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <h2 className="text-sm font-bold text-[#2d1b2e] mb-1">📝 搭配需求</h2>
            <p className="text-xs text-gray-500 mb-3">写下你的搭配需求（如场合、偏好、想避开的款式），顾问与 AI 会参考。</p>
            <textarea
              value={needs}
              onChange={onNeedsInput}
              maxLength={500}
              rows={4}
              placeholder="例如：下周出差 3 天，需要通勤+休闲两套，偏好简约高级感…"
              className="w-full min-h-[120px] bg-[#f7f5f2] border border-[#ececec] rounded-xl p-3 text-sm text-[#333]"
            />
          </section>
        </>
      )}

      {/* 去虚拟试衣 */}
      <button onClick={goTryon} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2d1b2e] to-[#7b4dff] text-white text-sm font-semibold mb-4">
        去虚拟试衣试穿 ›
      </button>

      {/* 商城推荐商品 */}
      <section className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-bold text-[#2d1b2e] mb-1">🛍 商城推荐</h2>
        <p className="text-xs text-gray-500 mb-3">挑一件，去虚拟试衣看看上身效果。</p>
        {storeProducts.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">商城单品加载中…</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {storeProducts.map((p) => (
              <button key={p.id} onClick={goTryon} className="relative rounded-xl overflow-hidden border">
                <img src={p.cover} alt="" className="w-full h-32 object-cover" />
                <span className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-[11px] px-1.5 py-0.5 truncate">{p.title}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="h-6" />
    </main>
  );
}
