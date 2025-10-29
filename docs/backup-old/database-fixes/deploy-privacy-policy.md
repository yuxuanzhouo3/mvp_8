# 🔒 Privacy Policy Deployment Guide

## ✅ **Privacy Policy Page Created**

我已经为您创建了一个完整的隐私政策页面，位于 `app/privacy/page.tsx`。

## 🚀 **部署步骤**

### **方法1：使用 Vercel 部署（推荐）**

1. **确保代码已提交到 Git**
```bash
git add .
git commit -m "Add privacy policy page"
git push
```

2. **在 Vercel 上部署**
- 访问 [vercel.com](https://vercel.com)
- 连接您的 GitHub 仓库
- 设置自定义域名：`mornhub.help`
- 部署完成后，隐私政策页面将在 `https://mornhub.help/privacy` 可用

### **方法2：使用 Netlify 部署**

1. **构建项目**
```bash
npm run build
```

2. **在 Netlify 上部署**
- 访问 [netlify.com](https://netlify.com)
- 拖拽 `out` 文件夹或连接 Git 仓库
- 设置自定义域名：`mornhub.help`

### **方法3：使用传统服务器部署**

1. **构建项目**
```bash
npm run build
npm run export
```

2. **上传到服务器**
- 将 `out` 文件夹内容上传到您的服务器
- 配置 Nginx 或 Apache 指向 `mornhub.help`

## 🔗 **微信开放平台配置**

部署完成后，在微信开放平台填写：

**隐私权政策网址：**
```
https://mornhub.help/privacy
```

## 📋 **隐私政策内容概览**

创建的隐私政策包含以下重要部分：

1. **信息收集** - 说明收集哪些数据
2. **数据使用** - 如何使用收集的数据
3. **数据保护** - 安全措施
4. **数据共享** - 不会出售用户数据
5. **用户权利** - 用户可以做什么
6. **第三方服务** - Supabase、微信、Google
7. **数据保留** - 数据保存时间
8. **儿童隐私** - 13岁以下用户
9. **政策变更** - 如何通知变更
10. **联系方式** - 如何联系

## 🎯 **测试验证**

部署后，访问以下URL验证：
- ✅ `https://mornhub.help/privacy` - 隐私政策页面
- ✅ 页面加载正常
- ✅ 内容完整且专业
- ✅ 符合微信开放平台要求

## 🔧 **自定义修改**

如果需要修改隐私政策内容：

1. 编辑 `app/privacy/page.tsx`
2. 修改联系信息、公司地址等
3. 重新部署

## 📞 **需要帮助？**

如果部署过程中遇到问题：
1. 检查域名 DNS 设置
2. 确认 SSL 证书有效
3. 验证页面可以正常访问

隐私政策页面已经创建完成，现在您可以在微信开放平台填写 `https://mornhub.help/privacy` 作为隐私权政策网址了！ 