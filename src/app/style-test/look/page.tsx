"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { STYLE_GARMENTS, sortByPredicted } from "@/lib/style-tryon";
import { motion } from "framer-motion";
import {
  Camera,
  Loader2,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Home,
} from "lucide-react";

interface TryonResult {
  id: string;
  name: string;
  url: string | null;
  error?: string;
}

export default function StyleTryonPage() {
  const supabase = createClient();
  const [predicted, setPredicted] = useState<string | null>(null);

  const [personFile, setPersonFile] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [personUrl, setPersonUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TryonResult[]>([]);

  const [selected, setSelected] = useState<string[]>([]);
  const [concluded, setConcluded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 可选：如果当前有 Supabase 会员登录，读取问卷预测风格做预排序
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("style_test_results")
          .select("main_style")
          .eq("gender", "female")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.main_style) setPredicted(data.main_style);
      } catch {
        // 未登录或 RLS 失败时静默跳过，不阻塞试穿
      }
    })();
  }, [supabase]);

  const garments = sortByPredicted(STYLE_GARMENTS, predicted);

  const getGarmentUrl = (path: string) =>
    supabase.storage.from("blocks-images").getPublicUrl(path).data.publicUrl;

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPersonFile(f);
    setPersonPreview(URL.createObjectURL(f));
    setPersonUrl(null);
    setResults([]);
    setSelected([]);
    setConcluded(false);
    // 上传后自动处理白底，少一步操作
    uploadPerson(f);
  };

  const uploadPerson = async (file?: File) => {
    const target = file || personFile;
    if (!target) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("personImage", target);
      const res = await fetch("/api/tryon/upload-person", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "上传失败");
      setPersonUrl(data.personImageUrl);
    } catch (err: any) {
      alert("人像处理失败：" + (err.message || "请重试"));
    } finally {
      setUploading(false);
    }
  };

  const startTryon = async () => {
    if (!personUrl) {
      await uploadPerson();
      if (!personUrl) return;
    }
    setRunning(true);
    setResults([]);
    setSelected([]);
    setConcluded(false);

    // 初始化 8 个空位；按每批 4 件并行生成（兼顾总时长与接口限流，避免串行超时 / 全并发受限）
    setResults(garments.map((g) => ({ id: g.id, name: g.name, url: null })));

    const BATCH = 4;
    for (let b = 0; b < garments.length; b += BATCH) {
      const batch = garments.slice(b, b + BATCH);
      await Promise.all(
        batch.map(async (g) => {
          try {
            const fd = new FormData();
            fd.append("personImageUrl", personUrl!);
            fd.append("garmentImageUrl", getGarmentUrl(g.storagePath));
            fd.append("userId", "style-tryon");
            const res = await fetch("/api/tryon/generate", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || "试衣失败");
            setResults((prev) => prev.map((r) => (r.id === g.id ? { ...r, url: data.resultUrl } : r)));
          } catch (err: any) {
            setResults((prev) => prev.map((r) => (r.id === g.id ? { ...r, error: err.message } : r)));
          }
        })
      );
    }
    setRunning(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) {
        alert("最适合的风格最多选 2 个");
        return prev;
      }
      return [...prev, id];
    });
  };

  const saveConclusion = async () => {
    const picks = garments.filter((g) => selected.includes(g.id));
    const primary = picks[0]?.name || "";
    try {
      // 如果当前有 Supabase 会员登录，顺便把结论落库；没登录就只本地展示，不弹任何提示
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("style_test_results").insert([
          {
            gender: "female",
            answers: {},
            main_style: primary,
            sub_style: picks.slice(1).map((p) => p.name).join("/") || null,
            source: "tryon_style_test",
          },
        ]);
      }
      setConcluded(true);
    } catch {
      // 登录/session 任何异常都不影响展示结论
      setConcluded(true);
    }
  };

  const reset = () => {
    setResults([]);
    setSelected([]);
    setConcluded(false);
    setCurrentIdx(-1);
  };

  const selectedGarments = garments.filter((g) => selected.includes(g.id));
  const matchPredicted =
    predicted && selectedGarments.some((g) => g.name === predicted);

  return (
    <div className="min-h-screen bg-[#1a1018] text-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 bg-[#1a1018]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/style-test" className="flex items-center gap-2 text-white/80 hover:text-white">
            <Home className="w-4 h-4" /> 风格测试
          </Link>
          <span className="font-bold text-[#C9A24B]">八大风格 · 真人试穿</span>
          <span className="w-4" />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#2d1b2e] to-[#3a233a] py-10 px-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#C9A24B]/20 mb-3">
          <Sparkles className="w-6 h-6 text-[#C9A24B]" />
        </div>
        <h1 className="text-2xl font-bold">把真人套进 8 大风格测试衣</h1>
        <p className="text-white/70 text-sm mt-2 max-w-md mx-auto">
          上传你的真人照，逐一试穿八大风格代表款，用眼睛判断哪几款最像你——比问卷更直观。
        </p>
        {predicted && (
          <div className="mt-4 inline-block px-4 py-2 rounded-full bg-[#C9A24B]/15 text-[#C9A24B] text-xs font-medium">
            问卷预测你的主风格：{predicted}（已优先试穿）
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Step 1 上传人像 */}
        <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h2 className="font-bold text-[#C9A24B] mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#C9A24B] text-[#1a1018] text-xs flex items-center justify-center font-bold">1</span>
            上传你的真人照
          </h2>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          <div className="rounded-xl border border-[#C9A24B]/20 bg-[#C9A24B]/5 p-3 mb-3 text-xs text-white/70 space-y-1">
            <p className="text-[#C9A24B] font-medium">拍照要求（直接影响试穿效果）</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li><b className="text-white/90">正面站立，双腿自然伸直并拢，双手自然下垂</b>（不要凹造型、不要摆 pose）</li>
              <li>全身或至少膝盖以上入镜，衣服轮廓清楚，不要裁掉手脚</li>
              <li><b className="text-white/90">面无表情，不要笑太用力</b>（试衣会继承你的表情与嘴型）</li>
              <li>自己的衣服自然垂落，<b className="text-white/90">不要扎进裤/裙腰</b></li>
              <li>不穿内搭、真空拍摄也可以（下装由系统统一配黑裙）</li>
              <li>光线均匀，背景干净（白墙/纯色最佳）</li>
            </ul>
          </div>
          {!personPreview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-10 rounded-xl border-2 border-dashed border-white/20 hover:border-[#C9A24B]/60 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm">点击上传正面、光线良好的半身/全身照</span>
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <img src={personPreview} alt="人像" className="w-20 h-20 object-cover rounded-xl border border-white/20" />
              <div className="flex-1">
                <p className="text-sm text-white/80">{personFile?.name}</p>
                {uploading ? (
                  <p className="text-xs text-[#C9A24B] mt-1 flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" />自动处理白底中…</p>
                ) : personUrl ? (
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />已处理白底，可开始试穿</p>
                ) : (
                  <button
                    onClick={() => uploadPerson()}
                    className="mt-2 px-4 py-1.5 rounded-lg bg-[#C9A24B] text-[#1a1018] text-xs font-semibold"
                  >
                    重试处理白底
                  </button>
                )}
                <button onClick={() => fileRef.current?.click()} className="ml-2 text-xs text-white/50 underline">重新选择</button>
              </div>
            </div>
          )}
        </section>

        {/* Step 2 开始试穿 */}
        <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h2 className="font-bold text-[#C9A24B] mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#C9A24B] text-[#1a1018] text-xs flex items-center justify-center font-bold">2</span>
            开始 8 套试穿
          </h2>
          <p className="text-xs text-white/60 mb-3">
            每张风格衣会调用一次试衣（约 15–40 秒），共 8 张，请保持页面打开。
          </p>
          <button
            onClick={startTryon}
            disabled={!personUrl || running}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A24B] to-[#e0b85c] text-[#1a1018] font-bold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {running ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 试穿中 {results.filter(r => r.url || r.error).length}/{garments.length}…</>
            ) : !personPreview ? (
              "请先上传真人照"
            ) : uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 白底处理中，完成后即可试穿</>
            ) : !personUrl ? (
              "白底处理失败，请重试"
            ) : (
              "开始 8 套风格试穿"
            )}
          </button>
        </section>

        {/* Step 3 结果网格 */}
        {(results.length > 0 || running) && (
          <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="font-bold text-[#C9A24B] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#C9A24B] text-[#1a1018] text-xs flex items-center justify-center font-bold">3</span>
              试穿效果（点击选择最适合你的，最多 2 个）
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {garments.map((g, i) => {
                const r = results.find((x) => x.id === g.id);
                const isSel = selected.includes(g.id);
                return (
                  <motion.button
                    key={g.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => r?.url && toggleSelect(g.id)}
                    className={`relative rounded-xl overflow-hidden border-2 text-left ${isSel ? "border-[#C9A24B]" : "border-white/10"} ${r?.url ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="aspect-[3/4] bg-black/40 flex items-center justify-center">
                      {r?.url ? (
                        <img src={r.url} alt={g.name} className="w-full h-full object-cover" />
                      ) : r?.error ? (
                        <span className="text-[10px] text-red-300 p-2 text-center">{r.error}</span>
                      ) : (
                        <Loader2 className="w-7 h-7 text-[#C9A24B] animate-spin" />
                      )}
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/50 text-[11px] font-medium">
                      {g.name}
                    </div>
                    {isSel && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#C9A24B] flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1a1018]" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 4 结论 */}
        {results.length === garments.length && !running && (
          <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="font-bold text-[#C9A24B] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#C9A24B] text-[#1a1018] text-xs flex items-center justify-center font-bold">4</span>
              我的风格结论
            </h2>
            {!concluded ? (
              <div className="text-center">
                <p className="text-sm text-white/70 mb-3">已选 {selected.length}/2 个风格</p>
                  <button
                  onClick={saveConclusion}
                  disabled={selected.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#C9A24B] text-[#1a1018] font-bold disabled:opacity-40"
                >
                  生成我的风格结论
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-[#C9A24B]/10 border border-[#C9A24B]/30 p-4">
                  <p className="text-xs text-white/60 mb-1">结合你的试穿选择，最适合你的风格</p>
                  <p className="text-lg font-bold text-[#C9A24B]">
                    {selectedGarments.map((g) => g.name).join(" / ")}
                  </p>
                </div>
                {predicted && (
                  <div className={`rounded-xl p-3 text-sm ${matchPredicted ? "bg-green-500/10 text-green-300" : "bg-amber-500/10 text-amber-300"}`}>
                    {matchPredicted
                      ? `✓ 与问卷预测（${predicted}）一致`
                      : `试穿结论与问卷预测（${predicted}）不同——以你眼睛看到的试穿效果为准`}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {selectedGarments.map((g) => (
                    <span key={g.id} className="px-3 py-1 rounded-full bg-white/10 text-xs">{g.short}</span>
                  ))}
                </div>
                <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-white/50 underline">
                  <RotateCcw className="w-3.5 h-3.5" /> 重新试穿
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
