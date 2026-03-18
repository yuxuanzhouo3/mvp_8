-- ========================================
-- SiteHub 订阅管理和自动续费数据库架构
-- ========================================

-- 1. 订阅记录表
CREATE TABLE IF NOT EXISTS sitehub_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('personal', 'team')),
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'failed')),
  auto_renew BOOLEAN DEFAULT true,
  
  -- 微信支付相关
  wechat_order_id VARCHAR(64) UNIQUE,
  wechat_transaction_id VARCHAR(64),
  wechat_prepay_id VARCHAR(64),
  payment_method VARCHAR(20) DEFAULT 'wechat',
  
  -- 金额信息
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  
  -- 时间信息
  start_date TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP NULL,
  
  -- 系统字段
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_current_period_end (current_period_end),
  INDEX idx_auto_renew (auto_renew),
  INDEX idx_wechat_order_id (wechat_order_id)
);

-- 2. 订阅历史表
CREATE TABLE IF NOT EXISTS sitehub_subscription_history (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES sitehub_subscriptions(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'renewed', 'cancelled', 'expired', 'failed', 'refunded')),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  transaction_id VARCHAR(64),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);

-- 3. 价格配置表
CREATE TABLE IF NOT EXISTS sitehub_pricing (
  id SERIAL PRIMARY KEY,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('personal', 'team')),
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 唯一约束
  UNIQUE KEY unique_plan_cycle (plan_type, billing_cycle),
  
  -- 索引
  INDEX idx_plan_type (plan_type),
  INDEX idx_is_active (is_active)
);

-- 4. 支付记录表
CREATE TABLE IF NOT EXISTS sitehub_payments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  subscription_id INTEGER REFERENCES sitehub_subscriptions(id) ON DELETE SET NULL,
  order_id VARCHAR(64) UNIQUE NOT NULL,
  transaction_id VARCHAR(64),
  
  -- 支付信息
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  payment_method VARCHAR(20) DEFAULT 'wechat',
  payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'success', 'failed', 'refunded')),
  
  -- 时间信息
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  
  -- 索引
  INDEX idx_user_id (user_id),
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_order_id (order_id),
  INDEX idx_payment_status (payment_status)
);

-- 5. 自动续费任务表
CREATE TABLE IF NOT EXISTS sitehub_renewal_tasks (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES sitehub_subscriptions(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL,
  task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('renewal', 'reminder', 'expiry_notice')),
  scheduled_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_user_id (user_id),
  INDEX idx_scheduled_at (scheduled_at),
  INDEX idx_status (status)
);

-- ========================================
-- 插入默认价格数据
-- ========================================

INSERT INTO sitehub_pricing (plan_type, billing_cycle, amount, currency, is_active) VALUES
('personal', 'monthly', 19.99, 'CNY', true),
('personal', 'yearly', 168.00, 'CNY', true),
('team', 'monthly', 299.99, 'CNY', true),
('team', 'yearly', 2520.00, 'CNY', true)
ON DUPLICATE KEY UPDATE 
  amount = VALUES(amount),
  updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- 创建触发器：自动更新 updated_at
-- ========================================

-- 订阅表触发器
DELIMITER //
CREATE TRIGGER sitehub_subscriptions_update_trigger
  BEFORE UPDATE ON sitehub_subscriptions
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- 价格表触发器
DELIMITER //
CREATE TRIGGER sitehub_pricing_update_trigger
  BEFORE UPDATE ON sitehub_pricing
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- ========================================
-- 创建视图：活跃订阅统计
-- ========================================

CREATE VIEW sitehub_active_subscriptions AS
SELECT 
  s.id,
  s.user_id,
  s.plan_type,
  s.billing_cycle,
  s.amount,
  s.currency,
  s.start_date,
  s.current_period_end,
  s.auto_renew,
  s.cancel_at_period_end,
  DATEDIFF(s.current_period_end, NOW()) as days_until_expiry,
  CASE 
    WHEN s.cancel_at_period_end = true THEN 'cancelled'
    WHEN s.current_period_end < NOW() THEN 'expired'
    ELSE 'active'
  END as effective_status
FROM sitehub_subscriptions s
WHERE s.status = 'active';

-- ========================================
-- 创建存储过程：处理自动续费
-- ========================================

DELIMITER //
CREATE PROCEDURE ProcessAutoRenewal()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE sub_id INT;
  DECLARE user_id VARCHAR(64);
  DECLARE plan_type VARCHAR(20);
  DECLARE billing_cycle VARCHAR(20);
  DECLARE amount DECIMAL(10,2);
  
  DECLARE renewal_cursor CURSOR FOR
    SELECT s.id, s.user_id, s.plan_type, s.billing_cycle, s.amount
    FROM sitehub_subscriptions s
    WHERE s.status = 'active'
      AND s.auto_renew = true
      AND s.cancel_at_period_end = false
      AND s.current_period_end <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
      AND s.current_period_end > NOW();
      
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN renewal_cursor;
  
  renewal_loop: LOOP
    FETCH renewal_cursor INTO sub_id, user_id, plan_type, billing_cycle, amount;
    IF done THEN
      LEAVE renewal_loop;
    END IF;
    
    -- 创建续费任务
    INSERT INTO sitehub_renewal_tasks (
      subscription_id, 
      user_id, 
      task_type, 
      scheduled_at, 
      status
    ) VALUES (
      sub_id, 
      user_id, 
      'renewal', 
      NOW(), 
      'pending'
    );
    
  END LOOP;
  
  CLOSE renewal_cursor;
END//
DELIMITER ;

-- ========================================
-- 权限设置（根据实际需求调整）
-- ========================================

-- 为应用用户创建只读权限
-- CREATE USER 'sitehub_app'@'%' IDENTIFIED BY 'secure_password';
-- GRANT SELECT ON sitehub_pricing TO 'sitehub_app'@'%';
-- GRANT SELECT, INSERT, UPDATE ON sitehub_subscriptions TO 'sitehub_app'@'%';
-- GRANT SELECT, INSERT ON sitehub_subscription_history TO 'sitehub_app'@'%';
-- GRANT SELECT, INSERT ON sitehub_payments TO 'sitehub_app'@'%';

-- 为管理后台创建完整权限
-- CREATE USER 'sitehub_admin'@'%' IDENTIFIED BY 'admin_secure_password';
-- GRANT ALL PRIVILEGES ON sitehub_subscriptions TO 'sitehub_admin'@'%';
-- GRANT ALL PRIVILEGES ON sitehub_subscription_history TO 'sitehub_admin'@'%';
-- GRANT ALL PRIVILEGES ON sitehub_payments TO 'sitehub_admin'@'%';
-- GRANT ALL PRIVILEGES ON sitehub_renewal_tasks TO 'sitehub_admin'@'%';
-- GRANT ALL PRIVILEGES ON sitehub_pricing TO 'sitehub_admin'@'%';

-- ========================================
-- 示例数据（用于测试）
-- ========================================

-- 插入测试订阅记录
INSERT INTO sitehub_subscriptions (
  user_id, 
  plan_type, 
  billing_cycle, 
  status, 
  auto_renew,
  wechat_order_id,
  amount,
  start_date,
  current_period_end
) VALUES 
(
  'test_user_001',
  'personal',
  'monthly',
  'active',
  true,
  'test_order_001',
  19.99,
  NOW(),
  DATE_ADD(NOW(), INTERVAL 1 MONTH)
),
(
  'test_user_002',
  'team',
  'yearly',
  'active',
  true,
  'test_order_002',
  2520.00,
  NOW(),
  DATE_ADD(NOW(), INTERVAL 1 YEAR)
);

-- 插入测试历史记录
INSERT INTO sitehub_subscription_history (
  subscription_id,
  user_id,
  action,
  amount,
  transaction_id,
  notes
) VALUES 
(1, 'test_user_001', 'created', 19.99, 'test_txn_001', 'Initial subscription'),
(2, 'test_user_002', 'created', 2520.00, 'test_txn_002', 'Initial subscription');

-- ========================================
-- 查询示例
-- ========================================

-- 查询用户活跃订阅
-- SELECT * FROM sitehub_active_subscriptions WHERE user_id = 'test_user_001';

-- 查询即将到期的订阅
-- SELECT * FROM sitehub_active_subscriptions 
-- WHERE days_until_expiry <= 7 AND effective_status = 'active';

-- 查询订阅统计
-- SELECT 
--   plan_type,
--   billing_cycle,
--   COUNT(*) as subscription_count,
--   SUM(amount) as total_revenue
-- FROM sitehub_subscriptions 
-- WHERE status = 'active' 
-- GROUP BY plan_type, billing_cycle;






