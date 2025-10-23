-- ============================================
-- 删除外键约束和RLS策略，允许web_users和web_favorites独立工作
-- ============================================

-- 第1步：删除所有RLS策略
DROP POLICY IF EXISTS "Users can view their own web favorites" ON web_favorites;
DROP POLICY IF EXISTS "Users can create their own web favorites" ON web_favorites;
DROP POLICY IF EXISTS "Users can delete their own web favorites" ON web_favorites;
DROP POLICY IF EXISTS "Users can view own favorites" ON web_favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON web_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON web_favorites;

DROP POLICY IF EXISTS "Users can view their own web custom sites" ON web_custom_sites;
DROP POLICY IF EXISTS "Users can create their own web custom sites" ON web_custom_sites;
DROP POLICY IF EXISTS "Users can update their own web custom sites" ON web_custom_sites;
DROP POLICY IF EXISTS "Users can delete their own web custom sites" ON web_custom_sites;
DROP POLICY IF EXISTS "Users can view own custom sites" ON web_custom_sites;
DROP POLICY IF EXISTS "Users can insert own custom sites" ON web_custom_sites;
DROP POLICY IF EXISTS "Users can update own custom sites" ON web_custom_sites;
DROP POLICY IF EXISTS "Users can delete own custom sites" ON web_custom_sites;

-- 第2步：删除外键约束
ALTER TABLE web_favorites DROP CONSTRAINT IF EXISTS web_favorites_user_id_fkey;
ALTER TABLE web_custom_sites DROP CONSTRAINT IF EXISTS web_custom_sites_user_id_fkey;

-- 第3步：修改 user_id 为 TEXT 类型
DO $$
BEGIN
  -- 修改 web_favorites.user_id 为 TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'web_favorites'
    AND column_name = 'user_id'
    AND data_type != 'text'
  ) THEN
    ALTER TABLE web_favorites ALTER COLUMN user_id TYPE TEXT;
  END IF;

  -- 修改 web_custom_sites.user_id 为 TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'web_custom_sites'
    AND column_name = 'user_id'
    AND data_type != 'text'
  ) THEN
    ALTER TABLE web_custom_sites ALTER COLUMN user_id TYPE TEXT;
  END IF;

  RAISE NOTICE '✅ RLS策略已删除，外键约束已删除，user_id已改为TEXT类型';
END $$;
