# 骆芷蝶智选 - 小程序项目交接文档

**日期**: 2026-06-12  
**状态**: Taro 4.2 编译已通，页面文件已创建，待接手完成

---

## 一、项目概况

| 项目 | 内容 |
|------|------|
| 框架 | Taro 4.2.0（React 18 + TypeScript + SCSS） |
| 编译状态 | ✅ `build:weapp` 和 `build:h5` 均编译成功 |
| 输出目录 | `dist/`（微信小程序）和 H5 的 `dist/` |
| Web后端 | https://colour-choice.art/api（已有） |
| Supabase | `style_diagnoses` 和 `hot_picks_memberships` 表已建 |

---

## 二、目录结构

```
/workspace/miniprogram/frontend/   ← 小程序项目根目录（重要！不是 front_end 也不是 front-end）
├── config/
│   ├── index.ts          ← Taro 配置（已修复，可编译）
│   ├── dev.ts
│   └── prod.ts
├── src/
│   ├── app.config.ts     ← 页面注册（已修复，路径和实际文件对应）
│   ├── app.tsx
│   ├── app.scss
│   ├── services/
│   │   └── api.ts       ← API 调用层（调 https://colour-choice.art/api）
│   └── pages/
│       ├── home/index.tsx        ← 首页（二层结构）
│       ├── courses/index.tsx     ← 课程企划
│       ├── hot-picks/index.tsx   ← 爆款样衣
│       ├── news/index.tsx        ← 资讯
│       ├── vip/index.tsx         ← VIP中心
│       ├── courses/detail/index.tsx
│       ├── hot-picks/detail/index.tsx
│       ├── news/detail/index.tsx
│       ├── vip/login/index.tsx
│       ├── vip/register/index.tsx
│       ├── vip/profile/index.tsx
│       ├── vip/style-test/index.tsx  ← 风格诊断表单
│       ├── planning/index.tsx     ← 商品企划
│       ├── buyer/index.tsx        ← 买手寻款
│       ├── collocation/index.tsx  ← 搭配展示
│       └── contact/index.tsx      ← 联系我们
├── package.json
└── project.config.json     ← 微信开发者工具项目配置（appid: wxe0ffec0a398de8b7）
```

---

## 三、已解决的问题（重要！别再踩坑）

### 坑1: `ENABLE_INNER_HTML is not defined` 编译错误
- **原因**: `app.config.js` 放在 `src/` 目录，webpack 处理时触发 `@tarojs/runtime` 在 Node 环境报错
- **解法**: `app.config.ts` 必须在 `src/` 下，但内容只能是纯导出（不能 import 任何包）。当前版本已修复
- **关键**: `src/app.config.ts` 用 `export default {...}` 格式，Taro CLI 直接读取，不经过 webpack

### 坑2: `缺少 app 全局配置文件` 错误
- **原因**: `app.config.ts` 不在 `src/` 目录下，Taro 找不到
- **解法**: 确保 `src/app.config.ts` 存在

### 坑3: `@babel/preset-react` 缺失
- **解法**: 已安装到 devDependencies，重新安装依赖即可（`pnpm install`）

### 坑4: `alias '@/'` 解析失败
- **解法**: `config/index.ts` 里已配置 `alias: {'@': path.resolve(__dirname, '..', 'src')}`

### 坑5: 页面路径和实际文件不匹配
- **原因**: `app.config.ts` 里注册的是三层路径（`pages/vip/index/index`），但实际文件是二层（`pages/vip/index.tsx`）
- **解法**: 已统一——TabBar页面用二层，子页面用三层，路径和实际文件一一对应

---

## 四、待完成任务

### 高优先级
1. **TabBar 图标** - 当前 tabBar 只有文字，没有图标。需要找 5 个图标（首页/课程/爆款/资讯/VIP），放在 `src/assets/icons/`
2. **API 对接** - `src/services/api.ts` 已创建，但页面里还是假数据。需要把每个页面的 `mock数据` 替换成真实 API 调用
3. **风格诊断图片上传** - `pages/vip/style-test/index.tsx` 里的 `handleUpload` 只是 toast，需要用 `Taro.uploadFile` 上传到 Supabase Storage
4. **微信登录** - 当前登录是假的逻辑，需要接入微信小程序 `wx.login` + 后端 `/api/auth/wechat`

### 中优先级
5. **真机测试** - 用微信开发者工具导入 `dist/` 目录，真机预览
6. **H5端路由** - `build:h5` 已通，但路由可能需要调整（Taro H5 用 hash 路由）
7. **Supabase Realtime** - 风格诊断结果通知（admin 提交结果后，用户端收到通知）

### 低优先级
8. **性能优化** - 当前包较大，可开启 lazy load
9. **UI细调** - 当前页面是基础版本，需要和 Web 版视觉效果对齐

---

## 五、如何运行

```bash
# 重要：必须在 /workspace/miniprogram/frontend/ 目录下运行（不是 miniprogram/ 也不是别的）
cd /workspace/miniprogram/frontend

# 安装依赖（首次或 node_modules 被删时）
pnpm install

# 编译微信小程序（输出到 dist/）
pnpm run build:weapp

# 编译 H5（输出到 dist/）
pnpm run build:h5

# 开发模式（监听文件变化）
pnpm run dev:weapp
```

---

## 六、关键文件说明

| 文件 | 说明 |
|------|------|
| `src/app.config.ts` | 页面路由注册，**修改页面路径必须同步改这里** |
| `config/index.ts` | Taro 编译配置，alias/plugin 都在这里 |
| `src/services/api.ts` | 所有 API 调用集中在这里，后端地址 `https://colour-choice.art/api` |
| `project.config.json` | 微信开发者工具配置，appid=`wxe0ffec0a398de8b7` |
| `src/pages/vip/style-test/index.tsx` | 风格诊断表单，最重要的页面，提交后写 `style_diagnoses` 表 |

---

## 七、联系方式

- 项目原作者：骆芷蝶
- Web版地址：https://colour-choice.art
- Supabase项目：已配置（表：`style_diagnoses`, `hot_picks_memberships`）
