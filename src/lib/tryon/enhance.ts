// lib/tryon/enhance.ts
// 画质修复 / 人像增强，两条通道：
//   1) 阿里云视觉智能 EnhanceFace（AI 人脸修复增强）—— 配了 AK 时优先启用，
//      专修人脸细节、去模糊、提清晰度，最贴近 Wink「人像增强」效果。
//   2) sharp 本地增强（零成本兜底）—— AK 未配置或 AI 调用失败时回退，
//      仍然做了超分 + 锐化 + 通透微调。
//
// 接入点说明（避免日后踩坑）：
//   EnhanceFace 需要公网可访问的图片 URL 作为输入；因此 generate / outfit 在把试衣结果
//   转存到 Supabase 得到公共 URL 之后，再拿该 URL 去调 AI，最后把返回的图重新落盘。
import sharp from "sharp";

export interface EnhanceOptions {
  scale?: number; // 超分倍数，默认 2（设为 1 则不放大）
  sharpen?: boolean; // 是否锐化，默认 true
}

export const ALIYUN_VISION_ENABLED = Boolean(
  process.env.ALIYUN_VISION_ACCESS_KEY_ID && process.env.ALIYUN_VISION_ACCESS_KEY_SECRET
);

/**
 * 阿里云视觉智能：人脸修复增强（EnhanceFace）。
 * @param imageUrl 公网可访问的图片地址
 * @returns 增强后的图片 Buffer；无 key / 失败 / 返回异常时返回 null（由调用方回退 sharp）
 */
export async function enhanceFaceViaAlibaba(imageUrl: string): Promise<Buffer | null> {
  if (!ALIYUN_VISION_ENABLED) return null;
  try {
    const pkg: any = await import("@alicloud/pop-core");
    const RPCClient = pkg.default || pkg;
    const client = new RPCClient({
      accessKeyId: process.env.ALIYUN_VISION_ACCESS_KEY_ID as string,
      accessKeySecret: process.env.ALIYUN_VISION_ACCESS_KEY_SECRET as string,
      endpoint: "https://facebody.cn-shanghai.aliyuncs.com",
      apiVersion: "2019-12-30",
    });
    const res: any = await client.request("EnhanceFace", { ImageURL: imageUrl }, { method: "POST" });
    const outUrl: string | undefined = res?.Data?.ImageURL || res?.Data?.ResultURL;
    if (!outUrl) {
      console.warn("[enhance] 阿里云 EnhanceFace 未返回图片地址");
      return null;
    }
    const r = await fetch(outUrl);
    if (!r.ok) {
      console.warn("[enhance] 阿里云 EnhanceFace 结果下载失败", r.status);
      return null;
    }
    return Buffer.from(await r.arrayBuffer());
  } catch (e: any) {
    console.warn("[enhance] 阿里云 EnhanceFace 调用失败，将回退本地增强：", e?.message || e);
    return null;
  }
}

/**
 * sharp 本地画质增强（零成本兜底）：超分放大 + 锐化 + 通透微调。
 */
export async function enhanceBuffer(input: Buffer, opts: EnhanceOptions = {}): Promise<Buffer> {
  const { scale = 2, sharpen = true } = opts;
  const meta = await sharp(input, { failOn: "none" }).metadata();
  let pipeline = sharp(input, { failOn: "none" });

  if (scale > 1 && meta.width && meta.height) {
    pipeline = pipeline.resize({
      width: Math.round(meta.width * scale),
      height: Math.round(meta.height * scale),
      kernel: "lanczos3",
    });
  }
  if (sharpen) {
    pipeline = pipeline.sharpen(1.5, 1.0, 2.5);
  }
  pipeline = pipeline.modulate({ brightness: 1.02, saturation: 1.05 });

  return pipeline
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}
