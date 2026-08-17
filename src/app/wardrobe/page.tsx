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
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const oid = user.id;
    setOpenid(oid);
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
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#2d1b2e] flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#C9A24B]" /> 我的衣橱
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          云衣橱 × VIP形象设计 合并 · 你上传的单品 + 形象顾问为你推荐的专属款，都在这里。
        </p>
      </div>

      {msg && <div className="mb-4 text-sm text-[#C9A24B] font-semibold">{msg}</div>}

      {/* 顾问推荐 · VIP 衣橱 */}
      <section className="bg-gradient-to-br from-[#2d1b2e] to-[#4a3a5a] text-white rounded-2xl p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-bold flex items-center gap-2 mb-1">
          <Crown className="w-4 h-4 text-[#C9A24B]" /> 顾问推荐 · VIP 衣橱
          <span className="text-xs text-white/60 font-normal">{stylistItems.length} 件</span>
        </h2>
        <p className="text-xs text-white/70 mb-3">形象顾问根据你的色彩季型与风格，挑选并推入的专属单品，可直接试穿。</p>
        {stylistItems.length === 0 ? (
          <p className="text-xs text-white/50 text-center py-4">顾问还未推荐单品。完成风格测试后，顾问会为你搭好专属衣橱。</p>
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
        <Link href="/look-studio" className="mt-3 inline-block text-xs text-[#C9A24B] hover:underline">去虚拟试衣试穿 ›</Link>
      </section>

      {/* 我的云衣橱 */}
      <section className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-bold text-[#2d1b2e] flex items-center gap-2 mb-1">
          <Shirt className="w-4 h-4 text-blue-500" /> 我的云衣橱（自传）
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

      <div className="h-10" />
    </main>
  );
}
