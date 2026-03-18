# SiteHub 订阅管理后台

## 功能概述

这是一个基于 Next.js 的订阅管理后台，用于管理 SiteHub 的订阅、用户和财务数据。

## 主要功能

### 1. 订阅管理
- 查看所有用户订阅
- 搜索和筛选订阅
- 手动取消/激活订阅
- 强制续费
- 导出订阅数据

### 2. 用户管理
- 用户列表和详情
- Pro状态管理
- 使用统计
- 用户行为分析

### 3. 财务统计
- 收入统计
- 订阅统计
- 退款统计
- 财务报表

### 4. 系统设置
- 价格配置
- 自动续费设置
- 通知设置
- 系统维护

## 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS, Shadcn/ui
- **状态管理**: Zustand
- **数据获取**: TanStack Query
- **图表**: Recharts
- **认证**: NextAuth.js
- **数据库**: 微信云数据库 + Supabase

## 项目结构

```
admin-backend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── dashboard/       # 仪表板
│   │   ├── subscriptions/   # 订阅管理
│   │   ├── users/          # 用户管理
│   │   ├── analytics/      # 数据分析
│   │   └── settings/       # 系统设置
│   ├── components/         # 可复用组件
│   │   ├── ui/            # 基础UI组件
│   │   ├── charts/        # 图表组件
│   │   └── forms/         # 表单组件
│   ├── lib/               # 工具库
│   │   ├── auth.ts        # 认证配置
│   │   ├── db.ts          # 数据库连接
│   │   └── utils.ts       # 工具函数
│   ├── hooks/             # 自定义Hooks
│   ├── store/             # 状态管理
│   └── types/             # TypeScript类型
├── public/                # 静态资源
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## 环境配置

### 1. 环境变量

创建 `.env.local` 文件：

```bash
# 数据库配置
WECHAT_CLOUD_ENV_ID=your_wechat_cloud_env_id
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 认证配置
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# 微信支付配置
WECHAT_PAY_MCH_ID=your_mch_id
WECHAT_PAY_API_KEY=your_api_key
WECHAT_PAY_CERT_PATH=path_to_cert
WECHAT_PAY_KEY_PATH=path_to_key

# 邮件配置（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

### 2. 安装依赖

```bash
npm install
# 或
yarn install
```

### 3. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

## 部署

### 1. Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### 2. Docker 部署

```bash
# 构建镜像
docker build -t sitehub-admin .

# 运行容器
docker run -p 3000:3000 --env-file .env.local sitehub-admin
```

## API 接口

### 订阅管理 API

```typescript
// 获取订阅列表
GET /api/subscriptions?page=1&limit=20&status=active&planType=personal

// 获取订阅详情
GET /api/subscriptions/[id]

// 更新订阅状态
PUT /api/subscriptions/[id]
{
  "status": "cancelled",
  "cancelAtPeriodEnd": true
}

// 强制续费
POST /api/subscriptions/[id]/renew
```

### 用户管理 API

```typescript
// 获取用户列表
GET /api/users?page=1&limit=20&isPro=true

// 获取用户详情
GET /api/users/[id]

// 更新用户状态
PUT /api/users/[id]
{
  "isPro": true,
  "proExpiresAt": "2025-12-31T23:59:59Z"
}
```

### 财务统计 API

```typescript
// 获取收入统计
GET /api/analytics/revenue?startDate=2025-01-01&endDate=2025-12-31

// 获取订阅统计
GET /api/analytics/subscriptions?period=monthly

// 获取退款统计
GET /api/analytics/refunds?startDate=2025-01-01&endDate=2025-12-31
```

## 权限控制

### 1. 角色定义

- **超级管理员**: 所有权限
- **财务管理员**: 财务统计和订阅管理
- **客服管理员**: 用户管理和客服功能
- **只读管理员**: 仅查看权限

### 2. 权限配置

```typescript
const permissions = {
  SUPER_ADMIN: ['*'],
  FINANCE_ADMIN: ['subscriptions:read', 'subscriptions:write', 'analytics:read'],
  SUPPORT_ADMIN: ['users:read', 'users:write', 'subscriptions:read'],
  READONLY_ADMIN: ['*:read']
}
```

## 监控和日志

### 1. 错误监控

使用 Sentry 进行错误监控：

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

### 2. 性能监控

使用 Vercel Analytics 或自定义监控：

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function App() {
  return (
    <>
      <Component />
      <Analytics />
    </>
  )
}
```

## 安全措施

### 1. 认证安全

- JWT Token 认证
- 刷新 Token 机制
- 多因素认证（可选）

### 2. API 安全

- Rate Limiting
- CORS 配置
- 输入验证和清理
- SQL 注入防护

### 3. 数据安全

- 敏感数据加密
- 定期数据备份
- 访问日志记录

## 开发指南

### 1. 代码规范

- 使用 ESLint 和 Prettier
- TypeScript 严格模式
- 组件命名规范
- 文件结构规范

### 2. 测试

```bash
# 运行测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e
```

### 3. 提交规范

使用 Conventional Commits：

```
feat: 添加新的订阅管理功能
fix: 修复支付回调处理问题
docs: 更新API文档
style: 调整UI样式
refactor: 重构订阅状态管理
test: 添加订阅功能测试
```

## 常见问题

### 1. 数据库连接问题

确保环境变量正确配置，特别是微信云数据库的环境ID。

### 2. 认证问题

检查 NextAuth.js 配置和密钥设置。

### 3. 支付回调问题

确保微信支付回调URL正确配置，并且服务器可以接收回调请求。

## 更新日志

### v1.0.0 (2025-01-11)
- 初始版本发布
- 基础订阅管理功能
- 用户管理功能
- 财务统计功能

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License






