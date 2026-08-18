"use client";
import { useState, useEffect } from "react";
import TryonPayButton from "@/components/tryon/TryonPayButton";

export default function OutfitPage() {
  const [person, setPerson] = useState<File | null>(null);
  const [top, setTop] = useState<File | null>(null);
  const [bottom, setBottom] = useState<File | null>(null);
  const [personPrev, setPersonPrev] = useState("");
  const [topPrev, setTopPrev] = useState("");
  const [bottomPrev, setBottomPrev] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [err, setErr] = useState("");

  // 权益门禁
  const [ent, setEnt] = useState<{ active: boolean; normalLeft: number; proLeft: number } | null>(null);
  const [entLoading, setEntLoading] = useState(true);
  const [paywall, setPaywall] = useState<"need" | "noleft" | null>(null);

  useEffect(() => {
    let anon = "";
    try { anon = "web_" + (localStorage.getItem("tryon_web_openid") || ""); } catch (e) {}
    if (!anon || anon === "web_") {
      anon = "web_" + Math.random().toString(36).slice(2, 12);
      try { localStorage.setItem("tryon_web_openid", anon.slice(4)); } catch (e) {}
    }
    fetch("/api/tryon/entitlement?openid=" + encodeURIComponent(anon))
      .then((r) => r.json())
      .then((d) => setEnt(d || { active: false, normalLeft: 0, proLeft: 0 }))
      .catch(() => setEnt({ active: false, normalLeft: 0, proLeft: 0 }))
      .finally(() => setEntLoading(false));
  }, []);

  const canTry = () => !!ent?.active && (ent?.normalLeft || 0) > 0;
  const ensureEnt = () => {
    if (entLoading) return false;
    if (!ent?.active) { setPaywall("need"); return false; }
    if ((ent?.normalLeft || 0) <= 0) { setPaywall("noleft"); return false; }
    return true;
  };

  const pick = (
    setter: (f: File | null) => void,
    prevSetter: (s: string) => void,
    file: File | null
  ) => {
    if (!ensureEnt()) return;
    if (!file) return;
    setter(file);
    prevSetter(URL.createObjectURL(file));
  };

  const uploader = (
    prev: string,
    label: string,
    setter: (f: File | null) => void,
    prevSetter: (s: string) => void
  ) => (
    <div style={card}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <label
          style={{
            width: 72,
            height: 96,
            borderRadius: 10,
            border: "1.5px dashed #6b5560",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#b9a7ad",
            fontSize: 12,
            textAlign: "center",
            overflow: "hidden",
            background: "#241620",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {prev ? <img src={prev} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : "上传"}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => pick(setter, prevSetter, e.target.files?.[0] || null)}
          />
        </label>
        <div style={{ fontSize: 11, color: "#8a7580", lineHeight: 1.5 }}>
          平铺 / 挂拍，背景干净、单一主体、无折叠遮挡
        </div>
      </div>
    </div>
  );

  const gen = async () => {
    if (!ensureEnt()) return;
    if (!person) {
      setErr("请先上传人物照片");
      return;
    }
    if (!top && !bottom) {
      setErr("请至少上传一件衣服（上装或下装）");
      return;
    }
    setErr("");
    setLoading(true);
    setResult("");
    const fd = new FormData();
    fd.append("personImage", person);
    if (top) fd.append("topImage", top);
    if (bottom) fd.append("bottomImage", bottom);
    try {
      const r = await fetch("/api/tryon/outfit", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok || !d.ok) {
        setErr(d.error || "生成失败");
      } else {
        setResult(d.resultUrl);
        // 本地先扣减，再同步服务端
        setEnt((prev) => prev ? { ...prev, normalLeft: Math.max(0, prev.normalLeft - 1) } : prev);
        let anon = "";
        try { anon = "web_" + (localStorage.getItem("tryon_web_openid") || ""); } catch (e) {}
        if (anon && anon !== "web_") {
          fetch("/api/tryon/entitlement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ openid: anon, tier: "normal" }) }).catch(() => {});
        }
      }
    } catch (e: any) {
      setErr(e.message || "网络错误");
    } finally {
      setLoading(false);
    }
  };

  const card: React.CSSProperties = {
    background: "#1f141c",
    borderRadius: 12,
    border: "1px solid #3a2832",
    padding: 12,
    marginBottom: 12,
  };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 16, minHeight: "100vh", background: "#16100f", color: "#f3ece9" }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, color: "#C9A24B", margin: "8px 0 4px" }}>整体造型 · 一套上身</h1>
      <p style={{ fontSize: 11, color: "#8a7580", margin: "0 0 14px", lineHeight: 1.5 }}>
        上传人物 + 上装 + 下装，一次生成完整套装效果（通义 OutfitAnyone，保留你的脸，无水印）。人物用全身正面照、光照良好、单人。
      </p>

      {!entLoading && !canTry() && (
        <div style={{ background: "rgba(201,162,75,.15)", border: "1px solid #C9A24B", borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#C9A24B" }}>{ent?.active ? "普通版次数已用完" : "未开通试衣套餐"}</div>
          <div style={{ fontSize: 12, color: "#d8c3c9", marginTop: 4, lineHeight: 1.5 }}>
            {ent?.active ? "当前套餐普通试穿次数不足，需续费后继续生成整体造型。" : "整体造型 · 一套上身需先付费开通试衣套餐。"}
            <span onClick={() => setPaywall(ent?.active ? "noleft" : "need")} style={{ color: "#C9A24B", cursor: "pointer", marginLeft: 6 }}>去开通 ›</span>
          </div>
        </div>
      )}

      {uploader(personPrev, "① 人物照片（全身正面）", setPerson, setPersonPrev)}
      {uploader(topPrev, "② 上装 / 连衣裙", setTop, setTopPrev)}
      {uploader(bottomPrev, "③ 下装（裤子 / 裙）", setBottom, setBottomPrev)}

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>④ 配饰 / 鞋包（可选）</div>
        <div style={{ fontSize: 11, color: "#8a7580", lineHeight: 1.6 }}>
          整体造型默认只替换上装 + 下装。鞋、包、项链等配饰请在生成整套造型后，点击结果下方的「继续叠加配饰」到普通版逐件追加。
        </div>
      </div>

      <button
        onClick={gen}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px 0",
          borderRadius: 10,
          border: "none",
          background: "#C9A24B",
          color: "#1c111d",
          fontWeight: 800,
          fontSize: 15,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "生成中…约 15-30 秒" : "生成整套造型 ↗"}
      </button>

      {err && <p style={{ color: "#e88", fontSize: 13, margin: "10px 0" }}>{err}</p>}

      {result && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>生成结果</div>
          <a href={result} target="_blank" rel="noreferrer">
            <img src={result} style={{ width: "100%", borderRadius: 10, border: "1px solid #4a3840" }} alt="result" />
          </a>
          <p style={{ fontSize: 11, color: "#8a7580", marginTop: 6 }}>点击图片可看大图并保存。</p>
          <a
            href={`/look-studio?baseImageUrl=${encodeURIComponent(result)}`}
            style={{
              display: "block",
              marginTop: 10,
              padding: "10px 0",
              borderRadius: 8,
              border: "1px solid #C9A24B",
              color: "#C9A24B",
              textAlign: "center",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            ＋ 继续叠加配饰（鞋 / 包 / 项链）
          </a>
        </div>
      )}

      {/* 付费门禁弹窗 */}
      {paywall && (
        <div onClick={() => setPaywall(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#2d1b2e" }}>{paywall === "need" ? "未开通试衣套餐" : "次数已用完"}</div>
            <p style={{ fontSize: 13, color: "#555", margin: "10px 0 18px", lineHeight: 1.5 }}>
              {paywall === "need" ? "整体造型 · 一套上身需先付费开通试衣套餐。" : "当前套餐普通试穿次数不足，需续费后继续生成整体造型。"}
            </p>
            <TryonPayButton productId="tryon_first_9_9" title="首单体验" price={9.9} label="首单体验 ¥9.9" sub="10 次普通试穿" />
            <button onClick={() => setPaywall(null)} style={{ marginTop: 12, width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#666", fontWeight: 700, cursor: "pointer" }}>先逛逛</button>
          </div>
        </div>
      )}
    </main>
  );
}
