-- ========================================
-- SiteHub 订阅管理表创建脚本
-- 支持订阅状态管理、计费历史、自动续费
-- ========================================

-- 1. 创建订阅主表
CREATE TABLE IF NOT EXISTS sitehub_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  
  -- 订阅信息
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'team')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  
  -- 支付信息
  payment_method TEXT CHECK (payment_method IN ('wechat', 'alipay', 'stripe')),
  transaction_id TEXT,                  -- 支付交易号
  amount DECIMAL(10,2),                 -- 支付金额
  currency TEXT DEFAULT 'CNY',          -- 货币类型
  
  -- 时间管理
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON sitehub_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON sitehub_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON sitehub_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created ON sitehub_subscriptions(created_at DESC);

-- 3. 扩展现有 sitehub_users 表（增加订阅相关字段）
ALTER TABLE sitehub_users 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;

ALTER TABLE sitehub_users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';

ALTER TABLE sitehub_users 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- 4. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_subscription_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 为订阅表添加更新时间触发器
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON sitehub_subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON sitehub_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_subscription_updated_at_column();

-- 6. 创建行级安全策略 (RLS)
ALTER TABLE sitehub_subscriptions ENABLE ROW LEVEL SECURITY;

-- 7. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON sitehub_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON sitehub_subscriptions;

-- 8. 创建服务端访问策略（用于云函数）
CREATE POLICY "Service role can manage subscriptions" ON sitehub_subscriptions
    FOR ALL 
    USING (true);

-- 9. 创建用户访问策略（可选，用于直接访问）
CREATE POLICY "Users can view own subscriptions" ON sitehub_subscriptions
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 10. 创建视图：用户订阅状态
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

-- 11. 创建函数：获取用户当前订阅
CREATE OR REPLACE FUNCTION get_user_current_subscription(p_openid TEXT)
RETURNS TABLE (
    subscription_id UUID,
    plan_type TEXT,
    billing_cycle TEXT,
    status TEXT,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN,
    amount DECIMAL(10,2),
    currency TEXT
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
        s.currency
    FROM sitehub_subscriptions s
    INNER JOIN sitehub_users u ON s.user_id = u.id
    WHERE u.openid = p_openid
    AND s.status IN ('active', 'cancelled')
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 12. 创建函数：获取用户订阅历史
CREATE OR REPLACE FUNCTION get_user_subscription_history(p_openid TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    subscription_id UUID,
    plan_type TEXT,
    billing_cycle TEXT,
    amount DECIMAL(10,2),
    currency TEXT,
    payment_method TEXT,
    transaction_id TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
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
        s.transaction_id,
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

-- 13. 创建函数：取消订阅（不立即取消，设置在周期结束时取消）
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

-- 14. 创建函数：重新激活订阅
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

-- 15. 插入示例数据（用于测试，可选）
-- 注意：需要先有 sitehub_users 记录
/*
INSERT INTO sitehub_subscriptions (
    user_id, plan_type, billing_cycle, status, 
    payment_method, transaction_id, amount, currency,
    start_date, current_period_end
)
SELECT 
    id,
    'pro',
    'yearly',
    'active',
    'wechat',
    'WXPAY_TEST_001',
    168.00,
    'CNY',
    NOW(),
    NOW() + INTERVAL '1 year'
FROM sitehub_users
WHERE openid = 'test_openid_001'
LIMIT 1
ON CONFLICT DO NOTHING;
*/

-- 16. 执行完成提示
SELECT '订阅管理表创建完成！' as status;

-- 17. 验证表是否创建成功
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'sitehub_subscriptions'
ORDER BY table_name;

-- 18. 验证表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sitehub_subscriptions'
ORDER BY ordinal_position;

-- 19. 验证索引
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'sitehub_subscriptions'
ORDER BY indexname;

-- 20. 验证函数
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%subscription%'
ORDER BY routine_name;







