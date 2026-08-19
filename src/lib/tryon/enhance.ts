// lib/tryon/enhance.ts
// 画质修复 / 人像增强，两条通道：
//   1) 阿里云视觉智能 EnhanceFace（AI 人脸修复增强）—— 配了 AK + 上海 OSS 时优先启用，
//      专修人脸细节、去模糊、提清晰度，最贴近 Wink「人像增强」效果。
//      EnhanceFace 只接受「上海 OSS 链接」作为输入，故函数内部会先把图片临时上传到
//      上海 OSS 中转，调完即删除临时文件。
//   2) sharp 本地增强（零成本兜底）—— AK / OSS 未配置或 AI 调用失败时回退，
//      仍然做了超分 + 锐化 + 通透微调。
//
// 接入点说明（避免日后踩坑）：
//   - ALIYUN_VISION_ACCESS_KEY_ID / ALIYUN_VISION_ACCESS_KEY_SECRET：阿里云 AK（已注入 Vercel）
//   - ALIYUN_OSS_BUCKET / ALIYUN_OSS_REGION / ALIYUN_OSS_ENDPOINT：中转 OSS 配置（待用户建桶后注入）
import sharp from "sharp";
import OSS from "ali-oss";

export interface EnhanceOptions {
  scale?: number; // 超分倍数，默认 2（设为 1 则不放大）
  sharpen?: boolean; // 是否锐化，默认 true
}

export const ALIYUN_VISION_ENABLED = Boolean(
  process.env.ALIYUN_VISION_ACCESS_KEY_ID && process.env.ALIYUN_VISION_ACCESS_KEY_SECRET
);

let _oss: OSS | null = null;
function getOssClient(): OSS | null {
  if (_oss) return _oss;
  const bucket = process.env.ALIYUN_OSS_BUCKET;
  if (!bucket) return null;
  const region = process.env.ALIYUN_OSS_REGION || "cn-shanghai";
  const endpoint = process.env.ALIYUN_OSS_ENDPOINT || `oss-${region}.aliyuncs.com`;
  _oss = new OSS({
    region,
    accessKeyId: process.env.ALIYUN_VISION_ACCESS_KEY_ID as string,
    accessKeySecret: process.env.ALIYUN_VISION_ACCESS_KEY_SECRET as string,
    bucket,
    endpoint,
  });
  return _oss;
}

/** 把图片字节临时上传到上海 OSS，返回公网 URL 与 object key（用于事后清理）。未配置 OSS 返回 null。 */
async function uploadToOss(buffer: Buffer): Promise<{ url: string; key: string } | null> {
  const client = getOssClient();
  if (!client) return null;
  const key = `tryon-tmp/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
  await client.put(key, buffer, { contentType: "image/jpeg" });
  return { url: client.generateObjectUrl(key), key };
}

/**
 * 阿里云视觉智能：人脸修复增强（EnhanceFace）。
 * @param input 原始图片字节（内部自动上传上海 OSS 中转，调完清理临时文件）
 * @returns 增强后的图片 Buffer；未配置 / 失败 / 返回异常时返回 null（由调用方回退 sharp）
 */
export async function enhanceFaceViaAlibaba(input: Buffer): Promise<Buffer | null> {
  if (!ALIYUN_VISION_ENABLED) return null;
  if (!process.env.ALIYUN_OSS_BUCKET) {
    console.warn("[enhance] 未配置 ALIYUN_OSS_BUCKET，无法使用 AI 增强，回退本地");
    return null;
  }
  const tmp = await uploadToOss(input);
  if (!tmp) return null;
  try {
    const pkg: any = await import("@alicloud/pop-core");
    const RPCClient = pkg.default || pkg;
    const client = new RPCClient({
      accessKeyId: process.env.ALIYUN_VISION_ACCESS_KEY_ID as string,
      accessKeySecret: process.env.ALIYUN_VISION_ACCESS_KEY_SECRET as string,
      endpoint: "https://facebody.cn-shanghai.aliyuncs.com",
      apiVersion: "2019-12-30",
    });
    const res: any = await client.request("EnhanceFace", { ImageURL: tmp.url }, { method: "POST" });
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
  } finally {
    try {
      await getOssClient()?.delete(tmp.key);
    } catch {
      /* 临时文件清理失败不阻断主流程 */
    }
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

  return pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}
