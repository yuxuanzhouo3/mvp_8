-- =====================================================
-- SiteHub Subscriptions Table Creation Script
-- =====================================================
-- 用途：存储用户订阅信息（支付记录、订阅状态、到期时间等）
-- 作者：SiteHub Development Team
-- 日期：2025-01-13
-- =====================================================

-- =====================================================
-- 表: web_subscriptions (用户订阅信息)
-- =====================================================
-- 存储所有用户的订阅信息，包括 Stripe、PayPal、Alipay 等支付方式

CREATE TABLE IF NOT EXISTS web_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 用户信息（支持邮箱登录和 OAuth 登录）
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL UNIQUE,

  -- 订阅信息
  platform TEXT NOT NULL DEFAULT 'web',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'alipay', 'wechat')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('pro', 'team')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'pending')) DEFAULT 'active',

  -- 时间信息
  purchase_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 购买时间
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,          -- 付费开始时间
  expire_time TIMESTAMP WITH TIME ZONE NOT NULL,         -- 结束时间

  -- 自动续费
  auto_renew BOOLEAN DEFAULT false,                      -- 是否自动续费
  auto_renew_method TEXT CHECK (auto_renew_method IN ('stripe', 'paypal', 'alipay', 'wechat')), -- 自动续费支付方式
  next_billing_date TIMESTAMP WITH TIME ZONE,            -- 下次扣费日期

  -- 会员权益（JSON 格式存储详细权益）
  benefits JSONB DEFAULT '{
    "unlimited_favorites": true,
    "custom_sites": true,
    "cloud_sync": true,
    "ad_free": true,
    "priority_support": true,
    "advanced_search": true,
    "data_export": true,
    "api_access": false,
    "team_collaboration": false
  }'::jsonb,

  -- 支付平台订单ID
  stripe_session_id TEXT,
  stripe_subscription_id TEXT,  -- Stripe 订阅 ID（用于自动续费）
  paypal_order_id TEXT,
  paypal_subscription_id TEXT,  -- PayPal 订阅 ID（用于自动续费）
  alipay_order_id TEXT,
  wechat_order_id TEXT,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引提升查询速度
CREATE INDEX IF NOT EXISTS idx_web_subscriptions_user_id ON web_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_web_subscriptions_user_email ON web_subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_web_subscriptions_status ON web_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_web_subscriptions_expire_time ON web_subscriptions(expire_time);
CREATE INDEX IF NOT EXISTS idx_web_subscriptions_payment_method ON web_subscriptions(payment_method);
CREATE INDEX IF NOT EXISTS idx_web_subscriptions_auto_renew ON web_subscriptions(auto_renew);
CREATE INDEX IF NOT EXISTS idx_web_subscriptions_created_at ON web_subscriptions(created_at);

-- 添加注释
COMMENT ON TABLE web_subscriptions IS '用户订阅信息表（会员管理）';
COMMENT ON COLUMN web_subscriptions.user_id IS '用户ID（关联到 auth.users）';
COMMENT ON COLUMN web_subscriptions.user_email IS '用户邮箱（唯一标识）';
COMMENT ON COLUMN web_subscriptions.platform IS '订阅平台（web/ios/android等）';
COMMENT ON COLUMN web_subscriptions.payment_method IS '支付方式（stripe/paypal/alipay/wechat）';
COMMENT ON COLUMN web_subscriptions.plan_type IS '套餐类型（pro/team）';
COMMENT ON COLUMN web_subscriptions.billing_cycle IS '计费周期（monthly/yearly）';
COMMENT ON COLUMN web_subscriptions.status IS '订阅状态（active/expired/cancelled/pending）';
COMMENT ON COLUMN web_subscriptions.purchase_time IS '购买时间（订单创建时间）';
COMMENT ON COLUMN web_subscriptions.start_time IS '付费开始时间（订阅生效时间）';
COMMENT ON COLUMN web_subscriptions.expire_time IS '结束时间（订阅到期时间）';
COMMENT ON COLUMN web_subscriptions.auto_renew IS '是否自动续费';
COMMENT ON COLUMN web_subscriptions.auto_renew_method IS '自动续费支付方式';
COMMENT ON COLUMN web_subscriptions.next_billing_date IS '下次扣费日期';
COMMENT ON COLUMN web_subscriptions.benefits IS '会员权益（JSON 格式）';
COMMENT ON COLUMN web_subscriptions.stripe_session_id IS 'Stripe Session ID';
COMMENT ON COLUMN web_subscriptions.stripe_subscription_id IS 'Stripe Subscription ID（自动续费用）';
COMMENT ON COLUMN web_subscriptions.paypal_order_id IS 'PayPal Order ID';
COMMENT ON COLUMN web_subscriptions.paypal_subscription_id IS 'PayPal Subscription ID（自动续费用）';
COMMENT ON COLUMN web_subscriptions.alipay_order_id IS 'Alipay Order ID';
COMMENT ON COLUMN web_subscriptions.wechat_order_id IS 'WeChat Order ID';
COMMENT ON COLUMN web_subscriptions.created_at IS '记录创建时间';
COMMENT ON COLUMN web_subscriptions.updated_at IS '记录最后更新时间';

-- 启用 Row Level Security (RLS)
ALTER TABLE web_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看自己的订阅信息（通过邮箱匹配）
CREATE POLICY "Users can view their own web_subscriptions"
  ON web_subscriptions FOR SELECT
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS 策略：服务端可以插入订阅记录（使用 service_role_key）
-- 注意：这个策略允许所有人插入，因为支付回调时用户可能未登录
CREATE POLICY "Allow insert web_subscriptions"
  ON web_subscriptions FOR INSERT
  WITH CHECK (true);

-- RLS 策略：服务端可以更新订阅记录（使用 service_role_key）
CREATE POLICY "Allow update web_subscriptions"
  ON web_subscriptions FOR UPDATE
  USING (true);

-- =====================================================
-- 创建更新 updated_at 的触发器
-- =====================================================

-- 触发器函数（如果已经存在则跳过）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 web_subscriptions 表添加自动更新 updated_at 的触发器
DROP TRIGGER IF EXISTS update_web_subscriptions_updated_at ON web_subscriptions;
CREATE TRIGGER update_web_subscriptions_updated_at
  BEFORE UPDATE ON web_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 创建自动过期检查函数（可选）
-- =====================================================
-- 这个函数可以被定时任务调用，自动将过期订阅标记为 expired

CREATE OR REPLACE FUNCTION check_expired_web_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE web_subscriptions
  SET status = 'expired'
  WHERE status = 'active' AND expire_time < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_expired_web_subscriptions IS '自动检查并更新过期订阅状态';

-- =====================================================
-- 完成！
-- =====================================================
-- 现在你可以验证表是否创建成功：
-- SELECT * FROM web_subscriptions LIMIT 10;
--
-- 测试插入数据：
-- INSERT INTO web_subscriptions (user_email, platform, payment_method, plan_type, status, start_time, expire_time, paypal_order_id)
-- VALUES ('test@example.com', 'web', 'paypal', 'pro', 'active', NOW(), NOW() + INTERVAL '1 month', 'TEST_ORDER_123');
-- =====================================================
