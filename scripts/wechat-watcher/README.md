# 微购相册 一键转发 → 骆芷蝶智选 自动上传

把微购相册的商品图，用最接近「一键」的方式流进你的后台。

## 原理

微信封闭生态，没法用链接自动抓。但图一旦被你**转发/保存到本地**，就脱离了微购相册，
本脚本监听一个文件夹，新图一出现就自动上传到骆芷蝶智选后台。

## 使用步骤

### 1. 建表（只需一次）

在 Supabase 后台 → SQL Editor 执行 `supabase/migrations/20260715_scraped_images.sql`。

### 2. 准备脚本

```bash
cd scripts/wechat-watcher
npm install
cp .env.example .env      # 填入 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY
```

### 3. 运行监听

```bash
node watcher.js "C:\Users\你\Documents\WeChatIncoming"
```

（不传路径则用脚本同级的 `watch/` 文件夹）

### 4. 日常使用（一键部分）

1. 微购相册里 一键转发 → 发到**文件传输助手**
2. 电脑版微信把图存到上面那个文件夹（或直接把图拖进文件夹）
3. 脚本自动上传 → 后台「图片抓取工具 / 待处理图片」里出现这些图
4. 复制链接 / 下载，分配给商品即可

## 说明

- `SUPABASE_SERVICE_ROLE_KEY` 权限极高，仅放本地 `.env`，**不要提交到仓库**
- 监听器只上传图片，不碰微购相册任何数据，合规安全
- 想停止监听：`Ctrl + C`

## 故障排查

- 报「配置 SUPABASE」→ 检查 `.env`
- 图没出现 → 后台刷新「待处理图片」页；确认表已建、监听器在运行
- 上传失败 → 看脚本终端日志
