# 小程序UI全面重写 - 改动说明

## 一、改动总览

| 项目 | 旧版（之前） | 新版（本次） |
|------|-------------|-------------|
| **首页** | 纯色背景+简单文字+emoji图标 | 深色渐变Hero+搜索栏+分类标签+功能卡片+骨架屏+商品网格 |
| **选品页** | 不存在 | 完整的搜索/筛选/排序/商品列表/加购/下单 |
| **购物车** | 不存在 | 商品列表(数量控制/选择删除) + 底部结算栏 |
| **我的页** | 不存在 | 用户信息/VIP卡片/订单入口/功能菜单 |
| **TabBar图标** | 1x1像素占位符 | 专业矢量风格图标(81x81px PNG) |
| **CI流程** | Taro编译后上传 | 直接使用原生代码上传 |

## 二、设计风格对标

### 首页 Hero 区域
- **背景**: `linear-gradient(135deg, #2d1b2e, #4a3a4b)` 深紫灰渐变
- **标题**: "骆芷蝶供应链**智选**平台" (智选用玫红 #e89aac 强调)
- **副标题**: "数据驱动 · 智选未来" 徽章 + "服装门店一站式赋能平台"
- **搜索栏**: 毛玻璃效果 `rgba(255,255,255,0.1)` + 白色按钮
- **分类标签**: 全部/穿搭/护肤/彩妆/养生/食品/家居/文创 (横向滚动)
- 对标网站首页全屏轮播区域

### 功能入口
- 4个圆角卡片: 买手选品/线上课程/每日搭配/VIP会员
- 各带独特渐变色图标背景
- 浮在Hero下方，负margin实现层叠效果

### 商品网格
- 2列布局，每张卡片: 图片(3:4比例) + 名称(2行截断) + 价格(玫红#e91e63) + 下单按钮(粉红渐变)
- HOT/NEW标签角标
- 加载中显示骨架屏动画
- 空状态提示

### 底部CTA
- "爆款选品 · 拿货精选"
- 双按钮: 全部商品(白底) + 爆款安利(透明边框)

## 三、文件清单

```
miniprogram-native/
├── app.json                          # 应用配置(4页面 + TabBar)
├── assets/tabbar/
│   ├── home.png / home-active.png    # 🏠 首页图标
│   ├── stock.png / stock-active.png  # 🔲 选品图标
│   ├── cart.png / cart-active.png    # 🛒 购物车图标
│   └── user.png / user-active.png    # 👤 我的图标
└── pages/
    ├── home/index.{wxml,wxss,js}     # 首页
    ├── buyer/index.{wxml,wxss,js}    # 选品页
    ├── cart/index.{wxml,wxss,js}     # 购物车
    └── my/index.{wxml,wxss,js}       # 我的页
```

## 四、技术要点

- **纯原生WXML/WXSS/JS**: 无Taro依赖，直接运行
- **API接口**: `https://colour-choice.art/api/public/products`
- **购物车数据**: 使用 `wx.getStorageSync('cart')` 本地存储
- **价格格式化**: 自动判断分/元，≥100按分处理
- **CI/CD**: GitHub Actions → miniprogram-ci → 微信开发者工具后台
- **触发条件**: push到main分支且 `miniprogram-native/**` 文件变化时自动上传

## 五、待后续开发功能

- [ ] 微信登录授权 (getUserProfile)
- [ ] 商品详情页 (`/pages/shop/index`)
- [ ] VIP会员购买与状态同步
- [ ] 结算下单 + 微信支付(JSAPI)
- [ ] 订单列表/详情页
- [ ] 收货地址管理
- [ ] 课程页/每日搭配页
- [ ] 图片裁剪修复 (object-cover → h-auto, 2026-07)
- [ ] 首页布局重构: 顶栏导航 + 汉堡菜单 + 分类标签移入Banner (commit 341cc718)
