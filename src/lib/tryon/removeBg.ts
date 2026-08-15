// src/lib/tryon/removeBg.ts
// 服务端自动抠图去背景 + 合成白底，供 Genlook 试衣使用。
//
// @imgly/background-removal 本质是浏览器库，Node 下需两处兼容（已在别处处理）：
//   - loadAsUrl 的 blob: 限制由 postinstall 脚本（scripts/patch-imgly.mjs）改为落盘 file://
//   - 本文件负责运行时 polyfill：fetch file:// + createImageBitmap/OffscreenCanvas/ImageData
//
// 输出统一为白底 JPEG（长边不足 1024 时放大，满足 Genlook 清晰度要求）。
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Blob } from 'buffer';
import { Canvas, loadImage, ImageData as NapiImageData } from '@napi-rs/canvas';

let polyfilled = false;
function ensurePolyfills() {
  if (polyfilled) return;
  polyfilled = true;

  // 1) fetch 支持 file://：onnxruntime-web 经打过补丁的 loadAsUrl 读取落盘的 wasm/model。
  const _origFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, ...rest: any[]) => {
    if (typeof input === 'string' && input.startsWith('file://')) {
      const p = fileURLToPath(input);
      const buf = readFileSync(p);
      const ext = p.split('.').pop()!.toLowerCase();
      const ct =
        ext === 'wasm' ? 'application/wasm'
        : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg'
        : ext === 'png' ? 'image/png'
        : ext === 'webp' ? 'image/webp'
        : 'application/octet-stream';
      return new Response(buf, { headers: { 'Content-Type': ct } });
    }
    return _origFetch(input, ...rest);
  }) as typeof fetch;

  // 2) canvas / ImageBitmap / ImageData（@napi-rs/canvas，原生、Vercel 友好）
  globalThis.createImageBitmap = (async (blob: any) => {
    const buf = Buffer.from(await blob.arrayBuffer());
    return await loadImage(buf);
  }) as any;

  class OffscreenCanvas extends Canvas {
    convertToBlob(opts: any = {}) {
      const type = opts?.type || 'image/png';
      const buf = this.toBuffer(type, opts?.quality != null ? { quality: opts.quality } : undefined);
      return new Blob([buf], { type });
    }
  }
  (globalThis as any).OffscreenCanvas = OffscreenCanvas;
  (globalThis as any).ImageData = NapiImageData;
}

/** 根据文件头嗅探图片 MIME（@imgly 需要带正确 type 的 Blob 才能解码） */
export function detectMime(buf: Buffer): string {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image/png';
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return 'image/webp';
  // 默认按 JPEG 处理（最通用，@imgly 也接受）
  return 'image/jpeg';
}

/**
 * 把任意上传图自动抠背景并合成白底。
 * @param input 原始图片字节
 * @param mime  图片 MIME
 * @param opts.person 兼容旧调用约定（人像/单品统一输出白底，参数保留仅作接口兼容）
 * @returns 白底 JPEG 字节
 */
export async function removeBackgroundToImage(
  input: Buffer,
  mime: string,
  opts?: { person?: boolean },
): Promise<Buffer> {
  ensurePolyfills();
  const { removeBackground } = await import('@imgly/background-removal');

  // 大图（手机常传 3000~4000px）直接喂给 @imgly 会爆内存：先降到 ≤ MAX_IN 长边再抠图，把内存封顶。
  const MAX_IN = 1280;
  let workBuf = input;
  let workMime = mime;
  try {
    const probe = await loadImage(input);
    const pl = Math.max(probe.width as number, probe.height as number);
    if (pl > MAX_IN) {
      const s = MAX_IN / pl;
      const w = Math.round((probe.width as number) * s);
      const h = Math.round((probe.height as number) * s);
      const pc = new Canvas(w, h);
      const pctx = pc.getContext('2d');
      pctx.drawImage(probe as any, 0, 0, w, h);
      workBuf = pc.toBuffer('image/jpeg', { quality: 0.9 });
      workMime = 'image/jpeg';
    }
  } catch {
    // 探测失败则用原图，交给 @imgly 自行处理
  }

  const inputBlob = new Blob([workBuf], { type: workMime });
  const outBlob = await removeBackground(inputBlob, {
    model: 'isnet_quint8',
    output: { format: 'image/png' },
    device: 'cpu',
    proxyToWorker: false,
    // 默认按"含真人"抠图：真人换衣场景下人物轮廓更完整、不误啃人
    person: opts?.person ?? true,
  } as any);

  const pngBuf = Buffer.from(await outBlob.arrayBuffer());
  const img = await loadImage(pngBuf);
  const W = img.width as number;
  const H = img.height as number;

  // alpha 边缘羽化：磨平硬边/锯齿，去除极淡 halo 白边（人物与衣服图均受益）
  const fCanvas = new Canvas(W, H);
  const fctx = fCanvas.getContext('2d');
  fctx.drawImage(img as any, 0, 0);
  const { data } = fctx.getImageData(0, 0, W, H);
  featherAlpha(data, W, H, 2);
  fctx.putImageData(new NapiImageData(data, W, H), 0, 0);

  const longSide = Math.max(W, H);
  let cw = W;
  let ch = H;
  if (longSide < 1024) {
    const s = 1024 / longSide;
    cw = Math.round(W * s);
    ch = Math.round(H * s);
  }

  const canvas = new Canvas(cw, ch);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(fCanvas as any, 0, 0, cw, ch);
  return canvas.toBuffer('image/jpeg', { quality: 0.92 });
}

// 对 RGBA 缓冲的 alpha 通道做轻量 box blur 羽化，并截断极淡 halo（<32 直接透明）
function featherAlpha(data: Uint8ClampedArray, w: number, h: number, r: number) {
  const n = w * h;
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = data[i * 4 + 3];
  const hb = new Float32Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, cnt = 0;
      for (let k = -r; k <= r; k++) {
        const xx = x + k;
        if (xx >= 0 && xx < w) { sum += a[y * w + xx]; cnt++; }
      }
      hb[y * w + x] = sum / cnt;
    }
  }
  const vb = new Float32Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, cnt = 0;
      for (let k = -r; k <= r; k++) {
        const yy = y + k;
        if (yy >= 0 && yy < h) { sum += hb[yy * w + x]; cnt++; }
      }
      vb[y * w + x] = sum / cnt;
    }
  }
  for (let i = 0; i < n; i++) {
    const v = vb[i];
    data[i * 4 + 3] = v < 32 ? 0 : v;
  }
}
