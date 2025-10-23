-- ============================================
-- 终极修复方案：动态删除所有策略
-- ============================================

-- 第1步：动态删除 web_favorites 的所有策略
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'web_favorites'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON web_favorites', r.policyname);
    RAISE NOTICE '已删除策略: %', r.policyname;
  END LOOP;
END $$;

-- 第2步：动态删除 web_custom_sites 的所有策略
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'web_custom_sites'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON web_custom_sites', r.policyname);
    RAISE NOTICE '已删除策略: %', r.policyname;
  END LOOP;
END $$;

-- 第3步：禁用RLS
ALTER TABLE web_favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE web_custom_sites DISABLE ROW LEVEL SECURITY;

-- 第4步：删除外键约束
ALTER TABLE web_favorites DROP CONSTRAINT IF EXISTS web_favorites_user_id_fkey;
ALTER TABLE web_custom_sites DROP CONSTRAINT IF EXISTS web_custom_sites_user_id_fkey;

-- 第5步：修改 user_id 为 TEXT 类型
ALTER TABLE web_favorites ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE web_custom_sites ALTER COLUMN user_id TYPE TEXT;

-- 显示成功消息
SELECT '✅ 所有策略已删除，RLS已禁用，外键已删除，user_id已改为TEXT！' AS status;
