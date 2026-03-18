# WeChat CloudBase 集合定义：sitehub_users

## 集合名称
`sitehub_users`

## 集合描述
用于存储用户的基本信息，包括注册时间、最后登录时间、地域等。

## 字段定义

| 字段名                 | 类型     | 描述                                     | 示例值                                     |
|------------------------|----------|------------------------------------------|--------------------------------------------|
| `_id`                  | String   | 文档ID (自动生成)                        | `5f9d7b3b9d7e1d0001a1b2c3`                 |
| `openid`               | String   | 用户OpenID (唯一标识)                    | `oXXXXXXXX`                                |
| `nickname`             | String   | 用户昵称                                 | `用户昵称`                                 |
| `avatar_url`           | String   | 用户头像URL                              | `https://thirdwx.qlogo.cn/...`             |
| `region`               | String   | 用户地域 (`china` 或 `international`)    | `china`                                    |
| `created_at`           | Date     | 注册时间                                 | `2025-01-10T08:30:00.000Z`                 |
| `last_login`           | Date     | 最后登录时间                             | `2025-01-10T10:00:00.000Z`                 |
| `updated_at`           | Date     | 更新时间 (自动生成)                      | `2025-01-10T10:05:00.000Z`                 |

## 索引建议
- `openid` (唯一索引)
- `region` (普通索引)
- `created_at` (普通索引)

## 权限设置
- **所有用户可读**：仅限自己的用户记录
- **所有用户可写**：仅限自己的用户记录（更新 `last_login` 等）
- **云函数可读写**：所有记录（用于用户管理、数据同步等）

## 示例数据
```json
{
  "_id": "user_001",
  "openid": "oXXXXXXXX",
  "nickname": "用户昵称",
  "avatar_url": "https://thirdwx.qlogo.cn/mmopen/...",
  "region": "china",
  "created_at": ISODate("2025-01-10T08:30:00.000Z"),
  "last_login": ISODate("2025-01-10T10:00:00.000Z"),
  "updated_at": ISODate("2025-01-10T10:05:00.000Z")
}
```

## 使用说明

### 创建用户记录
```javascript
// 在云函数中创建用户
const db = cloud.database()
await db.collection('sitehub_users').add({
  data: {
    openid: userInfo.openid,
    nickname: userInfo.nickName || 'User',
    avatar_url: userInfo.avatarUrl || '',
    region: 'china', // 根据IP检测设置
    created_at: new Date(),
    last_login: new Date()
  }
})
```

### 查询用户信息
```javascript
// 根据openid查询用户
const result = await db.collection('sitehub_users')
  .where({ openid: userInfo.openid })
  .limit(1)
  .get()
```

### 更新用户信息
```javascript
// 更新最后登录时间
await db.collection('sitehub_users')
  .where({ openid: userInfo.openid })
  .update({
    data: {
      last_login: new Date(),
      updated_at: new Date()
    }
  })
```

## 注意事项
1. `openid` 是用户的唯一标识，必须设置唯一索引
2. `created_at` 在用户首次创建时设置，之后不应该修改
3. `last_login` 在每次用户登录时更新
4. 如果用户不存在，云函数会自动创建新用户记录






