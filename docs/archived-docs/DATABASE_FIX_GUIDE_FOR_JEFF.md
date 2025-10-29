# 数据库修复指南 - Jeff专用

## 问题诊断报告

### 🔴 核心问题
用户反馈：**登出后再登录，收藏和自定义网站数据丢失**

### 🔍 根本原因

经过深度分析，发现了**三个严重的数据库结构问题**：

#### 问题1：`web_favorites` 表字段缺失
```sql
-- 当前数据库只有这些字段：
web_favorites: (id, user_id, site_id, created_at)

-- 但代码中需要查询：
site_name, site_url, site_icon, site_category ❌ 缺失！
```

#### 问题2：`custom_websites` 表不存在
```sql
-- 数据库中的表名：
web_custom_sites ✅ 存在

-- 代码中查询的表名：
custom_websites ❌ 不存在！
```

#### 问题3：字段名不一致
```typescript
// 代码中使用：
icon: website.icon

// SQL表中定义：
logo TEXT  // 字段名不匹配
```

---

## ✅ 修复方案

### 执行步骤

#### 第1步：登录Supabase控制台
1. 访问 https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧菜单 **SQL Editor**

#### 第2步：执行修复脚本
1. 打开文件：`scripts/fix-database-tables.sql`
2. 复制所有内容
3. 粘贴到Supabase SQL Editor
4. 点击 **Run** 按钮执行

#### 第3步：验证修复结果
执行后会看到类似输出：
```
✅ 数据库修复完成！

检查结果：
  - web_favorites 新增字段数: 4
    ✅ web_favorites 表结构正确
    ✅ custom_websites 表已创建
```

#### 第4步：（可选）运行验证脚本
如果想要详细的检查报告，可以执行验证脚本：
1. 打开文件：`scripts/verify-database-fix.sql`
2. 复制所有内容
3. 粘贴到Supabase SQL Editor
4. 点击 **Run**

你会看到完整的检查报告：
```
📊 数据库状态检查报告

【1】检查 web_favorites 表
  ✅ 表结构正确，包含所有必需字段
  📊 当前数据量: X 条

【2】检查 custom_websites 表
  ✅ 表已创建
  📊 当前数据量: X 条

【3】检查旧表 web_custom_sites
  ✅ 数据已迁移到新表
     迁移完整度: 100%

【4】检查 RLS 安全策略
  ✅ custom_websites RLS 策略已启用
  ✅ web_favorites RLS 策略已启用

✅ 数据库修复成功！
```

---

## 🧪 测试验证

### 测试场景1：收藏功能
1. 登录账号
2. 点击任意网站的收藏按钮（⭐）
3. 刷新页面 → 收藏应该保留 ✅
4. **登出再登录** → 收藏应该保留 ✅

### 测试场景2：自定义网站
1. 登录账号
2. 点击"添加自定义网站"
3. 输入名称、URL，点击保存
4. 刷新页面 → 自定义网站应该保留 ✅
5. **登出再登录** → 自定义网站应该保留 ✅

### 测试场景3：批量解析链接
1. 登录账号
2. 打开"智能解析链接"弹窗
3. 粘贴包含URL的文本，批量添加
4. **登出再登录** → 批量添加的网站应该保留 ✅

---

## 🔧 修复内容详解

### 1. 修复 `web_favorites` 表
```sql
ALTER TABLE web_favorites
ADD COLUMN site_name TEXT NOT NULL DEFAULT '',
ADD COLUMN site_url TEXT NOT NULL DEFAULT '',
ADD COLUMN site_icon TEXT,
ADD COLUMN site_category TEXT;
```

**作用**：添加缺失的4个字段，使代码能正常保存和查询收藏数据

### 2. 创建 `custom_websites` 表
```sql
CREATE TABLE custom_websites (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT DEFAULT '🌐',  -- 注意：使用icon而非logo
  category TEXT DEFAULT 'tools',
  is_favorite BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**作用**：创建代码实际使用的表，字段名与代码完全匹配

### 3. 自动数据迁移
```sql
-- 如果旧表web_custom_sites存在，自动迁移数据
INSERT INTO custom_websites (...)
SELECT id, user_id, name, url, logo AS icon, ...
FROM web_custom_sites;
```

**作用**：保留现有数据，防止数据丢失

### 4. 设置RLS安全策略
```sql
-- 确保用户只能访问自己的数据
CREATE POLICY "Users can view own custom sites"
  ON custom_websites FOR SELECT
  USING (auth.uid() = user_id);
```

**作用**：数据安全隔离，用户A看不到用户B的数据

---

## ⚠️ 常见问题

### Q1：执行SQL报错 "permission denied"
**原因**：账号权限不足
**解决**：使用项目Owner账号执行，或在Project Settings中检查数据库权限

### Q2：执行SQL时报错 "column user_id is of type uuid but expression is of type text"
**原因**：旧表`web_custom_sites`的`user_id`字段类型不一致
**解决**：脚本已包含自动类型检测和转换逻辑，会自动处理这个问题
**验证**：执行后查看输出信息，应该看到：
```
检测到旧表 web_custom_sites
  - 数据总数: X
  - user_id 类型: text (或 uuid)
✅ 已迁移 X / X 条数据
```

### Q3：执行后数据还是丢失
**检查清单**：
1. 打开Supabase控制台 → Table Editor
2. 确认 `web_favorites` 表中有新字段：`site_name`, `site_url`, `site_icon`, `site_category`
3. 确认 `custom_websites` 表存在
4. 尝试手动插入一条数据测试：
```sql
INSERT INTO custom_websites (user_id, name, url, icon)
VALUES ('你的user_id', '测试网站', 'https://example.com', '🌐');
```

### Q4：旧数据如何处理？
**自动处理**：脚本会自动从 `web_custom_sites` 迁移数据到 `custom_websites`
**手动检查**：
```sql
-- 查看旧表数据量
SELECT COUNT(*) FROM web_custom_sites;

-- 查看新表数据量
SELECT COUNT(*) FROM custom_websites;

-- 两者应该相等
```

---

## 📊 数据库最终结构

### `web_favorites` 表（收藏）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID（外键） |
| site_id | TEXT | 网站ID |
| site_name | TEXT | 网站名称 ✅ 新增 |
| site_url | TEXT | 网站URL ✅ 新增 |
| site_icon | TEXT | 网站图标 ✅ 新增 |
| site_category | TEXT | 分类 ✅ 新增 |
| created_at | TIMESTAMPTZ | 创建时间 |

### `custom_websites` 表（自定义网站）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID（外键） |
| name | TEXT | 网站名称 |
| url | TEXT | 网站URL |
| icon | TEXT | 图标（注意不是logo） |
| category | TEXT | 分类 |
| is_favorite | BOOLEAN | 是否收藏 |
| sort_order | INTEGER | 排序 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

---

## 🎯 修复后的效果

### 修复前
- ❌ 添加收藏后刷新页面 → 数据丢失
- ❌ 添加自定义网站 → 保存失败
- ❌ 登出再登录 → 所有数据清空

### 修复后
- ✅ 收藏数据持久化到数据库
- ✅ 自定义网站保存成功
- ✅ 登出再登录，数据完整保留
- ✅ 用户数据安全隔离（RLS）

---

## 📞 技术支持

如果执行过程中遇到问题：
1. 截图错误信息
2. 提供Supabase项目ID
3. 说明具体操作步骤

需要检查的环境变量：
```env
NEXT_PUBLIC_SUPABASE_URL=你的Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Anon Key
```

---

**执行建议**：
- ⏰ 建议在**低峰时段**执行（如凌晨）
- 💾 执行前可先在Supabase Dashboard中导出现有数据备份
- 🧪 执行后立即进行完整的功能测试

修复愉快！有问题随时联系 🚀
