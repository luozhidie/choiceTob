#!/usr/bin/env node
/**
 * 微购相册 → 骆芷蝶智选 自动上传监听器
 *
 * 用法：
 *   1. npm install  （仅需一次，安装 @supabase/supabase-js）
 *   2. 复制 .env.example 为 .env，填入 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *   3. node watcher.js  [要监听的文件夹路径]
 *
 * 工作流程：
 *   - 你从微购相册 一键转发 → 发到「文件传输助手」
 *   - 电脑版微信把图存到监听文件夹（或你拖进去）
 *   - 本脚本自动把新图上传到骆芷蝶智选后台 → 出现在「图片抓取工具 / 待处理图片」
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// ── 读取 .env（极简解析，避免额外依赖）──
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf8")
      .split("\n")
      .forEach((line) => {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      });
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.BUCKET || "products";
const PREFIX = process.env.PREFIX || "incoming";
const WATCH_DIR = process.argv[2] || process.env.WATCH_DIR || path.join(process.cwd(), "watch");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ 请在 .env 中配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif", "bmp"];
const processing = new Set();

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

// 等待文件写入稳定（大小不再变化）
function waitStable(filePath, tries = 20) {
  return new Promise((resolve, reject) => {
    let last = -1;
    let count = 0;
    const check = () => {
      try {
        const size = fs.statSync(filePath).size;
        if (size === last) {
          resolve(true);
        } else {
          last = size;
          if (count++ > tries) return reject(new Error("写入超时"));
          setTimeout(check, 300);
        }
      } catch (e) {
        reject(e);
      }
    };
    check();
  });
}

async function uploadImage(filePath) {
  const ext = (path.extname(filePath).replace(".", "") || "jpg").toLowerCase();
  if (!IMAGE_EXT.includes(ext)) {
    log(`⏭ 跳过非图片: ${path.basename(filePath)}`);
    return;
  }
  const filename = path.basename(filePath);
  const storagePath = `${PREFIX}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    await waitStable(filePath);
    const fileBuf = fs.readFileSync(filePath);

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuf, { contentType: `image/${ext === "jpg" ? "jpeg" : ext}`, upsert: false });
    if (upErr) throw upErr;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    const { error: insErr } = await supabase
      .from("scraped_images")
      .insert({ url: urlData.publicUrl, filename, bucket: BUCKET, storage_path: storagePath, status: "pending" });
    if (insErr) throw insErr;

    log(`✅ 已上传: ${filename} → ${urlData.publicUrl}`);
  } catch (e) {
    log(`❌ 上传失败 ${filename}: ${e.message}`);
  }
}

function handleFile(filePath) {
  if (processing.has(filePath)) return;
  processing.add(filePath);
  uploadImage(filePath)
    .catch((e) => log(`❌ ${e.message}`))
    .finally(() => processing.delete(filePath));
}

async function start() {
  if (!fs.existsSync(WATCH_DIR)) {
    fs.mkdirSync(WATCH_DIR, { recursive: true });
    log(`📁 已创建监听文件夹: ${WATCH_DIR}`);
  }
  log(`👀 开始监听: ${WATCH_DIR}`);
  log(`   (把微购相册转发到电脑微信的图片拖进这个文件夹即可自动上传)`);

  fs.watch(WATCH_DIR, { recursive: false }, (event, filename) => {
    if (!filename) return;
    const full = path.join(WATCH_DIR, filename);
    if (event === "rename" || event === "change") {
      if (fs.existsSync(full) && fs.statSync(full).isFile()) handleFile(full);
    }
  });

  // 启动时处理已存在的图片（可选，避免重复可注释）
  fs.readdirSync(WATCH_DIR).forEach((f) => {
    const full = path.join(WATCH_DIR, f);
    if (fs.statSync(full).isFile()) handleFile(full);
  });
}

start();
