# 💰 支付统计表设计方案

## 🎯 需求分析

Jeff 要求：
- 官网和小程序数据库加前缀区分
- 设计支付统计表
- 后期需要知道具体子产品有多少利润

## 📊 数据库表设计

### 1. Supabase 支付统计表

```sql
-- 支付统计主表
CREATE TABLE payment_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,           -- 子产品ID
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

-- 产品利润统计表
CREATE TABLE product_profit_stats (
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

-- 创建索引
CREATE INDEX idx_payment_stats_product ON payment_stats(product_id);
CREATE INDEX idx_payment_stats_platform ON payment_stats(platform);
CREATE INDEX idx_payment_stats_status ON payment_stats(payment_status);
CREATE INDEX idx_payment_stats_created ON payment_stats(created_at DESC);

CREATE INDEX idx_profit_stats_product ON product_profit_stats(product_id);
CREATE INDEX idx_profit_stats_platform ON product_profit_stats(platform);
```

### 2. WeChat Cloud 支付统计集合

```javascript
// 集合名称: sitehub_payment_stats
{
  _id: "auto_generated",
  user_id: "openid",
  product_id: "sitehub",           // 子产品ID
  product_name: "SiteHub",         // 子产品名称
  platform: "miniprogram",        // 平台
  plan_type: "pro",               // 套餐类型
  amount: 29.99,                  // 支付金额
  currency: "CNY",                // 货币
  payment_method: "wechat",       // 支付方式
  payment_status: "success",     // 支付状态
  billing_cycle: "monthly",       // 计费周期
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

## 🏷️ 产品前缀设计

### 官网产品前缀: `web_`
```
web_sitehub     - 官网 SiteHub
web_morngpt     - 官网 MornGPT  
web_deepfake    - 官网 DeepFake
web_mornsocial  - 官网 MornSocial
```

### 小程序产品前缀: `mp_`
```
mp_sitehub      - 小程序 SiteHub
mp_morngpt      - 小程序 MornGPT
mp_deepfake     - 小程序 DeepFake
mp_mornsocial   - 小程序 MornSocial
```

## 📈 利润统计查询

### 1. 按产品统计利润
```sql
SELECT 
  product_id,
  product_name,
  platform,
  SUM(amount) as total_revenue,
  COUNT(*) as total_orders,
  COUNT(DISTINCT user_id) as unique_users
FROM payment_stats 
WHERE payment_status = 'success'
GROUP BY product_id, product_name, platform
ORDER BY total_revenue DESC;
```

### 2. 按平台统计利润
```sql
SELECT 
  platform,
  SUM(amount) as total_revenue,
  COUNT(*) as total_orders,
  COUNT(DISTINCT user_id) as unique_users
FROM payment_stats 
WHERE payment_status = 'success'
GROUP BY platform
ORDER BY total_revenue DESC;
```

### 3. 月度利润趋势
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  product_id,
  platform,
  SUM(amount) as monthly_revenue
FROM payment_stats 
WHERE payment_status = 'success'
GROUP BY month, product_id, platform
ORDER BY month DESC, monthly_revenue DESC;
```

## 🔧 云函数扩展

### 新增支付统计云函数
```javascript
// cloudfunctions/paymentStats/index.js
exports.main = async (event, context) => {
  const { action, paymentData } = event;
  
  switch (action) {
    case 'recordPayment':
      return await recordPayment(paymentData);
    case 'getProductStats':
      return await getProductStats(event.productId, event.platform);
    case 'getPlatformStats':
      return await getPlatformStats(event.platform);
    case 'getMonthlyTrend':
      return await getMonthlyTrend(event.productId, event.platform);
  }
};
```

## 📊 前端统计面板

### 管理后台统计页面
```javascript
// 产品利润统计组件
const ProductStats = () => {
  const [stats, setStats] = useState([]);
  
  useEffect(() => {
    fetchProductStats();
  }, []);
  
  const fetchProductStats = async () => {
    const result = await wx.cloud.callFunction({
      name: 'paymentStats',
      data: { action: 'getProductStats' }
    });
    setStats(result.result.data);
  };
  
  return (
    <div className="product-stats">
      <h3>产品利润统计</h3>
      {stats.map(stat => (
        <div key={stat.product_id} className="stat-card">
          <h4>{stat.product_name}</h4>
          <p>总收入: ¥{stat.total_revenue}</p>
          <p>用户数: {stat.unique_users}</p>
          <p>平台: {stat.platform}</p>
        </div>
      ))}
    </div>
  );
};
```

## 🎯 实施步骤

### Phase 1: 数据库设计
1. ✅ 创建 Supabase 支付统计表
2. ✅ 创建 WeChat Cloud 支付统计集合
3. ✅ 设计产品前缀规范

### Phase 2: 云函数扩展
1. 🔄 扩展 callAIGateway 支持支付统计
2. 🔄 创建 paymentStats 云函数
3. 🔄 实现数据同步逻辑

### Phase 3: 前端集成
1. 🔄 支付成功回调记录统计
2. 🔄 管理后台统计面板
3. 🔄 实时利润监控

### Phase 4: 数据分析
1. 🔄 利润趋势分析
2. 🔄 产品对比分析
3. 🔄 用户行为分析

## 💡 优势

1. **数据隔离**: 官网和小程序数据完全分离
2. **利润透明**: 每个子产品的利润一目了然
3. **实时统计**: 支付后立即更新统计数据
4. **扩展性强**: 支持新产品快速接入
5. **分析深度**: 支持多维度利润分析

## 🔍 监控指标

- **总收入**: 各产品总收入
- **用户数**: 付费用户数量
- **转化率**: 免费到付费转化率
- **留存率**: 用户续费率
- **ARPU**: 平均每用户收入
- **LTV**: 用户生命周期价值






