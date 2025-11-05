# 腾讯云 CloudBase 数据库访问指南

## 📋 数据库基本信息

**环境ID (Environment ID):** `cloudbase-1gnip2iaa08260e5`

**相关数据库集合：**
- `web_users` - 用户表
- `web_favorites` - 收藏表
- `web_custom_sites` - 自定义网站表
- `web_subscriptions` - 订阅表

---

## 🔐 方式一：通过腾讯云控制台访问（推荐）

### 1. 登录腾讯云控制台

访问：https://console.cloud.tencent.com/

使用主账号登录（应该已经有权限）

### 2. 进入 CloudBase 控制台

- 在左侧导航栏找到 **云开发 CloudBase**
- 或者直接访问：https://console.cloud.tencent.com/tcb

### 3. 选择环境

- 在环境列表中找到：`cloudbase-1gnip2iaa08260e5`
- 点击进入该环境

### 4. 进入数据库管理

- 点击左侧菜单 **数据库**
- 选择 **集合管理**

### 5. 查看数据

- 点击 `web_favorites` 集合 - 查看收藏记录
- 点击 `web_custom_sites` 集合 - 查看自定义网站记录

---

## 📊 数据库表结构

### 收藏表 (web_favorites)

```javascript
{
  "_id": "自动生成的文档ID",
  "user_id": "用户ID（来自web_users的_id）",
  "site_id": "网站ID",
  "created_at": "创建时间（Date对象）"
}
```

### 示例数据：
```javascript
{
  "_id": "67297abc123456789",
  "user_id": "67297123abc456def",
  "site_id": "chatgpt",
  "created_at": ISODate("2025-11-05T08:30:00.000Z")
}
```

### 自定义网站表 (web_custom_sites)

```javascript
{
  "_id": "自动生成的文档ID",
  "user_id": "用户ID（来自web_users的_id）",
  "name": "网站名称",
  "url": "网站URL",
  "logo": "网站Logo URL",
  "category": "分类（如custom、tools等）",
  "description": "网站描述",
  "created_at": "创建时间（Date对象）",
  "updated_at": "更新时间（Date对象）"
}
```

### 示例数据：
```javascript
{
  "_id": "67297abc123456790",
  "user_id": "67297123abc456def",
  "name": "我的工具",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "category": "custom",
  "description": "一个很棒的工具网站",
  "created_at": ISODate("2025-11-05T09:00:00.000Z"),
  "updated_at": ISODate("2025-11-05T09:00:00.000Z")
}
```

---

## 🔍 如何验证功能

### 测试收藏功能：

1. **清空现有数据（可选）**
   - 在 `web_favorites` 集合中，删除测试用户的所有记录
   - 或者记录当前的数据条数

2. **在官网操作**
   - 注册/登录一个测试账号（记住邮箱）
   - 收藏3个网站
   - 退出登录

3. **查看数据库**
   - 刷新 CloudBase 控制台的 `web_favorites` 集合
   - 应该看到新增了3条记录
   - 检查 `user_id` 是否对应该测试账号

4. **再次登录验证**
   - 重新登录同一账号
   - 检查收藏是否显示
   - 同时在数据库中确认数据依然存在

### 测试自定义网站功能：

1. **清空现有数据（可选）**
   - 在 `web_custom_sites` 集合中，删除测试用户的所有记录
   - 或者记录当前的数据条数

2. **在官网操作**
   - 注册/登录一个测试账号（记住邮箱）
   - 添加2-3个自定义网站（输入名称、URL）
   - 退出登录

3. **查看数据库**
   - 刷新 CloudBase 控制台的 `web_custom_sites` 集合
   - 应该看到新增的记录
   - 检查 `user_id`、`name`、`url` 字段是否正确

4. **再次登录验证**
   - 重新登录同一账号
   - 检查自定义网站是否显示
   - 同时在数据库中确认数据依然存在

---

## 📝 方式二：使用 CloudBase CLI（命令行）

### 1. 安装 CloudBase CLI

```bash
npm install -g @cloudbase/cli
```

### 2. 登录

```bash
tcb login
```

### 3. 查询收藏数据

```bash
# 查看所有收藏
tcb db query web_favorites -e cloudbase-1gnip2iaa08260e5

# 查询特定用户的收藏
tcb db query web_favorites -e cloudbase-1gnip2iaa08260e5 \
  --where '{"user_id": "用户ID"}'
```

---

## 🔍 方式三：使用数据库查询语句（控制台）

在 CloudBase 控制台的数据库查询界面，可以使用以下查询：

### 查看所有收藏
```javascript
db.collection('web_favorites').get()
```

### 查看特定用户的收藏
```javascript
db.collection('web_favorites')
  .where({
    user_id: '用户ID'
  })
  .get()
```

### 按时间排序查看最新收藏
```javascript
db.collection('web_favorites')
  .orderBy('created_at', 'desc')
  .limit(10)
  .get()
```

### 统计收藏总数
```javascript
db.collection('web_favorites').count()
```

---

## 🔗 关联查询：找到用户及其收藏

### 1. 先在 `web_users` 表找到用户

```javascript
db.collection('web_users')
  .where({
    email: 'test@example.com'
  })
  .get()
```

记下返回的 `_id` 字段

### 2. 用这个 user_id 查询收藏

```javascript
db.collection('web_favorites')
  .where({
    user_id: '上面获取的_id'
  })
  .get()
```

---

## 📱 快速访问链接

**CloudBase 控制台直达：**
https://console.cloud.tencent.com/tcb/env/index?envId=cloudbase-1gnip2iaa08260e5

**数据库管理直达：**
https://console.cloud.tencent.com/tcb/db/index?envId=cloudbase-1gnip2iaa08260e5

---

## 🚨 注意事项

1. **不要在生产环境随意删除数据**
   - 建议先导出备份
   - 或者创建测试环境

2. **权限问题**
   - 如果无法访问，可能需要主账号授权
   - 检查子账号是否有 CloudBase 的读取权限

3. **时区问题**
   - 数据库中的时间是 UTC 时间
   - 转换为北京时间需要 +8 小时

4. **数据刷新**
   - 控制台数据可能有缓存
   - 点击刷新按钮确保看到最新数据

---

## 🛠️ 调试技巧

### 查看完整的数据写入日志

在代码中已经添加了详细日志，可以在服务端查看：

1. 打开浏览器开发者工具
2. 进行收藏操作
3. 查看 Network 标签中的 API 调用
4. 检查 `/api/favorites-cn` 的请求和响应

### 后端日志

如果部署在 Vercel，可以查看 Function Logs：
https://vercel.com/your-project/logs

搜索关键字：
- `[Favorites-CN POST] Adding favorite`
- `[Favorites-CN GET] Found`

---

## 📞 如有问题

如果遇到访问问题，可能需要：
1. 确认主账号登录
2. 检查环境ID是否正确
3. 确认是否有数据库查看权限

需要帮助时提供：
- 错误截图
- 使用的腾讯云账号
- 访问的具体步骤
