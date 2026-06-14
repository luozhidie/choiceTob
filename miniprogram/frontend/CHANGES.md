# 小程序改造变更说明

## 改造时间
2025-05-23

## 改造任务
1. 改造首页为买手选品电商风格 (#134)
2. 调整TabBar顺序 (#135)
3. 改造VIP会员中心 (#136)
4. 商品登录拦截 + 分类页场合筛选 (#137)

## 文件变更清单

### 任务1: 改造首页为买手选品电商风格
- `src/pages/home/index/index.tsx` - 重新设计首页结构
- `src/pages/home/index/index.scss` - 更新首页样式

### 任务2: 调整TabBar顺序
- `src/app.config.ts` - 更新tabBar配置，新的5个tab顺序
- `src/custom-tab-bar/index.tsx` - 更新TABS数组，去掉618促销按钮
- `src/custom-tab-bar/index.scss` - 更新样式，添加分类图标样式
- `src/assets/tabbar/category.png` - 新增分类图标(临时使用home.png)
- `src/assets/tabbar/category-active.png` - 新增分类图标(临时使用home-active.png)

### 任务3: 改造VIP会员中心
- `src/pages/vip/index/index.tsx` - 重新设计VIP页面，4个套餐
- `src/pages/vip/index/index.scss` - 更新VIP页面样式

### 任务4: 商品登录拦截 + 分类页场合筛选
- `src/pages/home/index/index.tsx` - 添加商品登录拦截逻辑
- `src/pages/hot-picks/index/index.tsx` - 添加商品登录拦截逻辑，添加goToContact函数
- `src/pages/category/index/index.tsx` - 添加场合分类筛选功能
- `src/pages/category/index/index.scss` - 更新分类页样式

## 重要说明

1. **分类图标**: 当前使用home.png作为category.png的临时方案，建议后续替换为真正的分类图标。

2. **数据源**: 首页的数据来自supabase的hot_products表和buyer_products表，需要确认这些表是否存在以及字段是否正确。

3. **场合字段**: 分类页的场合筛选假设hot_products表有occasion字段，需要确认数据库结构。

4. **构建验证**: 项目已成功构建，没有错误。

## 测试建议

1. 测试TabBar切换是否正常
2. 测试首页各区块显示是否正常
3. 测试VIP会员中心套餐显示和支付流程
4. 测试商品登录拦截功能
5. 测试分类页场合筛选功能
