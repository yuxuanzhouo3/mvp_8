# iOS 自动构建配置指南

本指南将帮助你配置 GitHub Actions 自动构建 iOS 应用。

## 📋 前置要求

### 必须拥有：
1. ✅ **Apple Developer 账号**（$99/年）
   - 注册地址：https://developer.apple.com/programs/
2. ✅ **Mac 电脑**（用于生成证书和配置文件）
3. ✅ **Xcode**（从 App Store 免费下载）

### 不需要：
- ❌ 不需要付费的 CI/CD 服务
- ❌ 不需要额外的构建工具

---

## 第一步：创建 App ID

1. 访问 [Apple Developer Center](https://developer.apple.com/account/resources/identifiers/list)
2. 点击 **"+"** 创建新的 Identifier
3. 选择 **"App IDs"** → **"App"**
4. 填写信息：
   - **Description**: MornHub
   - **Bundle ID**: `com.sitehub.app`（必须与 capacitor.config.json 中的 appId 一致）
   - **Capabilities**: 不需要选择任何特殊能力
5. 点击 **"Continue"** → **"Register"**

---

## 第二步：创建分发证书 (Distribution Certificate)

### 在你的 Mac 上：

1. 打开 **"钥匙串访问"** (Keychain Access)
2. 菜单栏：**钥匙串访问** → **证书助理** → **从证书颁发机构请求证书**
3. 填写信息：
   - **用户电子邮件地址**: 你的 Apple ID 邮箱
   - **常用名称**: 你的名字或公司名
   - **CA 电子邮件地址**: 留空
   - 选择 **"存储到磁盘"**
4. 保存为 `CertificateSigningRequest.certSigningRequest`

### 在 Apple Developer 网站：

1. 访问 [Certificates](https://developer.apple.com/account/resources/certificates/list)
2. 点击 **"+"** 创建新证书
3. 选择 **"Apple Distribution"**（用于 App Store 发布）
4. 上传刚才保存的 `CertificateSigningRequest.certSigningRequest`
5. 下载证书文件 `distribution.cer`

### 导入证书到钥匙串：

1. 双击 `distribution.cer` 导入到钥匙串
2. 在 **"钥匙串访问"** 中找到这个证书
3. 右键证书 → **"导出..."**
4. 文件格式选择 **"个人信息交换 (.p12)"**
5. 设置密码（记住这个密码！）
6. 保存为 `Certificates.p12`

---

## 第三步：创建 Provisioning Profile

1. 访问 [Profiles](https://developer.apple.com/account/resources/profiles/list)
2. 点击 **"+"** 创建新的 Profile
3. 选择 **"App Store"**
4. **App ID**: 选择刚才创建的 `com.sitehub.app`
5. **Certificate**: 选择刚才创建的 Distribution 证书
6. **Profile Name**: `MornHub App Store`
7. 下载 `MornHub_App_Store.mobileprovision`

---

## 第四步：配置 GitHub Secrets

现在需要把证书和配置文件上传到 GitHub Secrets（加密存储）。

### 1. 转换文件为 Base64

在 Mac 终端执行以下命令：

```bash
# 转换 P12 证书
base64 -i Certificates.p12 | pbcopy
# 现在 Base64 字符串已复制到剪贴板
```

去 GitHub 仓库设置：
- **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
- **Name**: `APPLE_CERTIFICATE`
- **Value**: 粘贴刚才复制的 Base64 字符串

```bash
# 转换 Provisioning Profile
base64 -i MornHub_App_Store.mobileprovision | pbcopy
```

创建新 Secret：
- **Name**: `APPLE_PROVISIONING_PROFILE`
- **Value**: 粘贴 Base64 字符串

### 2. 设置证书密码

创建新 Secret：
- **Name**: `APPLE_CERTIFICATE_PASSWORD`
- **Value**: 你在导出 P12 时设置的密码

### 3. 设置 Keychain 密码

创建新 Secret：
- **Name**: `KEYCHAIN_PASSWORD`
- **Value**: 随便设置一个强密码（只用于 GitHub Actions 临时 keychain）

### 4. 更新 ExportOptions.plist

编辑 `desktop-apps/ios-capacitor/ios/App/ExportOptions.plist`：

```xml
<key>teamID</key>
<string>YOUR_TEAM_ID</string>  <!-- 替换为你的 Team ID -->
```

**如何找到 Team ID？**
- 访问 https://developer.apple.com/account/
- 点击右上角你的名字
- **Team ID** 显示在页面中（10个字符，如 `AB12CD34EF`）

```xml
<key>provisioningProfiles</key>
<dict>
    <key>com.sitehub.app</key>
    <string>MornHub App Store</string>  <!-- 替换为你的 Profile 名称 -->
</dict>
```

---

## 第五步：测试构建

### 方式1：推送代码触发自动构建

```bash
git add .
git commit -m "feat: 配置iOS自动构建"
git push origin main
```

### 方式2：手动触发构建

1. 访问 GitHub 仓库的 **Actions** 标签
2. 选择 **"🚀 四端自动构建"** workflow
3. 点击 **"Run workflow"**
4. 选择平台：**"ios"** 或 **"all"**
5. 点击绿色的 **"Run workflow"** 按钮

---

## 第六步：下载 IPA 文件

构建成功后：

1. 进入 GitHub Actions 页面
2. 找到最新的成功构建
3. 滚动到底部 **"Artifacts"** 区域
4. 下载 **"SiteHub-iOS"** 压缩包
5. 解压得到 `.ipa` 文件

---

## 第七步：上传到 App Store

### 使用 Xcode：

1. 打开 Xcode
2. 菜单栏：**Window** → **Organizer**
3. 拖拽 `.ipa` 文件到 Organizer
4. 点击 **"Distribute App"**
5. 选择 **"App Store Connect"**
6. 按照向导完成上传

### 使用命令行：

```bash
xcrun altool --upload-app -f MornHub.ipa \
  --type ios \
  --apiKey YOUR_API_KEY \
  --apiIssuer YOUR_ISSUER_ID
```

---

## 常见问题

### Q: 构建失败，提示 "Code signing is required"
**A**: 检查 GitHub Secrets 是否正确配置，特别是 `APPLE_CERTIFICATE` 和 `APPLE_PROVISIONING_PROFILE`。

### Q: 提示 "Provisioning profile doesn't include the application-identifier"
**A**: 确保 `ExportOptions.plist` 中的 Bundle ID 与 Provisioning Profile 匹配。

### Q: 如何更新证书？
**A**: 证书过期后，重新执行第二步和第四步，更新 GitHub Secrets 中的 `APPLE_CERTIFICATE`。

### Q: 不想使用 App Store，只想内部测试？
**A**: 修改 `ExportOptions.plist` 中的 `method` 为 `ad-hoc` 或 `enterprise`，并使用对应类型的 Provisioning Profile。

---

## 文件清单

完成配置后，应该有以下文件（**不要提交到 Git！**）：

- ✅ `Certificates.p12` (本地保管，不上传)
- ✅ `MornHub_App_Store.mobileprovision` (本地保管，不上传)
- ✅ GitHub Secrets 已配置 4 个 Secrets

提交到 Git 的文件：

- ✅ `desktop-apps/ios-capacitor/ios/App/ExportOptions.plist` (已脱敏，可提交)
- ✅ `.github/workflows/build-all-platforms.yml` (已配置 iOS 构建)

---

## 安全提示

⚠️ **绝对不要**把以下内容提交到 Git：
- ❌ `.p12` 证书文件
- ❌ `.mobileprovision` 配置文件
- ❌ 证书密码
- ❌ API Keys

✅ **应该使用** GitHub Secrets 安全存储这些敏感信息。

---

## 需要帮助？

如果遇到问题，可以：
1. 查看 GitHub Actions 构建日志
2. 参考 [Apple 官方文档](https://developer.apple.com/documentation/)
3. 联系技术支持

---

**配置完成后，每次推送代码都会自动构建 iOS 应用！** 🎉
