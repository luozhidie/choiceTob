-- ============================================================
-- 弹窗功能 + 版块小标题 - 数据库迁移
-- 在 Supabase Dashboard > SQL Editor 中执行此文件
-- ============================================================

-- 1) page_blocks 表增加 section_title / section_subtitle 字段
alter table public.page_blocks
  add column if not exists section_title text default null,
  add column if not exists section_subtitle text default null;

-- 2) 新建 popups 表（自定义弹窗）
create table if not exists public.popups (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  keywords     text,                           -- 弹窗文字内容（支持多行）
  image_url    text,                           -- 弹窗图片
  link_url     text,                           -- 点击跳转链接（可选）
  show_on_home boolean default false,         -- 是否首页弹窗
  is_published boolean default false,
  start_at     timestamptz,                 -- 开始展示时间（可选）
  end_at       timestamptz,                 -- 结束展示时间（可选）
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 3) 启用 RLS
alter table public.popups enable row level security;

-- 4) RLS 策略：
--    公开读取：只读取已发布 + 在有效期内的弹窗（首页用）
create policy if not exists "public read published popups"
  on public.popups
  for select
  using (
    is_published = true
    and (start_at is null or start_at <= now())
    and (end_at   is null or end_at   >= now())
  );

-- Admin 全权（通过 service_role 绕过）
create policy if not exists "admin full access popups"
  on public.popups
  for all
  using (true)
  with check (true);

-- 5) 索引
create index if not exists idx_popups_home
  on public.popups (show_on_home, is_published, start_at, end_at);

comment on column public.page_blocks.section_title is '板块大标题（首页显示）';
comment on column public.page_blocks.section_subtitle is '板块小标题（首页显示）';
comment on table public.popups is '首页弹窗配置';
