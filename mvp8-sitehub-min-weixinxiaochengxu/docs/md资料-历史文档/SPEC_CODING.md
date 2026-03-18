# 📐 SiteHub 小程序功能规范文档 (Spec Coding)

**版本**: 2.0  
**更新时间**: 2025-10-10  
**负责人**: Jeff 产品需求 + AI 技术实现  
**状态**: ✅ 数据库方案已实现 | 🔄 自定义网站待实现 | 🔄 Team支付待实现

---

## 📑 目录

1. [项目概述](#1-项目概述)
2. [核心架构](#2-核心架构)
3. [功能模块详细设计](#3-功能模块详细设计)
4. [数据库设计](#4-数据库设计)
5. [API接口设计](#5-api接口设计)
6. [UI/UX设计规范](#6-uiux设计规范)
7. [实施计划](#7-实施计划)

---

## 1. 项目概述

### 1.1 产品定位
SiteHub是一个智能网站导航工具，为用户提供：
- 🌍 **地域化内容**: 根据IP自动显示适合的网站
- 🎯 **个性化管理**: 自定义网站、收藏夹、拖拽排序
- 💰 **会员订阅**: Pro/Team双层级付费模式
- 🔄 **跨平台同步**: 小程序与官网数据实时同步

### 1.2 核心价值
- **中国用户**: 只显示国内可访问的网站，避免访问失败
- **海外用户**: 显示全球优质网站，包括中文资源
- **企业团队**: Team套餐支持团队协作和数据共享

### 1.3 技术栈
- **前端**: 微信小程序原生开发 (WXML, WXSS, JS)
- **国内数据库**: WeChat CloudBase
- **海外数据库**: Supabase (与官网共享)
- **支付**: 微信支付 (国内) + Stripe/PayPal (海外)

---

## 2. 核心架构

### 2.1 双数据库架构

```
┌─────────────────────────────────────────────────────────┐
│                    用户访问小程序                        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  IP地域检测     │
         │  (云函数)       │
         └────────┬───────┘
                  │
          ┌───────┴───────┐
          │               │
    中国IP│               │海外IP
          ▼               ▼
┌─────────────────┐  ┌──────────────────┐
│ WeChat Cloud    │  │   Supabase       │
│ - 用户数据      │  │   - 用户数据     │
│ - 收藏夹        │  │   - 收藏夹       │
│ - 自定义网站    │  │   - 自定义网站   │
│ - 使用统计      │  │   - 使用统计     │
└─────────────────┘  └──────────────────┘
```

### 2.2 数据流向

```
用户操作 → 小程序前端 → 云函数路由 → 对应数据库
                     ↓
                返回数据 → 前端渲染
```

### 2.3 IP检测逻辑

```javascript
// 云函数: callAIGateway
1. 获取用户IP (context.requestIP)
2. 快速检测中国IP段 (本地匹配)
   ✅ 匹配 → 返回 'china' + 'wechat_cloud'
   ❌ 不匹配 → 调用外部API详细检测
3. 详细检测 (ip-api.com)
   - country === 'CN' → 'china' + 'wechat_cloud'
   - country !== 'CN' → 'international' + 'supabase'
4. 降级策略: 检测失败默认 'china' + 'wechat_cloud'
```

---

## 3. 功能模块详细设计

### 3.1 自定义网站功能 ⭐ **新增**

#### 3.1.1 功能描述
用户可以添加任意自定义网站到导航中，支持：
- 输入URL自动抓取网站信息
- 自定义网站名称和图标
- 拖拽排序
- 删除网站
- 跨平台同步（小程序 ↔ 官网）

#### 3.1.2 用户流程

```
┌────────────────────────────────────────────┐
│  1. 点击"自定义网站"Tab                    │
│     或点击"+ 添加网站"按钮                 │
└──────────────┬─────────────────────────────┘
               ▼
┌────────────────────────────────────────────┐
│  2. 弹出添加网站对话框                     │
│     - 输入URL                              │
│     - [可选] 输入名称                      │
│     - [可选] 选择图标emoji                 │
└──────────────┬─────────────────────────────┘
               ▼
┌────────────────────────────────────────────┐
│  3. 自动抓取网站信息                       │
│     - 网站标题 (meta title)                │
│     - 网站图标 (favicon)                   │
│     - 网站描述 (meta description)          │
└──────────────┬─────────────────────────────┘
               ▼
┌────────────────────────────────────────────┐
│  4. 预览并确认                             │
│     显示: [图标] 网站名 - URL              │
└──────────────┬─────────────────────────────┘
               ▼
┌────────────────────────────────────────────┐
│  5. 保存到数据库                           │
│     - 中国IP → WeChat Cloud                │
│     - 海外IP → Supabase                    │
└──────────────┬─────────────────────────────┘
               ▼
┌────────────────────────────────────────────┐
│  6. 实时显示在"自定义网站"Tab              │
└────────────────────────────────────────────┘
```

#### 3.1.3 UI设计

**自定义网站Tab界面:**
```
┌─────────────────────────────────────────┐
│  [+ 添加网站]  (大按钮，顶部)            │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐   │
│  │ 🌐  │  │ 📱  │  │ 🎮  │  │ 🎵  │   │
│  │我的 │  │工作 │  │游戏 │  │音乐 │   │
│  │博客 │  │平台 │  │论坛 │  │平台 │   │
│  └─────┘  └─────┘  └─────┘  └─────┘   │
│  (长按拖动排序 | 长按显示删除选项)       │
│                                         │
│  空状态提示:                            │
│  "还没有添加自定义网站"                 │
│  "点击上方按钮添加您常用的网站"         │
└─────────────────────────────────────────┘
```

**添加网站弹窗:**
```
┌─────────────────────────────────────────┐
│  添加自定义网站                    [✕]  │
├─────────────────────────────────────────┤
│  网址 *                                 │
│  ┌─────────────────────────────────┐   │
│  │ https://example.com             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  网站名称 (可选)                        │
│  ┌─────────────────────────────────┐   │
│  │ 我的网站                        │   │
│  └─────────────────────────────────┘   │
│  未填写将自动获取网站标题               │
│                                         │
│  图标 (可选)                            │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┐   │
│  │🌐│📱│💻│🎮│🎵│📚│🛒│🍕│   │
│  └───┴───┴───┴───┴───┴───┴───┴───┘   │
│  未选择将使用网站favicon                │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │  取消    │  │  添加    │           │
│  └──────────┘  └──────────┘           │
└─────────────────────────────────────────┘
```

#### 3.1.4 技术实现

**前端组件:**
```javascript
// pages/index/index.js

// 1. 添加自定义网站
addCustomSite() {
  wx.showModal({
    title: '添加自定义网站',
    content: '请输入网址',
    editable: true,
    placeholderText: 'https://example.com',
    success: (res) => {
      if (res.confirm && res.content) {
        this.fetchSiteInfo(res.content)
      }
    }
  })
},

// 2. 抓取网站信息
async fetchSiteInfo(url) {
  wx.showLoading({ title: '获取网站信息...' })
  
  try {
    const result = await wx.cloud.callFunction({
      name: 'callAIGateway',
      data: {
        action: 'fetchSiteInfo',
        url: url
      }
    })
    
    // 显示预览确认弹窗
    this.confirmAddSite(result.result)
    
  } catch (error) {
    wx.showToast({
      title: '获取失败，请手动输入',
      icon: 'none'
    })
    this.manualAddSite(url)
  } finally {
    wx.hideLoading()
  }
},

// 3. 保存到数据库
async saveCustomSite(siteData) {
  const result = await wx.cloud.callFunction({
    name: 'callAIGateway',
    data: {
      action: 'saveCustomSite',
      userInfo: this.data.userInfo,
      siteData: {
        url: siteData.url,
        name: siteData.name,
        logo: siteData.logo,
        description: siteData.description
      }
    }
  })
  
  if (result.result.success) {
    // 更新本地数据
    this.loadCustomSites()
    wx.showToast({ title: '添加成功', icon: 'success' })
  }
},

// 4. 加载自定义网站
async loadCustomSites() {
  const result = await wx.cloud.callFunction({
    name: 'callAIGateway',
    data: {
      action: 'loadCustomSites',
      userInfo: this.data.userInfo
    }
  })
  
  this.setData({
    customSites: result.result.sites
  })
},

// 5. 删除自定义网站
async deleteCustomSite(siteId) {
  wx.showModal({
    title: '确认删除',
    content: '确定要删除这个网站吗？',
    success: async (res) => {
      if (res.confirm) {
        await wx.cloud.callFunction({
          name: 'callAIGateway',
          data: {
            action: 'deleteCustomSite',
            userInfo: this.data.userInfo,
            siteId: siteId
          }
        })
        this.loadCustomSites()
      }
    }
  })
}
```

**云函数API:**
```javascript
// cloudfunctions/callAIGateway/index.js

// 1. 抓取网站信息
async function handleFetchSiteInfo(url) {
  try {
    // 使用cheerio或puppeteer抓取网站信息
    const response = await axios.get(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    
    // 解析HTML获取title, favicon, description
    const title = extractTitle(response.data)
    const favicon = extractFavicon(response.data, url)
    const description = extractDescription(response.data)
    
    return {
      success: true,
      siteInfo: {
        url: url,
        title: title,
        favicon: favicon,
        description: description
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// 2. 保存自定义网站
async function handleSaveCustomSite(userInfo, siteData, userIP) {
  const region = await detectRegion(userIP)
  const userId = userInfo.openid || userInfo.id
  
  if (region.region === 'china') {
    // WeChat Cloud
    const db = cloud.database()
    await db.collection('sitehub_custom_sites').add({
      data: {
        user_id: userId,
        site_url: siteData.url,
        site_name: siteData.name,
        site_logo: siteData.logo,
        site_description: siteData.description,
        sort_order: 0,
        created_at: new Date()
      }
    })
  } else {
    // Supabase
    await supabaseClient
      .from('sitehub_custom_sites')
      .insert({
        user_id: userId,
        site_url: siteData.url,
        site_name: siteData.name,
        site_logo: siteData.logo,
        site_description: siteData.description,
        sort_order: 0
      })
  }
  
  return { success: true }
}

// 3. 加载自定义网站
async function handleLoadCustomSites(userInfo, userIP) {
  const region = await detectRegion(userIP)
  const userId = userInfo.openid || userInfo.id
  let sites = []
  
  if (region.region === 'china') {
    // WeChat Cloud
    const db = cloud.database()
    const result = await db.collection('sitehub_custom_sites')
      .where({ user_id: userId })
      .orderBy('sort_order', 'asc')
      .get()
    sites = result.data
  } else {
    // Supabase
    const { data } = await supabaseClient
      .from('sitehub_custom_sites')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
    sites = data
  }
  
  return { success: true, sites: sites }
}
```

---

### 3.2 收藏功能增强 ⭐ **升级**

#### 3.2.1 当前问题
- ✅ 本地存储正常
- ❌ 无数据库同步
- ❌ 无拖拽排序
- ❌ 与官网不同步

#### 3.2.2 升级方案

**数据库同步:**
```javascript
// 收藏网站时保存到数据库
async toggleFavorite(siteId) {
  const favorites = this.data.favorites
  const isFavorited = favorites.includes(siteId)
  
  if (isFavorited) {
    // 取消收藏
    const newFavorites = favorites.filter(id => id !== siteId)
    this.setData({ favorites: newFavorites })
    
    // 同步到数据库
    await this.syncFavoritesToDB(newFavorites)
  } else {
    // 添加收藏
    const newFavorites = [...favorites, siteId]
    this.setData({ favorites: newFavorites })
    
    // 同步到数据库
    await this.syncFavoritesToDB(newFavorites)
  }
},

// 同步到数据库
async syncFavoritesToDB(favorites) {
  await wx.cloud.callFunction({
    name: 'callAIGateway',
    data: {
      action: 'saveFavorites',
      userInfo: this.data.userInfo,
      favorites: favorites
    }
  })
}
```

**拖拽排序:**
```javascript
// 使用 movable-view 组件实现拖拽
// pages/index/index.wxml
<movable-area class="favorites-area">
  <movable-view 
    wx:for="{{favoriteSites}}" 
    wx:key="id"
    class="favorite-item"
    direction="all"
    bindchange="onFavoriteDrag"
    data-id="{{item.id}}"
  >
    <text class="site-emoji">{{item.logo}}</text>
    <text class="site-title">{{item.name_zh}}</text>
  </movable-view>
</movable-area>

// 拖拽排序逻辑
onFavoriteDrag(e) {
  // 计算新位置
  // 更新排序数组
  // 同步到数据库
}
```

---

### 3.3 支付功能 - Team套餐 ⭐ **新增**

#### 3.3.1 套餐设计

**Pro套餐** (个人用户)
- 价格: $19.99/月, $168/年 (节省30%)
- 功能:
  - ✅ 访问 300+ 精选网站
  - ✅ 无广告体验
  - ✅ 云同步收藏夹
  - ✅ 无限自定义网站
  - ✅ 拖拽排序功能
  - ✅ 优先客户支持

**Team套餐** (团队用户)
- 价格: $299.99/月, $2520/年 (节省30%)
- 功能:
  - ✅ **Pro 所有功能**
  - ✅ 无限团队成员
  - ✅ 团队共享收藏夹
  - ✅ 团队协作工具
  - ✅ API 接口访问
  - ✅ 高级数据分析
  - ✅ 自定义域名
  - ✅ 专属客户经理
  - ✅ SLA 保证

#### 3.3.2 UI设计

**支付页面布局:**
```
┌─────────────────────────────────────────┐
│  升级会员                          [✕]  │
├─────────────────────────────────────────┤
│                                         │
│  选择套餐:                              │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Pro 会员   │  │  Team 会员   │   │
│  │  (推荐个人)  │  │  (适合团队)  │   │
│  │──────────────│  │──────────────│   │
│  │  $19.99/月   │  │ $299.99/月   │   │
│  │  $168/年     │  │ $2520/年     │   │
│  │  节省30%     │  │  节省30%     │   │
│  └──────────────┘  └──────────────┘   │
│   [已选择]                              │
│                                         │
│  计费周期:                              │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   月付       │  │   年付       │   │
│  │  $19.99      │  │  $168        │   │
│  └──────────────┘  └──────────────┘   │
│   [已选择]          节省30% 💰          │
│                                         │
│  功能对比:                              │
│  ✅ 300+ 精选网站                       │
│  ✅ 云同步收藏                          │
│  ✅ 自定义网站                          │
│  ✅ 拖拽排序                            │
│  ✅ 优先支持                            │
│  [Team独享] 团队协作                    │
│  [Team独享] API访问                     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      立即订阅 $19.99/月         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  支付即表示您同意服务条款和隐私政策     │
└─────────────────────────────────────────┘
```

#### 3.3.3 数据结构

```javascript
// pages/payment/payment.js
data: {
  // 套餐类型
  planType: 'pro', // 'pro' | 'team'
  
  // 计费周期
  billingCycle: 'monthly', // 'monthly' | 'yearly'
  
  // 价格配置
  prices: {
    pro: {
      monthly: 19.99,
      yearly: 168,
      originalYearly: 239.88 // 19.99 * 12
    },
    team: {
      monthly: 299.99,
      yearly: 2520,
      originalYearly: 3599.88 // 299.99 * 12
    }
  },
  
  // 功能列表
  features: {
    pro: [
      '访问 300+ 精选网站',
      '无广告体验',
      '云同步收藏夹',
      '无限自定义网站',
      '拖拽排序功能',
      '优先客户支持'
    ],
    team: [
      'Pro 的所有功能',
      '无限团队成员',
      '团队共享收藏夹',
      '团队协作工具',
      'API 接口访问',
      '高级数据分析',
      '自定义域名',
      '专属客户经理',
      'SLA 保证'
    ]
  }
}
```

#### 3.3.4 实现代码

```javascript
// pages/payment/payment.js

// 切换套餐类型
selectPlanType(e) {
  const planType = e.currentTarget.dataset.plan
  this.setData({ planType })
  this.updatePrice()
},

// 切换计费周期
selectBillingCycle(e) {
  const cycle = e.currentTarget.dataset.cycle
  this.setData({ billingCycle: cycle })
  this.updatePrice()
},

// 更新价格显示
updatePrice() {
  const { planType, billingCycle, prices } = this.data
  const currentPrice = prices[planType][billingCycle]
  
  this.setData({
    currentPrice: currentPrice,
    displayPrice: billingCycle === 'yearly' 
      ? `¥${currentPrice}/年 (节省30%)`
      : `¥${currentPrice}/月`
  })
},

// 发起支付
async handlePayment() {
  const { planType, billingCycle, currentPrice } = this.data
  
  wx.showLoading({ title: '正在创建订单...' })
  
  try {
    // 调用云函数创建订单
    const result = await wx.cloud.callFunction({
      name: 'callAIGateway',
      data: {
        action: 'createPayment',
        userInfo: this.data.userInfo,
        planType: planType,
        billingCycle: billingCycle,
        amount: currentPrice
      }
    })
    
    if (result.result.success) {
      // 调起微信支付
      await wx.requestPayment({
        timeStamp: result.result.payment.timeStamp,
        nonceStr: result.result.payment.nonceStr,
        package: result.result.payment.package,
        signType: 'MD5',
        paySign: result.result.payment.paySign,
        success: () => {
          wx.showToast({ title: '支付成功', icon: 'success' })
          // 更新用户会员状态
          this.updateUserMembership()
        },
        fail: () => {
          wx.showToast({ title: '支付取消', icon: 'none' })
        }
      })
    }
  } catch (error) {
    wx.showToast({ title: '订单创建失败', icon: 'none' })
  } finally {
    wx.hideLoading()
  }
}
```

---

## 4. 数据库设计

### 4.1 WeChat CloudBase 集合

#### 4.1.1 sitehub_custom_sites (自定义网站)
```javascript
{
  _id: ObjectId,
  user_id: String,           // 用户openid
  site_url: String,          // 网站URL
  site_name: String,         // 网站名称
  site_logo: String,         // 图标emoji或URL
  site_description: String,  // 网站描述
  sort_order: Number,        // 排序序号
  created_at: Date,          // 创建时间
  updated_at: Date           // 更新时间
}
```

#### 4.1.2 sitehub_favorites (收藏夹)
```javascript
{
  _id: ObjectId,
  user_id: String,           // 用户openid
  site_id: String,           // 网站ID
  sort_order: Number,        // 排序序号
  created_at: Date           // 收藏时间
}
```

#### 4.1.3 sitehub_subscriptions (订阅记录)
```javascript
{
  _id: ObjectId,
  user_id: String,           // 用户openid
  plan_type: String,         // 'pro' | 'team'
  billing_cycle: String,     // 'monthly' | 'yearly'
  status: String,            // 'active' | 'cancelled' | 'expired'
  start_date: Date,          // 开始日期
  end_date: Date,            // 到期日期
  amount: Number,            // 支付金额
  transaction_id: String,    // 微信支付交易号
  created_at: Date           // 创建时间
}
```

### 4.2 Supabase 数据表

#### 4.2.1 sitehub_custom_sites
```sql
CREATE TABLE sitehub_custom_sites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    site_url TEXT NOT NULL,
    site_name TEXT NOT NULL,
    site_logo TEXT,
    site_description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_custom_sites_user_id ON sitehub_custom_sites(user_id);
CREATE INDEX idx_custom_sites_sort_order ON sitehub_custom_sites(sort_order);
```

#### 4.2.2 sitehub_favorites
```sql
CREATE TABLE sitehub_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    site_id TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, site_id)
);

CREATE INDEX idx_favorites_user_id ON sitehub_favorites(user_id);
```

#### 4.2.3 sitehub_subscriptions
```sql
CREATE TABLE sitehub_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('pro', 'team')),
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON sitehub_subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON sitehub_subscriptions(status);
```

#### 4.2.4 sitehub_team_members (Team功能)
```sql
CREATE TABLE sitehub_team_members (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES sitehub_teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);
```

#### 4.2.5 sitehub_teams (Team功能)
```sql
CREATE TABLE sitehub_teams (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id BIGINT REFERENCES sitehub_subscriptions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 5. API接口设计 ⚡ **简化版**

### 5.1 设计原则

**核心理念**: 用最少的API实现所有功能
- ✅ **4个核心API** - 不需要10个
- ✅ **统一数据接口** - saveUserData/loadUserData
- ✅ **dataType参数** - 区分不同数据类型
- ✅ **易于维护** - 代码集中，逻辑清晰

---

### 5.2 云函数: callAIGateway

**核心Actions列表（4个）:**

| Action | 描述 | 参数 | 返回值 | 状态 |
|--------|------|------|--------|------|
| `detectRegion` | IP地域检测 | - | `{region, database, reason}` | ✅ 已实现 |
| `saveUserData` | 保存用户数据（统一接口） | `userInfo, dataType, data` | `{success}` | ✅ 已实现（需扩展） |
| `loadUserData` | 加载用户数据（统一接口） | `userInfo, dataType` | `{data}` | ✅ 已实现（需扩展） |
| `createPayment` | 创建支付订单 | `userInfo, planType, billingCycle, amount` | `{payment{}}` | ❌ 需实现 |

---

### 5.3 数据类型（dataType）

**saveUserData / loadUserData 支持的数据类型:**

| dataType | 描述 | 用途 |
|----------|------|------|
| `favorites` | 收藏夹 | 保存/加载用户收藏的网站ID列表 |
| `custom_sites` | 自定义网站 | 保存/加载用户添加的自定义网站 |
| `usage_stats` | 使用统计 | 保存/加载用户访问记录 |
| `settings` | 用户设置 | 保存/加载用户偏好设置 |
| `all` | 所有数据（仅load） | 一次性加载所有用户数据 |

---

### 5.4 API调用示例

#### **1. 保存收藏夹**
```javascript
const result = await wx.cloud.callFunction({
  name: 'callAIGateway',
  data: {
    action: 'saveUserData',
    userInfo: { openid: 'xxx' },
    dataType: 'favorites',
    data: {
      favorites: ['google', 'github', 'youtube']
    }
  }
})
```

#### **2. 添加自定义网站**
```javascript
const result = await wx.cloud.callFunction({
  name: 'callAIGateway',
  data: {
    action: 'saveUserData',
    userInfo: { openid: 'xxx' },
    dataType: 'custom_sites',
    data: {
      custom_sites: [
        {
          url: 'https://example.com',
          name: '我的网站',
          logo: '🌐',
          description: '示例网站',
          sort_order: 0
        }
      ]
    }
  }
})
```

#### **3. 加载用户所有数据**
```javascript
const result = await wx.cloud.callFunction({
  name: 'callAIGateway',
  data: {
    action: 'loadUserData',
    userInfo: { openid: 'xxx' },
    dataType: 'all'  // 一次性加载所有数据
  }
})

// 返回:
// {
//   success: true,
//   data: {
//     favorites: ['google', 'github'],
//     custom_sites: [{...}],
//     usage_stats: [{...}],
//     settings: {...}
//   }
// }
```

#### **4. 创建支付订单**
```javascript
const result = await wx.cloud.callFunction({
  name: 'callAIGateway',
  data: {
    action: 'createPayment',
    userInfo: { openid: 'xxx' },
    planType: 'pro',          // 'pro' | 'team'
    billingCycle: 'yearly',   // 'monthly' | 'yearly'
    amount: 168
  }
})

// 返回:
// {
//   success: true,
//   payment: {
//     timeStamp: '1234567890',
//     nonceStr: 'xxxxx',
//     package: 'prepay_id=xxxxx',
//     signType: 'MD5',
//     paySign: 'xxxxx'
//   },
//   orderId: 'ORDER_20250110_xxxxx'
// }
```

---

### 5.5 云函数实现示例

#### **扩展 saveUserData**
```javascript
// cloudfunctions/callAIGateway/index.js
case 'saveUserData':
  return await handleSaveUserData(event.userInfo, event.dataType, event.data, userIP);

async function handleSaveUserData(userInfo, dataType, data, userIP) {
  try {
    // 1. 获取路由决策
    const routeInfo = await getDatabaseRoute(userInfo, userIP);
    
    // 2. 根据dataType保存到对应的数据库
    let result;
    if (routeInfo.database === 'wechat_cloud') {
      result = await saveToWeChatCloud(userInfo, dataType, data);
    } else {
      result = await saveToSupabase(userInfo, dataType, data);
    }
    
    return {
      success: true,
      dataType: dataType,
      route: routeInfo
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 保存到WeChat Cloud
async function saveToWeChatCloud(userInfo, dataType, data) {
  const db = cloud.database();
  
  switch(dataType) {
    case 'favorites':
      // 保存收藏
      await db.collection('sitehub_favorites').where({
        user_id: userInfo.openid
      }).remove();
      
      for (let i = 0; i < data.favorites.length; i++) {
        await db.collection('sitehub_favorites').add({
          data: {
            user_id: userInfo.openid,
            site_id: data.favorites[i],
            sort_order: i,
            created_at: new Date()
          }
        });
      }
      break;
      
    case 'custom_sites':
      // 保存自定义网站（覆盖）
      await db.collection('sitehub_custom_sites').where({
        user_id: userInfo.openid
      }).remove();
      
      for (let site of data.custom_sites) {
        await db.collection('sitehub_custom_sites').add({
          data: {
            user_id: userInfo.openid,
            ...site,
            created_at: new Date()
          }
        });
      }
      break;
      
    case 'usage_stats':
      // 追加使用统计
      await db.collection('sitehub_usage_stats').add({
        data: {
          user_id: userInfo.openid,
          ...data,
          created_at: new Date()
        }
      });
      break;
  }
  
  return { success: true };
}
```

#### **扩展 loadUserData**
```javascript
case 'loadUserData':
  return await handleLoadUserData(event.userInfo, event.dataType, userIP);

async function handleLoadUserData(userInfo, dataType, userIP) {
  try {
    // 1. 获取路由决策
    const routeInfo = await getDatabaseRoute(userInfo, userIP);
    
    // 2. 从数据库加载
    let userData;
    if (routeInfo.database === 'wechat_cloud') {
      userData = await loadFromWeChatCloud(userInfo, dataType);
    } else {
      userData = await loadFromSupabase(userInfo, dataType);
    }
    
    return {
      success: true,
      data: userData,
      route: routeInfo
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
}

// 从WeChat Cloud加载
async function loadFromWeChatCloud(userInfo, dataType) {
  const db = cloud.database();
  const result = {};
  
  if (dataType === 'all' || dataType === 'favorites') {
    const favs = await db.collection('sitehub_favorites')
      .where({ user_id: userInfo.openid })
      .orderBy('sort_order', 'asc')
      .get();
    result.favorites = favs.data.map(f => f.site_id);
  }
  
  if (dataType === 'all' || dataType === 'custom_sites') {
    const sites = await db.collection('sitehub_custom_sites')
      .where({ user_id: userInfo.openid })
      .orderBy('sort_order', 'asc')
      .get();
    result.custom_sites = sites.data;
  }
  
  if (dataType === 'all' || dataType === 'usage_stats') {
    const stats = await db.collection('sitehub_usage_stats')
      .where({ user_id: userInfo.openid })
      .orderBy('created_at', 'desc')
      .limit(100)
      .get();
    result.usage_stats = stats.data;
  }
  
  return dataType === 'all' ? result : result[dataType] || [];
}
```

---

### 5.6 为什么不需要更多API？

#### ❌ **旧方案（10个API）的问题:**
```
fetchSiteInfo       ← 可以在前端用第三方服务
saveCustomSite      ← 合并到 saveUserData
loadCustomSites     ← 合并到 loadUserData
deleteCustomSite    ← 合并到 saveUserData（传空数组）
updateSiteOrder     ← 合并到 saveUserData（更新sort_order）
saveFavorites       ← 合并到 saveUserData
loadFavorites       ← 合并到 loadUserData
verifyPayment       ← 微信支付自动回调，不需要单独API
```

#### ✅ **新方案（4个API）的优势:**
```
✅ 代码量减少 60%
✅ 维护成本降低
✅ 前端调用更统一
✅ 易于扩展新数据类型
✅ 错误处理集中
```

---

### 5.7 前端调用封装（推荐）

为了进一步简化前端调用，可以封装工具函数：

```javascript
// utils/api.js
const api = {
  // 保存收藏
  async saveFavorites(favorites) {
    return await wx.cloud.callFunction({
      name: 'callAIGateway',
      data: {
        action: 'saveUserData',
        userInfo: getApp().globalData.userInfo,
        dataType: 'favorites',
        data: { favorites }
      }
    });
  },
  
  // 加载收藏
  async loadFavorites() {
    const result = await wx.cloud.callFunction({
      name: 'callAIGateway',
      data: {
        action: 'loadUserData',
        userInfo: getApp().globalData.userInfo,
        dataType: 'favorites'
      }
    });
    return result.result.data || [];
  },
  
  // 保存自定义网站
  async saveCustomSites(sites) {
    return await wx.cloud.callFunction({
      name: 'callAIGateway',
      data: {
        action: 'saveUserData',
        userInfo: getApp().globalData.userInfo,
        dataType: 'custom_sites',
        data: { custom_sites: sites }
      }
    });
  },
  
  // 加载所有用户数据
  async loadAllUserData() {
    const result = await wx.cloud.callFunction({
      name: 'callAIGateway',
      data: {
        action: 'loadUserData',
        userInfo: getApp().globalData.userInfo,
        dataType: 'all'
      }
    });
    return result.result.data;
  }
};

module.exports = api;
```

**使用示例:**
```javascript
// pages/index/index.js
const api = require('../../utils/api.js');

// 保存收藏
await api.saveFavorites(['google', 'github']);

// 加载收藏
const favorites = await api.loadFavorites();

// 加载所有数据
const userData = await api.loadAllUserData();
console.log(userData.favorites);
console.log(userData.custom_sites);
```

---

## 6. UI/UX设计规范

### 6.1 设计原则

1. **梁宁产品思维**:
   - 黄金比例布局
   - 留白呼吸感
   - 视觉层级分明
   - 简洁直观

2. **交互原则**:
   - 最少点击次数
   - 即时反馈
   - 容错设计
   - 一致性体验

### 6.2 颜色规范

```css
/* 主色调 */
--primary-blue: rgba(59, 130, 246, 1);
--primary-blue-light: rgba(59, 130, 246, 0.2);
--primary-blue-border: rgba(59, 130, 246, 0.3);

/* 背景色 */
--bg-dark: #0f172a;
--bg-gradient: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);

/* 文字颜色 */
--text-white: #ffffff;
--text-light: rgba(255, 255, 255, 0.7);
--text-dim: rgba(255, 255, 255, 0.5);

/* 成功/警告/错误 */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
```

### 6.3 组件规范

**按钮尺寸:**
- 大按钮: `height: 88rpx`, `padding: 0 48rpx`
- 中按钮: `height: 64rpx`, `padding: 0 32rpx`
- 小按钮: `height: 48rpx`, `padding: 0 24rpx`

**卡片样式:**
```css
.card {
  background: rgba(255, 255, 255, 0.05);
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  padding: 24rpx;
  transition: all 0.2s ease;
}

.card:active {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0.98);
}
```

**间距规范:**
- 超小间距: `8rpx`
- 小间距: `16rpx`
- 中间距: `24rpx`
- 大间距: `32rpx`
- 超大间距: `48rpx`

---

## 7. 实施计划

### 7.1 Phase 1: 核心功能完善 (2-3天)

**Day 1: 自定义网站基础功能**
- [ ] 添加网站弹窗UI
- [ ] URL输入和验证
- [ ] 抓取网站信息API
- [ ] 保存到数据库
- [ ] 显示在自定义Tab

**Day 2: 收藏功能升级**
- [ ] 数据库同步逻辑
- [ ] 拖拽排序UI
- [ ] 排序数据保存
- [ ] 与官网数据打通

**Day 3: Team支付功能**
- [ ] 支付页面UI重构
- [ ] Pro/Team套餐切换
- [ ] 价格计算逻辑
- [ ] 支付流程测试

### 7.2 Phase 2: 高级功能 (2-3天)

**Day 4-5: 拖拽排序**
- [ ] 自定义网站拖拽
- [ ] 收藏夹拖拽
- [ ] 排序动画优化
- [ ] 数据同步测试

**Day 6: Team协作功能**
- [ ] 团队创建
- [ ] 成员邀请
- [ ] 权限管理
- [ ] 数据共享

### 7.3 Phase 3: 测试与优化 (1-2天)

**Day 7: 全面测试**
- [ ] 功能测试
- [ ] 兼容性测试
- [ ] 性能测试
- [ ] 用户体验测试

**Day 8: 上线准备**
- [ ] Bug修复
- [ ] 文档完善
- [ ] 部署配置
- [ ] 监控告警

---

## 8. 风险评估

### 8.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 网站信息抓取失败 | 中 | 高 | 允许用户手动输入，提供默认图标 |
| 跨平台数据同步延迟 | 低 | 中 | 使用实时更新机制，添加同步状态提示 |
| 支付流程异常 | 高 | 低 | 完善错误处理，提供人工客服 |
| 数据库性能瓶颈 | 中 | 低 | 添加索引，使用缓存，分页加载 |

### 8.2 产品风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 用户不理解Team套餐价值 | 中 | 中 | 优化功能说明，提供试用期 |
| 自定义网站使用率低 | 低 | 中 | 引导教程，提供模板 |
| 拖拽排序操作复杂 | 低 | 低 | 简化交互，添加提示 |

---

## 9. 成功指标

### 9.1 功能指标
- [ ] 自定义网站添加成功率 > 95%
- [ ] 数据跨平台同步延迟 < 3秒
- [ ] 支付流程完成率 > 80%
- [ ] 拖拽排序操作成功率 > 90%

### 9.2 用户指标
- [ ] 日活用户数 (DAU) 增长 > 20%
- [ ] 付费转化率 > 5%
- [ ] Team套餐占比 > 15%
- [ ] 用户满意度 (NPS) > 8/10

### 9.3 技术指标
- [ ] 页面加载时间 < 2秒
- [ ] API响应时间 < 500ms
- [ ] 崩溃率 < 0.1%
- [ ] 数据库查询效率 > 95%

---

## 10. 附录

### 10.1 参考文档
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [WeChat CloudBase文档](https://cloud.tencent.com/document/product/876)
- [Supabase官方文档](https://supabase.com/docs)
- [Stripe支付集成](https://stripe.com/docs)

### 10.2 相关文件
- `JEFF_REQUIREMENTS_CHECK.md` - 需求检查报告
- `部署指南.md` - 部署步骤
- `supabase-setup.sql` - 数据库脚本
- `cloudfunctions/callAIGateway/` - 云函数代码

### 10.3 更新日志
- **2025-10-10**: 初始版本，包含自定义网站、收藏升级、Team支付三大功能
- **2025-10-09**: IP地域化功能已实现
- **2025-10-08**: 项目基础架构完成

---

**文档状态**: ✅ 已完成  
**待实现功能**: 自定义网站 | 收藏升级 | Team支付  
**预计完成时间**: 2025-10-17


