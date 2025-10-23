-- ============================================
-- 数据库表结构修复脚本
-- 问题：收藏和自定义网站数据无法保存
-- 根因：表结构与代码不匹配
-- ============================================

-- 步骤1：修复 web_favorites 表 - 添加缺失字段
ALTER TABLE web_favorites
ADD COLUMN IF NOT EXISTS site_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS site_url TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS site_icon TEXT,
ADD COLUMN IF NOT EXISTS site_category TEXT;

-- 更新现有数据的默认值（如果有数据）
UPDATE web_favorites
SET site_name = COALESCE(site_name, ''),
    site_url = COALESCE(site_url, ''),
    site_icon = COALESCE(site_icon, '🌐'),
    site_category = COALESCE(site_category, 'tools')
WHERE site_name = '' OR site_url = '';

-- ============================================

-- 步骤2：创建 custom_websites 表（代码中实际使用的表名）
CREATE TABLE IF NOT EXISTS custom_websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT DEFAULT '🌐',  -- 注意：代码中使用icon，不是logo
  category TEXT DEFAULT 'tools',
  is_favorite BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_custom_websites_user_id ON custom_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_websites_sort_order ON custom_websites(user_id, sort_order);

-- RLS 策略
ALTER TABLE custom_websites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own custom sites" ON custom_websites;
CREATE POLICY "Users can view own custom sites"
  ON custom_websites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own custom sites" ON custom_websites;
CREATE POLICY "Users can insert own custom sites"
  ON custom_websites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own custom sites" ON custom_websites;
CREATE POLICY "Users can update own custom sites"
  ON custom_websites FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own custom sites" ON custom_websites;
CREATE POLICY "Users can delete own custom sites"
  ON custom_websites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================

-- 步骤3：数据迁移（如果web_custom_sites表存在且有数据）
DO $$
DECLARE
  old_table_exists BOOLEAN;
  user_id_type TEXT;
  migrated_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- 检查旧表是否存在
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'web_custom_sites'
  ) INTO old_table_exists;

  IF old_table_exists THEN
    -- 获取旧表数据总数
    EXECUTE 'SELECT COUNT(*) FROM web_custom_sites' INTO total_count;

    -- 检查user_id字段类型
    SELECT udt_name INTO user_id_type
    FROM information_schema.columns
    WHERE table_name = 'web_custom_sites' AND column_name = 'user_id';

    RAISE NOTICE '检测到旧表 web_custom_sites';
    RAISE NOTICE '  - 数据总数: %', total_count;
    RAISE NOTICE '  - user_id 类型: %', user_id_type;

    -- 尝试迁移数据（带错误处理）
    BEGIN
      IF user_id_type IN ('text', 'varchar', 'character varying') THEN
        -- TEXT类型需要转换为UUID
        INSERT INTO custom_websites (id, user_id, name, url, icon, category, created_at, updated_at)
        SELECT
          COALESCE(id, gen_random_uuid()),
          user_id::uuid,  -- 将TEXT转换为UUID
          name,
          url,
          COALESCE(logo, '🌐') AS icon,
          COALESCE(category, 'tools'),
          COALESCE(created_at, NOW()),
          COALESCE(updated_at, NOW())
        FROM web_custom_sites
        WHERE user_id IS NOT NULL
          AND user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        ON CONFLICT (id) DO NOTHING;

        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE '✅ 已迁移 % / % 条数据（TEXT→UUID转换）', migrated_count, total_count;
      ELSE
        -- UUID类型或其他类型直接迁移
        INSERT INTO custom_websites (id, user_id, name, url, icon, category, created_at, updated_at)
        SELECT
          COALESCE(id, gen_random_uuid()),
          user_id,
          name,
          url,
          COALESCE(logo, '🌐') AS icon,
          COALESCE(category, 'tools'),
          COALESCE(created_at, NOW()),
          COALESCE(updated_at, NOW())
        FROM web_custom_sites
        ON CONFLICT (id) DO NOTHING;

        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE '✅ 已迁移 % / % 条数据', migrated_count, total_count;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '⚠️  数据迁移失败: %', SQLERRM;
        RAISE NOTICE 'ℹ️  这不影响新数据的使用，旧数据可能需要手动迁移';
    END;
  ELSE
    RAISE NOTICE 'ℹ️  旧表 web_custom_sites 不存在，跳过数据迁移';
  END IF;
END $$;

-- ============================================

-- 步骤4：添加触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_custom_websites_updated_at ON custom_websites;
CREATE TRIGGER update_custom_websites_updated_at
  BEFORE UPDATE ON custom_websites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================

-- 验证步骤
DO $$
DECLARE
  fav_cols INTEGER;
  custom_exists BOOLEAN;
BEGIN
  -- 检查 web_favorites 字段
  SELECT COUNT(*) INTO fav_cols
  FROM information_schema.columns
  WHERE table_name = 'web_favorites'
  AND column_name IN ('site_name', 'site_url', 'site_icon', 'site_category');

  -- 检查 custom_websites 表是否存在
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'custom_websites'
  ) INTO custom_exists;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 数据库修复完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '检查结果：';
  RAISE NOTICE '  - web_favorites 新增字段数: %', fav_cols;

  IF fav_cols >= 4 THEN
    RAISE NOTICE '    ✅ web_favorites 表结构正确';
  ELSE
    RAISE WARNING '    ⚠️  web_favorites 表字段可能缺失';
  END IF;

  IF custom_exists THEN
    RAISE NOTICE '    ✅ custom_websites 表已创建';
  ELSE
    RAISE WARNING '    ⚠️  custom_websites 表创建失败';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '请在应用中测试：';
  RAISE NOTICE '  1. 登录后添加收藏';
  RAISE NOTICE '  2. 添加自定义网站';
  RAISE NOTICE '  3. 登出再登录，数据应该保留';
  RAISE NOTICE '';
END $$;
