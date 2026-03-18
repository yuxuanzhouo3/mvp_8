# 🎯 单一事实源（SSOT）架构设计

## 系统架构图

```
[前端视图(左侧栏/设置页)]
      │
      │ (GET /me, traceId: m-20251012-001)
      │ [FE] call /me {traceId, userId, openid}
      ▼
[API 网关 - callAIGateway]
      │
      │ [GW-IN] {traceId, appEnv, userId, openid, tokenExists}
      │
      ├─────► [鉴权/识别 userId, openid]
      │                          │
      │                          ▼
      │                    [查询履约状态]
      │                          │
      │                          │ [ENT-GET] {traceId, status, plan, expiresAt, version}
      │                          │
      │                          ▼
      │                    [履约服务 Entitlement]
      │                          │
      │                          └─► 读取: plan, status, expiresAt, version
      │
      └─────► [GW-OUT] {traceId, entitlement:{status,plan,expiresAt,version}}
                  │
                  ▼
            [前端状态机]
                  │
                  ├─► 左侧栏显示
                  └─► 设置页显示


[支付流程]
      │
      │ (用户点击支付)
      ▼
[创建订单 - wechatPay云函数]
      │
      │ [PAY-CREATE] {traceId, orderId, userId, plan, amount}
      │
      ▼
[微信支付统一下单]
      │
      │ (用户完成支付)
      ▼
[支付回调通知]
      │
      │ [PAY-CALLBACK] {traceId, orderId, transactionId, status}
      │
      ▼
[履约服务 - 写入权益]
      │
      │ [ENT-WRITE] {traceId, userId, plan, status, expiresAt, version++}
      │
      ▼
[更新用户画像]
      │
      │ version++
      ▼
[通知前端刷新]
      │
      │ (支付成功页面)
      ▼
[前端强制刷新 /me]
```

## 状态机定义

```javascript
type EntitlementStatus = 
  | 'unknown'    // 未知状态（初始化中）
  | 'free'       // 免费用户
  | 'active'     // 活跃会员
  | 'grace'      // 宽限期（过期但保留权限）
  | 'expired'    // 已过期
  | 'suspended'  // 已暂停

type Entitlement = {
  plan: 'free' | 'pro' | 'team'
  status: EntitlementStatus
  expiresAt: string | null  // ISO 8601 格式
  source: 'wxpay' | 'legacy' | null
  version: number  // 版本号，每次更新递增
}
```

## 统一画像接口（SSOT）

```javascript
// GET /me (通过 callAIGateway 云函数实现)
{
  "userId": "123456",
  "openid": "oXXXXXXXXXXXXXXXXXXXX",
  "profile": {
    "nickname": "钰涵",
    "avatar": "https://...",
    "createdAt": "2025-10-11T10:30:00Z"
  },
  "entitlement": {
    "plan": "pro",
    "status": "active",
    "expiresAt": "2025-12-31T23:59:59Z",
    "source": "wxpay",
    "version": 18
  },
  "traceId": "m-20251012-001"
}
```

## 五个探针（可观测性）

### 探针1：前端发起 /me 前
```javascript
console.log('[FE] call /me', {
  traceId: 'm-20251012-001',
  userId: userInfo?.userId,
  openid: userInfo?.openid,
  timestamp: Date.now()
})
```

### 探针2：API 网关入口
```javascript
console.log('[GW-IN]', {
  traceId: event.traceId,
  appEnv: 'prod',
  userId: userInfo?.userId,
  openid: userInfo?.openid,
  tokenExists: !!userInfo
})
```

### 探针3：履约读取
```javascript
console.log('[ENT-GET]', {
  traceId: event.traceId,
  status: entitlement.status,
  plan: entitlement.plan,
  expiresAt: entitlement.expiresAt,
  version: entitlement.version
})
```

### 探针4：支付回调→履约写入
```javascript
console.log('[ENT-WRITE]', {
  traceId: event.traceId,
  userId: userId,
  plan: 'pro',
  status: 'active',
  expiresAt: expiresAt,
  version: oldVersion + 1
})
```

### 探针5：/me 返回
```javascript
console.log('[GW-OUT]', {
  traceId: event.traceId,
  entitlement: {
    status: result.entitlement.status,
    plan: result.entitlement.plan,
    expiresAt: result.entitlement.expiresAt,
    version: result.entitlement.version
  }
})
```

## 排错顺序

1. **先跑一次 /me**，对比 `[GW-IN]` 与 `[GW-OUT]`：
   - IN 有 openid、OUT 的 status=free → 查履约读取
   - IN openid=undefined → 查登录绑定
   - OUT 正确但前端仍显示免费 → 查前端是否没用统一 store/没强刷

2. **触发一次支付成功** → 看 `[ENT-WRITE]` 是否执行
   - 若执行，/me 是否 version++

3. **只要有一个探针输出异常**，就精准收敛到那一层去修

---

**关键原则**：
- ✅ 单一事实源：所有页面只信 /me 的返回
- ✅ 状态机而非布尔值：使用 EntitlementStatus 枚举
- ✅ 显式依赖注入：不依赖全局变量
- ✅ 端到端可观测：traceId 串起整条链路
- ✅ 强制刷新：支付成功/登录后调用 fetchMe(true)





