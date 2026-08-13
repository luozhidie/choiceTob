-- ============================================================
-- 理顺示例词元依赖：消除循环依赖，形成干净单链
-- 目标结构：选品判断（含客户画像+销售方法）→ 客户画像 + 销售方法
-- 在 Supabase Dashboard → SQL Editor 执行一次。幂等，可重复跑。
-- ============================================================

-- 1) 把被组合调用的「子词元」设为 draft（selection_tokens 的 status 仅允许 draft/published）：
--    它们不再作为主词元被单独调用，只通过 depends_on 被主词元注入系统提示词。
UPDATE selection_tokens
SET status = 'draft'
WHERE title IN ('女装25-35职场女性画像', '连衣裙朋友圈成交话术')
  AND status = 'published';

-- 2) 防御：任意词元的 depends_on 若包含自身 id（自环），去掉自身引用
UPDATE selection_tokens t
SET fields = jsonb_set(
  t.fields,
  '{depends_on}',
  COALESCE(
    (SELECT jsonb_agg(v) FROM jsonb_array_elements(t.fields->'depends_on') v WHERE v::text <> ('"'||t.id||'"')),
    '[]'::jsonb
  )
)
WHERE t.fields ? 'depends_on'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(t.fields->'depends_on') v WHERE v::text = ('"'||t.id||'"')
  );

-- 3) （可选）把独立的「春秋女装连衣裙选品判断」也设为 draft，
--    让 服装 行业只保留一条干净的主链「连衣裙选品判断（含客户画像+销售方法）」。
--    如需保留它作为独立示例，注释掉下面这段即可。
UPDATE selection_tokens
SET status = 'draft'
WHERE title = '春秋女装连衣裙选品判断'
  AND status = 'published';

-- 4) 查看结果：主词元 + 它依赖的子词元标题
SELECT
  m.title AS 主词元,
  m.status AS 主词元状态,
  COALESCE(
    (SELECT string_agg(s.title, ' + ')
     FROM jsonb_array_elements(m.fields->'depends_on') d
     LEFT JOIN selection_tokens s ON s.id = (d->>0)::uuid
     WHERE s.deleted_at IS NULL),
    '（无依赖）'
  ) AS 依赖的子词元
FROM selection_tokens m
WHERE m.deleted_at IS NULL
  AND m.status = 'published'
  AND m.domain = '服装'
ORDER BY m.created_at;
