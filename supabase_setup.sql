-- =====================================================
-- SiteHub Supabase 数据库表创建脚本
-- =====================================================
-- 用途：将用户收藏夹和自定义网站从 localStorage 迁移到 Supabase
-- 作者：SiteHub Development Team
-- 日期：2025-01-07
-- =====================================================

-- =====================================================
-- 表 1: user_favorites (用户收藏夹)
-- =====================================================
-- 存储用户收藏的网站 ID

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 确保用户不会重复收藏同一个网站
  UNIQUE(user_id, site_id)
);

-- 创建索引提升查询速度
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at);

-- 添加注释
COMMENT ON TABLE user_favorites IS '用户收藏的网站';
COMMENT ON COLUMN user_favorites.user_id IS '用户ID，关联到 auth.users';
COMMENT ON COLUMN user_favorites.site_id IS '网站ID（可以是预设网站或自定义网站的ID）';
COMMENT ON COLUMN user_favorites.created_at IS '收藏时间';

-- 启用 Row Level Security (RLS)
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看自己的收藏
CREATE POLICY "Users can view their own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 策略：用户只能添加自己的收藏
CREATE POLICY "Users can insert their own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略：用户只能删除自己的收藏
CREATE POLICY "Users can delete their own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 表 2: user_custom_sites (用户自定义网站)
-- =====================================================
-- 存储用户添加的自定义网站

CREATE TABLE IF NOT EXISTS user_custom_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引提升查询速度
CREATE INDEX IF NOT EXISTS idx_user_custom_sites_user_id ON user_custom_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_sites_category ON user_custom_sites(category);
CREATE INDEX IF NOT EXISTS idx_user_custom_sites_created_at ON user_custom_sites(created_at);

-- 添加注释
COMMENT ON TABLE user_custom_sites IS '用户自定义添加的网站';
COMMENT ON COLUMN user_custom_sites.user_id IS '用户ID，关联到 auth.users';
COMMENT ON COLUMN user_custom_sites.name IS '网站名称';
COMMENT ON COLUMN user_custom_sites.url IS '网站URL';
COMMENT ON COLUMN user_custom_sites.logo IS '网站Logo URL';
COMMENT ON COLUMN user_custom_sites.category IS '网站分类（social, productivity, ai, etc.）';
COMMENT ON COLUMN user_custom_sites.created_at IS '创建时间';
COMMENT ON COLUMN user_custom_sites.updated_at IS '最后更新时间';

-- 启用 Row Level Security (RLS)
ALTER TABLE user_custom_sites ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看自己的自定义网站
CREATE POLICY "Users can view their own custom sites"
  ON user_custom_sites FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 策略：用户只能添加自己的自定义网站
CREATE POLICY "Users can insert their own custom sites"
  ON user_custom_sites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略：用户只能更新自己的自定义网站
CREATE POLICY "Users can update their own custom sites"
  ON user_custom_sites FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS 策略：用户只能删除自己的自定义网站
CREATE POLICY "Users can delete their own custom sites"
  ON user_custom_sites FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 创建更新 updated_at 的触发器函数
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 user_custom_sites 表添加自动更新 updated_at 的触发器
CREATE TRIGGER update_user_custom_sites_updated_at
  BEFORE UPDATE ON user_custom_sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 完成！
-- =====================================================
-- 现在你可以验证表是否创建成功：
-- SELECT * FROM user_favorites LIMIT 10;
-- SELECT * FROM user_custom_sites LIMIT 10;
-- =====================================================
