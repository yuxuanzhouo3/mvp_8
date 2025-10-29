# Facebook域名配置指南

这个指南将帮助你解决Facebook应用域名配置问题。

## 🚨 问题描述

错误信息：**"无法加载网址 - 这个URL的网域未包含应用的网域"**

这个错误表明Facebook应用设置中的域名配置不完整。

## 🔧 解决方案

### 1. 登录Facebook开发者控制台

1. 访问 [Facebook Developers](https://developers.facebook.com/)
2. 选择你的应用
3. 进入应用设置

### 2. 配置应用域名

#### 步骤1: 基本设置
1. 点击左侧菜单 **"设置"** → **"基本"**
2. 在 **"应用域名"** 字段中添加：
   ```
   mornhub.help
   ```

#### 步骤2: 添加隐私政策URL
1. 在 **"隐私政策URL"** 字段中添加：
   ```
   https://mornhub.help/privacy
   ```

#### 步骤3: 添加服务条款URL（可选）
1. 在 **"服务条款URL"** 字段中添加：
   ```
   https://mornhub.help/terms
   ```

### 3. 配置Facebook登录设置

#### 步骤1: 产品设置
1. 点击左侧菜单 **"产品"** → **"Facebook登录"**
2. 点击 **"设置"**

#### 步骤2: 客户端OAuth设置
1. 在 **"有效的OAuth重定向URI"** 中添加：
   ```
   https://mornhub.help/auth/callback
   http://localhost:3000/auth/callback
   ```

#### 步骤3: 应用网域
1. 在 **"应用网域"** 字段中添加：
   ```
   mornhub.help
   ```

### 4. 开发环境配置

#### 本地开发设置
1. 在 **"应用网域"** 中添加：
   ```
   localhost
   ```

2. 在 **"有效的OAuth重定向URI"** 中添加：
   ```
   http://localhost:3000/auth/callback
   ```

### 5. 生产环境配置

#### 域名验证
1. 确保你的域名 `mornhub.help` 已经正确配置DNS
2. 确保HTTPS证书有效
3. 确保隐私政策页面可以访问

#### 应用状态
1. 如果应用处于开发模式，添加测试用户
2. 如果要上线，提交应用进行审核

## 📋 检查清单

### 基本设置
- [ ] 应用域名：`mornhub.help`
- [ ] 隐私政策URL：`https://mornhub.help/privacy`
- [ ] 服务条款URL：`https://mornhub.help/terms`（可选）

### Facebook登录设置
- [ ] 应用网域：`mornhub.help`
- [ ] 有效的OAuth重定向URI：
  - `https://mornhub.help/auth/callback`
  - `http://localhost:3000/auth/callback`

### 开发环境
- [ ] 应用网域包含：`localhost`
- [ ] 测试用户已添加（如果应用在开发模式）

### 生产环境
- [ ] 域名DNS配置正确
- [ ] HTTPS证书有效
- [ ] 隐私政策页面可访问
- [ ] 应用已提交审核（如果要上线）

## 🔍 验证步骤

### 1. 测试域名配置
1. 访问 `https://mornhub.help/privacy`
2. 确保页面正常加载
3. 检查页面内容是否符合Facebook要求

### 2. 测试OAuth流程
1. 启动开发服务器：`pnpm dev`
2. 点击 "Continue with Facebook" 按钮
3. 应该能正常重定向到Facebook授权页面

### 3. 检查错误日志
如果仍有问题，检查：
- Facebook应用控制台的错误日志
- 浏览器开发者工具的网络请求
- 应用服务器的日志

## 🚀 快速修复

### 立即可以做的：
1. **添加隐私政策页面** ✅ (已完成)
2. **配置应用域名** - 在Facebook开发者控制台添加 `mornhub.help`
3. **配置OAuth重定向URI** - 添加 `https://mornhub.help/auth/callback`

### 需要验证的：
1. **域名可访问性** - 确保 `mornhub.help` 可以正常访问
2. **HTTPS证书** - 确保有有效的SSL证书
3. **隐私政策内容** - 确保内容符合Facebook要求

## 📞 获取帮助

如果问题仍然存在：

1. **检查Facebook开发者文档**：
   - [Facebook登录文档](https://developers.facebook.com/docs/facebook-login/)
   - [应用设置指南](https://developers.facebook.com/docs/apps/manage-apps/)

2. **联系Facebook支持**：
   - 在Facebook开发者控制台提交问题
   - 提供详细的错误信息和配置截图

3. **检查应用状态**：
   - 确保应用没有被限制
   - 检查是否有未解决的审核问题 