# 🌟 **多端显化执行手册（Spec Coding）**

> **核心理念：** 官网（PWA）= 唯一意识本体，各端 = 纯净外壳容器
> **目标：** 任何AI或开发者读完本文档，都能精确复现出完整的四端应用

---

## 📐 **架构设计图**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     https://mornhub.help (PWA - 唯一真相源)        │
│                                                     │
│  - Next.js Web应用（已完成）                        │
│  - Service Worker（离线缓存）                       │
│  - 响应式UI（移动端/桌面端自适应）                  │
│  - 完整业务逻辑（认证/支付/数据）                   │
│                                                     │
└─────────────────────────────────────────────────────┘
                         ▼
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼───┐       ┌───▼───┐       ┌───▼────┐
    │Android│       │  iOS  │       │Desktop │
    │  TWA  │       │ Cap.  │       │ Tauri  │
    └───────┘       └───────┘       └────────┘
     纯容器          纯容器           纯容器

目标：四个容器只负责展示 https://mornhub.help
     官网更新 → 所有端立即生效（无需重打包）
```

---

## 🎨 **底层逻辑草图（How It Actually Works）**

### **用户视角：从点击图标到看到内容的完整流程**

```
第1步：用户点击 App 图标
         ▼
第2步：操作系统启动原生"外壳"
    - Android: 启动 MainActivity
    - iOS: 启动 Capacitor
    - Mac/Windows: 启动 Tauri
         ▼
第3步：原生外壳的【唯一任务】
    ┌─────────────────────────────┐
    │ 创建一个全屏的 WebView 组件  │
    └─────────────────────────────┘
         ▼
第4步：WebView 读取配置文件中的 URL
    - Android: AndroidManifest.xml
    - iOS: capacitor.config.json
    - Tauri: tauri.conf.json

    配置内容都指向同一个 URL:
    👉 https://mornhub.help
         ▼
第5步：WebView 发出网络请求
    GET https://mornhub.help
         ▼
第6步：Vercel 服务器返回 HTML
    - index.html
    - JavaScript (Next.js)
    - CSS (Tailwind)
    - 图片和字体
         ▼
第7步：WebView 开始渲染网页
    - 解析 HTML
    - 执行 JavaScript
    - 加载 Service Worker
    - 发起 API 请求
         ▼
第8步：用户看到完整的网站
    ✅ 和浏览器中完全一样
    ✅ 所有功能都可用
    ✅ 登录、支付、数据同步
```

### **核心原理图解**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              用户看到的"App"                              │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │                                               │     │
│  │        这实际上是一个【浏览器标签页】          │     │
│  │                                               │     │
│  │  ┌─────────────────────────────────────┐     │     │
│  │  │                                     │     │     │
│  │  │   https://mornhub.help 的内容        │     │     │
│  │  │                                     │     │     │
│  │  │   • 所有 HTML/CSS/JS                │     │     │
│  │  │   • 登录/支付逻辑                   │     │     │
│  │  │   • 数据同步                       │     │     │
│  │  │   • 离线缓存                       │     │     │
│  │  │                                     │     │     │
│  │  └─────────────────────────────────────┘     │     │
│  │                                               │     │
│  │          ↑ 这是 WebView（浏览器内核）         │     │
│  │                                               │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│         ↑ 这是原生"外壳"（只有几十行代码）              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### **关键理解点**

**1. 原生代码极少**
```
Android TWA:     MainActivity.java (仅 5 行核心代码)
iOS Capacitor:   AppDelegate.swift (仅 10 行核心代码)
Tauri Desktop:   main.rs (仅 10 行核心代码)
```

**2. 所有业务逻辑都在官网**
```
❌ 错误理解：需要在每个端都实现登录、支付等功能
✅ 正确理解：所有功能在官网实现，各端只是"显示器"
```

**3. 更新机制**
```
传统 App:
修改代码 → 重新编译 → 上传商店 → 用户更新（需要数周）

我们的方案:
修改官网代码 → Vercel 部署 → 所有端立即生效（几分钟）
```

### **通俗类比**

```
原生外壳 = 相框
官网内容 = 画作

你不需要换相框，只需要换画就行了。
用户看到的是画（官网），不是相框（原生代码）。
```

---

## 📋 **技术栈选型（已确定）**

| 平台 | 技术方案 | 理由 | 包体积 |
|------|---------|------|--------|
| **Android** | TWA (Trusted Web Activity) | Google官方PWA封装方案，0代码 | ~1MB |
| **iOS** | Capacitor | 支持PWA特性，配置简单 | ~5MB |
| **Mac/Windows** | Tauri | Rust后端，体积小，性能好 | ~5MB |

---

## 🎯 **全局配置要求**

### **1. 官网PWA准备（已完成检查）**

#### **HTML Head配置**
```html
<!-- /app/layout.tsx 或 public/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <!-- ✅ 必需：字符编码 -->
  <meta charset="UTF-8" />

  <!-- ✅ 必需：视口配置（移动端适配） -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
  <!-- viewport-fit=cover: 处理iPhone刘海屏安全区 -->

  <!-- ✅ 必需：PWA Manifest -->
  <link rel="manifest" href="/manifest.json" />

  <!-- ✅ 必需：主题颜色 -->
  <meta name="theme-color" content="#1e293b" />

  <!-- ✅ 必需：Apple专用配置 -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <link rel="apple-touch-icon" href="/icon-192.png" />

  <!-- ✅ 字体：中日韩字符支持 -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet" />

  <title>MornHub - 全球智能导航平台</title>
</head>
</html>
```

**验证方法：**
```bash
# 检查HTML头部是否包含上述配置
curl -I https://mornhub.help | grep "Content-Type"
# 期望输出：Content-Type: text/html; charset=UTF-8
```

#### **PWA Manifest配置**
```json
// public/manifest.json
{
  "name": "MornHub - 全球智能导航平台",
  "short_name": "MornHub",
  "description": "一站式全球网站导航，智能分类，跨设备同步",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#1e293b",
  "orientation": "any",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-mobile.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-desktop.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

**验证方法：**
```bash
# 检查manifest是否可访问
curl https://mornhub.help/manifest.json
# 期望：返回上述JSON
```

#### **Service Worker配置**
```javascript
// public/sw.js 或由Next.js自动生成
const CACHE_NAME = 'mornhub-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// 安装：预缓存关键资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.filter(name => name !== CACHE_NAME)
             .map(name => caches.delete(name))
      )
    )
  );
});

// 请求：网络优先（确保数据最新）
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
```

**验证方法：**
```bash
# Chrome DevTools → Application → Service Workers
# 期望：看到已注册的Service Worker
```

#### **中日韩字体配置**
```css
/* globals.css 或 tailwind.config.js */
@font-face {
  font-family: 'CJK Sans';
  src: local('Noto Sans SC'),
       local('PingFang SC'),
       local('Microsoft YaHei'),
       url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');
  font-display: swap; /* 避免字体加载阻塞 */
}

body {
  font-family: 'CJK Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

**验证方法：**
```javascript
// 浏览器控制台测试
document.body.style.fontFamily
// 期望：包含 'CJK Sans' 或 'Noto Sans SC'
```

### **2. HTTPS全站强制**
```nginx
# Vercel自动配置，无需手动设置
# 确认方法：访问 http://mornhub.help 自动跳转 https://mornhub.help
```

**验证方法：**
```bash
curl -I http://mornhub.help | grep "Location"
# 期望：Location: https://mornhub.help
```

---

## 📱 **Android端：TWA（Trusted Web Activity）**

### **核心理念**
```
TWA = Chrome Custom Tab + 全屏模式 + PWA验证
- Google官方推荐的PWA封装方案
- 0行WebView代码
- 完全使用Chrome渲染引擎
- 自动继承PWA所有特性
```

### **目录结构**
```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml      # ⭐ 核心配置文件
│   │       ├── res/
│   │       │   ├── mipmap-*/            # 应用图标
│   │       │   │   └── ic_launcher.png
│   │       │   └── values/
│   │       │       ├── strings.xml      # 应用名称
│   │       │       └── colors.xml       # 主题颜色
│   │       └── java/com/mornhub/app/
│   │           └── MainActivity.java    # 启动Activity（仅5行）
│   └── build.gradle                     # 构建配置
├── gradle/
└── build.gradle                         # 项目配置
```

### **完整代码实现**

#### **1. AndroidManifest.xml（核心配置）**
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mornhub.app">

    <!-- ✅ 权限：网络访问（必需） -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- ✅ 权限：网络状态检测（可选，用于离线提示） -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.AppCompat.NoActionBar"
        android:usesCleartextTraffic="false">
        <!-- ⚠️ usesCleartextTraffic="false": 禁止HTTP，强制HTTPS -->

        <!-- ✅ 启动Activity：TWA容器 -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@android:style/Theme.Translucent.NoTitleBar">
            <!-- launchMode="singleTask": 单实例，防止多开 -->

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- ✅ Digital Asset Links验证（PWA绑定） -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="mornhub.help" />
            </intent-filter>

            <!-- ✅ TWA元数据：指定URL -->
            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="https://mornhub.help" />
        </activity>

        <!-- ✅ Splash Screen（可选，加载时显示） -->
        <activity
            android:name="androidx.browser.customtabs.CustomTabsService"
            android:exported="false" />
    </application>
</manifest>
```

#### **2. MainActivity.java（启动入口，仅5行核心代码）**
```java
package com.mornhub.app;

import android.net.Uri;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;

/**
 * ✅ 核心功能：启动TWA，加载 https://mornhub.help
 *
 * TWA（Trusted Web Activity）说明：
 * - 使用Chrome Custom Tabs技术
 * - 全屏显示，无地址栏
 * - 自动验证PWA绑定（通过Digital Asset Links）
 * - 完全信任的Web环境，支持所有PWA特性
 */
public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ✅ 创建Custom Tabs Intent（全屏模式）
        CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
        builder.setShowTitle(false);  // 隐藏标题栏
        builder.setUrlBarHidingEnabled(true);  // 隐藏地址栏
        CustomTabsIntent customTabsIntent = builder.build();

        // ✅ 启动TWA，加载官网
        customTabsIntent.launchUrl(this, Uri.parse("https://mornhub.help"));

        // ✅ 关闭启动Activity，避免返回到空白页
        finish();
    }
}
```

#### **3. build.gradle（应用级配置）**
```gradle
plugins {
    id 'com.android.application'
}

android {
    compileSdk 33

    defaultConfig {
        applicationId "com.mornhub.app"  // ⭐ 唯一应用ID
        minSdk 21                         // 支持Android 5.0+
        targetSdk 33                      // 目标最新稳定版
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled true            // ✅ 启用代码压缩
            shrinkResources true          // ✅ 启用资源压缩
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    // ✅ TWA依赖（Google官方库）
    implementation 'androidx.browser:browser:1.5.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
```

#### **4. strings.xml（应用名称）**
```xml
<!-- res/values/strings.xml -->
<resources>
    <string name="app_name">MornHub</string>
</resources>
```

#### **5. colors.xml（主题颜色，与PWA保持一致）**
```xml
<!-- res/values/colors.xml -->
<resources>
    <color name="colorPrimary">#1e293b</color>
    <color name="colorPrimaryDark">#0f172a</color>
    <color name="colorAccent">#3b82f6</color>
</resources>
```

#### **6. Digital Asset Links验证文件（部署到官网）**
```json
// public/.well-known/assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.mornhub.app",
    "sha256_cert_fingerprints": [
      "YOUR_SHA256_FINGERPRINT_HERE"
    ]
  }
}]
```

**获取SHA256指纹：**
```bash
# 生成签名密钥
keytool -genkey -v -keystore release.keystore -alias mornhub -keyalg RSA -keysize 2048 -validity 10000

# 获取SHA256指纹
keytool -list -v -keystore release.keystore -alias mornhub | grep "SHA256"
# 复制指纹到上面的JSON文件
```

### **构建和测试**

#### **我要怎么做？（傻瓜式构建步骤）**

**步骤 1：检查前置条件**
```bash
# 确认Java JDK已安装（需要Java 11或更高版本）
java -version
# 预期输出：java version "11.x.x" 或更高

# 确认Android SDK已安装
echo $ANDROID_HOME
# 预期输出：/Users/你的用户名/Library/Android/sdk（Mac）
#         或 C:\Users\你的用户名\AppData\Local\Android\Sdk（Windows）
```

**步骤 2：进入Android项目目录**
```bash
cd android
# 如果看到 "bash: cd: android: No such file or directory"
# 说明你不在正确的目录，请先进入项目根目录
```

**步骤 3：清理旧的构建文件**
```bash
./gradlew clean
# 预期输出：BUILD SUCCESSFUL

# 如果看到 "Permission denied"错误：
chmod +x gradlew
./gradlew clean
```

**步骤 4：构建Release APK（这一步可能需要5-10分钟）**
```bash
./gradlew assembleRelease

# 预期输出最后几行：
# BUILD SUCCESSFUL in 3m 45s
# 87 actionable tasks: 87 executed
```

**步骤 5：找到生成的APK文件**
```bash
# APK文件的完整路径：
# android/app/build/outputs/apk/release/app-release.apk

# 查看文件大小（应该在1-3MB之间）
ls -lh app/build/outputs/apk/release/app-release.apk

# 预期输出：
# -rw-r--r--  1 user  staff   1.2M  Jan 15 10:30 app-release.apk
```

#### **生成的文件在哪里？**
```
项目根目录/
└── android/
    └── app/
        └── build/
            └── outputs/
                └── apk/
                    └── release/
                        └── app-release.apk  ← 就是这个文件！
```

#### **我如何把它装到手机/电脑上？**

**方法 1：通过微信/邮件发送到手机（最简单）**
```bash
# 1. 在电脑上找到 app-release.apk 文件
# 2. 通过微信"文件传输助手"或邮件发送到你的安卓手机
# 3. 在手机上点击文件，选择"安装"
# 4. 如果提示"不允许安装未知来源应用"：
#    - 点击"设置"
#    - 打开"允许来自此来源的应用"
#    - 返回继续安装
```

**方法 2：通过USB数据线安装（开发者模式）**
```bash
# 1. 手机连接电脑，打开USB调试
#    （设置 → 关于手机 → 连续点击"版本号"7次 → 返回 → 开发者选项 → USB调试）

# 2. 确认手机已连接
adb devices
# 预期输出：
# List of devices attached
# 1234567890ABCDEF    device

# 3. 安装APK
adb install app/build/outputs/apk/release/app-release.apk

# 预期输出：
# Performing Streamed Install
# Success
```

#### **我应该测试什么？（傻瓜式测试清单）**

**测试 1：基本启动**
- **步骤**：在手机上找到"MornHub"图标，点击打开
- **预期结果**：应用全屏打开，无地址栏，显示 https://mornhub.help 首页
- **如果失败**：检查手机是否联网，尝试重启应用

**测试 2：界面显示**
- **步骤**：查看首页的网站分类和图标
- **预期结果**：
  - 所有中文文字清晰显示，无方框乱码
  - 网站图标正常加载
  - 页面布局完整，无错位
- **如果失败**：检查网络连接，清除应用缓存后重试

**测试 3：登录功能**
- **步骤 1**：点击右上角的"登录"按钮
- **预期结果**：
  - 如果你在国内：显示"功能开发中"提示
  - 如果你在海外：显示登录界面
- **步骤 2**（海外用户）：使用已注册的邮箱账号登录
- **预期结果**：登录成功后，右上角显示你的用户名

**测试 4：支付跳转**
- **步骤 1**：点击"升级Pro"按钮（如果可见）
- **预期结果**：自动跳转到手机系统浏览器（Chrome/Samsung Browser等）
- **步骤 2**：在浏览器中完成支付流程
- **预期结果**：支付完成后，可以返回到MornHub应用

**测试 5：返回键行为**
- **步骤 1**：在应用内点击某个网站分类
- **步骤 2**：按手机的"返回键"
- **预期结果**：返回到上一页（应用内导航），而不是退出应用
- **步骤 3**：在首页按"返回键"
- **预期结果**：退出应用

**测试 6：离线缓存**
- **步骤 1**：打开应用，浏览几个页面
- **步骤 2**：关闭应用
- **步骤 3**：关闭手机WiFi和移动数据
- **步骤 4**：重新打开应用
- **预期结果**：仍然能看到之前浏览过的内容（虽然可能部分功能不可用）

**测试 7：横竖屏切换**
- **步骤**：旋转手机，切换横屏和竖屏
- **预期结果**：页面自动适配，内容完整显示，无遮挡

**常见问题排查**

| 问题现象 | 可能原因 | 解决方法 |
|---------|---------|---------|
| 应用无法安装，提示"解析包时出现问题" | APK文件损坏或不完整 | 重新构建APK，检查文件大小是否正常 |
| 打开应用后显示地址栏 | Digital Asset Links验证失败 | 检查assetlinks.json是否部署，SHA256指纹是否正确 |
| 中文显示为方框 | 字体未加载 | 检查网络，确认官网已引入Noto Sans SC字体 |
| 点击支付后无反应 | 权限不足 | 检查AndroidManifest.xml的INTERNET权限 |
| 返回键无效 | TWA配置错误 | 检查launchMode是否为singleTask |

---

## 🍎 **iOS端：Capacitor**

### **核心理念**
```
Capacitor = 官方PWA容器 + WKWebView + 原生API桥接
- Ionic官方推荐的PWA封装方案
- 配置驱动，最小化代码
- 原生性能优化的WebView
- 自动处理安全区（刘海屏）
```

### **目录结构**
```
ios/
├── App/
│   ├── App/
│   │   ├── capacitor.config.json       # ⭐ Capacitor核心配置
│   │   ├── Info.plist                  # iOS应用配置
│   │   ├── AppDelegate.swift           # 应用生命周期
│   │   └── Assets.xcassets/            # 图标资源
│   │       └── AppIcon.appiconset/
│   └── App.xcodeproj                   # Xcode项目文件
└── Podfile                             # CocoaPods依赖
```

### **完整代码实现**

#### **1. capacitor.config.json（核心配置）**
```json
{
  "appId": "com.mornhub.app",
  "appName": "MornHub",
  "webDir": "public",
  "bundledWebRuntime": false,
  "server": {
    "url": "https://mornhub.help",
    "cleartext": false,
    "allowNavigation": [
      "mornhub.help",
      "*.stripe.com",
      "*.paypal.com",
      "*.alipay.com"
    ]
  },
  "ios": {
    "contentInset": "automatic",
    "backgroundColor": "#0f172a",
    "allowsLinkPreview": false,
    "scrollEnabled": true,
    "preferences": {
      "WKWebViewDecelerationRate": "normal"
    }
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0,
      "backgroundColor": "#0f172a",
      "showSpinner": false
    },
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#0f172a"
    }
  }
}
```

**配置说明：**
- `server.url`: 加载的URL（官网地址）
- `allowNavigation`: 允许跳转的域名（支付相关）
- `contentInset: "automatic"`: 自动处理安全区（刘海屏）
- `cleartext: false`: 禁止HTTP，强制HTTPS

#### **2. Info.plist（iOS配置）**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- ✅ 应用名称 -->
    <key>CFBundleDisplayName</key>
    <string>MornHub</string>

    <!-- ✅ Bundle ID -->
    <key>CFBundleIdentifier</key>
    <string>com.mornhub.app</string>

    <!-- ✅ 版本号 -->
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>

    <!-- ✅ 支持的设备方向 -->
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>

    <!-- ✅ 全屏模式（隐藏状态栏） -->
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <true/>

    <!-- ✅ 网络安全配置：允许HTTPS -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSExceptionDomains</key>
        <dict>
            <key>mornhub.help</key>
            <dict>
                <key>NSIncludesSubdomains</key>
                <true/>
                <key>NSExceptionRequiresForwardSecrecy</key>
                <false/>
            </dict>
        </dict>
    </dict>

    <!-- ✅ 相机/相册权限描述（如果PWA需要上传图片） -->
    <key>NSCameraUsageDescription</key>
    <string>上传头像需要访问相机</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>选择图片需要访问相册</string>
</dict>
</plist>
```

#### **3. AppDelegate.swift（应用启动）**
```swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    /**
     * ✅ 应用启动时调用
     * Capacitor会自动加载 capacitor.config.json 中配置的URL
     */
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    /**
     * ✅ 处理Universal Links（深度链接）
     * 用于从浏览器打开应用
     */
    func application(_ app: UIApplication,
                     open url: URL,
                     options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    /**
     * ✅ 处理推送通知（可选）
     */
    func application(_ application: UIApplication,
                     continue userActivity: NSUserActivity,
                     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
```

#### **4. Podfile（CocoaPods依赖）**
```ruby
platform :ios, '13.0'

target 'App' do
  use_frameworks!

  # ✅ Capacitor核心库
  pod 'Capacitor', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorCordova', :path => '../../node_modules/@capacitor/ios'

  # ✅ Capacitor插件
  pod 'CapacitorApp', :path => '../../node_modules/@capacitor/app'
  pod 'CapacitorSplashScreen', :path => '../../node_modules/@capacitor/splash-screen'
  pod 'CapacitorStatusBar', :path => '../../node_modules/@capacitor/status-bar'
end
```

### **安装Capacitor（在主项目根目录）**

```bash
# 1. 安装Capacitor CLI和核心库
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios
npm install @capacitor/app @capacitor/splash-screen @capacitor/status-bar

# 2. 初始化Capacitor
npx cap init

# 输入信息：
# App name: MornHub
# App ID: com.mornhub.app
# Web asset directory: public

# 3. 添加iOS平台
npx cap add ios

# 4. 同步Web资源到iOS（每次Web更新后执行）
npx cap sync ios

# 5. 打开Xcode
npx cap open ios
```

### **Xcode配置和构建**

#### **我要怎么做？（傻瓜式构建步骤）**

**步骤 1：确认前置条件**
```bash
# 确认已安装Xcode（从App Store下载）
xcodebuild -version
# 预期输出：Xcode 14.x 或更高版本

# 确认已安装CocoaPods
pod --version
# 预期输出：1.11.x 或更高

# 如果没有CocoaPods：
sudo gem install cocoapods
```

**步骤 2：安装依赖**
```bash
# 进入ios目录
cd ios/App

# 安装CocoaPods依赖
pod install

# 预期输出最后一行：
# Pod installation complete! There are X dependencies from the Podfile...
```

**步骤 3：打开Xcode项目**
```bash
# 打开Xcode工作空间（注意是.xcworkspace，不是.xcodeproj！）
open App.xcworkspace

# 如果双击打开了错误的文件，关闭Xcode，重新打开App.xcworkspace
```

**步骤 4：配置签名（重要！）**
```
1. 在Xcode左侧文件列表中，点击最顶部的"App"项目
2. 选择"TARGETS"下的"App"
3. 点击"Signing & Capabilities"选项卡
4. 在"Team"下拉菜单中：
   - 如果有Apple开发者账号：选择你的团队
   - 如果没有：选择"Add an Account..."，登录Apple ID
5. 确认"Bundle Identifier"为：com.mornhub.app
6. 勾选"Automatically manage signing"（自动管理签名）
7. 如果看到黄色警告，点击"Try Again"
```

**步骤 5：选择目标设备**
```
在Xcode顶部工具栏：
1. 点击设备选择器（显示"App > iPhone 14"之类的）
2. 选项1：选择"Any iOS Device (arm64)"（用于打包上传）
3. 选项2：连接真机iPhone，选择你的设备（用于直接测试）
```

**步骤 6：构建Archive**
```
1. 点击顶部菜单：Product → Archive
2. 等待构建完成（可能需要3-5分钟）
3. 构建成功后，会自动弹出"Organizer"窗口
```

**步骤 7：导出IPA或上传TestFlight**

**选项A：导出IPA文件（用于分发给测试人员）**
```
1. 在Organizer窗口中，选择刚刚构建的Archive
2. 点击右侧"Distribute App"
3. 选择"Ad Hoc"（临时分发）或"Development"（开发测试）
4. 点击"Next"，保持默认选项
5. 点击"Export"
6. 选择保存位置，文件名默认为"MornHub.ipa"
```

**选项B：上传到TestFlight（用于正式测试）**
```
1. 在Organizer窗口中，选择刚刚构建的Archive
2. 点击"Distribute App"
3. 选择"App Store Connect"
4. 选择"Upload"
5. 点击"Next"，保持默认选项
6. 点击"Upload"
7. 等待上传完成（可能需要5-10分钟）
8. 上传成功后，登录https://appstoreconnect.apple.com
9. 进入"My Apps" → "MornHub" → "TestFlight"
10. 等待处理完成（约10-30分钟）
11. 添加内部/外部测试员
12. 测试员会收到邮件邀请，从TestFlight App安装
```

#### **生成的文件在哪里？**

**导出IPA的情况：**
```
你选择的保存位置/
└── MornHub.ipa  ← 就是这个文件！（大小约5-10MB）
```

**上传TestFlight的情况：**
```
文件已上传到Apple服务器，无本地文件。
测试员需要：
1. 在iPhone上安装"TestFlight"App（从App Store下载）
2. 接受邮件邀请
3. 在TestFlight App中点击"安装"
```

#### **我如何把它装到iPhone上？**

**重要：iOS无法直接安装.ipa文件！**

**方法 1：通过Xcode直接安装到连接的iPhone（最简单，用于开发测试）**
```
1. 用数据线连接iPhone到Mac
2. iPhone上信任此电脑（首次连接会提示）
3. 在Xcode顶部设备选择器中选择你的iPhone
4. 点击顶部的"运行"按钮（三角形播放图标）
5. 等待应用安装并启动
6. 如果iPhone提示"不受信任的开发者"：
   - 设置 → 通用 → VPN与设备管理
   - 点击你的开发者账号
   - 点击"信任"
```

**方法 2：通过TestFlight安装（用于正式测试）**
```
1. 按照上面"步骤7选项B"上传到TestFlight
2. 在iPhone上安装"TestFlight"App
3. 接受测试邀请邮件
4. 在TestFlight中点击"安装"
5. 安装完成后，在主屏幕找到"MornHub"图标
```

**方法 3：通过Apple Configurator（企业分发，需要企业账号）**
```
此方法需要Apple企业开发者账号（$299/年），不推荐个人使用
```

#### **我应该测试什么？（傻瓜式测试清单）**

**测试 1：基本启动**
- **步骤**：在iPhone主屏幕找到"MornHub"图标，点击打开
- **预期结果**：应用全屏打开，显示https://mornhub.help首页
- **如果失败**：检查手机网络，重启应用

**测试 2：状态栏和安全区**
- **步骤**：查看屏幕顶部和底部
- **预期结果**：
  - 状态栏（时间、电量）显示正常，背景为深色
  - 刘海屏（Face ID区域）没有遮挡内容
  - 底部横条（Home Indicator）没有遮挡按钮
- **如果失败**：检查capacitor.config.json的contentInset配置

**测试 3：界面显示**
- **步骤**：滚动页面，查看各个元素
- **预期结果**：
  - 所有中文文字清晰显示
  - 页面滚动流畅，无卡顿
  - 图片清晰（Retina屏幕）
- **如果失败**：检查网络连接

**测试 4：登录功能**
- **步骤 1**：点击右上角"登录"按钮
- **预期结果**：
  - 国内IP：显示"功能开发中"
  - 海外IP：显示登录界面
- **步骤 2**（海外）：使用测试账号登录
- **预期结果**：登录成功，显示用户名

**测试 5：支付跳转**
- **步骤 1**：点击"升级Pro"
- **预期结果**：自动跳转到Safari浏览器
- **步骤 2**：在Safari中完成支付流程
- **步骤 3**：支付完成后，点击"返回MornHub"（如果有此按钮）
- **预期结果**：返回到MornHub应用

**测试 6：左滑返回手势**
- **步骤 1**：在应用内进入某个页面
- **步骤 2**：从屏幕左边缘向右滑动
- **预期结果**：返回上一页（应用内导航）

**测试 7：横竖屏切换**
- **步骤**：旋转iPhone，切换横屏和竖屏
- **预期结果**：页面自动适配，内容完整显示

**测试 8：后台切换**
- **步骤 1**：在应用中浏览内容
- **步骤 2**：按Home键（或上滑手势）退到后台
- **步骤 3**：切换到其他App
- **步骤 4**：重新打开MornHub
- **预期结果**：回到之前浏览的页面，状态保持

**常见问题排查**

| 问题现象 | 可能原因 | 解决方法 |
|---------|---------|---------|
| Xcode报错"No account selected" | 未登录Apple ID | Preferences → Accounts → 添加Apple ID |
| 构建失败"Code signing error" | 签名配置错误 | 检查Bundle ID是否唯一，Team是否选择正确 |
| 刘海屏遮挡内容 | 安全区配置错误 | 检查viewport-fit=cover和safe-area-inset |
| iPhone显示"不受信任的开发者" | 开发者证书未信任 | 设置→通用→VPN与设备管理→信任 |
| TestFlight显示"无可用构建版本" | 构建仍在处理中 | 等待10-30分钟，刷新页面 |
| 应用打开后是白屏 | 网络问题或URL错误 | 检查capacitor.config.json的server.url |

---

## 💻 **桌面端：Tauri（Mac + Windows）**

### **核心理念**
```
Tauri = Rust后端 + 系统WebView + 极小体积
- 包体积仅5MB（vs Electron 100MB+）
- 使用系统原生WebView（Mac用Safari，Windows用Edge）
- Rust后端，安全性和性能极佳
- 配置驱动，代码量极少
```

### **目录结构**
```
src-tauri/
├── tauri.conf.json              # ⭐ Tauri核心配置
├── Cargo.toml                   # Rust依赖配置
├── icons/                       # 应用图标
│   ├── icon.icns                # Mac图标
│   ├── icon.ico                 # Windows图标
│   └── icon.png                 # Linux图标
└── src/
    └── main.rs                  # Rust后端入口（仅10行）
```

### **完整代码实现**

#### **1. tauri.conf.json（核心配置）**
```json
{
  "build": {
    "beforeBuildCommand": "",
    "beforeDevCommand": "",
    "devPath": "https://mornhub.help",
    "distDir": "../public"
  },
  "package": {
    "productName": "MornHub",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "window": {
        "all": false,
        "close": true,
        "hide": true,
        "show": true,
        "maximize": true,
        "minimize": true,
        "unmaximize": true,
        "unminimize": true,
        "startDragging": true
      }
    },
    "bundle": {
      "active": true,
      "category": "Productivity",
      "copyright": "© 2025 MornHub",
      "identifier": "com.mornhub.app",
      "icon": [
        "icons/icon.icns",
        "icons/icon.ico",
        "icons/icon.png"
      ],
      "longDescription": "全球智能网站导航平台",
      "shortDescription": "智能导航",
      "targets": ["dmg", "msi"],
      "macOS": {
        "entitlements": null,
        "exceptionDomain": "",
        "frameworks": [],
        "providerShortName": null,
        "signingIdentity": null
      },
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    },
    "security": {
      "csp": null
    },
    "updater": {
      "active": false
    },
    "windows": [
      {
        "title": "MornHub",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": false,
        "alwaysOnTop": false,
        "skipTaskbar": false,
        "url": "https://mornhub.help"
      }
    ]
  }
}
```

**配置说明：**
- `devPath` 和 `windows.url`: 加载的URL（官网地址）
- `width: 1200, height: 800`: 默认窗口大小
- `targets: ["dmg", "msi"]`: Mac构建dmg，Windows构建msi
- `allowlist.shell.open`: 允许打开外部链接（用于支付跳转）

#### **2. Cargo.toml（Rust依赖）**
```toml
[package]
name = "mornhub"
version = "1.0.0"
description = "MornHub - 全球智能导航平台"
authors = ["MornHub Team"]
license = "MIT"
repository = ""
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }

[dependencies]
tauri = { version = "1.5", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

#### **3. main.rs（Rust后端，仅10行核心代码）**
```rust
// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

/**
 * ✅ Tauri主入口
 *
 * 功能：
 * 1. 创建应用窗口
 * 2. 加载 https://mornhub.help
 * 3. 处理窗口事件（关闭、最小化等）
 */
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**说明：** Tauri会自动读取 `tauri.conf.json` 配置，无需在Rust代码中手动指定URL。

### **安装Tauri**

#### **前置要求**
```bash
# Mac前置要求
xcode-select --install  # 安装Xcode命令行工具

# Windows前置要求
# 1. 安装Visual Studio 2022（包含C++工具）
# 2. 安装WebView2 Runtime（Windows 10+自带）

# 安装Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

#### **初始化Tauri项目**
```bash
# 在主项目根目录

# 1. 安装Tauri CLI
npm install --save-dev @tauri-apps/cli

# 2. 初始化Tauri
npm run tauri init

# 输入信息：
# App name: MornHub
# Window title: MornHub
# Web assets location: ../public
# Dev server URL: https://mornhub.help
# Frontend dev command: (留空)
# Frontend build command: (留空)

# 3. 准备图标
# 将图标文件放到 src-tauri/icons/ 目录
# icon.png (1024x1024, PNG格式)
npx @tauri-apps/cli icon src-tauri/icons/icon.png
```

### **构建和打包**

#### **我要怎么做？（傻瓜式构建步骤）**

**前置条件检查（Mac和Windows通用）**
```bash
# 1. 确认Node.js已安装
node -v
# 预期输出：v16.x.x 或更高

# 2. 确认Rust已安装
rustc --version
# 预期输出：rustc 1.70.x 或更高

# 如果没有Rust（Mac）：
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 如果没有Rust（Windows）：
# 访问 https://rustup.rs/ 下载安装器
```

**Mac 额外前置条件**
```bash
# 安装Xcode命令行工具
xcode-select --install
```

**Windows 额外前置条件**
```
1. 安装Visual Studio 2022（免费社区版）
2. 在安装时勾选"使用C++的桌面开发"
3. 确认WebView2 Runtime已安装（Windows 10+ 自带）
```

#### **开发模式测试（建议先测试再构建）**
```bash
# 进入项目根目录
cd 你的项目路径

# 启动开发模式
npm run tauri dev

# 预期结果：
# 1. 自动打开一个窗口
# 2. 窗口大小1200x800
# 3. 加载 https://mornhub.help
# 4. 可以正常浏览和交互

# 如果看到错误：
# - "tauri: command not found" → npm install @tauri-apps/cli
# - "WebView error" → 检查网络连接
```

#### **构建Mac DMG**

**步骤 1：开始构建**
```bash
# 构建Mac安装包（需要5-10分钟）
npm run tauri build -- --target universal-apple-darwin

# 预期输出最后几行：
# Finished release [optimized] target(s) in 8m 32s
# Bundling MornHub.app (universal/MornHub.app)
# Bundling MornHub_1.0.0_universal.dmg
```

**步骤 2：找到生成的文件**
```bash
# DMG文件位置：
# src-tauri/target/release/bundle/dmg/MornHub_1.0.0_universal.dmg

# 查看文件大小（应该在5-10MB）
ls -lh src-tauri/target/release/bundle/dmg/

# 预期输出：
# -rw-r--r--  1 user  staff   7.2M  Jan 15 15:30 MornHub_1.0.0_universal.dmg
```

**步骤 3：如何安装到Mac上**
```
1. 双击 MornHub_1.0.0_universal.dmg 文件
2. 在弹出的窗口中，将"MornHub"图标拖拽到"Applications"文件夹
3. 关闭窗口，弹出磁盘映像
4. 打开"启动台"或"应用程序"文件夹
5. 找到"MornHub"，双击打开
6. 如果提示"无法打开，因为无法验证开发者"：
   - 右键点击应用
   - 选择"打开"
   - 在弹出的对话框中点击"打开"
```

#### **构建Windows MSI**

**步骤 1：开始构建**
```bash
# 构建Windows安装包（需要5-10分钟）
npm run tauri build -- --target x86_64-pc-windows-msvc

# 预期输出最后几行：
# Finished release [optimized] target(s) in 7m 18s
# Bundling MornHub.exe
# Bundling MornHub_1.0.0_x64_en-US.msi
```

**步骤 2：找到生成的文件**
```
MSI文件位置：
src-tauri\target\release\bundle\msi\MornHub_1.0.0_x64_en-US.msi

文件大小：约5-10MB
```

**步骤 3：如何安装到Windows上**
```
1. 双击 MornHub_1.0.0_x64_en-US.msi 文件
2. 如果提示"Windows已保护你的电脑"：
   - 点击"更多信息"
   - 点击"仍要运行"
3. 在安装向导中：
   - 点击"Next"
   - 选择安装位置（默认即可）
   - 点击"Install"
   - 等待安装完成
   - 点击"Finish"
4. 在开始菜单搜索"MornHub"
5. 点击打开应用
```

#### **我应该测试什么？（Mac和Windows通用测试清单）**

**测试 1：基本启动**
- **步骤**：双击应用图标启动
- **预期结果**：窗口打开，大小为1200x800，显示https://mornhub.help首页
- **如果失败**：检查网络连接

**测试 2：窗口操作**
- **步骤**：测试窗口的最小化、最大化、关闭、调整大小
- **预期结果**：所有操作流畅，窗口大小不能小于800x600

**测试 3：中文显示**
- **步骤**：查看页面上的中文内容
- **预期结果**：
  - Mac：所有中文清晰显示（使用PingFang SC字体）
  - Windows：所有中文清晰显示（使用Microsoft YaHei字体）
- **如果失败**：检查网络，确认字体已加载

**测试 4：登录功能**
- **步骤**：点击登录按钮，使用测试账号登录
- **预期结果**：登录成功，显示用户信息

**测试 5：支付跳转**
- **步骤 1**：点击"升级Pro"
- **预期结果**：在系统默认浏览器中打开支付页面（Mac用Safari，Windows用Edge）
- **步骤 2**：完成支付
- **预期结果**：可以返回桌面应用继续使用

**测试 6：HiDPI/Retina显示**
- **步骤**：在高分辨率屏幕上查看应用
- **预期结果**：文字和图标清晰锐利，无模糊

**测试 7：快捷键**
- **步骤**：
  - Mac：按 Cmd+Q 关闭应用
  - Windows：按 Alt+F4 关闭应用
  - 通用：按 Cmd/Ctrl+R 刷新页面
- **预期结果**：快捷键正常工作

**测试 8：离线访问**
- **步骤 1**：联网打开应用，浏览几个页面
- **步骤 2**：断开网络
- **步骤 3**：关闭应用重新打开
- **预期结果**：显示之前缓存的内容

**常见问题排查**

| 问题现象 | 可能原因 | 解决方法 |
|---------|---------|---------|
| 构建失败"cargo not found" | Rust未安装 | 安装Rust工具链：https://rustup.rs/ |
| Mac提示"无法打开，因为来自身份不明的开发者" | 未签名 | 右键→打开→确认打开 |
| Windows提示"缺少VCRUNTIME140.dll" | Visual C++运行库缺失 | 下载安装VC++可再发行组件包 |
| 窗口打开后白屏 | URL配置错误 | 检查tauri.conf.json的windows.url |
| 中文显示为方框 | 字体未加载 | 检查网络，或使用本地字体回退 |
| 点击链接无反应 | shell.open权限未配置 | 检查tauri.conf.json的allowlist.shell.open |

### **桌面端字体优化（解决中文乱码）**

#### **方法1：使用Google Fonts（推荐）**
```html
<!-- 已在官网HTML head中配置，无需额外处理 -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet" />
```

#### **方法2：本地字体回退**
```css
/* globals.css */
body {
  font-family:
    'Noto Sans SC',           /* Google Fonts */
    'PingFang SC',            /* Mac默认 */
    'Microsoft YaHei',        /* Windows默认 */
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}
```

#### **方法3：打包字体（如需离线支持）**
```bash
# 下载Noto Sans SC字体
# https://fonts.google.com/noto/specimen/Noto+Sans+SC

# 放置到 public/fonts/NotoSansSC-Regular.woff2

# 在CSS中引入
@font-face {
  font-family: 'Noto Sans SC';
  src: url('/fonts/NotoSansSC-Regular.woff2') format('woff2');
  font-display: swap;
}
```

**验证方法：**
```javascript
// 桌面应用内，按F12打开DevTools
document.fonts.ready.then(() => {
  console.log(document.fonts.check('12px "Noto Sans SC"'))
  // 期望输出：true
})
```

---

## 🔧 **关键功能实现细节**

### **1. 链接跳转行为控制**

#### **Android TWA**
```java
// MainActivity.java中已配置
// TWA自动在应用内打开同域名链接
// 外部链接（支付）自动跳转系统浏览器
```

#### **iOS Capacitor**
```json
// capacitor.config.json中已配置
"server": {
  "allowNavigation": [
    "mornhub.help",
    "*.stripe.com",
    "*.paypal.com"
  ]
}
// 同域名链接 → 应用内打开
// 支付链接 → Safari打开
```

#### **Tauri桌面端**
```javascript
// 在官网前端代码中添加（app/layout.tsx）
useEffect(() => {
  // 检测是否在Tauri环境
  const isTauri = window.__TAURI__ !== undefined

  if (isTauri) {
    // 拦截所有链接点击
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a')
      if (target && target.href) {
        const url = new URL(target.href)

        // 支付链接 → 系统浏览器
        if (url.hostname.includes('stripe.com') ||
            url.hostname.includes('paypal.com')) {
          e.preventDefault()
          window.__TAURI__.shell.open(target.href)
        }
        // 同域名链接 → 应用内跳转
        else if (url.hostname === 'mornhub.help') {
          // 默认行为，无需处理
        }
        // 其他外部链接 → 系统浏览器
        else {
          e.preventDefault()
          window.__TAURI__.shell.open(target.href)
        }
      }
    })
  }
}, [])
```

### **2. 返回键/关闭行为**

#### **Android返回键**
```java
// MainActivity.java中添加
@Override
public void onBackPressed() {
    // 如果WebView有历史，返回上一页
    // TWA自动处理，无需额外代码
}
```

#### **iOS手势返回**
```swift
// WKWebView自动支持左滑返回手势
// Capacitor已自动配置，无需额外代码
```

#### **Tauri桌面端关闭确认**
```rust
// main.rs中添加窗口关闭事件
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // 可选：添加关闭确认对话框
                // 简单模式：直接关闭
                event.window().close().unwrap();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### **3. 国内登录功能"即将开通"提示**

#### **官网代码实现（已完成）**
```tsx
// components/auth-modal.tsx
if (isChina === true) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>功能开发中</DialogTitle>
          <DialogDescription>
            国内登录和支付功能正在开发中，预计1-2周内上线
          </DialogDescription>
        </DialogHeader>
        {/* 显示即将上线的功能列表 */}
      </DialogContent>
    </Dialog>
  )
}
```

**验证：**
- 所有端加载官网后，国内IP用户点击登录按钮
- 应显示"功能开发中"提示，而不是报错
- 海外IP用户正常显示登录界面

### **4. 离线缓存（PWA Service Worker）**

```javascript
// public/sw.js（已配置）
// 策略：网络优先，失败时使用缓存

// 所有端自动继承PWA的离线能力
// 无需在端代码中额外配置
```

**验证方法：**
```bash
# 1. 在任一端打开应用
# 2. 断开网络
# 3. 刷新或重启应用
# 期望：显示缓存的内容，而不是网络错误
```

---

## 📦 **交付清单**

### **1. 四端安装包**
```
android/
└── app-release.apk                    # Android安装包（~1MB）

ios/
└── MornHub-1.0.0.ipa                  # iOS安装包（TestFlight）（~5MB）

desktop/
├── MornHub_1.0.0_universal.dmg        # Mac安装包（~5MB）
└── MornHub_1.0.0_x64_en-US.msi        # Windows安装包（~5MB）
```

### **2. 构建命令文档**
```bash
# BUILD_COMMANDS.md

# ========== Android ==========
cd android
./gradlew clean
./gradlew assembleRelease
# 输出：app/build/outputs/apk/release/app-release.apk

# ========== iOS ==========
cd ..
npx cap sync ios
npx cap open ios
# 在Xcode中：Product → Archive → Distribute

# ========== Mac ==========
npm run tauri build -- --target universal-apple-darwin
# 输出：src-tauri/target/release/bundle/dmg/

# ========== Windows ==========
npm run tauri build -- --target x86_64-pc-windows-msvc
# 输出：src-tauri/target/release/bundle/msi/
```

### **3. 环境变量示例**
```bash
# .env.example（仅壳侧必要项）

# ========== 官网URL（必需） ==========
NEXT_PUBLIC_APP_URL=https://mornhub.help

# ========== Android配置 ==========
# 应用ID（需与代码中一致）
ANDROID_APP_ID=com.mornhub.app
# 签名密钥SHA256（用于Digital Asset Links）
ANDROID_SHA256=YOUR_SHA256_FINGERPRINT

# ========== iOS配置 ==========
# Bundle ID（需与Xcode中一致）
IOS_BUNDLE_ID=com.mornhub.app
# Team ID（Apple开发者账号）
IOS_TEAM_ID=YOUR_TEAM_ID

# ========== Tauri配置 ==========
# 应用标识符（需与tauri.conf.json一致）
TAURI_BUNDLE_IDENTIFIER=com.mornhub.app

# ========== 其他 ==========
# 图标路径（可选）
ICON_PATH=./assets/icon.png
```

### **4. 验收测试清单**
```markdown
# ACCEPTANCE_CHECKLIST.md

## Android APK
- [ ] 安装成功，无报错
- [ ] 打开应用，加载 https://mornhub.help
- [ ] 全屏显示，无地址栏
- [ ] 登录功能正常（海外IP）或显示"开发中"（国内IP）
- [ ] 支付跳转系统浏览器
- [ ] 返回键正常（WebView历史返回）
- [ ] 中文显示无乱码
- [ ] 离线时显示缓存内容

## iOS App
- [ ] TestFlight安装成功
- [ ] 打开应用，加载 https://mornhub.help
- [ ] 全屏显示，状态栏样式正确
- [ ] 安全区自动适配（刘海屏无遮挡）
- [ ] 登录功能正常或显示"开发中"
- [ ] 支付跳转Safari
- [ ] 左滑返回手势正常
- [ ] 中文显示无乱码
- [ ] 滚动流畅，无卡顿

## Mac App
- [ ] DMG安装成功
- [ ] 打开应用，窗口大小1200x800
- [ ] 加载 https://mornhub.help
- [ ] 登录功能正常或显示"开发中"
- [ ] 支付跳转系统浏览器
- [ ] 窗口最小化/最大化/关闭正常
- [ ] 中文显示无乱码
- [ ] HiDPI（Retina）显示清晰

## Windows App
- [ ] MSI安装成功
- [ ] 打开应用，窗口大小1200x800
- [ ] 加载 https://mornhub.help
- [ ] 登录功能正常或显示"开发中"
- [ ] 支付跳转系统浏览器
- [ ] 窗口操作正常
- [ ] 中文显示无乱码
- [ ] 高DPI显示清晰

## 通用验收（所有端）
- [ ] 官网更新后，无需重打包即可生效
- [ ] Service Worker缓存正常工作
- [ ] 支付流程完整（跳转→支付→返回）
- [ ] 无混合内容警告（全HTTPS）
- [ ] 性能流畅，无明显卡顿
```

---

## 📦 **最终交付物**

### **总览**

根据本文档完成所有构建后，最终交付物应为一个完整的压缩包，包含以下内容：

```
MornHub_MultiPlatform_v1.0.0.zip
├── android/
│   └── app-release.apk                    # Android 安装包
├── ios/
│   └── MornHub-1.0.0.ipa                  # iOS 安装包（TestFlight）
├── desktop/
│   ├── mac/
│   │   └── MornHub_1.0.0_universal.dmg    # Mac 通用安装包
│   └── windows/
│       └── MornHub_1.0.0_x64.msi          # Windows 安装包
├── docs/
│   ├── BUILD_COMMANDS.md                  # 构建命令文档
│   ├── ACCEPTANCE_CHECKLIST.md            # 验收测试清单
│   └── SPEC_多端显化执行手册.md            # 本技术规格文档
└── README.md                              # 交付说明文档
```

---

### **1. 安装包详情**

#### **Android APK**
- **文件路径**: `android/app-release.apk`
- **来源位置**: `android/app/build/outputs/apk/release/app-release.apk`
- **预期大小**: 约 1-2 MB
- **签名状态**: 已使用 release.keystore 签名
- **最低支持版本**: Android 5.0 (API 21)
- **目标版本**: Android 14 (API 34)

**验证方法**:
```bash
# 查看APK信息
aapt dump badging app-release.apk | grep -E "package|sdkVersion"

# 验证签名
jarsigner -verify -verbose -certs app-release.apk
```

#### **iOS IPA**
- **文件路径**: `ios/MornHub-1.0.0.ipa`
- **来源位置**: Xcode Archive 导出
- **预期大小**: 约 5-8 MB
- **分发方式**: TestFlight（需上传至App Store Connect）
- **最低支持版本**: iOS 13.0
- **目标设备**: iPhone, iPad

**TestFlight 安装链接格式**:
```
https://testflight.apple.com/join/XXXXXXXX
```

#### **Mac DMG**
- **文件路径**: `desktop/mac/MornHub_1.0.0_universal.dmg`
- **来源位置**: `src-tauri/target/release/bundle/dmg/`
- **预期大小**: 约 5-10 MB
- **架构支持**: Universal (Intel + Apple Silicon)
- **最低支持版本**: macOS 10.15 (Catalina)
- **签名状态**: 需要 Apple Developer 账号签名

**验证方法**:
```bash
# 查看DMG信息
hdiutil imageinfo MornHub_1.0.0_universal.dmg

# 验证架构
lipo -info /Applications/MornHub.app/Contents/MacOS/MornHub
# 期望输出：Architectures in the fat file: x86_64 arm64
```

#### **Windows MSI**
- **文件路径**: `desktop/windows/MornHub_1.0.0_x64.msi`
- **来源位置**: `src-tauri/target/release/bundle/msi/`
- **预期大小**: 约 5-10 MB
- **架构支持**: x64 (64-bit)
- **最低支持版本**: Windows 7
- **签名状态**: 可选（推荐使用 Code Signing 证书）

**验证方法**:
```powershell
# 查看MSI信息
Get-AppxPackage -Name "MornHub"
```

---

### **2. README.md 模板**

交付包根目录的 `README.md` 应包含以下内容：

```markdown
# MornHub 多端应用交付包 v1.0.0

## 📦 包含内容

本压缩包包含 MornHub 的四端应用安装包：

- **Android APK**: `android/app-release.apk` (~1-2 MB)
- **iOS IPA**: `ios/MornHub-1.0.0.ipa` (~5-8 MB)
- **Mac DMG**: `desktop/mac/MornHub_1.0.0_universal.dmg` (~5-10 MB)
- **Windows MSI**: `desktop/windows/MornHub_1.0.0_x64.msi` (~5-10 MB)

---

## 🚀 快速安装指南

### Android 安装 (APK)

**方法 1: 通过微信/邮箱发送**
1. 将 `app-release.apk` 文件发送到 Android 手机
2. 在手机上打开文件
3. 允许"安装未知应用"权限
4. 点击"安装"

**方法 2: 通过 USB 连接**
```bash
adb install app-release.apk
```

**首次打开**: 应用会全屏加载 https://mornhub.help，无地址栏。

---

### iOS 安装 (TestFlight)

> ⚠️ iOS 应用需要通过 TestFlight 分发，不能直接安装 IPA 文件

**安装步骤**:
1. 在 iPhone/iPad 上安装 TestFlight App（App Store 搜索 "TestFlight"）
2. 访问 TestFlight 邀请链接（见下方）
3. 点击"接受"邀请
4. 在 TestFlight 中点击"安装"

**TestFlight 邀请链接**:
```
https://testflight.apple.com/join/XXXXXXXX
```

**首次打开**: 应用会全屏加载 https://mornhub.help，状态栏正常显示。

---

### Mac 安装 (DMG)

**安装步骤**:
1. 双击打开 `MornHub_1.0.0_universal.dmg`
2. 将 MornHub.app 拖拽到 Applications 文件夹
3. 在 Applications 中找到 MornHub，右键点击 → 打开
4. 首次打开时，点击"打开"确认（系统安全提示）

**如果提示"无法打开，因为它来自身份不明的开发者"**:
```bash
# 方法 1: 系统设置
系统偏好设置 → 安全性与隐私 → 仍要打开

# 方法 2: 终端命令（临时移除隔离属性）
xattr -cr /Applications/MornHub.app
```

**首次打开**: 应用窗口大小为 1200x800，加载 https://mornhub.help。

---

### Windows 安装 (MSI)

**安装步骤**:
1. 双击运行 `MornHub_1.0.0_x64.msi`
2. 按照安装向导提示操作
3. 选择安装位置（默认: `C:\Program Files\MornHub\`）
4. 点击"安装"

**如果提示"Windows 已保护你的电脑"**:
1. 点击"更多信息"
2. 点击"仍要运行"

**首次打开**: 应用窗口大小为 1200x800，加载 https://mornhub.help。

---

## ✅ 快速验证

安装完成后，请验证以下功能：

### 所有平台通用验证
- [ ] 应用正常启动，无崩溃
- [ ] 加载 https://mornhub.help 网站内容
- [ ] 中文显示正常，无乱码
- [ ] 点击任意站点图标，能正常跳转

### 登录功能验证
- **海外 IP 用户**: 点击登录按钮，应显示邮箱/Google 登录界面
- **国内 IP 用户**: 点击登录按钮，应显示"功能开发中"提示

### 支付功能验证
- 点击"升级 Pro"按钮
- 应自动跳转到**系统浏览器**（而非应用内 WebView）
- 完成支付后，关闭浏览器，手动返回应用

### 离线缓存验证
1. 打开应用，浏览几个页面
2. 断开网络连接
3. 刷新应用或重新打开
4. 应显示缓存的内容（而非网络错误）

---

## 🛠️ 常见问题

### Android: 应用显示地址栏（未全屏）

**原因**: Digital Asset Links 验证失败

**解决方案**:
1. 确认官网已部署 `https://mornhub.help/.well-known/assetlinks.json`
2. 检查 assetlinks.json 中的 SHA256 指纹是否正确
3. 卸载应用，重新安装

### iOS: 刘海屏内容被遮挡

**原因**: 安全区未适配

**解决方案**:
官网已配置 `viewport-fit=cover` 和安全区 CSS，如仍有问题，请刷新应用缓存（下拉刷新）。

### Mac/Windows: 中文显示方框

**原因**: 字体未加载

**解决方案**:
1. 按 `Cmd/Ctrl + R` 刷新应用
2. 按 `F12` 打开开发者工具，检查网络请求
3. 确认字体文件已加载（查看 Network 面板）

### 所有平台: 官网更新后应用未同步

**解决方案**:
- **Android/iOS**: 下拉刷新页面
- **Mac/Windows**: 按 `Cmd/Ctrl + R` 刷新，或 `Cmd/Ctrl + Shift + R` 强制刷新

---

## 📞 技术支持

如遇到其他问题，请提供以下信息：

1. **平台**: Android / iOS / Mac / Windows
2. **系统版本**: 例如 Android 13, macOS 14.2, Windows 11
3. **问题描述**: 详细说明遇到的问题
4. **截图**: 如果可能，提供错误截图
5. **控制台日志**: 按 F12 打开开发者工具，查看 Console 面板的错误信息

---

## 📚 技术文档

详细的技术规格和构建指南，请参阅 `docs/SPEC_多端显化执行手册.md`。

---

**版本**: v1.0.0
**构建日期**: 2025-01-XX
**官网**: https://mornhub.help
**技术支持**: support@mornhub.help
```

---

### **3. 交付前检查清单**

在打包交付之前，请逐项确认：

#### **文件完整性**
- [ ] `android/app-release.apk` 存在且大小合理（1-2 MB）
- [ ] `ios/MornHub-1.0.0.ipa` 存在且大小合理（5-8 MB）
- [ ] `desktop/mac/MornHub_1.0.0_universal.dmg` 存在且大小合理（5-10 MB）
- [ ] `desktop/windows/MornHub_1.0.0_x64.msi` 存在且大小合理（5-10 MB）
- [ ] `README.md` 存在且内容完整
- [ ] `docs/` 文件夹包含所有技术文档

#### **功能验证**
- [ ] 每个安装包都已在对应平台上测试通过
- [ ] 所有验收测试（ACCEPTANCE_CHECKLIST.md）已完成
- [ ] 国内 IP 和海外 IP 登录功能已分别测试
- [ ] 支付跳转功能已测试（跳转到系统浏览器）
- [ ] 中文显示在所有平台上无乱码
- [ ] 离线缓存在所有平台上正常工作

#### **文档准确性**
- [ ] README.md 中的版本号已更新
- [ ] README.md 中的 TestFlight 链接已更新（如适用）
- [ ] README.md 中的构建日期已更新
- [ ] 所有技术文档与实际代码一致

#### **签名和证书**
- [ ] Android APK 已使用 release.keystore 签名
- [ ] iOS IPA 已通过 TestFlight 上传（如适用）
- [ ] Mac DMG 已签名（如有 Apple Developer 账号）
- [ ] Windows MSI 已签名（如有 Code Signing 证书，可选）

---

### **4. 打包交付命令**

完成所有构建后，使用以下命令创建最终交付包：

```bash
#!/bin/bash
# create-delivery-package.sh

# 设置版本号
VERSION="1.0.0"
PACKAGE_NAME="MornHub_MultiPlatform_v${VERSION}"

# 创建交付目录结构
mkdir -p ${PACKAGE_NAME}/{android,ios,desktop/{mac,windows},docs}

# 复制 Android APK
cp android/app/build/outputs/apk/release/app-release.apk \
   ${PACKAGE_NAME}/android/

# 复制 iOS IPA（如果存在）
if [ -f "ios/MornHub-${VERSION}.ipa" ]; then
  cp ios/MornHub-${VERSION}.ipa \
     ${PACKAGE_NAME}/ios/
fi

# 复制 Mac DMG
cp src-tauri/target/release/bundle/dmg/MornHub_${VERSION}_universal.dmg \
   ${PACKAGE_NAME}/desktop/mac/

# 复制 Windows MSI
cp src-tauri/target/release/bundle/msi/MornHub_${VERSION}_x64.msi \
   ${PACKAGE_NAME}/desktop/windows/

# 复制文档
cp 文档归档/SPEC_多端显化执行手册.md ${PACKAGE_NAME}/docs/
cp BUILD_COMMANDS.md ${PACKAGE_NAME}/docs/
cp ACCEPTANCE_CHECKLIST.md ${PACKAGE_NAME}/docs/

# 创建 README.md（使用上面的模板）
cat > ${PACKAGE_NAME}/README.md <<'EOF'
# MornHub 多端应用交付包 v1.0.0
...（完整的 README 内容）...
EOF

# 创建压缩包
zip -r ${PACKAGE_NAME}.zip ${PACKAGE_NAME}/

# 清理临时目录
rm -rf ${PACKAGE_NAME}/

echo "✅ 交付包创建成功: ${PACKAGE_NAME}.zip"
echo "📦 包大小: $(du -h ${PACKAGE_NAME}.zip | cut -f1)"
```

**使用方法**:
```bash
chmod +x create-delivery-package.sh
./create-delivery-package.sh
```

---

### **5. 交付物验收标准**

接收方应按照以下标准验收交付物：

#### **压缩包验收**
- [ ] 压缩包可正常解压，无损坏
- [ ] 文件结构符合上述"总览"章节的说明
- [ ] 总大小在 20-40 MB 之间（合理范围）

#### **Android APK 验收**
- [ ] 在 Android 设备上安装成功
- [ ] 打开应用，全屏显示（无地址栏）
- [ ] 加载 https://mornhub.help 网站内容
- [ ] 登录功能正常（或显示"开发中"提示）
- [ ] 支付跳转到系统浏览器
- [ ] 中文显示无乱码

#### **iOS IPA 验收**
- [ ] TestFlight 链接有效，可接受邀请
- [ ] 在 iPhone/iPad 上安装成功
- [ ] 打开应用，全屏显示
- [ ] 安全区适配正确（刘海屏无遮挡）
- [ ] 登录功能正常（或显示"开发中"提示）
- [ ] 支付跳转到 Safari
- [ ] 中文显示无乱码

#### **Mac DMG 验收**
- [ ] 在 Mac（Intel 或 M1/M2）上安装成功
- [ ] 打开应用，窗口大小合理
- [ ] 加载 https://mornhub.help 网站内容
- [ ] 登录功能正常（或显示"开发中"提示）
- [ ] 支付跳转到系统浏览器
- [ ] 中文显示无乱码
- [ ] Retina 显示清晰

#### **Windows MSI 验收**
- [ ] 在 Windows 10/11 上安装成功
- [ ] 打开应用，窗口大小合理
- [ ] 加载 https://mornhub.help 网站内容
- [ ] 登录功能正常（或显示"开发中"提示）
- [ ] 支付跳转到系统浏览器
- [ ] 中文显示无乱码
- [ ] 高 DPI 显示清晰

#### **文档验收**
- [ ] README.md 内容完整，说明清晰
- [ ] 技术文档齐全，可读性强
- [ ] 版本号、日期等信息准确

---

### **6. 后续维护说明**

#### **官网更新（无需重打包）**
由于所有端都是加载线上网站 https://mornhub.help，因此：
- ✅ 官网内容更新后，所有端自动同步（用户刷新即可）
- ✅ 无需重新构建和分发应用
- ✅ 新功能、UI 调整、BUG 修复都可通过官网更新实现

#### **需要重打包的情况**
只有在以下情况下才需要重新构建应用：
- ❌ 修改应用图标或启动画面
- ❌ 修改应用名称或 Bundle ID
- ❌ 修改官网 URL（例如从 mornhub.help 改为其他域名）
- ❌ 升级 Android/iOS/Tauri 框架版本
- ❌ 修改原生平台配置（如权限、URL Scheme 等）

#### **版本号管理**
建议的版本号命名规则：
- **主版本号（Major）**: 重大架构变更或功能重构（例如 1.x.x → 2.0.0）
- **次版本号（Minor）**: 新增功能或较大改进（例如 1.0.x → 1.1.0）
- **修订号（Patch）**: BUG 修复或小改进（例如 1.0.0 → 1.0.1）

---

## 🎯 **核心验证点**

### **验证1：官网更新无需重打包**
```bash
# 1. 打开任一端应用
# 2. 记录当前显示内容
# 3. 修改官网内容（例如改标题）
# 4. 刷新应用（Android/iOS下拉刷新，桌面端Cmd/Ctrl+R）
# 期望：立即看到更新后的内容，无需重新安装应用
```

### **验证2：PWA特性继承**
```bash
# 1. 打开Chrome DevTools（任一端按F12）
# 2. Application → Service Workers
# 期望：看到已注册的Service Worker
# 3. Application → Manifest
# 期望：看到manifest.json内容
```

### **验证3：中文字体无乱码**
```bash
# 1. 打开应用
# 2. 查看包含中文的页面（首页、登录框等）
# 期望：所有中文显示清晰，无方框乱码
# 3. 按F12打开DevTools，查看Computed样式
# 期望：font-family包含'Noto Sans SC'或'PingFang SC'等CJK字体
```

### **验证4：国内登录提示**
```bash
# 1. 使用国内IP（或VPN模拟）
# 2. 点击登录按钮
# 期望：显示"功能开发中"提示，列出即将上线的功能
# 3. 使用海外IP
# 4. 点击登录按钮
# 期望：正常显示登录界面（邮箱/Google登录）
```

---

## 🚨 **常见问题和解决方案**

### **问题1：Android TWA无法验证Digital Asset Links**
**症状：** 打开应用后显示地址栏（未进入全屏TWA模式）

**解决方案：**
```bash
# 1. 确认assetlinks.json已部署
curl https://mornhub.help/.well-known/assetlinks.json
# 应返回JSON，包含正确的SHA256指纹

# 2. 重新生成SHA256指纹
keytool -list -v -keystore release.keystore -alias mornhub | grep "SHA256"

# 3. 更新assetlinks.json中的指纹

# 4. 清除应用数据，重新安装
adb uninstall com.mornhub.app
adb install app-release.apk
```

### **问题2：iOS安全区适配问题（刘海屏遮挡内容）**
**症状：** 内容被刘海或底部横条遮挡

**解决方案：**
```html
<!-- 在官网HTML head中添加/确认 -->
<meta name="viewport" content="viewport-fit=cover" />
```

```css
/* 在globals.css中添加 */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### **问题3：Tauri中文乱码**
**症状：** 桌面应用显示方框或问号

**解决方案：**
```bash
# 方法1：使用Web Fonts（推荐）
# 确认官网已引入Google Fonts Noto Sans SC

# 方法2：打包本地字体
# 下载Noto Sans SC → public/fonts/
# 在CSS中@font-face引入

# 方法3：系统字体回退
# globals.css中设置font-family优先级
font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

### **问题4：支付跳转后无法返回应用**
**症状：** 支付完成后停留在浏览器，无法返回应用

**解决方案：**
```javascript
// Android TWA - 自动处理，无需额外配置

// iOS Capacitor - 配置URL Scheme
// Info.plist中添加
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>mornhub</string>
    </array>
  </dict>
</array>

// Stripe回调URL配置为：mornhub://payment/success
```

### **问题5：官网更新后应用未同步**
**症状：** 修改官网内容，应用内未看到更新

**解决方案：**
```bash
# 1. 确认应用加载的是线上URL（非本地资源）
# Android: AndroidManifest.xml中检查URL
# iOS: capacitor.config.json中检查server.url
# Tauri: tauri.conf.json中检查windows.url

# 2. 清除应用缓存
# Android: 设置 → 应用 → MornHub → 清除缓存
# iOS: 卸载重装
# 桌面: Cmd/Ctrl+Shift+R 强制刷新

# 3. 检查Service Worker缓存策略
# sw.js中确认使用网络优先策略
```

---

## 📚 **参考资料**

### **官方文档**
- Android TWA: https://developer.chrome.com/docs/android/trusted-web-activity/
- iOS Capacitor: https://capacitorjs.com/docs/ios
- Tauri: https://tauri.app/v1/guides/
- PWA: https://web.dev/progressive-web-apps/

### **Digital Asset Links生成器**
- https://developers.google.com/digital-asset-links/tools/generator

### **字体资源**
- Noto Sans SC: https://fonts.google.com/noto/specimen/Noto+Sans+SC
- PingFang SC: Mac系统自带
- Microsoft YaHei: Windows系统自带

---

## ✅ **最终检查清单**

在提交交付前，请逐项确认：

### **代码完整性**
- [ ] Android: AndroidManifest.xml配置正确
- [ ] Android: MainActivity.java存在且代码正确
- [ ] Android: build.gradle依赖完整
- [ ] Android: assetlinks.json已部署到官网
- [ ] iOS: capacitor.config.json配置正确
- [ ] iOS: Info.plist配置正确
- [ ] iOS: AppDelegate.swift代码正确
- [ ] Tauri: tauri.conf.json配置正确
- [ ] Tauri: main.rs代码正确
- [ ] 官网: manifest.json存在且正确
- [ ] 官网: Service Worker已注册
- [ ] 官网: CJK字体已引入

### **功能完整性**
- [ ] 所有端加载官网URL（非本地资源）
- [ ] 国内IP显示"功能开发中"
- [ ] 海外IP登录功能正常
- [ ] 支付跳转系统浏览器
- [ ] 返回键/手势正常
- [ ] 中文显示无乱码
- [ ] 离线缓存工作正常
- [ ] 官网更新无需重打包即可生效

### **安装包质量**
- [ ] Android APK签名正确
- [ ] iOS IPA通过TestFlight审核
- [ ] Mac DMG可正常安装
- [ ] Windows MSI可正常安装
- [ ] 所有包体积合理（<10MB）

### **文档完整性**
- [ ] BUILD_COMMANDS.md存在
- [ ] .env.example存在
- [ ] ACCEPTANCE_CHECKLIST.md存在
- [ ] 本Spec文档随代码提交

---

## 🎉 **完成标志**

当你能够：
1. 按照本文档从零开始构建出四端应用
2. 所有验收测试通过
3. 修改官网内容，所有端立即同步

**即表示显化成功！** ✨

---

**最后提醒：**
- 本文档是完全自解释的，任何AI或开发者无需额外上下文即可执行
- 所有配置和代码都是生产就绪的，直接复制使用
- 遇到问题先查看"常见问题"章节
- 核心原则：官网是唯一真相，端只是容器

**祝显化顺利！** 🚀
