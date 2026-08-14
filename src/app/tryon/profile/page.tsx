"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

const SEASON_TYPES = [
  { code: "deep_cool", name: "深冷" }, { code: "deep_warm", name: "深暖" },
  { code: "light_cool", name: "浅冷" }, { code: "light_warm", name: "浅暖" },
  { code: "cool_bright", name: "冷亮" }, { code: "cool_soft", name: "冷柔" },
  { code: "warm_bright", name: "暖亮" }, { code: "warm_soft", name: "暖柔" },
  { code: "clear_cool", name: "净冷" }, { code: "clear_warm", name: "净暖" },
  { code: "soft_cool", name: "柔冷" }, { code: "soft_warm", name: "柔暖" },
];
// 穿衣风格：以系统 style_tags 表为权威源（女士 8 主 + 56 偏；男士 5 主 + 20 偏）
const STYLE_DATA: Record<string, { code: string; name: string; subs: { code: string; name: string }[] }[]> = {
  women: [
    { code: "girl", name: "少女型", subs: [{ code: "girl_qz_boyish", name: "少女偏少年" }, { code: "girl_qz_fashion", name: "少女偏时尚" }, { code: "girl_qz_classic", name: "少女偏古典" }, { code: "girl_qz_natural", name: "少女偏自然" }, { code: "girl_qz_dramatic", name: "少女偏戏剧" }, { code: "girl_qq_elegant", name: "少女偏优雅" }, { code: "girl_qq_romantic", name: "少女偏浪漫" }] },
    { code: "elegant", name: "优雅型", subs: [{ code: "elegant_qz_boyish", name: "优雅偏少年" }, { code: "elegant_qz_fashion", name: "优雅偏时尚" }, { code: "elegant_qz_classic", name: "优雅偏古典" }, { code: "elegant_qz_natural", name: "优雅偏自然" }, { code: "elegant_qz_dramatic", name: "优雅偏戏剧" }, { code: "elegant_qq_girl", name: "优雅偏少女" }, { code: "elegant_qq_romantic", name: "优雅偏浪漫" }] },
    { code: "romantic", name: "浪漫型", subs: [{ code: "romantic_qz_boyish", name: "浪漫偏少年" }, { code: "romantic_qz_fashion", name: "浪漫偏时尚" }, { code: "romantic_qz_classic", name: "浪漫偏古典" }, { code: "romantic_qz_natural", name: "浪漫偏自然" }, { code: "romantic_qz_dramatic", name: "浪漫偏戏剧" }, { code: "romantic_qq_girl", name: "浪漫偏少女" }, { code: "romantic_qq_elegant", name: "浪漫偏优雅" }] },
    { code: "boyish", name: "少年型", subs: [{ code: "boyish_zq_girl", name: "少年偏少女" }, { code: "boyish_zq_elegant", name: "少年偏优雅" }, { code: "boyish_zq_romantic", name: "少年偏浪漫" }, { code: "boyish_zz_fashion", name: "少年偏时尚" }, { code: "boyish_zz_classic", name: "少年偏古典" }, { code: "boyish_zz_natural", name: "少年偏自然" }, { code: "boyish_zz_dramatic", name: "少年偏戏剧" }] },
    { code: "fashion", name: "时尚型", subs: [{ code: "fashion_zq_girl", name: "时尚偏少女" }, { code: "fashion_zq_elegant", name: "时尚偏优雅" }, { code: "fashion_zq_romantic", name: "时尚偏浪漫" }, { code: "fashion_zz_boyish", name: "时尚偏少年" }, { code: "fashion_zz_classic", name: "时尚偏古典" }, { code: "fashion_zz_natural", name: "时尚偏自然" }, { code: "fashion_zz_dramatic", name: "时尚偏戏剧" }] },
    { code: "classic", name: "古典型", subs: [{ code: "classic_zq_girl", name: "古典偏少女" }, { code: "classic_zq_elegant", name: "古典偏优雅" }, { code: "classic_zq_romantic", name: "古典偏浪漫" }, { code: "classic_zz_boyish", name: "古典偏少年" }, { code: "classic_zz_fashion", name: "古典偏时尚" }, { code: "classic_zz_natural", name: "古典偏自然" }, { code: "classic_zz_dramatic", name: "古典偏戏剧" }] },
    { code: "natural", name: "自然型", subs: [{ code: "natural_zq_girl", name: "自然偏少女" }, { code: "natural_zq_elegant", name: "自然偏优雅" }, { code: "natural_zq_romantic", name: "自然偏浪漫" }, { code: "natural_zz_boyish", name: "自然偏少年" }, { code: "natural_zz_fashion", name: "自然偏时尚" }, { code: "natural_zz_classic", name: "自然偏古典" }, { code: "natural_zz_dramatic", name: "自然偏戏剧" }] },
    { code: "dramatic", name: "戏剧型", subs: [{ code: "dramatic_zq_girl", name: "戏剧偏少女" }, { code: "dramatic_zq_elegant", name: "戏剧偏优雅" }, { code: "dramatic_zq_romantic", name: "戏剧偏浪漫" }, { code: "dramatic_zz_boyish", name: "戏剧偏少年" }, { code: "dramatic_zz_fashion", name: "戏剧偏时尚" }, { code: "dramatic_zz_classic", name: "戏剧偏古典" }, { code: "dramatic_zz_natural", name: "戏剧偏自然" }] },
  ],
  men: [
    { code: "dramatic_m", name: "戏剧型", subs: [{ code: "dramatic_m_natural", name: "戏剧偏自然" }, { code: "dramatic_m_classic", name: "戏剧偏古典" }, { code: "dramatic_m_romantic", name: "戏剧偏浪漫" }, { code: "dramatic_m_fashion", name: "戏剧偏时尚" }] },
    { code: "natural_m", name: "自然型", subs: [{ code: "natural_m_dramatic", name: "自然偏戏剧" }, { code: "natural_m_classic", name: "自然偏古典" }, { code: "natural_m_romantic", name: "自然偏浪漫" }, { code: "natural_m_fashion", name: "自然偏时尚" }] },
    { code: "classic_m", name: "古典型", subs: [{ code: "classic_m_dramatic", name: "古典偏戏剧" }, { code: "classic_m_natural", name: "古典偏自然" }, { code: "classic_m_romantic", name: "古典偏浪漫" }, { code: "classic_m_fashion", name: "古典偏时尚" }] },
    { code: "romantic_m", name: "浪漫型", subs: [{ code: "romantic_m_dramatic", name: "浪漫偏戏剧" }, { code: "romantic_m_natural", name: "浪漫偏自然" }, { code: "romantic_m_classic", name: "浪漫偏古典" }, { code: "romantic_m_fashion", name: "浪漫偏时尚" }] },
    { code: "fashion_m", name: "时尚型", subs: [{ code: "fashion_m_dramatic", name: "时尚偏戏剧" }, { code: "fashion_m_natural", name: "时尚偏自然" }, { code: "fashion_m_classic", name: "时尚偏古典" }, { code: "fashion_m_romantic", name: "时尚偏浪漫" }] },
  ],
};
const OCCASIONS = [
  { code: "work", name: "职场通勤" }, { code: "date", name: "约会休闲" }, { code: "travel", name: "出行旅游" }, { code: "social", name: "社交礼仪" }, { code: "home", name: "居家" },
];
const CAT_NAMES: Record<string, string> = { top: "上装", bottom: "下装", shoes: "鞋履", bag: "包袋", accessory: "配饰" };

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [openid, setOpenid] = useState("");
  const [season, setSeason] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [gender, setGender] = useState("women");
  const [mainStyle, setMainStyle] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [sizes, setSizes] = useState<{ top: string; bottom: string; shoe: string }>({ top: "", bottom: "", shoe: "" });
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState("");
  const [closet, setCloset] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const oid = user.id;
    setOpenid(oid);
    fetch("/api/style-profile?openid=" + encodeURIComponent(oid))
      .then((r) => r.json())
      .then((d) => {
        const p = d.profile;
        if (p) {
          const tags: string[] = p.style_tags || [];
          let g = "women";
          for (const t of tags) { if (String(t).indexOf("_m") > -1) { g = "men"; break; } }
          let ms = "";
          for (const m of STYLE_DATA[g]) { if (tags.includes(m.code)) { ms = m.code; break; } }
          setGender(g);
          setMainStyle(ms);
          setSeason(p.season_type || "");
          setStyles(tags);
          setOccasions(p.occasions || []);
          setHeight(p.height ? String(p.height) : "");
          setWeight(p.weight ? String(p.weight) : "");
          setSizes(p.sizes || { top: "", bottom: "", shoe: "" });
          setBody(p.body_type || "");
          setPhoto(p.full_body_photo || "");
        }
      });
    fetch("/api/closet?openid=" + encodeURIComponent(oid))
      .then((r) => r.json())
      .then((d) => {
        setCloset((d.items || []).map((it: any) => ({ ...it, catName: CAT_NAMES[it.category] || it.category })));
      });
  }, [user, authLoading]);

  const toggle = (arr: string[], setArr: any, c: string) => {
    setArr(arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c]);
  };

  const mainList = STYLE_DATA[gender];
  const curMain = mainList.find((m) => m.code === mainStyle) || null;
  const subList = curMain ? curMain.subs : [];
  const mainName = curMain ? curMain.name : "";

  const setGenderFn = (g: string) => {
    if (g === gender) return;
    setGender(g);
    setMainStyle("");
    setStyles([]);
  };
  const toggleMain = (c: string) => {
    const mains = STYLE_DATA[gender];
    const cur = mains.find((m) => m.code === c) || null;
    const old = mains.find((m) => m.code === mainStyle) || null;
    let next = styles.slice();
    if (mainStyle === c) {
      next = next.filter((x) => x !== c && !(cur && cur.subs.some((s) => s.code === x)));
      setMainStyle("");
    } else {
      if (old) next = next.filter((x) => x !== old.code && !old.subs.some((s) => s.code === x));
      next.push(c);
      setMainStyle(c);
    }
    setStyles(next);
  };

  const save = async () => {
    if (!openid) { setMsg("请先登录"); return; }
    if (!season && styles.length === 0) { setMsg("先选色彩季型或风格"); return; }
    const res = await fetch("/api/style-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openid, season_type: season, style_tags: styles, occasions,
        body_type: body, height: height ? Number(height) : null, weight: weight ? Number(weight) : null,
        sizes, full_body_photo: photo,
      }),
    });
    const d = await res.json();
    setMsg(d.error ? "保存失败：" + d.error : "形象档案已保存 ✓");
  };

  const onPhoto = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await res.json();
    const url = d.url || (d.data && d.data.url);
    if (url) setPhoto(url);
    else setMsg("上传失败：" + (d.error || ""));
  };

  const onCloset = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await res.json();
    const url = d.url || (d.data && d.data.url);
    if (!url) { setMsg("上传失败：" + (d.error || "")); return; }
    const r2 = await fetch("/api/closet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openid, image_url: url, category: "top" }),
    });
    const d2 = await r2.json();
    if (d2.item) setCloset([{ ...d2.item, catName: CAT_NAMES[d2.item.category] || d2.item.category }, ...closet]);
  };

  const delCloset = async (id: string) => {
    await fetch("/api/closet?openid=" + encodeURIComponent(openid) + "&id=" + id, { method: "DELETE" });
    setCloset(closet.filter((x) => x.id !== id));
  };

  if (authLoading) {
    return (
      <main className="max-w-[720px] mx-auto px-4 py-12 text-center text-sm text-gray-500">
        加载中…
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-[720px] mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-[#2d1b2e] mb-2">请先登录</h1>
        <p className="text-sm text-gray-500 mb-6">形象档案属于个人数据，登录后才能保存与查看。</p>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-2.5 rounded-xl bg-[#2d1b2e] text-white text-sm font-semibold"
        >
          去登录 ›
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-[720px] mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#2d1b2e]">我的形象档案</h1>
        <p className="text-sm text-gray-500 mt-1">完成诊断，AI 搭配更精准：按你的色彩季型、风格、身材与常去场合生成造型。</p>
      </div>

      {msg && <div className="mb-4 text-sm text-[#C9A24B] font-semibold">{msg}</div>}

      {/* 色彩季型 */}
      <section className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-bold text-[#2d1b2e] mb-3">色彩季型（选 1 个）</h2>
        <div className="flex flex-wrap gap-2">
          {SEASON_TYPES.map((s) => (
            <button
              key={s.code}
              onClick={() => setSeason(s.code)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                season === s.code ? "bg-[#2d1b2e] text-white border-transparent" : "bg-[#f6f3ef] text-gray-600 border-[#e7ded2]"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </section>

      {/* 风格 */}
      <section className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-bold text-[#2d1b2e] mb-3">穿衣风格（主风格 + 偏风格）</h2>
        <div className="flex gap-2 mb-3">
          <button onClick={() => setGenderFn("women")} className={`flex-1 py-2 rounded-xl text-sm border transition ${gender === "women" ? "bg-[#2d1b2e] text-white border-transparent" : "bg-[#f6f3ef] text-gray-600 border-[#e7ded2]"}`}>女士 · 8 主风格</button>
          <button onClick={() => setGenderFn("men")} className={`flex-1 py-2 rounded-xl text-sm border transition ${gender === "men" ? "bg-[#2d1b2e] text-white border-transparent" : "bg-[#f6f3ef] text-gray-600 border-[#e7ded2]"}`}>男士 · 5 主风格</button>
        </div>
        <p className="text-xs text-[#a08f74] mb-3">先选你的主风格，再叠加偏风格（可多选）</p>
        <div className="flex flex-wrap gap-2">
          {mainList.map((m) => (
            <button
              key={m.code}
              onClick={() => toggleMain(m.code)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${mainStyle === m.code ? "bg-[#2d1b2e] text-white border-transparent" : "bg-[#f6f3ef] text-gray-600 border-[#e7ded2]"}`}
            >
              {m.name}
            </button>
          ))}
        </div>
        {mainStyle && (
          <>
            <h3 className="text-xs font-bold text-[#2d1b2e] mt-4 mb-2">{mainName}的偏风格（曲直 / 冷暖微调）</h3>
            <div className="flex flex-wrap gap-2">
              {subList.map((s) => (
                <button
                  key={s.code}
                  onClick={() => toggle(styles, setStyles, s.code)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${styles.includes(s.code) ? "bg-[#2d1b2e] text-white border-transparent" : "bg-[#f6f3ef] text-gray-600 border-[#e7ded2]"}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 场合 */}
      <section className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-bold text-[#2d1b2e] mb-3">常去场合（可多选）</h2>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((s) => (
            <button
              key={s.code}
              onClick={() => toggle(occasions, setOccasions, s.code)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                occasions.includes(s.code) ? "bg-[#2d1b2e] text-white border-transparent" : "bg-[#f6f3ef] text-gray-600 border-[#e7ded2]"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </section>

      {/* 身材尺码 */}
      <section className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-bold text-[#2d1b2e] mb-3">身材与尺码</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-600">身高(cm)<input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="165" /></label>
          <label className="text-sm text-gray-600">体重(kg)<input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="52" /></label>
          <label className="text-sm text-gray-600">上装尺码<input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={sizes.top} onChange={(e) => setSizes({ ...sizes, top: e.target.value })} placeholder="M" /></label>
          <label className="text-sm text-gray-600">下装尺码<input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={sizes.bottom} onChange={(e) => setSizes({ ...sizes, bottom: e.target.value })} placeholder="L" /></label>
          <label className="text-sm text-gray-600">鞋码<input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={sizes.shoe} onChange={(e) => setSizes({ ...sizes, shoe: e.target.value })} placeholder="38" /></label>
          <label className="text-sm text-gray-600">身材特点<input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={body} onChange={(e) => setBody(e.target.value)} placeholder="梨形/沙漏型" /></label>
        </div>
      </section>

      {/* 全身照 */}
      <section className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-bold text-[#2d1b2e] mb-3">全身照（用于试衣合成）</h2>
        <div className="flex items-center gap-4">
          {photo ? (
            <img src={photo} alt="全身照" className="w-28 h-36 object-cover rounded-xl border" />
          ) : (
            <div className="w-28 h-36 bg-[#f6f3ef] rounded-xl border border-dashed border-[#d9cdb8] flex items-center justify-center text-xs text-gray-400">未上传</div>
          )}
          <label className="px-4 py-2 bg-[#2d1b2e] text-white text-sm rounded-lg cursor-pointer">
            上传全身照
            <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          </label>
        </div>
      </section>

      <button onClick={save} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2d1b2e] to-[#7b4dff] text-white font-bold mb-8">
        保存形象档案
      </button>

      {/* 我的衣橱 */}
      <section className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-bold text-[#2d1b2e] mb-1">我的衣橱</h2>
        <p className="text-xs text-gray-500 mb-3">上传你自己的衣服 / 配饰 / 鞋 / 包，参与 AI 搭配。</p>
        <label className="inline-block px-4 py-2 mb-3 bg-gradient-to-r from-[#2d1b2e] to-[#7b4dff] text-white text-sm rounded-lg cursor-pointer">
          ＋ 上传单品到衣橱
          <input type="file" accept="image/*" className="hidden" onChange={onCloset} />
        </label>
        <div className="grid grid-cols-3 gap-3">
          {closet.map((it) => (
            <div key={it.id} className="relative">
              <img src={it.image_url} alt={it.catName} className="w-full h-32 object-cover rounded-xl border" />
              <span className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 rounded">{it.catName}</span>
              <button onClick={() => delCloset(it.id)} className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full">×</button>
            </div>
          ))}
        </div>
        {closet.length === 0 && <p className="text-xs text-gray-400 text-center py-4">衣橱空空，先上传你的单品吧</p>}
      </section>

      <div className="h-10" />
    </main>
  );
}
