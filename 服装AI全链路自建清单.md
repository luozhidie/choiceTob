# 骆芷蝶智选 · 服装AI 全链路自建清单与路线图

> 目标：用「开源自建 + 现有 DeepSeek/OpenAI」逐步实现对标轻链服装AI 的全链路能力（企划→设计→生产→营销），成本远低于商业 SaaS，数据留在自己手里。
> 阶段一（当前）= 方案 A 零成本深化；阶段二起 = 自建开源多模态推理服务，往轻链方向推进。

---

## 一、现状盘点（你已有什么）

**技术栈**：Next.js(App Router) + Supabase + Vercel；AI 走 DeepSeek 优先 / OpenAI 备选 / mock 降级，封装在 `src/lib/ai.ts` 的 `callAI()`。

**已有 AI 页面 / API**：

| 模块 | 页面 | API | 当前状态 |
|------|------|-----|----------|
| 商品企划 | `/admin/report` | `/api/generate-report` | 文本报告，基于店铺 VIP/结构/波段数据 |
| 设计研发 | `/admin/designer` | — | 空 CRUD（爆款样衣套餐表） |
| 营销策划 | `/admin/marketing` | `/api/generate-marketing-plan` | 营销方案文本，可保存 |
| 趋势预测 | `/admin/trend-predict` | `/api/trend/predict` 等 | 趋势+爆款单品 |
| 生产协同 | `/admin/production-coordination` | `/api/ai/production-coordination` | 新建，文本建议，落库 `ai_production_orders` |
| 买手助手 | `/admin/buyer` | `/api/ai/buyer-assistant` | 对话式 |
| AI 中心 | `/admin/ai-center` | — | 入口聚合（本次已修高亮错位） |

**核心数据表**：`products`、`buyer_products`、`profiles`、`stores`、`orders`、`marketing_campaigns`、`ai_production_orders`、`product_test_campaigns/items/events`。

**差距**：现有 AI 多为「文本包装表单」，缺少①图像生成（AI 模特/改款图）、②可执行文件（工艺单/BOM）、③数据闭环（生成结果直接落库驱动选品/拿货）。

---

## 二、方案 A：零成本深化（立即做，不 new 模型）

| 模块 | 现状 | 深化目标 | 交付物 |
|------|------|----------|--------|
| 商品企划 | 文本报告 | 报告末尾追加「可执行企划」：SKU 建议、拿货清单、价格带、主推款 | 结果落库新表 `ai_planning_results`，可回看 |
| 设计研发 | 空壳 | 加「AI 爆款改款」文本入口：输入爆款描述→生成改款方向/换色/换面料建议 | 打破空壳，先文本后接图 |
| 营销策划 | 方案文本 | 结果拆出「朋友圈文案 + 主推款 + 海报文案」，一键存到内容日历 | 可直接发朋友圈/群 |
| 趋势预测 | 趋势列表 | 趋势结论关联你 `buyer_products`/爆款，给出「该跟哪些款」 | 趋势→选品联动 |
| 生产协同 | 建议文本 | 升级为「标准工艺单/BOM 文本模板」，可复制/导出打印给工厂 | 工厂可执行文件 |
| 统一调用层 | 各 API 各自连模型 | 全部改走 `lib/ai.ts`，DeepSeek 优先策略一致 | 稳定性+降成本 |

---

## 三、对标轻链的自建技术栈（开源替代）

| 轻链能力 | 开源替代（国内可跑） | 说明 |
|----------|---------------------|------|
| 文本企划/营销/生产文案 | DeepSeek / OpenAI（已有） | 直接用，零新增成本 |
| AI 模特 / 虚拟试衣 | **IDM-VTON**、**OOTDiffusion** | 上传服装图+模特图→上身图 |
| 款式改款 / 换色 / 换面料 | **Stable Diffusion XL + 服装 LoRA + ComfyUI** | 工作流编排 |
| 线稿转实物 / 图案设计 | **SD + ControlNet**（线稿/姿态控制） | 控图生成 |
| 工艺单 / BOM | DeepSeek 生成 + 你的商品字段模板 | 文本→结构化表 |
| 场景营销图 | **SD + 场景 LoRA** | 街景/棚拍背景 |

> 以上模型多可商用（SD/IDM-VTON/OOTDiffusion 遵循各自开源协议，商用前需确认许可证）。

---

## 四、部署架构（往轻链方向推进的骨架）

```
手机/后台 (Next.js + Supabase)
        │  HTTP 调用
        ▼
自研推理服务 (Python: ComfyUI / Diffusers)
        │  跑在 GPU 云
        ▼
GPU 云 (AutoDL/蓝耘/智星云, 4090 24GB)
        │  生成图回传
        ▼
Supabase Storage (图片) + 商品表 (关联 products/buyer_products)
```

- 推理服务暴露 `/vton`、`/redesign`、`/scene` 等接口，后台按需调用。
- 生成的图存 Supabase Storage，和商品/选品表关联，形成数据闭环。

---

## 五、分阶段路线图（全链路）

- **阶段 1（0 成本，当前）**：方案 A 五模块深化 + 统一调用层。产出可执行文本结果。
- **阶段 2（租 GPU 云 ~¥1-3万/年）**：部署 ComfyUI + IDM-VTON，打通「AI 模特上身」「爆款改款图」，接进 designer / 商品页。
- **阶段 3**：DeepSeek 自动工艺单/BOM + 趋势→选品联动，生产协同真正对接工厂。
- **阶段 4**：全链路数据闭环——企划结论驱动选品，选品驱动设计图，设计图驱动生产文件，营销图自动生成并排期。

---

## 六、成本估算

| 项 | 费用 |
|----|------|
| 方案 A（深化+统一调用） | ¥0（已有 DeepSeek 额度） |
| GPU 云（4090，轻度） | ¥1-3 万/年 |
| 开发（我帮你搭推理服务+集成） | 一次性，按模块推进 |
| 轻链同等商业 SaaS | 五位数/年起（不推荐） |

---

## 七、立即行动

1. ✅ 本次已交付：本清单 + 菜单高亮修复。
2. ⏳ 我按任务 #76–#80 逐模块做方案 A 深化（先从「商品企划」或「生产协同」开工，你没指定就按企划优先）。
3. ⏳ 你后续评估是否租 GPU 云，启动阶段 2 的 AI 模特/改款图。

> 注：不破解、不逆向任何商业服务；全部用开源模型 + 自研工作流实现同类效果。
