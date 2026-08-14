"use client";
import { useState } from "react";

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

  const pick = (
    setter: (f: File | null) => void,
    prevSetter: (s: string) => void,
    file: File | null
  ) => {
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
      if (!r.ok || !d.ok) setErr(d.error || "生成失败");
      else setResult(d.resultUrl);
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

      {uploader(personPrev, "① 人物照片（全身正面）", setPerson, setPersonPrev)}
      {uploader(topPrev, "② 上装 / 连衣裙", setTop, setTopPrev)}
      {uploader(bottomPrev, "③ 下装（裤子 / 裙）", setBottom, setBottomPrev)}

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
        </div>
      )}
    </main>
  );
}
