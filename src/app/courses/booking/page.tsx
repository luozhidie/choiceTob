"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, CheckCircle, Copy } from "lucide-react";

interface BookingConfig {
  title: string;
  subtitle: string;
  price: number;
  desc: string;
  wechat: string;
  outline: string[];
}

const DEFAULT: BookingConfig = {
  title: "整体形象诊断",
  subtitle: "一次诊断 终身受益",
  price: 190,
  desc: "专业形象顾问一对一定制，找准显白本命色，锁定高级风格，越穿越显贵。",
  wechat: "luozhidie",
  outline: ["风格诊断", "色彩诊断", "身材诊断", "生成报告"],
};

export default function DiagnosisBookingPage() {
  const [config, setConfig] = useState<BookingConfig>(DEFAULT);
  const [heroImage, setHeroImage] = useState("");
  const [booked, setBooked] = useState(false);
  const [showWechat, setShowWechat] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/public/site-assets?keys=diagnosis_hero,diagnosis_booking");
        const d = await res.json();
        if (d.success && d.data) {
          if (d.data.diagnosis_hero) setHeroImage(d.data.diagnosis_hero);
          if (d.data.diagnosis_booking) {
            try {
              const cfg = JSON.parse(d.data.diagnosis_booking);
              setConfig({ ...DEFAULT, ...cfg });
            } catch {}
          }
        }
      } catch {}
    })();
  }, []);

  const copyWechat = () => {
    navigator.clipboard?.writeText(config.wechat).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
      () => setShowWechat(true)
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f3f0]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#2d1b2e] to-[#4a2a3e] text-white py-12 md:py-16 px-4 overflow-hidden">
        {heroImage && (
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(201,162,75,.15),transparent_50%)]" />
        <Link href="/courses" className="absolute top-4 left-4 text-white/70 hover:text-white flex items-center gap-1 text-sm z-10">
          <ArrowLeft className="w-4 h-4" /> 返回
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-3xl mx-auto text-center pt-6"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[#e91e63] text-white text-xs font-semibold mb-4">🔥 形象诊断预约</span>
          <h1 className="text-3xl md:text-4xl font-bold">{config.title}</h1>
          <p className="text-lg md:text-xl text-[#C9A24B] mt-2">{config.subtitle}</p>
          <p className="text-3xl md:text-4xl font-bold text-[#C9A24B] mt-4">¥{config.price}</p>
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 简介 */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-[#2d1b2e] mb-4">预约说明</h2>
          <p className="text-gray-600 leading-relaxed text-sm md:text-base">{config.desc}</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-400">方式</span>
              <span className="text-gray-700 font-medium">一对一 在线 / 线下</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-400">地点</span>
              <span className="text-gray-700 font-medium">深圳·南油服装批发市场 / 线上</span>
            </div>
          </div>
        </div>

        {/* 服务大纲 */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm mb-24">
          <h2 className="text-xl font-bold text-[#2d1b2e] mb-4">服务大纲</h2>
          <div className="space-y-3">
            {config.outline.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#2d1b2e] text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-gray-600 text-sm md:text-base pt-0.5">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 固定底部预约栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 md:px-6 z-50">
        {booked ? (
          <div className="flex items-center justify-center gap-2 text-green-600 font-bold py-3">
            <CheckCircle className="w-5 h-5" /> 已预约，客服将联系您
          </div>
        ) : (
          <button
            onClick={() => setShowWechat(true)}
            className="w-full bg-[#2d1b2e] text-white rounded-full py-3.5 font-bold text-base hover:opacity-95 transition"
          >
            立即预约 · ¥{config.price}
          </button>
        )}
      </div>

      {/* 微信弹窗 */}
      {showWechat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowWechat(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-[#2d1b2e] text-white flex items-center justify-center mx-auto mb-4 text-2xl font-bold">骆</div>
            <h3 className="text-lg font-bold text-[#2d1b2e]">添加客服微信预约</h3>
            <p className="text-gray-500 text-sm mt-1">复制微信号，添加好友备注「形象诊断」</p>
            <div className="mt-4 flex items-center justify-center gap-2 bg-[#faf8f6] border border-[#eee5df] rounded-xl px-4 py-3">
              <span className="text-lg font-bold text-[#2d1b2e] tracking-wide">{config.wechat}</span>
              <button onClick={copyWechat} className="text-[#C9A24B] text-sm flex items-center gap-1">
                <Copy className="w-4 h-4" /> {copied ? "已复制" : "复制"}
              </button>
            </div>
            <button
              onClick={() => { setShowWechat(false); setBooked(true); }}
              className="mt-6 w-full bg-[#2d1b2e] text-white rounded-full py-3 font-bold hover:opacity-95 transition"
            >
              我已添加，完成预约
            </button>
            <button onClick={() => setShowWechat(false)} className="mt-3 w-full text-gray-400 text-sm py-2">稍后再说</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
