# 充值订单功能部署指南

## 功能概述

本次恢复了充值订单相关的所有功能，包括：
1. 数据库表结构（charge_orders）
2. 前端充值中心页面（/buyer-center）
3. 管理后台充值订单管理页面（/admin/charge-orders）
4. API接口（/api/charge-orders）

## 部署步骤

### 1. 创建数据库表

在 Supabase SQL Editor 中执行以下SQL文件：

```bash
# 文件路径
/workspace/lzdzhixuan/charge-orders-schema.sql
```

执行方式：
1. 登录 Supabase 控制台
2. 进入 SQL Editor
3. 复制 `charge-orders-schema.sql` 的全部内容
4. 粘贴到 SQL Editor 中
5. 点击 "Run" 执行

### 2. 验证数据库表

执行完成后，在 Supabase 中检查：
- 左侧菜单 → Table Editor → 应该能看到 `charge_orders` 表
- 表结构应包含以下字段：
  - id (UUID)
  - order_no (充值订单号)
  - user_id (用户ID)
  - amount (充值金额)
  - discount_rate (折扣率)
  - actual_amount (实际到账金额)
  - status (订单状态)
  - 等等...

### 3. 部署代码

所有代码文件已经创建完成：

```
/workspace/lzdzhixuan/
├── charge-orders-schema.sql              # 数据库表结构
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── charge-orders/
│   │   │       ├── route.ts             # 充值订单列表API + 创建API
│   │   │       └── [id]/route.ts       # 充值订单详情API + 更新API + 删除API
│   │   ├── buyer-center/
│   │   │   └── page.tsx                # 用户充值中心页面
│   │   └── admin/
│   │       └── charge-orders/
│   │           └── page.tsx             # 管理后台充值订单管理页面
│   └── app/admin/
│       └── layout.tsx                   # 已添加"充值管理"菜单
```

### 4. 提交代码到Git

```bash
cd /workspace/lzdzhixuan

# 添加所有新文件
git add charge-orders-schema.sql
git add src/app/api/charge-orders/
git add src/app/buyer-center/
git add src/app/admin/charge-orders/
git add src/app/admin/layout.tsx

# 提交
git commit -m "feat: 添加充值订单功能

- 创建 charge_orders 数据库表
- 添加用户充值中心页面 /buyer-center
- 添加管理后台充值订单管理页面 /admin/charge-orders
- 添加充值订单相关API
- 在管理后台左侧菜单添加'充值管理'分组"

# 推送到远程仓库
git push origin main
```

### 5. 触发布署

如果使用 Vercel 部署，推送代码后会自动触发部署。

如果需要手动触发：
1. 登录 Vercel
2. 找到项目
3. 点击 "Deploy" 按钮

## 功能说明

### 用户端（/buyer-center）

用户可以：
- 查看账户余额、折扣率、累计充值
- 创建充值订单
- 选择充值金额（5万/10万/30万快捷按钮）
- 选择支付方式（银行转账/微信支付）
- 查看充值记录和历史订单状态

### 管理后台（/admin/charge-orders）

管理员可以：
- 查看所有用户的充值订单
- 按状态筛选订单（待支付/已支付待确认/已确认/已取消）
- 查看订单详情（包括支付凭证图片）
- 更新订单状态：
  - 待支付 → 已支付
  - 已支付 → 已确认（自动给用户账户充值）
  - 任何状态 → 已取消
- 添加管理员备注
- 查看充值前后的余额变化

### 自动化功能

1. **订单号自动生成**：格式为 `CZ + 日期 + 4位随机数`（如：CZ202606200001）
2. **余额自动更新**：当管理员确认充值后，系统自动：
   - 记录充值前余额
   - 给用户账户加上实际到账金额
   - 记录充值后余额
   - 记录确认时间和确认人
3. **RLS安全策略**：
   - 用户只能查看自己的充值订单
   - 管理员可以查看和编辑所有充值订单

## 测试流程

### 1. 测试用户充值

1. 登录用户账号
2. 访问 `/buyer-center`
3. 点击"立即充值"
4. 输入充值金额或选择快捷金额
5. 选择支付方式
6. 提交订单
7. 检查订单是否创建成功

### 2. 测试管理员确认

1. 登录管理员账号
2. 访问 `/admin/charge-orders`
3. 找到刚才创建的订单
4. 点击"查看详情"
5. 上传支付凭证（可选）
6. 点击"标记为已支付"
7. 再点击"确认充值（到账）"
8. 检查用户余额是否增加

### 3. 验证数据库

在 Supabase 中：
1. 查看 `charge_orders` 表，确认订单状态已更新为 `confirmed`
2. 查看 `user_profiles` 表，确认用户余额已增加
3. 检查 `balance_before` 和 `balance_after` 字段是否正确

## 常见问题

### Q1: 执行SQL时报错 "relation already exists"

**A**: 说明表已经存在，可以先删除再重建：
```sql
DROP TABLE IF EXISTS charge_orders;
```
然后重新执行 `charge-orders-schema.sql`

### Q2: 用户充值后余额没有增加

**A**: 检查：
1. 订单状态是否变为 `confirmed`
2. 数据库触发器是否正常工作
3. 查看 `balance_before` 和 `balance_after` 字段

### Q3: 管理后台看不到"充值管理"菜单

**A**: 检查 `/workspace/lzdzhixuan/src/app/admin/layout.tsx` 文件，确认是否已经添加了"充值管理"分组。

### Q4: 创建充值订单时报错

**A**: 检查：
1. 用户是否已登录
2. `user_profiles` 表中是否有该用户记录
3. API 返回的具体错误信息

## 技术细节

### API接口

#### GET /api/charge-orders
获取充值订单列表
- 参数：
  - `page`: 页码（默认1）
  - `pageSize`: 每页数量（默认20）
  - `status`: 状态筛选（可选）
  - `userId`: 用户ID筛选（管理员可用）
- 返回：订单列表 + 分页信息

#### POST /api/charge-orders
创建充值订单
- 参数：
  - `amount`: 充值金额
  - `discount_rate`: 折扣率
  - `payment_method`: 支付方式
  - `remark`: 备注（可选）
- 返回：创建的订单信息

#### PATCH /api/charge-orders/[id]
更新充值订单
- 参数：
  - `status`: 新状态
  - `payment_proof`: 支付凭证（可选）
  - `admin_remark`: 管理员备注（可选）
- 返回：更新后的订单信息

#### DELETE /api/charge-orders/[id]
删除充值订单（只能删除未确认的订单）
- 返回：成功消息

### 数据库触发器

1. **`trigger_update_charge_orders_updated_at`**: 自动更新 `updated_at` 字段
2. **`trigger_generate_charge_order_no`**: 自动生成订单号
3. **`trigger_update_user_balance_after_charge`**: 确认充值后自动更新用户余额

## 后续优化建议

1. **支付集成**：接入微信支付/支付宝API，实现自动确认
2. **邮件通知**：充值确认后自动发送邮件通知用户
3. **导出功能**：管理后台支持导出充值订单Excel
4. **统计报表**：添加充值统计图表（日/月/年）
5. **退款功能**：支持充值订单退款

## 联系人

如有问题，请联系开发团队。

---
创建时间：2026-06-20
版本：1.0
