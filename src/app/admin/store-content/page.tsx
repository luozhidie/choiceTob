"use client";

import { useEffect, useState } from "react";
import { Save, Store, Truck, Shirt, BookOpen, Lightbulb, Plus, Trash2 } from "lucide-react";

interface GuideItem {
  title: string;
  desc: string;
}

export default function StoreContentPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [form, setForm] = useState({
    shop_name: "骆芷蝶智选",
    intro: "",
    shipping_note: "",
    fabric_care: "",
    wholesale_guide: [] as GuideItem[],
    seller_tips: [] as GuideItem[],
  });

  useEffect(() => {
    fetch("/api/admin/store-content", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          setForm((prev) => ({
            ...prev,
            ...j.data,
            wholesale_guide: j.data.wholesale_guide || [],
            seller_tips: j.data.seller_tips || [],
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const setField = (key: string, val: any) => setForm((prev) => ({ ...prev, [key]: val }));

  const updateGuide = (
    key: "wholesale_guide" | "seller_tips",
    idx: number,
    field: "title" | "desc",
    val: string
  ) => {
    setForm((prev) => {
      const arr = [...prev[key]];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...prev, [key]: arr };
    });
  };
  const addGuide = (key: "wholesale_guide" | "seller_tips") =>
    setForm((prev) => ({ ...prev, [key]: [...prev[key], { title: "", desc: "" }] }));
  const removeGuide = (key: "wholesale_guide" | "seller_tips", idx: number) =>
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/store-content", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok || j.error) throw new Error(j.error || "保存失败");
      setToast({ type: "success", msg: "已保存，全店详情页立即生效" });
    } catch (e: any) {
      setToast({ type: "error", msg: e.message || "保存失败" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "#64748b" }}>加载中…</div>;
  }

  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };
  const label: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
  };
  const input: React.CSSProperties = {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 14,
    outline: "none",
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>店铺内容（详情页通用块）</h2>
      <p style={{ color: "#64748b", fontSize: 13, marginTop: 0, marginBottom: 16 }}>
        这里编辑的内容会出现在<b>所有商品详情页底部</b>（拿货指南 / 店主技巧 / 面料洗护 / 店铺介绍 / 发货说明），网站与小程序同步生效。
      </p>

      {/* 店铺基础 */}
      <div style={card}>
        <div style={label}><Store size={15} /> 店铺名称</div>
        <input style={input} value={form.shop_name} onChange={(e) => setField("shop_name", e.target.value)} />
        <div style={{ ...label, marginTop: 16 }}><Store size={15} /> 店铺介绍</div>
        <textarea style={{ ...input, minHeight: 64, resize: "vertical" }} value={form.intro}
          onChange={(e) => setField("intro", e.target.value)} placeholder="一句话介绍你的店" />
        <div style={{ ...label, marginTop: 16 }}><Truck size={15} /> 发货 / 物流说明</div>
        <textarea style={{ ...input, minHeight: 56, resize: "vertical" }} value={form.shipping_note}
          onChange={(e) => setField("shipping_note", e.target.value)} placeholder="如：现货48h发出，默认顺丰/京东，满额包邮" />
      </div>

      {/* 拿货指南 */}
      <div style={card}>
        <div style={label}><BookOpen size={15} /> 拿货指南</div>
        {form.wholesale_guide.map((g, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
            <input style={{ ...input, maxWidth: 160, flexShrink: 0 }} placeholder="小标题"
              value={g.title} onChange={(e) => updateGuide("wholesale_guide", i, "title", e.target.value)} />
            <input style={input} placeholder="说明" value={g.desc}
              onChange={(e) => updateGuide("wholesale_guide", i, "desc", e.target.value)} />
            <button onClick={() => removeGuide("wholesale_guide", i)}
              style={{ border: "none", background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "8px 10px", cursor: "pointer", flexShrink: 0 }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button onClick={() => addGuide("wholesale_guide")}
          style={{ border: "1px dashed #cbd5e1", background: "#f8fafc", color: "#475569", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={14} /> 加一条
        </button>
      </div>

      {/* 店主拿货技巧 */}
      <div style={card}>
        <div style={label}><Lightbulb size={15} /> 店主拿货技巧</div>
        {form.seller_tips.map((g, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
            <input style={{ ...input, maxWidth: 160, flexShrink: 0 }} placeholder="小标题"
              value={g.title} onChange={(e) => updateGuide("seller_tips", i, "title", e.target.value)} />
            <input style={input} placeholder="说明" value={g.desc}
              onChange={(e) => updateGuide("seller_tips", i, "desc", e.target.value)} />
            <button onClick={() => removeGuide("seller_tips", i)}
              style={{ border: "none", background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "8px 10px", cursor: "pointer", flexShrink: 0 }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button onClick={() => addGuide("seller_tips")}
          style={{ border: "1px dashed #cbd5e1", background: "#f8fafc", color: "#475569", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={14} /> 加一条
        </button>
      </div>

      {/* 面料洗护 */}
      <div style={card}>
        <div style={label}><Shirt size={15} /> 面料洗护指南</div>
        <textarea style={{ ...input, minHeight: 72, resize: "vertical" }} value={form.fabric_care}
          onChange={(e) => setField("fabric_care", e.target.value)} placeholder="洗涤/晾晒/熨烫建议" />
      </div>

      <button onClick={save} disabled={saving}
        style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, opacity: saving ? 0.6 : 1 }}>
        <Save size={16} /> {saving ? "保存中…" : "保存"}
      </button>

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: toast.type === "success" ? "#16a34a" : "#dc2626", color: "#fff",
          padding: "12px 18px", borderRadius: 10, fontSize: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
