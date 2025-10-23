-- ============================================
-- 数据库修复验证脚本
-- 用于检查修复后的数据库状态
-- ============================================

DO $$
DECLARE
  fav_columns TEXT[];
  fav_count INTEGER;
  custom_exists BOOLEAN;
  custom_count INTEGER;
  old_custom_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 数据库状态检查报告';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- 检查1: web_favorites 表结构
  RAISE NOTICE '【1】检查 web_favorites 表';

  SELECT ARRAY_AGG(column_name ORDER BY column_name) INTO fav_columns
  FROM information_schema.columns
  WHERE table_name = 'web_favorites'
  AND column_name IN ('site_name', 'site_url', 'site_icon', 'site_category');

  IF ARRAY_LENGTH(fav_columns, 1) >= 4 THEN
    RAISE NOTICE '  ✅ 表结构正确，包含所有必需字段';
    RAISE NOTICE '     字段: %', fav_columns;
  ELSE
    RAISE WARNING '  ⚠️  表结构不完整！';
    RAISE NOTICE '     当前字段: %', fav_columns;
    RAISE NOTICE '     缺少字段: site_name, site_url, site_icon, site_category';
  END IF;

  SELECT COUNT(*) INTO fav_count FROM web_favorites;
  RAISE NOTICE '  📊 当前数据量: % 条', fav_count;
  RAISE NOTICE '';

  -- 检查2: custom_websites 表
  RAISE NOTICE '【2】检查 custom_websites 表';

  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'custom_websites'
  ) INTO custom_exists;

  IF custom_exists THEN
    RAISE NOTICE '  ✅ 表已创建';

    SELECT COUNT(*) INTO custom_count FROM custom_websites;
    RAISE NOTICE '  📊 当前数据量: % 条', custom_count;
  ELSE
    RAISE WARNING '  ❌ 表不存在！';
  END IF;
  RAISE NOTICE '';

  -- 检查3: 旧表 web_custom_sites
  RAISE NOTICE '【3】检查旧表 web_custom_sites';

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'web_custom_sites') THEN
    SELECT COUNT(*) INTO old_custom_count FROM web_custom_sites;
    RAISE NOTICE '  ℹ️  旧表存在';
    RAISE NOTICE '  📊 旧表数据量: % 条', old_custom_count;

    IF custom_exists AND custom_count > 0 THEN
      RAISE NOTICE '  ✅ 数据已迁移到新表';
      IF custom_count >= old_custom_count THEN
        RAISE NOTICE '     迁移完整度: 100%%';
      ELSE
        RAISE NOTICE '     迁移完整度: %%%', ROUND((custom_count::NUMERIC / old_custom_count) * 100, 2);
      END IF;
    ELSE
      RAISE WARNING '  ⚠️  数据可能未迁移';
    END IF;
  ELSE
    RAISE NOTICE '  ℹ️  旧表不存在（正常）';
  END IF;
  RAISE NOTICE '';

  -- 检查4: RLS 策略
  RAISE NOTICE '【4】检查 RLS 安全策略';

  IF EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'custom_websites'
    AND policyname LIKE '%can view own%'
  ) THEN
    RAISE NOTICE '  ✅ custom_websites RLS 策略已启用';
  ELSE
    RAISE WARNING '  ⚠️  custom_websites RLS 策略缺失';
  END IF;

  IF EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'web_favorites'
    AND policyname LIKE '%can view own%'
  ) THEN
    RAISE NOTICE '  ✅ web_favorites RLS 策略已启用';
  ELSE
    RAISE WARNING '  ⚠️  web_favorites RLS 策略缺失';
  END IF;
  RAISE NOTICE '';

  -- 总结
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 检查总结';
  RAISE NOTICE '========================================';

  IF ARRAY_LENGTH(fav_columns, 1) >= 4 AND custom_exists THEN
    RAISE NOTICE '✅ 数据库修复成功！';
    RAISE NOTICE '';
    RAISE NOTICE '可以开始测试：';
    RAISE NOTICE '  1. 登录账号';
    RAISE NOTICE '  2. 添加收藏/自定义网站';
    RAISE NOTICE '  3. 登出再登录';
    RAISE NOTICE '  4. 数据应该保留';
  ELSE
    RAISE WARNING '⚠️  数据库可能存在问题，请执行修复脚本：';
    RAISE NOTICE '    scripts/fix-database-tables.sql';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
