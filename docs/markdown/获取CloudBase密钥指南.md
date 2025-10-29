# 🔑 获取 CloudBase API 密钥指南

## 问题
当前 API 测试失败，错误信息：
```
{"success":false,"message":"secret id error 请前往云开发AI小助手查看问题：https://tcb.cloud.tencent.com/dev#/helper/copilot?q=SIGN_PARAM_INVALID"}
```

原因是缺少 CloudBase 的 `CLOUDBASE_SECRET_ID` 和 `CLOUDBASE_SECRET_KEY`。

---

## 📍 获取密钥的步骤

### 1. 登录腾讯云控制台
打开网址：https://console.cloud.tencent.com/tcb

### 2. 进入环境设置
1. 在左侧菜单找到 **"设置"**
2. 点击 **"环境设置"**
3. 找到 **"环境密钥"** 部分

### 3. 查看或创建密钥
你需要获取以下信息：
- **SecretId**：格式为 `AKID...`（20多个字符）
- **SecretKey**：长字符串（32个字符以上）

**⚠️ 重要提示：**
- SecretKey 可能会被隐藏显示，需要点击"显示"才能看到
- 如果还没有密钥，点击"新建密钥"来创建
- SecretKey 只显示一次，**请立即保存到安全的地方！**

---

## 🔧 配置到项目

### 方法1：添加到 .env.local 文件

打开项目根目录的 `.env.local` 文件，添加以下两行：

```bash
# CloudBase API Keys (for server-side authentication)
CLOUDBASE_SECRET_ID=你的SecretId
CLOUDBASE_SECRET_KEY=你的SecretKey
```

**完整示例：**
```bash
# 腾讯云CloudBase配置（国内用户认证）
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=cloudbase-1gnip2iaa08260e5

# CloudBase API Keys
CLOUDBASE_SECRET_ID=AKIDxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDBASE_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 方法2：使用新的环境变量名称（可选）

也可以使用 `TENCENT_` 前缀的变量名：

```bash
TENCENT_ENV_ID=cloudbase-1gnip2iaa08260e5
TENCENT_SECRET_ID=AKIDxxxxxxxxxxxxxxxxxxxxxxxxxx
TENCENT_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🧪 测试 API

配置完成后，需要重启开发服务器：

```bash
# 停止当前服务器（按 Ctrl+C）
# 然后重新启动
npm run dev
```

然后运行测试：

```bash
# 测试注册
curl -X POST http://localhost:3000/api/auth-cn \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123456", "action": "signup"}'
```

预期响应：
```json
{
  "success": true,
  "message": "注册成功",
  "user": {
    "id": "xxx",
    "email": "test@example.com",
    "name": "test",
    "pro": false,
    "region": "china"
  }
}
```

---

## 🔒 安全提示

1. **不要提交到 Git**
   - `.env.local` 文件已经在 `.gitignore` 中
   - 永远不要把这些密钥提交到代码仓库

2. **生产环境配置**
   - 在生产环境（Vercel/腾讯云）中也要配置这些变量
   - 在部署平台的环境变量设置中添加

3. **密钥泄露处理**
   - 如果怀疑密钥泄露，立即在腾讯云控制台重新生成密钥
   - 重新配置所有环境中的密钥

---

## ❓ 常见问题

### Q: 找不到"环境密钥"选项？
A: 确保你已经创建了云开发环境。如果没有，先创建一个环境。

### Q: SecretKey 显示为星号 ***？
A: 点击旁边的"显示"或"查看"按钮来显示完整密钥。

### Q: 仍然报错 "secret id error"？
A: 
1. 检查密钥是否正确复制（没有多余空格）
2. 确认密钥的权限是否包含云开发访问权限
3. 重启开发服务器
4. 检查 `.env.local` 文件格式是否正确

### Q: 如何测试连接？
A: 使用项目根目录的测试脚本：
```bash
node test-cloudbase-connection.js
```

---

## 📞 获取帮助

如果遇到问题：
1. 查看腾讯云文档：https://cloud.tencent.com/document/product/876
2. 联系开发团队获取技术支持

---

## ✅ 完成检查清单

- [ ] 登录腾讯云控制台
- [ ] 进入云开发环境设置
- [ ] 找到环境密钥部分
- [ ] 获取 SecretId 和 SecretKey
- [ ] 添加到 `.env.local` 文件
- [ ] 重启开发服务器
- [ ] 运行测试命令
- [ ] 确认返回成功响应

完成后，你的 API 就可以正常工作了！🎉



