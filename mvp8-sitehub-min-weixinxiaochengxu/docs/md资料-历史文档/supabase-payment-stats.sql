-- ========================================
-- 支付统计表创建脚本
-- 支持官网和小程序利润统计
-- ========================================

-- 1. 支付统计主表
CREATE TABLE IF NOT EXISTS payment_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,           -- 子产品ID (web_sitehub, mp_sitehub等)
  product_name TEXT NOT NULL,         -- 子产品名称
  platform TEXT NOT NULL,            -- 平台: 'website' | 'miniprogram'
  plan_type TEXT NOT NULL,            -- 套餐: 'free' | 'pro' | 'team'
  amount DECIMAL(10,2) NOT NULL,      -- 支付金额
  currency TEXT DEFAULT 'CNY',        -- 货币类型
  payment_method TEXT,                -- 支付方式: 'wechat' | 'alipay' | 'stripe'
  payment_status TEXT DEFAULT 'pending', -- 支付状态: 'pending' | 'success' | 'failed' | 'refunded'
  billing_cycle TEXT,                 -- 计费周期: 'monthly' | 'yearly'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 产品利润统计表
CREATE TABLE IF NOT EXISTS product_profit_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,    -- 总收入
  total_users INTEGER DEFAULT 0,            -- 总用户数
  active_users INTEGER DEFAULT 0,          -- 活跃用户数
  monthly_revenue DECIMAL(12,2) DEFAULT 0, -- 月收入
  yearly_revenue DECIMAL(12,2) DEFAULT 0,  -- 年收入
  profit_margin DECIMAL(5,2) DEFAULT 0,   -- 利润率 (%)
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, platform, plan_type)
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_stats_product ON payment_stats(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_stats_platform ON payment_stats(platform);
CREATE INDEX IF NOT EXISTS idx_payment_stats_status ON payment_stats(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_stats_created ON payment_stats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_stats_user ON payment_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_profit_stats_product ON product_profit_stats(product_id);
CREATE INDEX IF NOT EXISTS idx_profit_stats_platform ON product_profit_stats(platform);
CREATE INDEX IF NOT EXISTS idx_profit_stats_plan ON product_profit_stats(plan_type);

-- 4. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_payment_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 为支付统计表添加更新时间触发器
CREATE TRIGGER update_payment_stats_updated_at 
    BEFORE UPDATE ON payment_stats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_payment_updated_at_column();

-- 6. 创建行级安全策略 (RLS)
ALTER TABLE payment_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_profit_stats ENABLE ROW LEVEL SECURITY;

-- 7. 创建服务端访问策略（用于云函数）
CREATE POLICY "Service role can manage all payment data" ON payment_stats
    FOR ALL USING (true);

CREATE POLICY "Service role can manage all profit data" ON product_profit_stats
    FOR ALL USING (true);

-- 8. 创建视图：产品利润汇总
CREATE OR REPLACE VIEW product_profit_summary AS
SELECT 
    product_id,
    product_name,
    platform,
    SUM(total_revenue) as total_revenue,
    SUM(total_users) as total_users,
    SUM(active_users) as active_users,
    SUM(monthly_revenue) as monthly_revenue,
    SUM(yearly_revenue) as yearly_revenue,
    AVG(profit_margin) as avg_profit_margin,
    MAX(last_updated) as last_updated
FROM product_profit_stats
GROUP BY product_id, product_name, platform
ORDER BY total_revenue DESC;

-- 9. 创建视图：平台利润对比
CREATE OR REPLACE VIEW platform_profit_comparison AS
SELECT 
    platform,
    COUNT(DISTINCT product_id) as product_count,
    SUM(total_revenue) as total_revenue,
    SUM(total_users) as total_users,
    SUM(monthly_revenue) as monthly_revenue,
    SUM(yearly_revenue) as yearly_revenue,
    AVG(profit_margin) as avg_profit_margin
FROM product_profit_stats
GROUP BY platform
ORDER BY total_revenue DESC;

-- 10. 创建函数：更新产品利润统计
CREATE OR REPLACE FUNCTION update_product_profit_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新产品利润统计
    INSERT INTO product_profit_stats (
        product_id, product_name, platform, plan_type,
        total_revenue, total_users, monthly_revenue, yearly_revenue, last_updated
    )
    SELECT 
        NEW.product_id,
        NEW.product_name,
        NEW.platform,
        NEW.plan_type,
        COALESCE(SUM(CASE WHEN payment_status = 'success' THEN amount ELSE 0 END), 0),
        COUNT(DISTINCT user_id),
        COALESCE(SUM(CASE WHEN payment_status = 'success' AND billing_cycle = 'monthly' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_status = 'success' AND billing_cycle = 'yearly' THEN amount ELSE 0 END), 0),
        NOW()
    FROM payment_stats
    WHERE product_id = NEW.product_id 
      AND platform = NEW.platform 
      AND plan_type = NEW.plan_type
    ON CONFLICT (product_id, platform, plan_type) 
    DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_users = EXCLUDED.total_users,
        monthly_revenue = EXCLUDED.monthly_revenue,
        yearly_revenue = EXCLUDED.yearly_revenue,
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. 创建触发器：支付成功后自动更新利润统计
CREATE TRIGGER update_profit_stats_on_payment
    AFTER INSERT OR UPDATE ON payment_stats
    FOR EACH ROW
    WHEN (NEW.payment_status = 'success')
    EXECUTE FUNCTION update_product_profit_stats();

-- 12. 插入示例数据（可选）
INSERT INTO payment_stats (
    user_id, product_id, product_name, platform, plan_type, 
    amount, currency, payment_method, payment_status, billing_cycle
) VALUES 
    ('user_001', 'web_sitehub', 'SiteHub', 'website', 'pro', 29.99, 'CNY', 'stripe', 'success', 'monthly'),
    ('user_002', 'mp_sitehub', 'SiteHub', 'miniprogram', 'pro', 29.99, 'CNY', 'wechat', 'success', 'monthly'),
    ('user_003', 'web_morngpt', 'MornGPT', 'website', 'team', 99.99, 'CNY', 'stripe', 'success', 'yearly'),
    ('user_004', 'mp_morngpt', 'MornGPT', 'miniprogram', 'pro', 29.99, 'CNY', 'wechat', 'success', 'monthly')
ON CONFLICT DO NOTHING;

-- 13. 执行完成提示
SELECT '支付统计表创建完成！' as status;

-- 14. 验证表是否创建成功
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payment_stats', 'product_profit_stats')
ORDER BY table_name;

-- 15. 验证表结构
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('payment_stats', 'product_profit_stats')
ORDER BY table_name, ordinal_position;






