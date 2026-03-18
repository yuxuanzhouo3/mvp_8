# 🚀 Supabase 数据库设置指南

## 为什么需要Supabase？

我们的系统采用**双数据库架构**：
- **微信云数据库**: 服务中国用户
- **Supabase数据库**: 服务国际用户 + 管理后台数据

## 📋 设置步骤

### 步骤1：创建Supabase项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project"
3. 使用GitHub/Google登录
4. 点击 "New Project"
5. 填写项目信息：
   - **Name**: sitehub-database
   - **Database Password**: 设置一个强密码（记住这个密码）
   - **Region**: 选择离用户最近的区域
6. 点击 "Create new project"

### 步骤2：获取连接信息

创建完成后，在项目设置中找到：
- **Project URL**: `https://xxx.supabase.co`
- **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Database Password**: 你设置的密码

### 步骤3：创建数据库表

在Supabase的SQL编辑器中执行以下SQL脚本：

```sql
-- ========================================
-- SiteHub Supabase 数据库表结构
-- ========================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS sitehub_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  openid VARCHAR(64) UNIQUE NOT NULL,
  nickname VARCHAR(100),
  avatar_url TEXT,
  is_pro BOOLEAN DEFAULT false,
  subscription_status VARCHAR(20) DEFAULT 'inactive',
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 价格配置表
CREATE TABLE IF NOT EXISTS sitehub_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('personal', 'team')),
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_type, billing_cycle)
);

-- 3. 订阅记录表
CREATE TABLE IF NOT EXISTS sitehub_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('personal', 'team')),
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'failed')),
  auto_renew BOOLEAN DEFAULT true,
  
  -- 微信支付相关
  wechat_order_id VARCHAR(64) UNIQUE,
  wechat_transaction_id VARCHAR(64),
  payment_method VARCHAR(20) DEFAULT 'wechat',
  
  -- 金额信息
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  
  -- 时间信息
  start_date TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP,
  
  -- 系统字段
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 订阅历史表
CREATE TABLE IF NOT EXISTS sitehub_subscription_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES sitehub_subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'renewed', 'cancelled', 'expired', 'failed', 'refunded')),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  transaction_id VARCHAR(64),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 支付记录表
CREATE TABLE IF NOT EXISTS sitehub_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES sitehub_subscriptions(id) ON DELETE SET NULL,
  order_id VARCHAR(64) UNIQUE NOT NULL,
  transaction_id VARCHAR(64),
  
  -- 支付信息
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  payment_method VARCHAR(20) DEFAULT 'wechat',
  payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'success', 'failed', 'refunded')),
  
  -- 时间信息
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP
);

-- 6. 用户收藏表
CREATE TABLE IF NOT EXISTS sitehub_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  site_title VARCHAR(200),
  site_description TEXT,
  site_category VARCHAR(50),
  site_icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 自定义网站表
CREATE TABLE IF NOT EXISTS sitehub_custom_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES sitehub_users(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  site_title VARCHAR(200),
  site_description TEXT,
  site_icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 插入默认价格数据
-- ========================================

INSERT INTO sitehub_pricing (plan_type, billing_cycle, amount, currency, is_active) VALUES
('personal', 'monthly', 19.99, 'CNY', true),
('personal', 'yearly', 168.00, 'CNY', true),
('team', 'monthly', 299.99, 'CNY', true),
('team', 'yearly', 2520.00, 'CNY', true)
ON CONFLICT (plan_type, billing_cycle) DO UPDATE SET
  amount = EXCLUDED.amount,
  updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- 创建索引
-- ========================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_openid ON sitehub_users(openid);
CREATE INDEX IF NOT EXISTS idx_users_is_pro ON sitehub_users(is_pro);

-- 订阅表索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON sitehub_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON sitehub_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON sitehub_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_auto_renew ON sitehub_subscriptions(auto_renew);

-- 历史表索引
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON sitehub_subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON sitehub_subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON sitehub_subscription_history(created_at);

-- 支付表索引
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON sitehub_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON sitehub_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON sitehub_payments(payment_status);

-- 收藏表索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON sitehub_favorites(user_id);

-- 自定义网站表索引
CREATE INDEX IF NOT EXISTS idx_custom_sites_user_id ON sitehub_custom_sites(user_id);

-- ========================================
-- 启用行级安全策略 (RLS)
-- ========================================

-- 启用RLS
ALTER TABLE sitehub_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitehub_custom_sites ENABLE ROW LEVEL SECURITY;

-- 用户表策略
CREATE POLICY "Users can view own data" ON sitehub_users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON sitehub_users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- 订阅表策略
CREATE POLICY "Users can view own subscriptions" ON sitehub_subscriptions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own subscriptions" ON sitehub_subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 收藏表策略
CREATE POLICY "Users can view own favorites" ON sitehub_favorites
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own favorites" ON sitehub_favorites
  FOR ALL USING (auth.uid()::text = user_id::text);

-- 自定义网站表策略
CREATE POLICY "Users can view own custom sites" ON sitehub_custom_sites
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own custom sites" ON sitehub_custom_sites
  FOR ALL USING (auth.uid()::text = user_id::text);

-- 价格配置表（所有人可读）
CREATE POLICY "Anyone can view pricing" ON sitehub_pricing
  FOR SELECT USING (true);
```

### 步骤4：配置环境变量

在你的小程序项目中添加Supabase配置：

```javascript
// 在 app.js 或相关配置文件中添加
const supabaseConfig = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key'
}
```

### 步骤5：验证设置

在Supabase的SQL编辑器中执行验证查询：

```sql
-- 验证表创建
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'sitehub_%';

-- 验证价格数据
SELECT * FROM sitehub_pricing;

-- 验证索引创建
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename LIKE 'sitehub_%';
```

## 🔧 管理后台配置

如果你要使用管理后台，还需要：

### 1. 创建管理员用户

```sql
-- 在Supabase中创建管理员用户
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('admin@sitehub.com', crypt('your-admin-password', gen_salt('bf')), NOW(), NOW(), NOW());
```

### 2. 设置管理员权限

```sql
-- 创建管理员角色
CREATE ROLE sitehub_admin;

-- 授予管理员权限
GRANT ALL ON ALL TABLES IN SCHEMA public TO sitehub_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO sitehub_admin;
```

## 📊 数据同步策略

### 微信云 ↔ Supabase 数据同步

1. **用户注册**: 同时在两个数据库创建用户记录
2. **订阅创建**: 根据用户IP选择数据库
3. **数据备份**: 定期同步关键数据
4. **故障转移**: 一个数据库故障时切换到另一个

## 🎯 下一步

Supabase设置完成后：

1. ✅ 微信云数据库已设置（你刚才完成的）
2. ✅ Supabase数据库设置完成
3. 🔄 测试双数据库功能
4. 🚀 部署管理后台

## 📞 需要帮助？

如果设置过程中遇到问题：
- 检查SQL语法错误
- 确认Supabase项目权限
- 验证网络连接
- 查看Supabase日志

---

**注意**: 记住保存好Supabase的连接信息，后续开发和管理后台都会用到！





