# Supabase 配置指南

本指南将帮助您完成 Supabase 的配置，为骆芷蝶智选平台提供数据库和认证服务。

## 1. 注册 Supabase 免费账号

1. 访问 [supabase.com](https://supabase.com)
2. 点击 "Start your project" 按钮
3. 使用 GitHub 账号或邮箱注册

## 2. 创建新项目

1. 登录后进入 Dashboard
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: `lzdzhixuan`
   - **Database Password**: 设置一个强密码并妥善保存
   - **Region**: 选择离您最近的区域（推荐 East Asia - Tokyo）
4. 点击 "Create new project"，等待初始化完成

## 3. 数据库建表

进入项目后，点击左侧 "SQL Editor"，执行以下 SQL：

```sql
-- 商品表
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  color_season TEXT NOT NULL,
  style_type TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  wholesale_price DECIMAL(10,2) NOT NULL,
  retail_price DECIMAL(10,2) NOT NULL,
  attributes JSONB DEFAULT '{}',
  description TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  is_hot BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 供应商表
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  main_categories JSONB DEFAULT '[]',
  brand TEXT,
  annual_capacity TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  level TEXT CHECK (level IN ('A', 'B', 'C')),
  status TEXT DEFAULT '活跃',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 订单表
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  items JSONB DEFAULT '[]',
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT '待支付',
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- VIP会员表
CREATE TABLE vip_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  phone TEXT,
  level TEXT DEFAULT 'V1' CHECK (level IN ('V1', 'V2', 'V3')),
  annual_spend DECIMAL(12,2) DEFAULT 0,
  discount_rate DECIMAL(3,2) DEFAULT 1.00,
  return_rate INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 课程表
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  level TEXT NOT NULL,
  description TEXT,
  outline JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

> **注意**：请先创建 `suppliers` 表，因为 `products` 表有外键引用它。

## 4. 开启 Row Level Security (RLS)

为每张表启用 RLS，确保数据安全：

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 公开读取策略（商品、供应商、课程）
CREATE POLICY "公开读取商品" ON products FOR SELECT USING (true);
CREATE POLICY "公开读取供应商" ON suppliers FOR SELECT USING (true);
CREATE POLICY "公开读取课程" ON courses FOR SELECT USING (true);

-- 用户只能读取自己的订单
CREATE POLICY "用户读取自己的订单" ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能读取自己的VIP信息
CREATE POLICY "用户读取自己的VIP信息" ON vip_members FOR SELECT
  USING (auth.uid() = user_id);
```

## 5. 获取 URL 和 Anon Key

1. 在项目 Dashboard 左侧点击 "Settings"（齿轮图标）
2. 点击 "API"
3. 找到以下信息：
   - **Project URL**: 形如 `https://xxxxx.supabase.co`
   - **anon public**: 一串长字符串（公开密钥，可安全暴露在前端）

## 6. 配置 Storage Bucket（商品图片）

1. 在项目 Dashboard 左侧点击 "Storage"
2. 点击 "New Bucket"
3. 填写 Bucket 名称：`product-images`
4. 选择 "Public bucket"（公开访问）
5. 点击 "Create bucket"
6. 设置存储策略：

```sql
-- 允许公开读取商品图片
CREATE POLICY "公开读取商品图片" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 允许认证用户上传图片
CREATE POLICY "认证用户上传图片" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

## 7. 在 .env.local 填入配置

将获取到的信息填入项目根目录的 `.env.local` 文件：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

完成后重启开发服务器即可生效。

---

如有问题，请参考 [Supabase 官方文档](https://supabase.com/docs)。
