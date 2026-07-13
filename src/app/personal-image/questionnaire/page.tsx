"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, Upload, ChevronUp, ArrowLeft } from "lucide-react";

/* ==================== 题目定义（色彩风格诊断问卷 · 21 项） ==================== */
const INPUT_QUESTIONS = [
  { id: "full_name", label: "1. 你的名字", type: "text", placeholder: "请输入", required: true },
  { id: "wechat_id", label: "2. 你的微信号", type: "text", placeholder: "请输入微信号（用于联系）", required: true },
  { id: "age", label: "3. 年龄", type: "text", placeholder: "请输入", required: true },
  { id: "video_course_info", label: "4. 是否视频课学员，你在几号社群，微信名？（优先连）", type: "text", placeholder: "请输入", required: true },
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

export default function VipDiagnosisQuestionnairePage() {
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<Record<string, any>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [photoNote, setPhotoNote] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>(["", "", ""]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const requireLogin = () => {
    if (!user) {
      setError("请先登录后再填写问卷");
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
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!requireLogin()) return;
    const err = validate();
    if (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

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
      if (!res.ok) {
        setError(data.error || "提交失败");
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setError(e.message || "提交失败");
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f5f3f0] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-[#2d8a4e] mx-auto" />
          <h2 className="text-xl font-bold text-[#2d1b2e] mt-4">提交成功</h2>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            我们已收到你的色彩风格诊断问卷，将按「喜欢 + 适合 + 需要」的规则为你选款，<br />
            结果会通过微信通知你。
          </p>
          <Link
            href="/personal-image"
            className="inline-block mt-6 px-6 py-3 bg-[#2d1b2e] text-white rounded-full text-sm font-semibold hover:opacity-95 transition"
          >
            返回个人形象诊断
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3f0] py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* 返回 + Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/personal-image" className="inline-flex items-center gap-1 text-[#2d1b2e] text-sm hover:opacity-70">
            <ArrowLeft className="w-4 h-4" /> 返回
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#2d1b2e]">VIP 形象诊断问卷</h1>
          <p className="text-gray-500 text-sm mt-1">色彩形象诊断风格判断 · 共 21 题，请详细填写，我们将以微信形式通知你结果</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {!user && !authLoading && (
          <div className="mb-6 flex items-center justify-between gap-3 p-4 rounded-lg bg-[#2d1b2e]/5 border border-[#2d1b2e]/10 text-sm">
            <span className="text-[#2d1b2e]">填写问卷需先登录</span>
            <Link href="/login" className="px-4 py-2 bg-[#2d1b2e] text-white rounded-full text-xs font-semibold hover:opacity-95">
              去登录
            </Link>
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 outline-none text-sm bg-gray-50/50"
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
                        ? "bg-[#2d1b2e] text-white border-[#2d1b2e]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-[#C9A24B]/50"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${answers[q.id] === opt ? "border-white bg-white" : "border-gray-300"}`}>
                      {answers[q.id] === opt && <span className="w-2 h-2 rounded-full bg-[#C9A24B]" />}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
              {/* 第12题配图 */}
              {q.id === "q12" && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <p className="font-medium text-gray-700 text-sm mb-3">上衣长度参考</p>
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img src="/images/form-reference/q12.jpg" alt="上衣长度参考" className="w-full h-auto object-contain" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Q18: 需要提供的照片（填写者回答区） */}
          <div className="pt-6 border-t border-gray-100">
            <label className="block text-base font-bold text-gray-900 mb-3">18. 需要提供的照片</label>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>1: 一张后背图：示例如下</p>
              <p>注意：拍后背是为了分清直曲，红框区域需要露出来，肩和背可以不露肤，最好穿贴身衣服</p>
              <div className="rounded-lg overflow-hidden border border-gray-200 my-2">
                <img src="/images/form-reference/q18.jpg" alt="后背参考图" className="w-full h-auto object-contain max-h-48" />
              </div>
              <p>2: 多张生活照 要求：</p>
              <ul className="list-decimal pl-8 space-y-1">
                <li>1: 最好全身照或大半身照</li>
                <li>2: 不能戴口罩</li>
                <li>3: 面部清晰</li>
                <li>4: 最好不同场合，不同颜色、款式</li>
              </ul>
            </div>
            <textarea
              value={photoNote}
              onFocus={() => requireLogin()}
              onChange={(e) => requireLogin() && setPhotoNote(e.target.value)}
              placeholder="填写者回答区"
              rows={4}
              className="mt-3 w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20 outline-none text-sm bg-gray-50/50 resize-vertical"
            />
          </div>

          {/* Q19-Q21: 图片文件上传（三组） */}
          {[19, 20, 21].map((num) => {
            const idx = num - 19;
            return (
              <div key={num} className="pt-4">
                <label className="block text-base font-bold text-gray-900 mb-2">
                  {num === 19 ? "*19." : `${num}.`}图片文件{["一", "二", "三"][idx]}
                </label>
                <div
                  className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#C9A24B]/40 transition-colors cursor-pointer"
                  onClick={() => document.getElementById(`vip-img-${idx}`)?.click()}
                >
                  {imageUrls[idx] ? (
                    <div className="space-y-2">
                      <img src={imageUrls[idx]} alt={`图片${["一", "二", "三"][idx]}`} className="max-h-48 mx-auto rounded-lg object-contain" />
                      <p className="text-xs text-green-600">已上传 ✓</p>
                    </div>
                  ) : uploadingIndex === idx ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-[#C9A24B]" />
                      <p className="text-sm text-gray-500">上传中...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-10 h-10 text-gray-400" />
                      <p className="text-base text-[#C9A24B] font-medium">↑ 点击上传图片</p>
                      <p className="text-xs text-gray-400">JPG / PNG / WEBP / GIF，单张 ≤ 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  id={`vip-img-${idx}`}
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
              className="w-full py-3.5 bg-[#2d1b2e] text-white font-semibold rounded-xl hover:bg-[#3a233c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? "提交中..." : "提交问卷"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 mb-2">所有信息仅用于色彩风格诊断，严格保密</p>

        {/* 回到顶部 */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-10 h-10 bg-[#2d1b2e] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#3a233c] transition-colors z-50"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
