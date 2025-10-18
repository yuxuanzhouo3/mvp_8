-- =====================================================
-- Supabase 数据库清理和修复脚本
-- =====================================================
-- 用途：删除错误的表，确保只使用带前缀的表
-- 日期：2025-01-13
-- =====================================================

-- =====================================================
-- 第一步：删除没有前缀的旧表（冲突表）
-- =====================================================

-- 1. 删除没有前缀的 subscriptions 表
-- 注意：这个表可能已经有数据，执行前请确认！
DROP TABLE IF EXISTS subscriptions CASCADE;

-- 2. 确认删除成功
SELECT '✅ 已删除没有前缀的 subscriptions 表' as status;

-- =====================================================
-- 第二步：修复 web_payment_transactions 表的外键（如果需要）
-- =====================================================

-- 如果 web_payment_transactions 表已经创建，但外键引用错误，执行以下修复：

-- 1. 删除错误的外键约束
DO $$
BEGIN
  -- 检查并删除可能存在的错误外键
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name LIKE '%subscription%'
      AND table_name = 'web_payment_transactions'
  ) THEN
    ALTER TABLE web_payment_transactions
    DROP CONSTRAINT IF EXISTS web_payment_transactions_subscription_id_fkey;
  END IF;
END $$;

-- 2. 添加正确的外键约束（引用 web_subscriptions）
ALTER TABLE web_payment_transactions
ADD CONSTRAINT web_payment_transactions_subscription_id_fkey
FOREIGN KEY (subscription_id)
REFERENCES web_subscriptions(id)
ON DELETE SET NULL;

SELECT '✅ 已修复 web_payment_transactions 表的外键' as status;

-- =====================================================
-- 第三步：保留官网表（不重命名）
-- =====================================================

-- 注意：不重命名 user_favorites 和 user_custom_sites
-- 因为前端代码使用这些表名，重命名会导致功能失效

-- 检查表是否存在
SELECT '✅ 保持官网表名不变（user_favorites, user_custom_sites）' as status;

-- =====================================================
-- 第四步：验证表结构
-- =====================================================

-- 1. 查看所有表
SELECT
  table_name,
  CASE
    WHEN table_name LIKE 'sitehub_%' THEN '小程序表'
    WHEN table_name LIKE 'web_%' THEN '官网表'
    WHEN table_name IN ('profiles', 'user_settings') THEN '共享表'
    ELSE '其他'
  END as table_category
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_category, table_name;

-- 2. 检查外键关系
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('web_subscriptions', 'web_payment_transactions')
ORDER BY tc.table_name;

-- 3. 验证视图是否创建成功
SELECT
  table_name as view_name,
  'VIEW' as object_type
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'v_%'
ORDER BY table_name;

-- =====================================================
-- 完成！
-- =====================================================
SELECT '🎉 数据库清理和修复完成！' as final_status;

-- 验证命令：
-- SELECT * FROM web_subscriptions LIMIT 5;
-- SELECT * FROM web_payment_transactions LIMIT 5;
-- SELECT * FROM v_profit_by_product;
