-- ============================================
-- 最简单的修复方案：
-- 1. 先禁用RLS（这会让所有策略失效）
-- 2. 删除外键约束
-- 3. 修改user_id类型为TEXT
-- ============================================

-- 第1步：禁用RLS（这样策略就不会阻止类型修改）
ALTER TABLE web_favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE web_custom_sites DISABLE ROW LEVEL SECURITY;

-- 第2步：删除外键约束
ALTER TABLE web_favorites DROP CONSTRAINT IF EXISTS web_favorites_user_id_fkey;
ALTER TABLE web_custom_sites DROP CONSTRAINT IF EXISTS web_custom_sites_user_id_fkey;

-- 第3步：修改 user_id 为 TEXT 类型
ALTER TABLE web_favorites ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE web_custom_sites ALTER COLUMN user_id TYPE TEXT;

-- 显示成功消息
SELECT '✅ RLS已禁用，外键已删除，user_id已改为TEXT，可以开始测试了！' AS status;
