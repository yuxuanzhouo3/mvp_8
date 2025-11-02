# iOS 证书配置指南

## 概述

本文档指导如何为 MornHub iOS 应用生成和配置 Apple Developer 证书，以便在 GitHub Actions 中自动构建 iOS 安装包（IPA）。

**App Bundle ID**: `com.sitehub.app`

---

## 方案选择

### 方案 A：Jeff 自己操作（推荐，最安全）

**优势**：
- ✅ 账号信息不会泄露
- ✅ 完全控制证书访问权限
- ✅ 符合安全最佳实践

**步骤**：按照下面的"详细操作步骤"执行

---

### 方案 B：临时共享账号

**仅在必要时使用**，操作流程：
1. Jeff 提供 Apple Developer 账号和密码
2. 技术人员登录生成证书（20分钟内完成）
3. 立即修改密码并还给 Jeff
4. **不会保存任何账号信息到代码或 GitHub**

---

## 详细操作步骤（方案 A）

### 第一步：登录 Apple Developer

1. 打开 [Apple Developer 账户页面](https://developer.apple.com/account/)
2. 使用 Apple ID 登录
3. 进入 **Certificates, Identifiers & Profiles** 页面

---

### 第二步：注册 App ID（如果还没有）

1. 点击左侧 **Identifiers** → 点击 **+** 按钮
2. 选择 **App IDs** → 点击 **Continue**
3. 选择 **App** → 点击 **Continue**
4. 填写信息：
   - **Description**: MornHub iOS App
   - **Bundle ID**: 选择 **Explicit**，填写 `com.sitehub.app`
   - **Capabilities**: 默认即可（可以后续添加）
5. 点击 **Continue** → 点击 **Register**

---

### 第三步：创建证书（Certificate）

#### 3.1 生成证书签名请求（CSR）

**在 Mac 上操作**：

1. 打开 **钥匙串访问** (Keychain Access)
2. 菜单栏选择：**钥匙串访问** → **证书助理** → **从证书颁发机构请求证书**
3. 填写信息：
   - **用户电子邮件地址**：填写您的邮箱
   - **常用名称**：填写 `MornHub iOS Distribution`
   - **CA 电子邮件地址**：留空
   - **请求是**：选择 **存储到磁盘**
4. 点击 **继续**，保存为 `CertificateSigningRequest.certSigningRequest`

#### 3.2 在 Apple Developer 创建证书

1. 回到 [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/certificates/list)
2. 点击 **Certificates** → 点击 **+** 按钮
3. 选择证书类型：
   - **选择 iOS Distribution (App Store and Ad Hoc)** ← 用于发布
   - 或者选择 **iOS App Development** ← 仅用于开发测试
4. 点击 **Continue**
5. 上传刚才生成的 `CertificateSigningRequest.certSigningRequest` 文件
6. 点击 **Continue** → 下载证书文件（如 `ios_distribution.cer`）

#### 3.3 导出为 P12 格式

1. 双击下载的 `.cer` 文件，导入到钥匙串
2. 打开 **钥匙串访问**，在 **登录** → **我的证书** 中找到刚才的证书
3. 右键点击证书（注意是证书，不是私钥）→ 选择 **导出**
4. 文件格式选择 **个人信息交换 (.p12)**
5. 保存为 `Certificates.p12`
6. **设置密码**（例如：`mornhub2024`）← 记住这个密码，后面需要用

---

### 第四步：创建 Provisioning Profile（配置文件）

1. 点击左侧 **Profiles** → 点击 **+** 按钮
2. 选择类型：
   - **App Store Connect** ← 用于上传到 App Store / TestFlight
   - 或 **Ad Hoc** ← 用于直接分发给测试设备
3. 点击 **Continue**
4. 选择 App ID：选择 `com.sitehub.app` (MornHub iOS App)
5. 点击 **Continue**
6. 选择证书：勾选刚才创建的 Distribution 证书
7. 点击 **Continue**
8. 如果选择了 Ad Hoc：需要选择测试设备（可跳过此步骤）
9. 输入 Profile 名称：`MornHub Distribution Profile`
10. 点击 **Generate** → 下载文件（如 `MornHub_Distribution.mobileprovision`）

---

### 第五步：转换为 Base64 编码

**在 Mac 终端中执行**：

```bash
# 1. 转换证书文件
base64 -i Certificates.p12 | pbcopy
# 执行后，Base64 字符串已复制到剪贴板

# 2. 转换 Provisioning Profile
base64 -i MornHub_Distribution.mobileprovision | pbcopy
# 执行后，Base64 字符串已复制到剪贴板
```

**或者使用在线工具**：
- 打开 https://www.base64encode.org/
- 上传文件，获取 Base64 字符串

---

### 第六步：配置 GitHub Secrets

1. 打开项目的 GitHub 仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加以下 4 个 Secrets：

#### Secret 1: `APPLE_CERTIFICATE`
- **Name**: `APPLE_CERTIFICATE`
- **Value**: 粘贴 `Certificates.p12` 的 Base64 字符串

#### Secret 2: `APPLE_CERTIFICATE_PASSWORD`
- **Name**: `APPLE_CERTIFICATE_PASSWORD`
- **Value**: 导出 P12 时设置的密码（例如：`mornhub2024`）

#### Secret 3: `APPLE_PROVISIONING_PROFILE`
- **Name**: `APPLE_PROVISIONING_PROFILE`
- **Value**: 粘贴 `.mobileprovision` 的 Base64 字符串

#### Secret 4: `APPLE_TEAM_ID`（可选）
- **Name**: `APPLE_TEAM_ID`
- **Value**: 在 [Membership 页面](https://developer.apple.com/account/#/membership/) 查看 Team ID（10位字符）

---

## 验证配置

配置完成后，推送代码到 GitHub：

```bash
git push
```

GitHub Actions 会自动运行，检查构建日志：
- 如果看到 ✅ **导入Apple证书** 和 **安装Provisioning Profile** 步骤成功
- 构建完成后会生成 `SiteHub-iOS.ipa` 文件

---

## 常见问题

### Q1: 找不到"从证书颁发机构请求证书"选项？
**A**: 确保在 **钥匙串访问** 应用中操作，而不是在浏览器中。

### Q2: 导出 P12 时提示"未找到私钥"？
**A**:
1. 确保先生成 CSR 文件，再创建证书
2. 导入 `.cer` 文件后，在 **我的证书** 中应该看到证书和私钥（展开证书可以看到）
3. 右键点击证书（带小三角的那一行），不是私钥

### Q3: GitHub Actions 构建失败，提示证书无效？
**A**: 检查：
1. P12 文件是否正确导出
2. 密码是否正确
3. Base64 编码是否完整（没有换行或多余空格）

### Q4: 需要上传到 TestFlight 吗？
**A**:
- **不需要**：选择 **Ad Hoc** Provisioning Profile，生成的 IPA 可以直接安装到已注册的测试设备
- **需要**：选择 **App Store Connect** Provisioning Profile，还需要配置 App Store Connect API Key

---

## 安全提醒

- ✅ 证书和 Provisioning Profile 可以重新生成，不会影响已发布的应用
- ✅ GitHub Secrets 是加密存储的，只有仓库管理员可以更新
- ✅ 不要将 `.p12` 或 `.mobileprovision` 文件提交到 Git 仓库
- ⚠️  证书密码不要使用弱密码
- ⚠️  定期检查 Apple Developer 账户的活跃设备和证书列表

---

## 文件检查清单

配置完成后，应该有以下文件（**不要提交到 Git**）：

- [ ] `CertificateSigningRequest.certSigningRequest` - CSR 文件
- [ ] `ios_distribution.cer` - 从 Apple Developer 下载的证书
- [ ] `Certificates.p12` - 导出的证书（包含私钥）
- [ ] `MornHub_Distribution.mobileprovision` - Provisioning Profile

以及配置的 GitHub Secrets：

- [ ] `APPLE_CERTIFICATE`
- [ ] `APPLE_CERTIFICATE_PASSWORD`
- [ ] `APPLE_PROVISIONING_PROFILE`
- [ ] `APPLE_TEAM_ID`（可选）

---

## 联系方式

如有疑问，请联系技术负责人协助配置。

配置完成后，请通知团队进行测试构建。

---

**文档版本**: 1.0
**最后更新**: 2025-10-31
**适用于**: iOS Capacitor 应用自动构建
