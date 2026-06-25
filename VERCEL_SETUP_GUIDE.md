# ⚠️ 微信支付 Vercel 环境变量配置指南

## 问题根因
`.env.local` 文件在 `.gitignore` 中，不会被 git 提交，因此 Vercel 部署时读不到微信支付环境变量，导致支付 API 一直失败。

## 解决步骤（必须执行）

### 第1步：登录 Vercel
访问 https://vercel.com/dashboard 并登录

### 第2步：进入项目设置
- 找到 `lzdzhixuan` 项目（或你的项目名）
- 点击项目 → 顶部标签页选择 **Settings**
- 左侧菜单选择 **Environment Variables**

### 第3步：添加以下环境变量

点击 **Add Variable** 按钮，逐个添加：

| Name | Value | Environment |
|------|-------|-------------|
| `WECHAT_MCHID` | `[从 .env.local 读取]` | Production, Preview, Development |
| `WECHAT_APIV2_KEY` | `[从 .env.local 读取]` | Production, Preview, Development |
| `WECHAT_MINI_APPID` | `[从 .env.local 读取]` | Production, Preview, Development |
| `WECHAT_MP_APPID` | `[从 .env.local 读取]` | Production, Preview, Development |
| `WECHAT_NOTIFY_URL` | `https://colour-choice.art/api/wechat-pay/notify` | Production, Preview, Development |

> ⚠️ **注意**：真实值请从服务器上的 `/workspace/lzdzhixuan/.env.local` 文件读取，**不要把这个文件提交到 git**。

### 第4步：重新部署
- 回到 Vercel 项目首页
- 点击 **Deployments** 标签
- 找到最新部署 → 点击右侧 **⁝** 菜单 → **Redeploy**

---

## 如果无法访问 Vercel 网页（被墙）

方案一：在本地用 Vercel CLI（会自动走代理如果你配置了）
```bash
vercel login --github
vercel env add
```

方案二：直接修改代码里的 fallback 值（位于 `src/lib/wechat-pay.ts` 顶部）
- 找到 `process.env.WECHAT_MCHID || "..."` 这行
- 把 fallback 值改成你的真实商户号
- 提交并 push 到 main 分支触发部署
