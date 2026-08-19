// lib/tryon/enhance.ts
// 画质修复 / 人像增强：基于 sharp 的本地增强（零成本、无需额外凭证）。
// 针对 AI 试衣图常见的"整体偏糊、人脸/衣物纹理不清、压缩噪点"做优化：
//   1) 超分放大（lanczos3 插值，默认 2x，让画面更大更清晰）
//   2) unsharp 锐化（提升边缘与纹理清晰度，画质修复最直观效果）
//   3) 轻微提亮 + 增饱和（让画面更通透干净，贴近 Wink 修复风格）
//
// 未来若接入阿里云视觉智能 EnhancePortrait / DashScope 超分模型，只需替换
// enhanceBuffer 内部实现即可，调用方（generate / enhance 路由）无需改动。
import sharp from "sharp";

export interface EnhanceOptions {
  scale?: number; // 超分倍数，默认 2（设为 1 则不放大）
  sharpen?: boolean; // 是否锐化，默认 true
}

export async function enhanceBuffer(
  input: Buffer,
  opts: EnhanceOptions = {}
): Promise<Buffer> {
  const { scale = 2, sharpen = true } = opts;
  const meta = await sharp(input, { failOn: "none" }).metadata();

  let pipeline = sharp(input, { failOn: "none" });

  // 1) 超分放大
  if (scale > 1 && meta.width && meta.height) {
    pipeline = pipeline.resize({
      width: Math.round(meta.width * scale),
      height: Math.round(meta.height * scale),
      kernel: "lanczos3",
    });
  }

  // 2) 锐化（unsharp mask）提升清晰度
  if (sharpen) {
    pipeline = pipeline.sharpen(1.5, 1.0, 2.5);
  }

  // 3) 通透度微调
  pipeline = pipeline.modulate({ brightness: 1.02, saturation: 1.05 });

  return pipeline
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}
