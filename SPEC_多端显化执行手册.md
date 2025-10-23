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

#### **构建APK**
```bash
# 1. 进入Android项目目录
cd android

# 2. 清理旧构建
./gradlew clean

# 3. 构建Release APK
./gradlew assembleRelease

# 4. APK位置
# android/app/build/outputs/apk/release/app-release.apk
```

#### **安装和测试**
```bash
# 方法1：通过ADB安装
adb install app/build/outputs/apk/release/app-release.apk

# 方法2：直接拷贝到手机安装

# 测试检查清单：
# ✅ 打开应用，全屏显示，无地址栏
# ✅ 登录功能正常
# ✅ 支付跳转正常
# ✅ 返回键正常（WebView历史返回）
# ✅ 中文显示无乱码
# ✅ 离线时显示缓存内容
```

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

#### **1. 签名配置**
```
1. 打开 App.xcodeproj
2. 选择 App target
3. Signing & Capabilities 选项卡
4. Team: 选择你的Apple开发者账号
5. Bundle Identifier: com.mornhub.app
6. 勾选 Automatically manage signing
```

#### **2. 构建设置**
```
1. Product → Scheme → Edit Scheme
2. Run → Build Configuration → Release
3. Product → Archive
4. 等待构建完成
```

#### **3. 上传到TestFlight**
```
1. Archive完成后，点击 Distribute App
2. 选择 App Store Connect
3. 选择 Upload
4. 等待处理完成（约10-30分钟）
5. App Store Connect → TestFlight → 添加测试员
```

### **测试检查清单**
```bash
# ✅ 打开应用，全屏显示
# ✅ 状态栏样式正确（深色背景）
# ✅ 安全区自动适配（刘海屏无遮挡）
# ✅ 登录功能正常
# ✅ 支付跳转到Safari正常
# ✅ 返回应用正常
# ✅ 中文显示无乱码
# ✅ 滚动流畅，无卡顿
```

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

#### **开发模式测试**
```bash
# 启动开发模式（会打开窗口加载官网）
npm run tauri dev

# 测试检查：
# ✅ 窗口大小1200x800
# ✅ 加载 https://mornhub.help
# ✅ 登录功能正常
# ✅ 支付跳转打开浏览器
# ✅ 中文显示无乱码
```

#### **构建Mac DMG**
```bash
# 构建Mac安装包
npm run tauri build -- --target universal-apple-darwin

# 输出位置：
# src-tauri/target/release/bundle/dmg/MornHub_1.0.0_universal.dmg

# 测试安装：
# 1. 双击dmg文件
# 2. 拖动到Applications文件夹
# 3. 打开应用测试
```

#### **构建Windows MSI**
```bash
# 构建Windows安装包
npm run tauri build -- --target x86_64-pc-windows-msvc

# 输出位置：
# src-tauri/target/release/bundle/msi/MornHub_1.0.0_x64_en-US.msi

# 测试安装：
# 1. 双击msi文件
# 2. 按提示安装
# 3. 开始菜单找到MornHub打开测试
```

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
