# 🔴 userId 变化问题诊断报告

**问题现象**: 同一个微信登录，每次登录 userId 都在变化（821378 → 177005）

**影响**: 支付成功但会员身份无法显示，因为订阅记录关联的是旧的 userId

---

## 🔍 根本原因

### 问题代码位置：`cloudfunctions/callAIGateway/index.js`

**问题1**: 数据库中存在**多条相同 openid 的用户记录**

```javascript
// 行 1723-1726
const result = await db.collection('sitehub_users')
  .where({ openid: userInfo.openid })
  .limit(1)  // ⚠️ 只取第一条，但可能有多条
  .get()
```

**问题2**: 每次查询可能返回**不同的记录**

由于没有 `orderBy`，微信云数据库返回的"第一条"是不确定的：
- 第一次登录可能返回 记录A（userId=821378）
- 第二次登录可能返回 记录B（userId=177005）

**问题3**: 缺少 `userId` 字段时会重新生成

```javascript
// 行 1732-1736
if (!user.userId) {
  const stableUserId = generateStableUserId(user.openid)
  updates.userId = stableUserId
  user.userId = stableUserId
}
```

虽然 `generateStableUserId` 算法是稳定的（相同 openid 生成相同 hash），但：
- 如果多条记录都没有 `userId` 字段
- 每条记录会在第一次被查询到时生成不同的 `userId`
- 导致不同登录会话看到不同的 `userId`

---

## 🎯 完整问题链路

```
用户登录
  ↓
callAIGateway.getMe()
  ↓
getUserInfoFromWeChatCloud()
  ↓
db.collection('sitehub_users').where({ openid: xxx }).limit(1).get()
  ↓
返回多条记录中的"随机一条" ← 🔴 问题核心
  ↓
if (!user.userId) { 生成新userId } ← 🔴 每条记录生成不同ID
  ↓
返回不同的 userId 给前端
  ↓
前端用新 userId 查询，找不到订阅记录 ← 🔴 导致会员身份不显示
```

---

## 📊 数据库状态诊断

### 可能的情况1：多条用户记录

```javascript
sitehub_users:
[
  {
    _id: 'record-1',
    openid: 'oABC123...',
    userId: undefined,     // ← 未设置
    is_pro: true,
    created_at: '2025-10-12'
  },
  {
    _id: 'record-2',
    openid: 'oABC123...',  // ← 相同openid
    userId: undefined,     // ← 未设置
    is_pro: false,
    created_at: '2025-10-13'
  }
]
```

**结果**:
- 第一次登录可能返回 record-1，生成 userId=821378
- 第二次登录可能返回 record-2，生成 userId=177005

### 可能的情况2：订阅关联错误

```javascript
sitehub_subscriptions:
{
  user_openid: 'oABC123...',
  user_id: 821378,           // ← 关联旧的userId
  status: 'active'
}

sitehub_users (当前):
{
  openid: 'oABC123...',
  userId: 177005,            // ← 新的userId
  is_pro: false              // ← 找不到订阅，显示免费版
}
```

---

## ✅ 解决方案

### 方案1: 运行诊断脚本（立即执行）

在微信开发者工具的 Settings 页面控制台执行：

```javascript
// 1. 先运行诊断脚本
复制 '检查重复用户记录.js' 的内容并执行

// 2. 然后运行修复脚本
复制 '修复用户记录重复问题.js' 的内容并执行
```

**修复脚本会**:
1. ✅ 查找所有相同 openid 的用户记录
2. ✅ 选择一条主记录（优先选择 is_pro=true 的）
3. ✅ 生成永久的 userId（基于 openid 的稳定 hash）
4. ✅ 删除重复记录
5. ✅ 将所有订阅记录关联到正确的 userId
6. ✅ 如果有 pending 订阅，自动激活为 active
7. ✅ 更新用户表的会员状态（is_pro=true）
8. ✅ 更新本地缓存

### 方案2: 修复云函数代码（长期方案）

修改 `callAIGateway/index.js` 的 `getUserInfoFromWeChatCloud` 函数：

```javascript
// 🔧 修复1: 添加排序和去重检查
const result = await db.collection('sitehub_users')
  .where({ openid: userInfo.openid })
  .orderBy('created_at', 'asc')  // ← 总是返回最早创建的
  .limit(1)
  .get()

// 🔧 修复2: 检查并合并重复记录
if (result.data.length === 0) {
  // 创建新用户...
} else {
  const user = result.data[0]

  // 检查是否有重复记录
  const allUsers = await db.collection('sitehub_users')
    .where({ openid: userInfo.openid })
    .get()

  if (allUsers.data.length > 1) {
    console.warn(`⚠️ 发现重复用户记录: ${allUsers.data.length} 条`)
    // 自动清理重复记录
    for (let i = 1; i < allUsers.data.length; i++) {
      await db.collection('sitehub_users')
        .doc(allUsers.data[i]._id)
        .remove()
    }
  }

  // 确保userId永久固定
  if (!user.userId) {
    const permanentUserId = generateStableUserId(user.openid)
    await db.collection('sitehub_users')
      .doc(user._id)
      .update({
        data: {
          userId: permanentUserId,
          user_id: permanentUserId
        }
      })
    user.userId = permanentUserId
  }

  // ... 其余逻辑
}
```

---

## 🎯 验证清单

修复后，依次验证：

- [ ] **数据库层**: 只有1条 sitehub_users 记录（openid=xxx）
- [ ] **数据库层**: userId 字段已设置且不为空
- [ ] **数据库层**: sitehub_subscriptions.user_id === sitehub_users.userId
- [ ] **数据库层**: is_pro === true, subscription_status === 'active'
- [ ] **API层**: 调用 getMe，返回相同的 userId
- [ ] **API层**: entitlement.status === 'active'
- [ ] **前端层**: 刷新页面，Settings 显示 Pro 会员卡
- [ ] **前端层**: 侧边栏不显示"升级 Pro 会员"按钮

---

## 📝 预防措施

### 1. 数据库唯一性约束

在微信云数据库中为 `sitehub_users.openid` 添加唯一索引：

```javascript
// 在微信云控制台执行
db.collection('sitehub_users').createIndex({
  index: [{ name: 'openid', order: 'asc' }],
  unique: true
})
```

### 2. 用户注册时检查重复

```javascript
// 创建用户前先检查
const existing = await db.collection('sitehub_users')
  .where({ openid: userInfo.openid })
  .get()

if (existing.data.length > 0) {
  // 返回已存在的用户，不创建新记录
  return existing.data[0]
}
```

### 3. 添加监控日志

```javascript
console.log('[USER-CREATE]', {
  openid: userInfo.openid,
  userId: generatedUserId,
  action: 'create_or_update',
  duplicates: allUsers.data.length
})
```

---

## 🚀 立即行动

**第一步**: 在微信开发者工具执行修复脚本
```
复制 '修复用户记录重复问题.js' → 在Settings页面控制台粘贴执行
```

**第二步**: 刷新小程序
```
重新进入 Settings 页面，查看是否显示 Pro 会员卡
```

**第三步**: 验证 userId 稳定性
```
退出重新登录，检查 userId 是否保持不变
```

---

**创建时间**: 2025-10-13
**严重等级**: 🔴 CRITICAL
**影响范围**: 所有已支付用户
**修复优先级**: P0 - 立即修复
