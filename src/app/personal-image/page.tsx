"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

export default function PersonalImagePage() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [heroImage, setHeroImage] = useState("");
  const [blocks, setBlocks] = useState<string[]>([]);

  // 顾问人工服务（提交资料 → 人工报价，不展示价格）
  const [showConsult, setShowConsult] = useState(false);
  const [consultName, setConsultName] = useState("");
  const [consultContact, setConsultContact] = useState("");
  const [consultNotes, setConsultNotes] = useState("");
  const [consultPhotos, setConsultPhotos] = useState<string[]>([]);
  const [consultSubmitting, setConsultSubmitting] = useState(false);
  const [consultMsg, setConsultMsg] = useState("");

  useEffect(() => {
    setVisible(true);
    (async () => {
      try {
        const res = await fetch("/api/public/site-assets?keys=diagnosis_hero,diagnosis_blocks");
        const d = await res.json();
        if (d.success && d.data) {
          if (d.data.diagnosis_hero) setHeroImage(d.data.diagnosis_hero);
          if (d.data.diagnosis_blocks) {
            try {
              const list = JSON.parse(d.data.diagnosis_blocks);
              if (Array.isArray(list)) setBlocks(list);
            } catch {}
          }
        }
      } catch {}
    })();
  }, []);

  const onConsultPhoto = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (consultPhotos.length >= 3) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      const url = d.url || (d.data && d.data.url);
      if (url) setConsultPhotos([...consultPhotos, url]);
    } catch (err) {}
  };

  const submitConsult = async () => {
    if (!consultName.trim() || !consultContact.trim()) {
      setConsultMsg("请填写姓名与联系方式");
      return;
    }
    setConsultSubmitting(true);
    setConsultMsg("");
    try {
      const res = await fetch("/api/diagnosis-consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id || null,
          openid: user?.id || null,
          name: consultName.trim(),
          contact: consultContact.trim(),
          notes: consultNotes,
          photo_urls: consultPhotos,
          source: "personal_image_manual",
        }),
      });
      const d = await res.json();
      setConsultSubmitting(false);
      if (d.error) { setConsultMsg(d.error); return; }
      setShowConsult(false);
      setConsultName(""); setConsultContact(""); setConsultNotes(""); setConsultPhotos([]);
      alert(d.message || "资料已提交，顾问会在 24 小时内联系你报价");
    } catch (err: any) {
      setConsultSubmitting(false);
      setConsultMsg("网络错误：" + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3f0] pb-32 md:pb-28">
      {/* Hero：全屏大图，暗遮罩保证文字可读 */}
      <section className="relative h-screen min-h-screen flex items-center justify-center overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2d1b2e] to-[#4a2a3e]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(201,162,75,.15),transparent_50%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl mx-auto px-4 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-widest">形象管理</h1>
          <p className="inline-block mt-6 px-6 py-2 rounded-full bg-white/10 text-[#C9A24B] text-lg tracking-widest border border-[#C9A24B]/30">
            找到你的色彩与风格
          </p>
          <p className="mt-4 text-white/70 text-base md:text-lg">让你找到气质提升的本源</p>
        </motion.div>
      </section>

      {/* 后台配置的满框大图片模块（全宽无 padding，像同行） */}
      {blocks.length > 0 && (
        <section className="w-full space-y-0">
          {blocks.map((url, i) => (
            <img key={i} src={url} alt="" className="w-full h-auto block" />
          ))}
        </section>
      )}

      {/* 底部间距 */}
      <div className="h-8" />

      {/* 固定底部双按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 md:px-6 md:py-5 flex gap-4 z-50">
        <Link
          href="/style-test/female"
          className="flex-1 flex flex-col items-center justify-center bg-[#C9A24B] text-white rounded-full py-3 hover:opacity-95 transition"
        >
          <span className="text-base font-bold">色彩季型与风格测试</span>
          <span className="text-sm text-white/80">¥998</span>
        </Link>
        <Link
          href="/courses"
          className="flex-1 flex flex-col items-center justify-center bg-[#2d1b2e] text-white rounded-full py-3 hover:opacity-95 transition"
        >
          <span className="text-base font-bold">整体形象管理</span>
          {/* 整体形象管理：不展示价格，避免强调补差价 */}
        </Link>
      </div>

      {/* 低调入口：顾问人工服务 */}
      <div className="max-w-[720px] mx-auto px-4 pb-4">
        <button
          onClick={() => setShowConsult(true)}
          className="w-full text-center text-sm text-[#9a8358] underline py-2"
        >
          需要顾问一对一定制？提交资料，顾问人工报价 ›
        </button>
      </div>

      {/* 顾问人工服务弹窗 */}
      {showConsult && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center"
          onClick={() => setShowConsult(false)}
        >
          <div
            className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#2d1b2e] text-center">顾问人工服务</h3>
            <p className="text-xs text-gray-500 mt-2 mb-4 text-center">
              提交你的资料，顾问会根据需求人工报价（不在此展示价格）。
            </p>

            <input
              value={consultName}
              onChange={(e) => setConsultName(e.target.value)}
              placeholder="姓名"
              className="w-full bg-[#f7f5f2] border border-[#ececec] rounded-xl px-4 py-3 text-sm mb-3 outline-none"
            />
            <input
              value={consultContact}
              onChange={(e) => setConsultContact(e.target.value)}
              placeholder="联系方式（微信 / 手机）"
              className="w-full bg-[#f7f5f2] border border-[#ececec] rounded-xl px-4 py-3 text-sm mb-3 outline-none"
            />
            <textarea
              value={consultNotes}
              onChange={(e) => setConsultNotes(e.target.value)}
              placeholder="需求描述（如希望顾问帮我定位风格 / 季型、场合搭配等）"
              maxLength={500}
              rows={4}
              className="w-full bg-[#f7f5f2] border border-[#ececec] rounded-xl px-4 py-3 text-sm mb-3 outline-none resize-none"
            />

            <div className="flex gap-3 mb-4">
              {consultPhotos.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setConsultPhotos(consultPhotos.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {consultPhotos.length < 3 && (
                <label className="w-20 h-20 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-2xl text-gray-400 cursor-pointer">
                  ＋
                  <input type="file" accept="image/*" className="hidden" onChange={onConsultPhoto} />
                </label>
              )}
            </div>

            {consultMsg && <p className="text-xs text-red-500 mb-2">{consultMsg}</p>}

            <button
              onClick={submitConsult}
              disabled={consultSubmitting}
              className="w-full bg-gradient-to-r from-[#2d1b2e] to-[#4a3a5a] text-[#C9A24B] font-bold py-3 rounded-full text-sm disabled:opacity-60"
            >
              {consultSubmitting ? "提交中…" : "提交资料"}
            </button>
            <button onClick={() => setShowConsult(false)} className="w-full text-center text-sm text-gray-400 py-3">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
