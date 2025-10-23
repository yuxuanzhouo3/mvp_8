-- 查询所有RLS策略
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('web_favorites', 'web_custom_sites')
ORDER BY tablename, policyname;
