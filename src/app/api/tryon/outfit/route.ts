// app/api/tryon/outfit/route.ts
// 通义百炼 OutfitAnyone（模型 aitryon）整体造型试衣：一次传人物 + 上装 + 下装，
// 完整替换全身套装，保留原脸，输出默认无水印。异步任务模式。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "blocks-images";
const DASHSCOPE_BASE = "https://dashscope.aliyuncs.com";
export const maxDuration = 120;

async function uploadToSupabase(supabase: any, file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
  const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
  const filename = `outfit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${safeExt}`;
  const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
    contentType: file.type || `image/${safeExt === "jpg" ? "jpeg" : safeExt}`,
    upsert: false,
  });
  if (error) throw new Error("上传失败：" + error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
}

export async function POST(request: NextRequest) {
  try {
    // 兼容 JSON（小程序传 URL）与 multipart/form-data（网站传文件）
    const ct = request.headers.get("content-type") || "";
    let personFile: File | null = null;
    let topFile: File | null = null;
    let bottomFile: File | null = null;
    let personImageUrl = "";
    let topImageUrl = "";
    let bottomImageUrl = "";
    if (ct.includes("application/json")) {
      const j = await request.json();
      personImageUrl = j.personImageUrl || "";
      topImageUrl = j.topImageUrl || "";
      bottomImageUrl = j.bottomImageUrl || "";
    } else {
      const form = await request.formData();
      personFile = form.get("personImage") as File | null;
      topFile = form.get("topImage") as File | null;
      bottomFile = form.get("bottomImage") as File | null;
      topImageUrl = (form.get("topImageUrl") as string) || "";
      bottomImageUrl = (form.get("bottomImageUrl") as string) || "";
    }

    if (!personFile && !personImageUrl)
      return NextResponse.json({ error: "请上传人物照片" }, { status: 400 });
    if (!topFile && !topImageUrl && !bottomFile && !bottomImageUrl)
      return NextResponse.json({ error: "请至少上传一件衣服（上装或下装）" }, { status: 400 });

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      console.error("[tryon/outfit] 未配置 DASHSCOPE_API_KEY");
      return NextResponse.json({ error: "试衣服务未配置" }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "存储未配置" }, { status: 500 });
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await supabase.storage.createBucket(BUCKET, { public: true });

    const personUrl = personImageUrl || (personFile ? await uploadToSupabase(supabase, personFile) : "");
    const tUrl = topImageUrl || (topFile ? await uploadToSupabase(supabase, topFile) : "");
    const bUrl = bottomImageUrl || (bottomFile ? await uploadToSupabase(supabase, bottomFile) : "");

    if (!tUrl && !bUrl) return NextResponse.json({ error: "缺少衣服图片" }, { status: 400 });

    const input: any = { person_image_url: personUrl };
    if (tUrl) input.top_garment_url = tUrl;
    if (bUrl) input.bottom_garment_url = bUrl;

    const createRes = await fetch(`${DASHSCOPE_BASE}/api/v1/services/aigc/image2image/image-synthesis`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-DashScope-Async": "enable",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "aitryon",
        input,
        parameters: { resolution: -1, restore_face: true },
      }),
    });
    const createData = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      const msg = createData.message || createData.error || `任务创建失败（${createRes.status}）`;
      console.error("[tryon/outfit] 创建失败", createRes.status, createData);
      return NextResponse.json({ error: msg }, { status: createRes.status });
    }
    const taskId = createData.output?.task_id || createData.task_id;
    if (!taskId) {
      console.error("[tryon/outfit] 未返回 task_id", createData);
      return NextResponse.json({ error: "未返回任务ID" }, { status: 500 });
    }

    let resultUrl = "";
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const tRes = await fetch(`${DASHSCOPE_BASE}/api/v1/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const tData = await tRes.json().catch(() => ({}));
      const out = tData.output || {};
      const status = out.task_status || tData.task_status;
      if (status === "SUCCEEDED") {
        resultUrl = out.image_url || out.results?.[0]?.url || out.result?.url || "";
        break;
      }
      if (status === "FAILED" || status === "CANCELED") {
        const msg = out.message || out.err_code || "生成失败";
        console.error("[tryon/outfit] 任务失败", status, out);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }
    if (!resultUrl) {
      console.error("[tryon/outfit] 生成超时", taskId);
      return NextResponse.json({ error: "生成超时，请重试" }, { status: 504 });
    }

    // 转存到自己的 Supabase（dashscope 结果 URL 仅 24h 有效）
    try {
      const imgRes = await fetch(resultUrl);
      if (imgRes.ok) {
        const imgBuf = Buffer.from(await imgRes.arrayBuffer());
        const outName = `outfit-result-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
        await supabase.storage.from(BUCKET).upload(outName, imgBuf, { contentType: "image/jpeg", upsert: false });
        resultUrl = supabase.storage.from(BUCKET).getPublicUrl(outName).data.publicUrl;
      } else {
        console.warn("[tryon/outfit] 结果图转存失败，回退原始 URL", imgRes.status);
      }
    } catch (e) {
      console.warn("[tryon/outfit] 结果图转存异常", e);
    }

    return NextResponse.json({ ok: true, resultUrl });
  } catch (err: any) {
    console.error("[tryon/outfit] 异常", err);
    return NextResponse.json({ error: err.message || "试衣失败" }, { status: 500 });
  }
}
