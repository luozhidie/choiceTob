# 骆芷蝶智选 - 微信小程序版

## 产品概述

骆芷蝶智选微信小程序是骆芷蝶智选 ToB 服装供应链平台的移动端，面向服装店老板和买手，
提供店铺管理、VIP 会员管理、商品企划、采购库存、销售分析等核心功能。

## 核心用户

- 服装店老板/店长：日常经营管理
- 买手：选品采购决策
- 形象顾问：VIP 客户服务

## 核心功能

### 1. 数据概览（首页）
- 今日/本月关键指标：营业额、进店数、成交率、连带率
- 低库存预警提醒
- 待办事项（待收货订单、到期 VIP 服务）
- 快捷入口

### 2. 店铺管理
- 店铺信息查看/编辑（名称、面积、地段、风格定位）
- 经营数据录入（月租金、保本点、毛利率等）
- 店铺会员画像概览（色彩季型分布、风格分布）

### 3. VIP 会员管理
- VIP 客户列表（搜索、筛选）
- 客户详情（基本信息、色彩季型、风格测试结果）
- 快速录入新 VIP
- 服务记录添加
- 加油包购买记录

### 4. 商品企划
- AI 企划生成（选择季节/风格/价格带 → 一键生成）
- 企划方案查看（色彩、风格、价格带、波段）
- 96 格商品矩阵查看

### 5. 采购管理
- 采购订单列表（按状态筛选）
- 新建采购单（选供应商、添加明细）
- 确认收货入库

### 6. 库存管理
- 库存列表（搜索、按品类筛选）
- 库存状态标签（正常/低库存/断货/滞销）
- 一键补货

### 7. 销售数据
- 每日/周/月销售录入
- 销售趋势图表
- 同步库存扣减

### 8. 我的
- 账号信息
- 消息通知
- 设置

## 页面结构

```
pages/
├── index/              # 数据概览（TabBar首页）
├── stores/             # 店铺管理
│   ├── list/           # 店铺列表
│   └── detail/         # 店铺详情
├── vip/                # VIP会员（TabBar）
│   ├── list/           # 客户列表
│   └── detail/         # 客户详情
├── planning/           # 商品企划（TabBar）
│   ├── index/          # 企划首页
│   └── result/         # 企划结果
├── inventory/          # 采购库存（TabBar）
│   ├── index/          # 库存列表
│   ├── purchase/       # 采购订单
│   └── sales/          # 销售录入
└── profile/            # 我的
```

## TabBar 配置

| Tab | 图标 | 页面 |
|-----|------|------|
| 概览 | home | pages/index/index |
| VIP | users | pages/vip/list/index |
| 企划 | lightbulb | pages/planning/index/index |
| 进销存 | package | pages/inventory/index/index |
| 我的 | user | pages/profile/index |

## 数据模型

复用 Web 端 Supabase 数据库，通过同一套 API 交互：
- stores, vip_customers, inventory, purchase_orders, purchase_order_items
- weekly_sales_analysis, product_structure_plan, product_matrix_plan

## API 端点

后端复用现有 Express API（部署在 colour-choice.art/api）：
- GET/POST /api/categories
- GET/POST /api/inventory/*
- GET/POST /api/purchase-orders/*
- GET/POST /api/sales/*
- POST /api/generate-planning
- GET/POST /api/migrate

## 技术栈

- **前端**：Taro 4.x + React 18 + TypeScript + SCSS + Taro UI
- **后端**：复用现有 Next.js API Routes（colour-choice.art）
- **数据库**：Supabase PostgreSQL（复用 Web 端）
- **认证**：微信登录 + Supabase Auth
