-- 给 courses 表添加 video_url 字段
ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 创建 videos 存储桶（如果 Supabase 控制台创建的话需要下面的 policy）
-- 注意：Supabase 存储桶通常需要在控制台创建，SQL 只能创建 policy
-- 请进入 Supabase Dashboard → Storage → New bucket → 创建 "videos" bucket

-- 允许匿名用户上传视频到 videos bucket
CREATE POLICY IF NOT EXISTS "Allow anon upload to videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

-- 允许匿名用户查看视频
CREATE POLICY IF NOT EXISTS "Allow anon select from videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');
