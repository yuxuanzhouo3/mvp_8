-- ============================================
-- Supabase 官网用户表结构（修复版）
-- 前缀：web_（与小程序 sitehub_ 区分）
-- 用途：官网海外IP用户数据存储
-- ============================================

-- 先删除旧表（如果存在）
DROP TABLE IF EXISTS web_payment_transactions CASCADE;
DROP TABLE IF EXISTS web_subscriptions CASCADE;
DROP TABLE IF EXISTS web_custom_sites CASCADE;
DROP TABLE IF EXISTS web_favorites CASCADE;

-- ============================================
-- 表1：web_favorites（收藏表）
-- ============================================

CREATE TABLE web_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, site_id)
);

CREATE INDEX idx_web_favorites_user_id ON web_favorites(user_id);
CREATE INDEX idx_web_favorites_site_id ON web_favorites(site_id);

ALTER TABLE web_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON web_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON web_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON web_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 表2：web_custom_sites（自定义网站表）
-- ============================================

CREATE TABLE web_custom_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo TEXT DEFAULT '🌐',
  category TEXT DEFAULT 'tools',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_web_custom_sites_user_id ON web_custom_sites(user_id);

ALTER TABLE web_custom_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom sites"
  ON web_custom_sites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom sites"
  ON web_custom_sites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom sites"
  ON web_custom_sites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom sites"
  ON web_custom_sites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 表3：web_subscriptions（订阅表）
-- ============================================

CREATE TABLE web_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  plan_type TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_web_subscriptions_user_id ON web_subscriptions(user_id);
CREATE INDEX idx_web_subscriptions_status ON web_subscriptions(status);

ALTER TABLE web_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON web_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage subscriptions"
  ON web_subscriptions FOR ALL
  USING (true);

-- ============================================
-- 表4：web_payment_transactions（支付记录表）
-- ============================================

CREATE TABLE web_payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount_usd DECIMAL(10, 2),
  amount_cny DECIMAL(10, 2),
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为transaction_id添加唯一约束
ALTER TABLE web_payment_transactions ADD CONSTRAINT web_payment_transactions_transaction_id_key UNIQUE (transaction_id);

-- 创建索引
CREATE INDEX idx_web_payment_user_id ON web_payment_transactions(user_id);
CREATE INDEX idx_web_payment_user_email ON web_payment_transactions(user_email);
CREATE INDEX idx_web_payment_transaction_id ON web_payment_transactions(transaction_id);
CREATE INDEX idx_web_payment_status ON web_payment_transactions(status);

-- RLS策略
ALTER TABLE web_payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON web_payment_transactions FOR SELECT
  USING (auth.uid() = user_id OR user_email = (auth.jwt()->>'email'));

CREATE POLICY "Service can manage transactions"
  ON web_payment_transactions FOR ALL
  USING (true);

-- ============================================
-- 完成提示
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ✅ ✅ 官网Supabase表创建完成！✅ ✅ ✅';
  RAISE NOTICE '';
  RAISE NOTICE '已创建表：';
  RAISE NOTICE '  ✓ web_favorites';
  RAISE NOTICE '  ✓ web_custom_sites';
  RAISE NOTICE '  ✓ web_subscriptions';
  RAISE NOTICE '  ✓ web_payment_transactions';
  RAISE NOTICE '';
  RAISE NOTICE '请在左侧Table Editor中验证4个表是否正确创建。';
  RAISE NOTICE '';
END $$;

