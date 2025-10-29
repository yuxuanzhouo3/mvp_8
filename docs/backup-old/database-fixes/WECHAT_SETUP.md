# WeChat登录设置指南

本指南将帮助你在SiteHub应用中设置WeChat登录功能。

## 🚀 快速开始

### 1. 注册微信开放平台应用

#### 步骤1: 创建微信应用
1. 访问 [微信开放平台](https://open.weixin.qq.com/)
2. 注册开发者账号（需要企业认证）
3. 创建新应用
4. 选择应用类型：**网页应用**

#### 步骤2: 获取应用凭证
1. 在应用详情页面获取：
   - **AppID** (应用ID)
   - **AppSecret** (应用密钥)

#### 步骤3: 配置授权回调域名
1. 在应用设置中添加授权回调域名：
   ```
   localhost (开发环境)
   your-domain.com (生产环境)
   ```

### 2. 配置环境变量

创建 `.env.local` 文件并添加以下配置：

```env
# WeChat OAuth Configuration
NEXT_PUBLIC_WECHAT_APP_ID=你的微信AppID
WECHAT_APP_SECRET=你的微信AppSecret

# Site URL for OAuth redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. 安装依赖

项目已经安装了 `wechat-oauth` 包：

```bash
pnpm add wechat-oauth@1.5.0
```

### 4. 测试WeChat登录

1. 启动开发服务器：
   ```bash
   pnpm dev
   ```

2. 访问应用并点击 "Continue with WeChat" 按钮

3. 你应该会被重定向到微信授权页面

4. 授权后，你会被重定向回应用并自动登录

## 🔧 故障排除

### 常见问题：

1. **"App not verified" (应用未验证)**
   - 微信应用需要验证才能在生产环境使用
   - 开发阶段可以使用测试账号

2. **"Invalid redirect URI" (无效的重定向URI)**
   - 确保回调域名在微信应用设置中正确配置
   - 检查 `NEXT_PUBLIC_SITE_URL` 环境变量

3. **"App ID not found" (找不到App ID)**
   - 检查环境变量是否正确设置
   - 确保 `NEXT_PUBLIC_WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 已配置

4. **"OAuth failed" (OAuth失败)**
   - 检查网络连接
   - 查看服务器日志获取详细错误信息

### 开发环境设置：

1. **使用测试账号**：
   - 在微信开放平台添加测试用户
   - 使用测试账号进行授权测试

2. **本地开发**：
   - 确保 `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
   - 在微信应用设置中添加 `localhost` 到授权域名

### 生产环境部署：

1. **域名配置**：
   - 更新 `NEXT_PUBLIC_SITE_URL` 为生产域名
   - 在微信应用设置中添加生产域名

2. **应用验证**：
   - 提交应用进行微信官方验证
   - 验证通过后可以正式上线

## 📱 微信登录流程

1. 用户点击 "Continue with WeChat" 按钮
2. 应用重定向到微信授权页面
3. 用户在微信中授权
4. 微信重定向回应用的回调地址
5. 应用获取用户信息并创建/登录用户
6. 用户被重定向到仪表板

## 🔒 安全注意事项

1. **环境变量**：不要将 `WECHAT_APP_SECRET` 提交到版本控制
2. **HTTPS**：生产环境必须使用HTTPS
3. **状态验证**：验证OAuth状态参数防止CSRF攻击
4. **错误处理**：实现适当的错误处理和用户反馈

## 📚 相关资源

- [微信开放平台文档](https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1419316505&token=&lang=zh_CN)
- [wechat-oauth npm包](https://www.npmjs.com/package/wechat-oauth)
- [Supabase Auth文档](https://supabase.com/docs/guides/auth) 