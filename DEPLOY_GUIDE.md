# 骆芷蝶智选 - 部署上线指南

## 一、项目概述

- **技术栈**：Next.js 15 + TypeScript + Tailwind CSS + Supabase
- **页面数量**：16个页面
- **支持端**：PC + 手机自适应（小程序需额外封装）
- **免费后端**：Supabase（PostgreSQL + Auth + Storage，免费额度足够起步）

---

## 二、Supabase 配置（免费后端）

### 2.1 注册 Supabase

1. 访问 https://supabase.com 注册账号（可用GitHub登录）
2. 点击 "New Project"，选择免费计划（Free Tier）
3. 填写项目名称：`lzdzhixuan`，设置数据库密码，选择地区：**Singapore**（离中国最近）
4. 等待项目创建完成（约2分钟）

### 2.2 创建数据库表

在 Supabase 控制台 → SQL Editor 中，依次执行以下SQL：

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
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 供应商表
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  main_categories JSONB DEFAULT '[]',
  brand TEXT,
  annual_capacity TEXT,
  rating DECIMAL(2,1) DEFAULT 4.0,
  level TEXT DEFAULT 'C',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 订单表
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIP会员表
CREATE TABLE vip_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  level TEXT DEFAULT 'V1',
  annual_spend DECIMAL(10,2) DEFAULT 0,
  discount_rate DECIMAL(3,2) DEFAULT 0.95,
  return_rate DECIMAL(3,2) DEFAULT 0.05,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 课程表
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  level TEXT NOT NULL,
  description TEXT,
  outline JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 开启 RLS（行级安全策略）

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 商品和课程：所有人可读
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read courses" ON courses FOR SELECT USING (true);

-- 供应商：认证用户可读，供应商自己可写
CREATE POLICY "Authenticated read suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Supplier insert" ON suppliers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 订单：用户只能看自己的
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- VIP：用户只能看自己的
CREATE POLICY "Users read own vip" ON vip_members FOR SELECT USING (auth.uid() = user_id);
```

### 2.4 创建 Storage Bucket

1. 进入 Storage → New Bucket
2. 名称：`product-images`
3. 开启 Public 访问
4. 设置策略：认证用户可上传，所有人可读

### 2.5 获取配置信息

1. 进入 Settings → API
2. 复制 `Project URL` 和 `anon public` Key
3. 填入项目根目录的 `.env.local` 文件

---

## 三、本地开发

```bash
# 1. 进入项目目录
cd /workspace/lzdzhixuan

# 2. 安装依赖（如未安装）
pnpm install

# 3. 配置环境变量
# 编辑 .env.local，填入Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# 4. 启动开发服务器
pnpm dev
# 访问 http://localhost:3000

# 5. 构建生产版本
pnpm build

# 6. 启动生产服务器
pnpm start
```

---

## 四、部署到腾讯云

### 方案A：腾讯云轻量应用服务器（推荐，最简单）

**费用**：约50-80元/月（2核4G足够）

#### 步骤：

```bash
# 1. 在腾讯云购买轻量应用服务器
# - 镜像选择：Ubuntu 22.04
# - 配置：2核4G（起步够用）
# - 带宽：4Mbps+

# 2. SSH登录服务器
ssh root@你的服务器IP

# 3. 安装 Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. 安装 pnpm
npm install -g pnpm

# 5. 安装 PM2（进程守护）
npm install -g pm2

# 6. 安装 Nginx
sudo apt install nginx -y

# 7. 上传项目代码（从本地）
# 在本地电脑执行：
scp -r /workspace/lzdzhixuan root@你的服务器IP:/home/lzdzhixuan

# 8. 在服务器上构建
cd /home/lzdzhixuan
pnpm install
pnpm build

# 9. 用 PM2 启动
pm2 start pnpm --name "lzdzhixuan" -- start
pm2 save
pm2 startup  # 开机自启

# 10. 配置 Nginx 反向代理
sudo nano /etc/nginx/sites-available/lzdzhixuan
```

Nginx 配置内容：

```nginx
server {
    listen 80;
    server_name 你的域名.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 11. 启用站点配置
sudo ln -s /etc/nginx/sites-available/lzdzhixuan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 12. 配置SSL（免费Let's Encrypt）
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d 你的域名.com
# 按提示操作，自动配置HTTPS

# 13. 开放防火墙端口
sudo ufw allow 80
sudo ufw allow 443
```

### 方案B：Vercel 部署（免费，最快上线）

> 如果你在腾讯云买的是域名而非服务器，可以先用Vercel免费部署。

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 在项目目录执行
cd /workspace/lzdzhixuan
vercel

# 按提示操作，首次会要求登录
# 部署完成后会得到一个 .vercel.app 域名

# 3. 绑定自定义域名
# 在 Vercel Dashboard → Settings → Domains 添加你的域名
# 在腾讯云域名管理添加 CNAME 记录指向 vercel
```

---

## 五、域名配置（腾讯云）

1. 登录腾讯云 → 域名管理
2. 添加解析记录：

| 记录类型 | 主机记录 | 记录值 |
|----------|----------|--------|
| A | @ | 你的服务器IP |
| A | www | 你的服务器IP |

3. 如果用Vercel部署：
   - 添加 CNAME 记录：@ → cname.vercel-dns.com

4. SSL证书：腾讯云可申请免费DV证书，或用Let's Encrypt

---

## 六、小程序端

### 方案A：使用 uni-app 封装（推荐）

1. 安装 HBuilderX
2. 创建 uni-app 项目
3. 用 web-view 组件嵌入网站：
```html
<web-view src="https://你的域名.com"></web-view>
```
4. 发布到微信小程序

### 方案B：使用 Taro 封装

1. `npx @tarojs/cli init lzdzhixuan-mini`
2. 将网页内容逐步转换为Taro组件
3. 发布到微信/支付宝/抖音小程序

> **最快方案**：先用方案A（web-view嵌入），1天内可上线小程序。后续再逐步做原生小程序。

---

## 七、日常运维

```bash
# 更新代码后重新部署
cd /home/lzdzhixuan
git pull  # 或重新上传
pnpm build
pm2 restart lzdzhixuan

# 查看日志
pm2 logs lzdzhixuan

# 查看服务器状态
pm2 status

# Nginx重启
sudo systemctl reload nginx
```

---

## 八、费用汇总（起步期）

| 项目 | 费用 |
|------|------|
| Supabase 免费版 | 0元/月 |
| 腾讯云轻量服务器 2核4G | 约50-80元/月 |
| 域名 | 约50-80元/年 |
| SSL证书 | 0元（Let's Encrypt） |
| Vercel（如用） | 0元/月（免费额度） |
| **月均成本** | **约50-80元** |

---

## 九、快速上线清单

- [ ] 注册 Supabase 账号，创建项目
- [ ] 执行建表SQL
- [ ] 获取 URL 和 Key，填入 .env.local
- [ ] 本地 pnpm dev 验证网站正常
- [ ] 购买腾讯云服务器或使用Vercel
- [ ] 部署代码
- [ ] 配置域名解析
- [ ] 配置SSL证书
- [ ] 测试全流程
- [ ] 正式上线
