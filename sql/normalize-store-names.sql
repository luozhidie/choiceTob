-- 一次性规范化历史 stores 的 name：拼上城市，形成「店名(城市)」
-- 与前端/后台新的保存逻辑保持一致，确保「一个名字 = 一家店铺」。
-- 在 Supabase SQL Editor 中执行一次即可；执行后请到后台「店铺管理」复核有无残留重名。

UPDATE stores s
SET name = s.name || '(' || s.city || ')'
WHERE s.city IS NOT NULL
  AND s.city <> ''
  -- 已带半角/全角 (城市) 后缀的跳过，避免重复拼接
  AND s.name NOT LIKE '%(' || s.city || ')'
  AND s.name NOT LIKE '%（' || s.city || '）'
  -- 若拼接后会产生与其他店完全相同的名字，则跳过该行，留给人工复核，避免制造新重复
  AND NOT EXISTS (
    SELECT 1 FROM stores d
    WHERE d.name = s.name || '(' || s.city || ')'
      AND d.id <> s.id
  );
