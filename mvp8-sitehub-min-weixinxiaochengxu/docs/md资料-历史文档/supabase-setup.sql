-- ========================================
-- SiteHub 数据库修复脚本
-- 兼容现有数据库，安全升级
-- ========================================

-- 0. 检查现有表结构（调试用）
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('sitehub_users', 'sitehub_favorites', 'sitehub_usage_stats')
ORDER BY table_name, ordinal_position;

-- 1. 创建小程序用户数据表（如果不存在）
CREATE TABLE IF NOT EXISTS sitehub_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  openid TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  region TEXT DEFAULT 'international',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建小程序收藏数据表（如果不存在）
CREATE TABLE IF NOT EXISTS sitehub_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, site_id)
);

-- 3. 修复：添加缺失的列
ALTER TABLE sitehub_favorites ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 4. 创建自定义网站表（如果不存在）
CREATE TABLE IF NOT EXISTS sitehub_custom_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  site_name TEXT NOT NULL,
  site_logo TEXT DEFAULT '🌐',
  site_description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建小程序使用统计表（如果不存在）
CREATE TABLE IF NOT EXISTS sitehub_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 修复：更新使用统计表结构
ALTER TABLE sitehub_usage_stats DROP COLUMN IF EXISTS access_count;
ALTER TABLE sitehub_usage_stats DROP COLUMN IF EXISTS last_accessed;
ALTER TABLE sitehub_usage_stats DROP COLUMN IF EXISTS region;
ALTER TABLE sitehub_usage_stats ADD COLUMN IF NOT EXISTS action TEXT DEFAULT 'visit';
ALTER TABLE sitehub_usage_stats ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. 创建小程序访问日志表（可选，用于分析）
CREATE TABLE IF NOT EXISTS sitehub_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES sitehub_users(id) ON DELETE SET NULL,
  site_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_sitehub_users_openid ON sitehub_users(openid);
CREATE INDEX IF NOT EXISTS idx_sitehub_users_region ON sitehub_users(region);
CREATE INDEX IF NOT EXISTS idx_sitehub_users_created_at ON sitehub_users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sitehub_favorites_user_id ON sitehub_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_sitehub_favorites_site_id ON sitehub_favorites(site_id);
CREATE INDEX IF NOT EXISTS idx_sitehub_favorites_sort ON sitehub_favorites(user_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_sitehub_custom_sites_user_id ON sitehub_custom_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_sitehub_custom_sites_sort ON sitehub_custom_sites(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_sitehub_custom_sites_created ON sitehub_custom_sites(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sitehub_usage_user_id ON sitehub_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_sitehub_usage_site_id ON sitehub_usage_stats(site_id);
CREATE INDEX IF NOT EXISTS idx_sitehub_usage_timestamp ON sitehub_usage_stats(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sitehub_logs_user_id ON sitehub_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sitehub_logs_created_at ON sitehub_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sitehub_logs_region ON sitehub_access_logs(region);

-- 9. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. 为用户表添加更新时间触发器
CREATE TRIGGER update_sitehub_users_updated_at 
    BEFORE UPDATE ON sitehub_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 11. 创建行级安全策略 (RLS)
ALTER TABLE sitehub_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_access_logs ENABLE ROW LEVEL SECURITY;

-- 12. 创建服务端访问策略（用于云函数）
CREATE POLICY "Service role can manage all data" ON sitehub_users
    FOR ALL USING (true);

CREATE POLICY "Service role can manage all data" ON sitehub_favorites
    FOR ALL USING (true);

CREATE POLICY "Service role can manage all data" ON sitehub_usage_stats
    FOR ALL USING (true);

CREATE POLICY "Service role can manage all data" ON sitehub_access_logs
    FOR ALL USING (true);

-- 13. 创建视图：用户收藏统计
CREATE OR REPLACE VIEW sitehub_user_stats AS
SELECT 
    u.id,
    u.openid,
    u.nickname,
    u.region,
    u.created_at,
    u.last_login,
    COUNT(f.id) as favorites_count,
    COUNT(s.id) as sites_accessed_count,
    MAX(s.timestamp) as last_site_access
FROM sitehub_users u
LEFT JOIN sitehub_favorites f ON u.id = f.user_id
LEFT JOIN sitehub_usage_stats s ON u.id = s.user_id
GROUP BY u.id, u.openid, u.nickname, u.region, u.created_at, u.last_login;

-- 14. 创建函数：获取用户完整信息
CREATE OR REPLACE FUNCTION get_user_with_data(user_openid TEXT)
RETURNS TABLE (
    user_id UUID,
    openid TEXT,
    nickname TEXT,
    avatar_url TEXT,
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    favorites JSON,
    usage_stats JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.openid,
        u.nickname,
        u.avatar_url,
        u.region,
        u.created_at,
        u.last_login,
        COALESCE(
            (SELECT json_agg(json_build_object('site_id', f.site_id, 'created_at', f.created_at))
             FROM sitehub_favorites f WHERE f.user_id = u.id), 
            '[]'::json
        ) as favorites,
        COALESCE(
            (SELECT json_agg(json_build_object('site_id', s.site_id, 'action', s.action, 'timestamp', s.timestamp))
             FROM sitehub_usage_stats s WHERE s.user_id = u.id), 
            '[]'::json
        ) as usage_stats
    FROM sitehub_users u
    WHERE u.openid = user_openid;
END;
$$ LANGUAGE plpgsql;

-- 15. 执行完成提示
SELECT 'SiteHub Supabase数据库修复完成！' as status;

-- 16. 验证表是否创建成功
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'sitehub_%'
ORDER BY table_name;

-- 17. 验证表结构
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name LIKE 'sitehub_%'
ORDER BY table_name, ordinal_position;

-- 18. 检查现有表结构（调试用）
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('sitehub_users', 'sitehub_favorites', 'sitehub_usage_stats')
ORDER BY table_name, ordinal_position;
