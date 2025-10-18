-- =====================================================
-- SiteHub Payment Transactions Table Creation Script
-- =====================================================
-- 用途：记录所有支付交易数据，用于统计利润和财务分析
-- 作者：SiteHub Development Team
-- 日期：2025-01-13
-- =====================================================

-- =====================================================
-- 表: payment_transactions (支付交易记录)
-- =====================================================
-- 记录每一笔支付交易，包括收入、成本、利润等详细信息

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 关联信息
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,

  -- 产品信息（便于统计各子产品利润）
  product_name TEXT NOT NULL DEFAULT 'sitehub',  -- 产品名称（sitehub/morngpt/securefiles等）
  product_category TEXT,                          -- 产品分类
  plan_type TEXT NOT NULL CHECK (plan_type IN ('pro', 'team', 'enterprise')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),

  -- 支付信息
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'alipay', 'wechat')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')) DEFAULT 'pending',
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'renewal', 'refund', 'chargeback')) DEFAULT 'purchase',

  -- 金额信息（以美分为单位，避免浮点数精度问题）
  currency TEXT NOT NULL DEFAULT 'USD',
  gross_amount INTEGER NOT NULL,                  -- 总金额（用户支付的金额，单位：美分）
  payment_fee INTEGER NOT NULL DEFAULT 0,         -- 支付手续费（Stripe/PayPal 收取的费用，单位：美分）
  net_amount INTEGER NOT NULL,                    -- 净收入（gross_amount - payment_fee，单位：美分）
  refund_amount INTEGER DEFAULT 0,                -- 退款金额（单位：美分）

  -- 成本和利润分析
  service_cost INTEGER DEFAULT 0,                 -- 服务成本（服务器、API调用等，单位：美分）
  profit INTEGER NOT NULL,                        -- 利润（net_amount - service_cost - refund_amount，单位：美分）

  -- 平台订单ID（用于对账和查询）
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  alipay_trade_no TEXT,
  wechat_transaction_id TEXT,

  -- 时间信息
  payment_time TIMESTAMP WITH TIME ZONE,          -- 支付完成时间
  refund_time TIMESTAMP WITH TIME ZONE,           -- 退款时间（如果有）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 备注信息
  notes TEXT,                                     -- 备注（如退款原因等）
  metadata JSONB                                  -- 额外的元数据（JSON 格式）
);

-- 创建索引提升查询速度
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_email ON payment_transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_product_name ON payment_transactions(product_name);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_plan_type ON payment_transactions(plan_type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_method ON payment_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_status ON payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_type ON payment_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_time ON payment_transactions(payment_time);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

-- 为支付平台订单ID创建索引（用于快速查询）
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_session_id ON payment_transactions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paypal_order_id ON payment_transactions(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_alipay_trade_no ON payment_transactions(alipay_trade_no);

-- 添加注释
COMMENT ON TABLE payment_transactions IS '支付交易记录表（用于统计利润和财务分析）';
COMMENT ON COLUMN payment_transactions.subscription_id IS '关联的订阅ID';
COMMENT ON COLUMN payment_transactions.user_id IS '用户ID';
COMMENT ON COLUMN payment_transactions.user_email IS '用户邮箱';
COMMENT ON COLUMN payment_transactions.product_name IS '产品名称（sitehub/morngpt/securefiles等）';
COMMENT ON COLUMN payment_transactions.product_category IS '产品分类';
COMMENT ON COLUMN payment_transactions.plan_type IS '套餐类型（pro/team/enterprise）';
COMMENT ON COLUMN payment_transactions.billing_cycle IS '计费周期（monthly/yearly/lifetime）';
COMMENT ON COLUMN payment_transactions.payment_method IS '支付方式';
COMMENT ON COLUMN payment_transactions.payment_status IS '支付状态';
COMMENT ON COLUMN payment_transactions.transaction_type IS '交易类型（purchase/renewal/refund/chargeback）';
COMMENT ON COLUMN payment_transactions.currency IS '货币类型';
COMMENT ON COLUMN payment_transactions.gross_amount IS '总金额（用户支付金额，单位：美分）';
COMMENT ON COLUMN payment_transactions.payment_fee IS '支付手续费（平台收取，单位：美分）';
COMMENT ON COLUMN payment_transactions.net_amount IS '净收入（总金额 - 手续费，单位：美分）';
COMMENT ON COLUMN payment_transactions.refund_amount IS '退款金额（单位：美分）';
COMMENT ON COLUMN payment_transactions.service_cost IS '服务成本（单位：美分）';
COMMENT ON COLUMN payment_transactions.profit IS '利润（净收入 - 服务成本 - 退款，单位：美分）';
COMMENT ON COLUMN payment_transactions.payment_time IS '支付完成时间';
COMMENT ON COLUMN payment_transactions.refund_time IS '退款时间';
COMMENT ON COLUMN payment_transactions.notes IS '备注信息';
COMMENT ON COLUMN payment_transactions.metadata IS '额外的元数据（JSON格式）';

-- 启用 Row Level Security (RLS)
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS 策略：只有管理员可以查看所有交易记录
-- 普通用户只能查看自己的交易记录
CREATE POLICY "Users can view their own transactions"
  ON payment_transactions FOR SELECT
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS 策略：服务端可以插入交易记录（使用 service_role_key）
CREATE POLICY "Allow insert transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (true);

-- RLS 策略：服务端可以更新交易记录（使用 service_role_key）
CREATE POLICY "Allow update transactions"
  ON payment_transactions FOR UPDATE
  USING (true);

-- =====================================================
-- 创建更新 updated_at 的触发器
-- =====================================================

-- 为 payment_transactions 表添加自动更新 updated_at 的触发器
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 创建统计视图（便于查询利润报表）
-- =====================================================

-- 视图 1: 按产品统计利润
CREATE OR REPLACE VIEW v_profit_by_product AS
SELECT
  product_name,
  COUNT(*) as total_transactions,
  SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) as completed_transactions,
  SUM(gross_amount) / 100.0 as total_revenue,
  SUM(payment_fee) / 100.0 as total_fees,
  SUM(net_amount) / 100.0 as total_net_income,
  SUM(service_cost) / 100.0 as total_service_cost,
  SUM(profit) / 100.0 as total_profit,
  ROUND(SUM(profit)::NUMERIC / NULLIF(SUM(gross_amount), 0) * 100, 2) as profit_margin_percent
FROM payment_transactions
WHERE payment_status = 'completed'
GROUP BY product_name
ORDER BY total_profit DESC;

COMMENT ON VIEW v_profit_by_product IS '按产品统计利润（金额单位：美元）';

-- 视图 2: 按支付方式统计
CREATE OR REPLACE VIEW v_profit_by_payment_method AS
SELECT
  payment_method,
  COUNT(*) as total_transactions,
  SUM(gross_amount) / 100.0 as total_revenue,
  SUM(payment_fee) / 100.0 as total_fees,
  SUM(profit) / 100.0 as total_profit,
  ROUND(AVG(payment_fee::NUMERIC / NULLIF(gross_amount, 0)) * 100, 2) as avg_fee_percent
FROM payment_transactions
WHERE payment_status = 'completed'
GROUP BY payment_method
ORDER BY total_profit DESC;

COMMENT ON VIEW v_profit_by_payment_method IS '按支付方式统计手续费和利润';

-- 视图 3: 按月统计收入
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
  DATE_TRUNC('month', payment_time) as month,
  COUNT(*) as total_transactions,
  SUM(gross_amount) / 100.0 as total_revenue,
  SUM(payment_fee) / 100.0 as total_fees,
  SUM(net_amount) / 100.0 as total_net_income,
  SUM(profit) / 100.0 as total_profit
FROM payment_transactions
WHERE payment_status = 'completed' AND payment_time IS NOT NULL
GROUP BY DATE_TRUNC('month', payment_time)
ORDER BY month DESC;

COMMENT ON VIEW v_monthly_revenue IS '按月统计收入和利润';

-- 视图 4: 按套餐类型统计
CREATE OR REPLACE VIEW v_profit_by_plan_type AS
SELECT
  product_name,
  plan_type,
  billing_cycle,
  COUNT(*) as total_transactions,
  SUM(gross_amount) / 100.0 as total_revenue,
  SUM(profit) / 100.0 as total_profit,
  ROUND(AVG(gross_amount) / 100.0, 2) as avg_transaction_value
FROM payment_transactions
WHERE payment_status = 'completed'
GROUP BY product_name, plan_type, billing_cycle
ORDER BY total_profit DESC;

COMMENT ON VIEW v_profit_by_plan_type IS '按套餐类型统计利润';

-- =====================================================
-- 创建查询函数（便于后台管理使用）
-- =====================================================

-- 函数：获取指定时间范围的利润统计
CREATE OR REPLACE FUNCTION get_profit_stats(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_fees NUMERIC,
  total_net_income NUMERIC,
  total_profit NUMERIC,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(gross_amount) / 100.0,
    SUM(payment_fee) / 100.0,
    SUM(net_amount) / 100.0,
    SUM(profit) / 100.0,
    COUNT(*)
  FROM payment_transactions
  WHERE payment_status = 'completed'
    AND payment_time >= start_date
    AND payment_time <= end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_profit_stats IS '获取指定时间范围的利润统计';

-- =====================================================
-- 完成！
-- =====================================================
-- 现在你可以验证表是否创建成功：
-- SELECT * FROM payment_transactions LIMIT 10;
--
-- 查看利润统计视图：
-- SELECT * FROM v_profit_by_product;
-- SELECT * FROM v_profit_by_payment_method;
-- SELECT * FROM v_monthly_revenue;
--
-- 使用查询函数：
-- SELECT * FROM get_profit_stats('2025-01-01', '2025-12-31');
-- =====================================================
