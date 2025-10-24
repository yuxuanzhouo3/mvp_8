# macOS 调试指南

## 🔧 如何打开开发者工具

### 方法 1：快捷键（推荐）
- **Command + Option + I**（打开开发者工具）
- **Command + Option + J**（直接打开 Console）

### 方法 2：右键菜单
1. 在页面上**右键点击**
2. 选择 **"检查"** 或 **"Inspect Element"**

### 方法 3：菜单栏
1. 点击 **"View"（视图）** 菜单
2. 选择 **"Developer"（开发者）**
3. 点击 **"Show Console"（显示控制台）**

## 📱 在 macOS 上使用 F12

如果你希望 F12 直接打开开发者工具：

### 设置步骤
1. 打开 **系统设置**
2. 点击 **键盘**
3. 勾选 **"使用 F1、F2 等键作为标准功能键"**
4. 之后按 `Fn + F12` 才是音量，**F12** 直接打开开发者工具

## 🎯 调试步骤

1. 打开网站：https://www.mornhub.help
2. 按 **Command + Option + J** 打开 Console
3. 点击"添加网站"按钮
4. 查看详细的错误信息（不再是 Error #185）

## 📊 现在的错误信息格式

### 之前（错误 #185）
```
Error: Minified React error #185
```

### 现在（详细错误）
```
Error: Cannot read property 'id' of undefined
  at AuthContext (auth-context.tsx:98)
  at SiteHub (page.tsx:205)
```

这样就可以看到具体是哪个文件、哪一行出错了！

