-- ============================================
-- 快速修复：创建web_users表并禁用RLS
-- 用于快速测试海外用户注册/登录
-- ============================================

-- 第1步：创建 web_users 表（如果不存在）
CREATE TABLE IF NOT EXISTS web_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname TEXT,
  avatar TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  region TEXT DEFAULT 'overseas',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_web_users_email ON web_users(email);

-- 第2步：禁用RLS（在已有表上）
DO $$
BEGIN
  -- 禁用 web_users 的 RLS
  EXECUTE 'ALTER TABLE web_users DISABLE ROW LEVEL SECURITY';

  -- 如果 web_favorites 存在，禁用它的 RLS
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'web_favorites') THEN
    EXECUTE 'ALTER TABLE web_favorites DISABLE ROW LEVEL SECURITY';
  END IF;

  -- 如果 web_custom_sites 存在，禁用它的 RLS
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'web_custom_sites') THEN
    EXECUTE 'ALTER TABLE web_custom_sites DISABLE ROW LEVEL SECURITY';
  END IF;

  RAISE NOTICE '✅ RLS已临时禁用，可以开始测试';
END $$;
