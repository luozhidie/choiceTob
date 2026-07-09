"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
  User, CheckCircle2, AlertCircle, Loader2, Camera,
  LogIn, UserPlus, ChevronUp, X, Upload, Image as ImageIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

/* ==================== 题目定义 ==================== */
const INPUT_QUESTIONS = [
  { id: "full_name", label: "1. 你的名字", type: "text", placeholder: "请输入", required: true },
  { id: "wechat_id", label: "2. 你的微信号", type: "text", placeholder: "请输入微信号（用于联系）", required: true },
  { id: "age", label: "3. 年龄", type: "text", placeholder: "请输入", required: true },
  { id: "video_course_info", label: "4. 是否视频课学员，你在几号社群，微信名？（优先连	）", type: "text", placeholder: "请输入", required: true },
  { id: "look_vs_age", label: "5. 看上去会比同年人（ ）？", type: "text", placeholder: "请输入", required: true },
  { id: "height", label: "6. 身高：", type: "text", placeholder: "请输入", required: true },
];

const CHOICE_QUESTIONS = [
  { id: "q7", label: "7. 你看起来的身高和实际身高相比会：", options: ["A. 显高", "B. 显矮", "C. 正常", "D. 不知道"], required: true },
  { id: "q8", label: "8. 有没有擅长体育项目：（跑步、打球、瑜伽、舞蹈等都算，比别人学起来厉害，甚至有拿奖）", options: ["A. 有", "B. 没有"], required: true },
  { id: "q9", label: "9. 你穿正装与休闲装哪个好看？", options: ["A. 正装有气质", "B. 休闲装好看", "C. 都差不多", "D. 不知道"], required: true },
  { id: "q10", label: "10. 穿裤装和裙装哪个好看？", options: ["A. 裤装", "B. 裙装", "C. 都差不多，没区别", "D. 不知道"], required: true },
  { id: "q11", label: "11. 你穿连衣裙和半裙哪个好看？", options: ["A. 连衣裙", "B. 半裙", "C. 都差不多", "D. 不知道"], required: true },
  { id: "q12", label: "12. 你穿上衣（不是风衣大衣）到哪个长度好看？", options: ["A. 短款", "B. 中款", "C. 长款", "D. 都差不多"], required: true },
  { id: "q13", label: "13. 有没有这样的现象：你穿的衣服的面料看上去价值感高就好看，价值感一般的就不好看？", options: ["A. 有", "B. 没有"], required: true },
  { id: "q14", label: "14. 你小时候会不会调皮淘气，上墙爬树的行为？", options: ["A. 有", "B. 没有"], required: true },
  { id: "q15", label: "15. 你在青春期身型发育上（前凸后翘）和同年人相比", options: ["A. 会早些", "B. 正常发育", "C. 较晚"], required: true },
  { id: "q16", label: "16. 洗完脸后当时皮肤会不会白一些，过一段时间又恢复。", options: ["A. 会", "B. 不会"], required: true },
  { id: "q17", label: "17. 平时会不会容易脸红（不包括大的运动、害羞、喝酒等）", options: ["A. 容易", "B. 不容易"], required: true },
];

/* ==================== 组件 ==================== */
export default function StyleTestPage() {
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<Record<string, any>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [photoNote, setPhotoNote] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>(["", "", ""]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const supabase = createClient();

  // 需要登录的操作：点击输入框/选项时检查
  const requireLogin = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const validate = () => {
    for (const q of INPUT_QUESTIONS) {
      if (q.required && !form[q.id]) return `请填写：${q.label.replace(/^\d+\.\s*/, "")}`;
    }
    for (const q of CHOICE_QUESTIONS) {
      if (q.required && !answers[q.id]) return `请选择：${q.label.replace(/^\d+\.\s*/, "")}`;
    }
    return "";
  };

  // 图片上传（调用 /api/upload → Supabase Storage）
  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || "上传失败");
        return;
      }
      const urls = [...imageUrls];
      urls[index] = data.url;
      setImageUrls(urls);
    } catch (err: any) {
      alert(err.message || "上传失败");
    } finally {
      setUploadingIndex(null);
      // 重置 input 以便重复选同一文件
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!requireLogin()) return;
    const err = validate();
    if (err) { setError(err); window.scrollTo({ top: 0, behavior: "smooth" }); return; }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        full_name: form.full_name,
        wechat_id: form.wechat_id || null,
        age: form.age,
        video_course_info: form.video_course_info || null,
        look_vs_age: form.look_vs_age || null,
        height: form.height || null,
        answers,
        photo_note: photoNote || null,
        photo_urls_1: imageUrls[0] ? [imageUrls[0]] : [],
        photo_urls_2: imageUrls[1] ? [imageUrls[1]] : [],
        photo_urls_3: imageUrls[2] ? [imageUrls[2]] : [],
      };
      const res = await fetch("/api/style-test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "提交失败"); setSubmitting(false); return; }
      setSuccess(true);
    } catch (e: any) { setError(e.message || "提交失败"); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">骆</span>
            </div>
            <span className="font-bold text-lg text-primary">骆芷蝶智选</span>
          </Link>
          <h1 className="text-2xl font-bold text-primary">色彩风格诊断问卷</h1>
          <p className="text-gray-500 text-sm mt-1">请详细填写以下内容进行预约，我们将以微信形式通知你结果</p>
        </div>

        {/* 风格测试会员 ¥99 */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-5 mb-6 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">风格测试会员 · ¥99</h3>
              <p className="text-xs text-white/80 mt-0.5">14道题自动出结果 · 解锁专属色彩风格诊断</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-2xl font-black">¥99</span>
            <div className="flex gap-2">
              <Link href="/style-test/female" className="px-3 py-1.5 bg-white text-primary text-xs font-semibold rounded-lg hover:bg-white/90 transition-colors">女士</Link>
              <Link href="/style-test/male" className="px-3 py-1.5 bg-white text-primary text-xs font-semibold rounded-lg hover:bg-white/90 transition-colors">男士</Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8">
          {/* 输入题 1-6 */}
          {INPUT_QUESTIONS.map((q) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                {q.label} {q.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={form[q.id] || ""}
                onFocus={() => requireLogin()}
                onChange={(e) => requireLogin() && setForm((p) => ({ ...p, [q.id]: e.target.value }))}
                placeholder={q.placeholder}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-gray-50/50"
              />
            </div>
          ))}

          {/* 单选题 7-17 */}
          {CHOICE_QUESTIONS.map((q) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                {q.label} {q.required && <span className="text-red-500">*</span>}
              </label>
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { if (!requireLogin()) return; setAnswers((p) => ({ ...p, [q.id]: opt })) }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all flex items-center gap-3 ${
                      answers[q.id] === opt
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-700 border-gray-200 hover:border-primary/50"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${answers[q.id] === opt ? "border-white bg-white" : "border-gray-300"}`}>
                      {answers[q.id] === opt && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
              {/* 第12题配图：仅Q12显示 */}
              {q.id === 'q12' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <p className="font-medium text-gray-700 text-sm mb-3">上衣长度参考</p>
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img src="/images/form-reference/q12.jpg" alt="上衣长度参考" className="w-full h-auto object-contain" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ═══ Q18: 需要提供的照片（填写者回答区） ═══ */}
          <div className="pt-6 border-t border-gray-100">
            <label className="block text-base font-bold text-gray-900 mb-3">
              18.需要提供的照片
            </label>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>1:一张后背图：示例如下</p>
              <p>注意：拍后背是为了分清直曲，红框区域需要露出来，肩和背可以不露肤，最好穿贴身衣服</p>
              <div className="rounded-lg overflow-hidden border border-gray-200 my-2">
                <img src="/images/form-reference/q18.jpg" alt="后背参考图" className="w-full h-auto object-contain max-h-48" />
              </div>
              <p>2:多张生活照 要求：</p>
              <p className="pl-4">质量：</p>
              <ul className="list-decimal pl-8 space-y-1">
                <li>1:最好全身照或大半身照</li>
                <li>2:不能戴口罩</li>
                <li>3:面部清晰</li>
                <li>4:最好不同场合，不同颜色、款式</li>
              </ul>
            </div>
            <textarea
              value={photoNote}
              onFocus={() => requireLogin()}
              onChange={(e) => requireLogin() && setPhotoNote(e.target.value)}
              placeholder="填写者回答区"
              rows={4}
              className="mt-3 w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-gray-50/50 resize-vertical"
            />
          </div>

          {/* ═══ Q19-Q21: 图片文件上传（三组） ═══ */}
          {[19, 20, 21].map((num) => {
            const idx = num - 19;
            return (
              <div key={num} className="pt-4">
                <label className="block text-base font-bold text-gray-900 mb-2">
                  {num === 19 ? "*19." : `${num}.`}图片文件{["一", "二", "三"][idx]}
                </label>
                <div
                  className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => document.getElementById(`style-img-${idx}`)?.click()}
                >
                  {imageUrls[idx] ? (
                    <div className="space-y-2">
                      <img src={imageUrls[idx]} alt={`图片${["一","二","三"][idx]}`} className="max-h-48 mx-auto rounded-lg object-contain" />
                      <p className="text-xs text-green-600">已上传 ✓</p>
                    </div>
                  ) : uploadingIndex === idx ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-gray-500">上传中...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-10 h-10 text-gray-400" />
                      <p className="text-base text-pink-400 font-medium">↑ 点击上传图片（0/10）</p>
                      <p className="text-xs text-gray-400">当前设置：最多上传10张图片，单个图片10MB以内</p>
                    </div>
                  )}
                </div>
                <input
                  id={`style-img-${idx}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleImageUpload(idx, e)}
                />
              </div>
            );
          })}

          {/* 提交 */}
          <div className="pt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? "提交中..." : "提交"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 mb-2">所有信息仅用于色彩风格诊断，严格保密</p>

        {/* 回到顶部 */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-6 right-6 w-10 h-10 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-50">
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>

      {/* 登录提示弹窗（填写时触发） */}
      {showLoginPrompt && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowLoginPrompt(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary">
                <User className="w-5 h-5 inline-block mr-1 -mt-0.5" /> 请先登录
              </h3>
              <button onClick={() => setShowLoginPrompt(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">登录后即可填写色彩风格诊断问卷</p>
            <div className="space-y-3">
              <Link href="/login?redirect=/style-test" onClick={() => setShowLoginPrompt(false)} className="block w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl text-center hover:bg-primary/90 transition-colors">
                去登录
              </Link>
              <Link href="/register?redirect=/style-test" onClick={() => setShowLoginPrompt(false)} className="block w-full py-3 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl text-center hover:bg-gray-50 transition-colors">
                去注册
              </Link>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="block w-full py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl text-center"
              >
                再看看
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 提交成功 */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-sm w-full text-center">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-primary mb-2">提交成功！</h2>
            <p className="text-gray-500 text-sm mb-6">您的色彩风格诊断问卷已提交，我们的专业顾问将在 24 小时内与您联系，请留意微信消息。</p>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors">
              返回首页
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}
