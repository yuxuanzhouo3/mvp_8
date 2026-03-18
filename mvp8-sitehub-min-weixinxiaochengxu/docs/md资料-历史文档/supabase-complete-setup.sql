-- ========================================
-- SiteHub 完整数据库建表脚本 - Supabase
-- 支持双数据库架构（WeChat Cloud + Supabase）
-- 创建日期: 2025-01-13
-- ========================================

-- ========================================
-- 第一步：清理所有旧的视图、函数、表
-- ========================================

-- 删除视图
DROP VIEW IF EXISTS monthly_revenue_trend CASCADE;
DROP VIEW IF EXISTS product_plan_revenue_stats CASCADE;
DROP VIEW IF EXISTS product_revenue_stats CASCADE;
DROP VIEW IF EXISTS sitehub_user_stats CASCADE;
DROP VIEW IF EXISTS user_subscription_status CASCADE;

-- 删除函数
DROP FUNCTION IF EXISTS get_user_with_data(text) CASCADE;
DROP FUNCTION IF EXISTS get_user_current_subscription(text) CASCADE;
DROP FUNCTION IF EXISTS get_user_subscription_history(text, integer) CASCADE;
DROP FUNCTION IF EXISTS cancel_subscription_at_period_end(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS reactivate_subscription(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 删除表（注意顺序，先删除有外键依赖的表）
DROP TABLE IF EXISTS sitehub_payment_stats CASCADE;
DROP TABLE IF EXISTS sitehub_subscriptions CASCADE;
DROP TABLE IF EXISTS sitehub_access_logs CASCADE;
DROP TABLE IF EXISTS sitehub_usage_stats CASCADE;
DROP TABLE IF EXISTS sitehub_custom_sites CASCADE;
DROP TABLE IF EXISTS sitehub_favorites CASCADE;
DROP TABLE IF EXISTS sitehub_users CASCADE;

-- ========================================
-- 第一部分：核心用户数据表
-- ========================================

-- 1. 用户主表（改用 snake_case 命名）
CREATE TABLE IF NOT EXISTS sitehub_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  openid TEXT UNIQUE NOT NULL,
  user_id_number INTEGER,                  -- 稳定用户ID（基于openid hash）- 改用 snake_case
  nickname TEXT,
  avatar_url TEXT,
  region TEXT DEFAULT 'international',
  is_pro BOOLEAN DEFAULT false,            -- 是否为Pro用户
  subscription_status TEXT DEFAULT 'free', -- 订阅状态
  subscription_expires_at TIMESTAMPTZ,     -- 订阅到期时间
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- 2. 收藏夹表
CREATE TABLE IF NOT EXISTS sitehub_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, site_id)
);

-- 3. 自定义网站表
CREATE TABLE IF NOT EXISTS sitehub_custom_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  site_name TEXT NOT NULL,
  site_logo TEXT DEFAULT '🌐',
  site_description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 使用统计表
CREATE TABLE IF NOT EXISTS sitehub_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  action TEXT DEFAULT 'visit',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 访问日志表（可选）
CREATE TABLE IF NOT EXISTS sitehub_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES sitehub_users(id) ON DELETE SET NULL,
  site_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 第二部分：订阅与支付表
-- ========================================

-- 6. 订阅主表
CREATE TABLE IF NOT EXISTS sitehub_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  user_openid TEXT,                        -- 冗余字段，便于查询

  -- 订阅信息
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'personal', 'team')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),

  -- 支付信息
  payment_method TEXT CHECK (payment_method IN ('wechat', 'alipay', 'stripe')),
  wechat_transaction_id TEXT,              -- 微信支付交易号
  wechat_order_id TEXT,                    -- 微信订单号
  stripe_subscription_id TEXT,             -- Stripe订阅ID
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'CNY',

  -- 时间管理
  start_date TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,

  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 支付统计表（支持利润分析）
CREATE TABLE IF NOT EXISTS sitehub_payment_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  user_openid TEXT,                         -- 用户标识（冗余，便于查询）

  -- 产品信息
  product_id TEXT NOT NULL,                 -- 子产品ID（sitehub/morngpt/securefiles等）
  product_name TEXT,                        -- 产品名称
  plan_type TEXT CHECK (plan_type IN ('free', 'pro', 'personal', 'team')),  -- 套餐类型
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),        -- 计费周期

  -- 支付信息
  platform TEXT NOT NULL,                   -- 平台（wechat/web/stripe）
  payment_method TEXT,                      -- 支付方式（wechat/alipay/stripe）
  transaction_id TEXT UNIQUE,               -- 交易ID（唯一）
  order_id TEXT,                            -- 订单号

  -- 金额与成本
  amount DECIMAL(10,2) NOT NULL,            -- 收入金额
  cost DECIMAL(10,2) DEFAULT 0,             -- 成本（云服务费用、API费用等）
  profit DECIMAL(10,2) GENERATED ALWAYS AS (amount - cost) STORED,  -- 利润（自动计算）
  currency TEXT DEFAULT 'CNY',              -- 币种

  -- 状态与元数据
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  refund_amount DECIMAL(10,2) DEFAULT 0,    -- 退款金额
  region TEXT,                              -- 地域（CN/US/EU等）

  -- 时间戳
  paid_at TIMESTAMPTZ DEFAULT NOW(),        -- 支付时间
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 第三部分：索引优化
-- ========================================

-- sitehub_users 索引
CREATE INDEX IF NOT EXISTS idx_sitehub_users_openid ON sitehub_users(openid);
CREATE INDEX IF NOT EXISTS idx_sitehub_users_user_id_number ON sitehub_users(user_id_number);
CREATE INDEX IF NOT EXISTS idx_sitehub_users_region ON sitehub_users(region);
CREATE INDEX IF NOT EXISTS idx_sitehub_users_created_at ON sitehub_users(created_at DESC);

-- sitehub_favorites 索引
CREATE INDEX IF NOT EXISTS idx_sitehub_favorites_user_id ON sitehub_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_sitehub_favorites_site_id ON sitehub_favorites(site_id);
CREATE INDEX IF NOT EXISTS idx_sitehub_favorites_sort ON sitehub_favorites(user_id, sort_order);

-- sitehub_custom_sites 索引
CREATE INDEX IF NOT EXISTS idx_sitehub_custom_sites_user_id ON sitehub_custom_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_sitehub_custom_sites_sort ON sitehub_custom_sites(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_sitehub_custom_sites_created ON sitehub_custom_sites(created_at DESC);

-- sitehub_usage_stats 索引
CREATE INDEX IF NOT EXISTS idx_sitehub_usage_user_id ON sitehub_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_sitehub_usage_site_id ON sitehub_usage_stats(site_id);
CREATE INDEX IF NOT EXISTS idx_sitehub_usage_timestamp ON sitehub_usage_stats(timestamp DESC);

-- sitehub_access_logs 索引
CREATE INDEX IF NOT EXISTS idx_sitehub_logs_user_id ON sitehub_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sitehub_logs_created_at ON sitehub_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sitehub_logs_region ON sitehub_access_logs(region);

-- sitehub_subscriptions 索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON sitehub_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_openid ON sitehub_subscriptions(user_openid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON sitehub_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON sitehub_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_wechat_order ON sitehub_subscriptions(wechat_order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created ON sitehub_subscriptions(created_at DESC);

-- sitehub_payment_stats 索引（增强利润分析能力）
CREATE INDEX IF NOT EXISTS idx_payment_stats_user_id ON sitehub_payment_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_stats_user_openid ON sitehub_payment_stats(user_openid);
CREATE INDEX IF NOT EXISTS idx_payment_stats_product ON sitehub_payment_stats(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_stats_product_plan ON sitehub_payment_stats(product_id, plan_type);  -- 产品+套餐组合查询
CREATE INDEX IF NOT EXISTS idx_payment_stats_platform ON sitehub_payment_stats(platform);
CREATE INDEX IF NOT EXISTS idx_payment_stats_status ON sitehub_payment_stats(status);
CREATE INDEX IF NOT EXISTS idx_payment_stats_region ON sitehub_payment_stats(region);
CREATE INDEX IF NOT EXISTS idx_payment_stats_transaction ON sitehub_payment_stats(transaction_id);  -- 唯一交易查询
CREATE INDEX IF NOT EXISTS idx_payment_stats_paid_at ON sitehub_payment_stats(paid_at DESC);  -- 按支付时间排序
CREATE INDEX IF NOT EXISTS idx_payment_stats_created ON sitehub_payment_stats(created_at DESC);

-- ========================================
-- 第四部分：触发器与函数
-- ========================================

-- 1. 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. 为相关表添加更新时间触发器
DROP TRIGGER IF EXISTS update_sitehub_users_updated_at ON sitehub_users;
CREATE TRIGGER update_sitehub_users_updated_at
    BEFORE UPDATE ON sitehub_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sitehub_custom_sites_updated_at ON sitehub_custom_sites;
CREATE TRIGGER update_sitehub_custom_sites_updated_at
    BEFORE UPDATE ON sitehub_custom_sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sitehub_subscriptions_updated_at ON sitehub_subscriptions;
CREATE TRIGGER update_sitehub_subscriptions_updated_at
    BEFORE UPDATE ON sitehub_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sitehub_payment_stats_updated_at ON sitehub_payment_stats;
CREATE TRIGGER update_sitehub_payment_stats_updated_at
    BEFORE UPDATE ON sitehub_payment_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 第五部分：行级安全策略 (RLS)
-- ========================================

-- 启用 RLS
ALTER TABLE sitehub_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_custom_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_payment_stats ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Service role can manage all data" ON sitehub_users;
DROP POLICY IF EXISTS "Service role can manage all data" ON sitehub_favorites;
DROP POLICY IF EXISTS "Service role can manage all data" ON sitehub_custom_sites;
DROP POLICY IF EXISTS "Service role can manage all data" ON sitehub_usage_stats;
DROP POLICY IF EXISTS "Service role can manage all data" ON sitehub_access_logs;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON sitehub_subscriptions;
DROP POLICY IF EXISTS "Service role can manage payment stats" ON sitehub_payment_stats;

-- 创建服务端访问策略（用于云函数 - 使用 service_role）
CREATE POLICY "Service role can manage all data" ON sitehub_users
    FOR ALL USING (true);

CREATE POLICY "Service role can manage all data" ON sitehub_favorites
    FOR ALL USING (true);

CREATE POLICY "Service role can manage all data" ON sitehub_custom_sites
    FOR ALL USING (true);

CREATE POLICY "Service role can manage all data" ON sitehub_usage_stats
    FOR ALL USING (true);

CREATE POLICY "Service role can manage all data" ON sitehub_access_logs
    FOR ALL USING (true);

CREATE POLICY "Service role can manage subscriptions" ON sitehub_subscriptions
    FOR ALL USING (true);

CREATE POLICY "Service role can manage payment stats" ON sitehub_payment_stats
    FOR ALL USING (true);

-- ========================================
-- 第六部分：数据库函数
-- ========================================

-- 1. 获取用户完整信息（包含收藏和统计）
CREATE OR REPLACE FUNCTION get_user_with_data(p_openid TEXT)
RETURNS TABLE (
    user_id UUID,
    openid TEXT,
    user_id_number INTEGER,
    nickname TEXT,
    avatar_url TEXT,
    region TEXT,
    is_pro BOOLEAN,
    subscription_status TEXT,
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    favorites JSON,
    usage_stats JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.openid,
        u.user_id_number,
        u.nickname,
        u.avatar_url,
        u.region,
        u.is_pro,
        u.subscription_status,
        u.subscription_expires_at,
        u.created_at,
        u.last_login,
        COALESCE(
            (SELECT json_agg(json_build_object('site_id', f.site_id, 'sort_order', f.sort_order, 'created_at', f.created_at))
             FROM sitehub_favorites f WHERE f.user_id = u.id ORDER BY f.sort_order),
            '[]'::json
        ) as favorites,
        COALESCE(
            (SELECT json_agg(json_build_object('site_id', s.site_id, 'action', s.action, 'timestamp', s.timestamp))
             FROM sitehub_usage_stats s WHERE s.user_id = u.id ORDER BY s.timestamp DESC LIMIT 100),
            '[]'::json
        ) as usage_stats
    FROM sitehub_users u
    WHERE u.openid = p_openid;
END;
$$ LANGUAGE plpgsql;

-- 2. 获取用户当前订阅
CREATE OR REPLACE FUNCTION get_user_current_subscription(p_openid TEXT)
RETURNS TABLE (
    subscription_id UUID,
    plan_type TEXT,
    billing_cycle TEXT,
    status TEXT,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN,
    amount DECIMAL(10,2),
    currency TEXT,
    payment_method TEXT,
    start_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.plan_type,
        s.billing_cycle,
        s.status,
        s.current_period_end,
        s.cancel_at_period_end,
        s.amount,
        s.currency,
        s.payment_method,
        s.start_date
    FROM sitehub_subscriptions s
    INNER JOIN sitehub_users u ON s.user_id = u.id
    WHERE u.openid = p_openid
    AND s.status IN ('active', 'pending', 'cancelled')
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 3. 获取用户订阅历史
CREATE OR REPLACE FUNCTION get_user_subscription_history(p_openid TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    subscription_id UUID,
    plan_type TEXT,
    billing_cycle TEXT,
    amount DECIMAL(10,2),
    currency TEXT,
    payment_method TEXT,
    transaction_id TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.plan_type,
        s.billing_cycle,
        s.amount,
        s.currency,
        s.payment_method,
        s.wechat_transaction_id,
        s.start_date,
        s.current_period_end,
        s.status,
        s.created_at
    FROM sitehub_subscriptions s
    INNER JOIN sitehub_users u ON s.user_id = u.id
    WHERE u.openid = p_openid
    ORDER BY s.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 4. 取消订阅（设置在周期结束时取消）
CREATE OR REPLACE FUNCTION cancel_subscription_at_period_end(
    p_subscription_id UUID,
    p_openid TEXT
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    UPDATE sitehub_subscriptions s
    SET
        cancel_at_period_end = true,
        cancelled_at = NOW(),
        updated_at = NOW()
    FROM sitehub_users u
    WHERE s.id = p_subscription_id
    AND s.user_id = u.id
    AND u.openid = p_openid
    AND s.status = 'active'
    RETURNING json_build_object(
        'success', true,
        'message', '订阅将在当前周期结束时取消',
        'subscription_id', s.id,
        'current_period_end', s.current_period_end,
        'cancel_at_period_end', s.cancel_at_period_end
    ) INTO v_result;

    IF v_result IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', '订阅不存在或已取消'
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 5. 重新激活订阅
CREATE OR REPLACE FUNCTION reactivate_subscription(
    p_subscription_id UUID,
    p_openid TEXT
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    UPDATE sitehub_subscriptions s
    SET
        cancel_at_period_end = false,
        cancelled_at = NULL,
        status = 'active',
        updated_at = NOW()
    FROM sitehub_users u
    WHERE s.id = p_subscription_id
    AND s.user_id = u.id
    AND u.openid = p_openid
    AND s.cancel_at_period_end = true
    RETURNING json_build_object(
        'success', true,
        'message', '订阅已重新激活',
        'subscription_id', s.id,
        'status', s.status,
        'cancel_at_period_end', s.cancel_at_period_end
    ) INTO v_result;

    IF v_result IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', '订阅不存在或无法重新激活'
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 第七部分：视图
-- ========================================

-- 用户订阅状态视图
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT
    u.id as user_id,
    u.openid,
    u.nickname,
    u.is_pro,
    u.subscription_status,
    u.subscription_expires_at,
    s.id as subscription_id,
    s.plan_type,
    s.billing_cycle,
    s.status as subscription_status_detail,
    s.current_period_end,
    s.cancel_at_period_end,
    s.amount,
    s.currency,
    s.payment_method,
    s.start_date,
    s.created_at as subscription_created_at
FROM sitehub_users u
LEFT JOIN LATERAL (
    SELECT *
    FROM sitehub_subscriptions
    WHERE user_id = u.id
    ORDER BY created_at DESC
    LIMIT 1
) s ON true;

-- 用户统计视图
CREATE OR REPLACE VIEW sitehub_user_stats AS
SELECT
    u.id,
    u.openid,
    u.nickname,
    u.region,
    u.is_pro,
    u.created_at,
    u.last_login,
    COUNT(DISTINCT f.id) as favorites_count,
    COUNT(DISTINCT c.id) as custom_sites_count,
    COUNT(DISTINCT s.id) as sites_accessed_count,
    MAX(s.timestamp) as last_site_access
FROM sitehub_users u
LEFT JOIN sitehub_favorites f ON u.id = f.user_id
LEFT JOIN sitehub_custom_sites c ON u.id = c.user_id
LEFT JOIN sitehub_usage_stats s ON u.id = s.user_id
GROUP BY u.id, u.openid, u.nickname, u.region, u.is_pro, u.created_at, u.last_login;

-- 产品利润统计视图（按产品聚合）
CREATE OR REPLACE VIEW product_revenue_stats AS
SELECT
    product_id,
    product_name,
    COUNT(*) as total_transactions,
    COUNT(DISTINCT user_id) as unique_customers,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
    SUM(CASE WHEN status = 'completed' THEN cost ELSE 0 END) as total_cost,
    SUM(CASE WHEN status = 'completed' THEN profit ELSE 0 END) as total_profit,
    AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_revenue_per_transaction,
    AVG(CASE WHEN status = 'completed' THEN profit ELSE NULL END) as avg_profit_per_transaction,
    SUM(CASE WHEN status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunds,
    MIN(paid_at) as first_payment_date,
    MAX(paid_at) as last_payment_date
FROM sitehub_payment_stats
GROUP BY product_id, product_name
ORDER BY total_profit DESC;

-- 产品套餐利润明细视图（按产品+套餐+周期聚合）
CREATE OR REPLACE VIEW product_plan_revenue_stats AS
SELECT
    product_id,
    product_name,
    plan_type,
    billing_cycle,
    COUNT(*) as total_transactions,
    COUNT(DISTINCT user_id) as unique_customers,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
    SUM(CASE WHEN status = 'completed' THEN cost ELSE 0 END) as total_cost,
    SUM(CASE WHEN status = 'completed' THEN profit ELSE 0 END) as total_profit,
    AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_revenue,
    AVG(CASE WHEN status = 'completed' THEN profit ELSE NULL END) as avg_profit,
    SUM(CASE WHEN status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunds
FROM sitehub_payment_stats
WHERE plan_type IS NOT NULL
GROUP BY product_id, product_name, plan_type, billing_cycle
ORDER BY total_profit DESC;

-- 月度收入趋势视图
CREATE OR REPLACE VIEW monthly_revenue_trend AS
SELECT
    DATE_TRUNC('month', paid_at) as month,
    product_id,
    COUNT(*) as transactions,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue,
    SUM(CASE WHEN status = 'completed' THEN cost ELSE 0 END) as cost,
    SUM(CASE WHEN status = 'completed' THEN profit ELSE 0 END) as profit,
    COUNT(DISTINCT user_id) as unique_customers
FROM sitehub_payment_stats
GROUP BY DATE_TRUNC('month', paid_at), product_id
ORDER BY month DESC, profit DESC;

-- ========================================
-- 验证与诊断
-- ========================================

-- 显示所有创建的表
SELECT '✅ 已创建的表:' as info;
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'sitehub_%'
ORDER BY table_name;

-- 显示订阅表结构
SELECT '✅ sitehub_subscriptions 表结构:' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'sitehub_subscriptions'
ORDER BY ordinal_position;

-- 显示所有索引
SELECT '✅ 已创建的索引:' as info;
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'sitehub_%'
ORDER BY tablename, indexname;

-- 显示所有函数
SELECT '✅ 已创建的函数:' as info;
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%subscription%' OR routine_name LIKE '%user%')
ORDER BY routine_name;

-- 完成提示
SELECT '🎉 SiteHub Supabase 数据库建表完成！' as status;
