// postinstall 补丁：让 @imgly/background-removal 能在 Node 服务端运行。
//
// 问题：@imgly 本质是为浏览器设计，Node 下有两处不兼容：
//  1) loadAsUrl 用 URL.createObjectURL 把 wasm/model 包成 blob: URL，而 onnxruntime-web
//     用 import() 加载该 blob:，Node 的 ESM loader 不支持 blob: 方案（只支持 file/data/node）。
//  2) 图像解码用 createImageBitmap、编码用 createCanvas/convertToBlob，均为浏览器 API。
//
// 解码/编码的 polyfill 放在运行时（src/lib/tryon/removeBg.ts）。
// 本脚本只 patch 第 1 点：把 loadAsUrl 改为将资源落盘到 os.tmpdir() 并返回 file:// URL，
// Node 原生支持 file: 方案的 import/fetch，从而绕过 blob: 限制。
//
// 幂等：已打过补丁的文件跳过。

import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function resolveCandidates() {
  try {
    const main = require.resolve('@imgly/background-removal');
    // main 形如 .../@imgly/background-removal/dist/index.cjs，dist 目录即其 dirname
    const distDir = path.dirname(main);
    const cands = [];
    for (const f of ['index.mjs', 'index.cjs']) {
      const p = path.join(distDir, f);
      if (existsSync(p)) cands.push(p);
    }
    return cands;
  } catch (e) {
    console.warn('[patch-imgly] 未找到 @imgly/background-removal，跳过补丁');
    return [];
  }
}

const MARK = '// IMGGO_PATCHED_LOADASURL';
const IMPORT_INJECTION = `import { writeFileSync } from 'fs';\nimport os from 'os';\nimport path from 'path';\n${MARK}\n`;
const OLD_FN = `async function loadAsUrl(url, config) {
  return URL.createObjectURL(await loadAsBlob(url, config));
}`;
const NEW_FN = `async function loadAsUrl(url, config) {
  const blob = await loadAsBlob(url, config);
  const ext = url.endsWith('.wasm') ? 'wasm' : url.endsWith('.mjs') ? 'mjs' : url.endsWith('.onnx') ? 'onnx' : 'bin';
  const p = path.join(os.tmpdir(), \`imgly_\${Date.now()}_\${Math.random().toString(36).slice(2, 8)}.\${ext}\`);
  writeFileSync(p, Buffer.from(await blob.arrayBuffer()));
  return 'file://' + p;
}`;

const files = resolveCandidates();
if (files.length === 0) process.exit(0);

let patchedAny = false;
for (const file of files) {
  let src = readFileSync(file, 'utf8');
  if (src.includes(MARK)) {
    console.log(`[patch-imgly] ${path.basename(file)} 已打过补丁，跳过`);
    continue;
  }
  // 1) 注入 import（放在文件顶部）
  if (src.startsWith('import ')) {
    const idx = src.indexOf('\n');
    src = src.slice(0, idx + 1) + IMPORT_INJECTION + src.slice(idx + 1);
  } else {
    src = IMPORT_INJECTION + src;
  }
  // 2) 替换 loadAsUrl
  if (!src.includes(OLD_FN)) {
    console.error(`[patch-imgly] ${path.basename(file)} 未匹配 loadAsUrl，可能 @imgly 已更新，请检查补丁`);
    process.exit(1);
  }
  src = src.replace(OLD_FN, NEW_FN);
  writeFileSync(file, src, 'utf8');
  console.log(`[patch-imgly] 已为 ${path.basename(file)} 打补丁（loadAsUrl -> file://）`);
  patchedAny = true;
}

if (!patchedAny) console.log('[patch-imgly] 无需补丁');
process.exit(0);
