# 浏览器报错问题 - Issue Report for Codex

## 问题描述

移动浏览器访问 https://mornhub.help 时出现以下错误：

```
Application error: a client-side exception has occurred
(see the browser console for more information).
```

页面完全无法加载，只显示错误信息。

---

## 问题环境

- **访问方式**: 移动浏览器（手机浏览器）
- **用户IP**: 国内IP
- **部署平台**: Vercel
- **框架**: Next.js 14.2.16
- **当前Git提交**: `b9e3fd0` (fix: 恢复国内用户邮箱登录界面显示)

---

## 问题历史

1. **初始状态**（在尝试修复前）:
   - ✅ 页面能正常显示网站列表
   - ❌ 点击登录按钮后崩溃

2. **尝试修复后**（commit `00c5b60`, `0828807`, `717a898`）:
   - ❌ 页面直接无法加载
   - 错误：Application error: a client-side exception has occurred

3. **回滚到当前状态** (`b9e3fd0`):
   - ❌ 页面仍然无法加载
   - 同样的错误信息

---

## 已完成的工作

✅ **问题1-3已解决**：
- 智能解析界面移动端适配 (`components/parse-sites-modal.tsx`)
- 网站网格布局优化 (`components/ultra-compact-site-grid.tsx`)
- APK链接在WebView中的打开方式 (`components/website-card.tsx`)

✅ **问题4已解决（数据库同步）**：
- 所有数据操作都已使用 `dbAdapter` 适配器模式
- 支持国内IP用CloudBase、海外IP用Supabase
- 代码在当前提交 `b9e3fd0` 中已包含

---

## 需要Codex解决的问题

**只解决这一个问题：修复移动浏览器的客户端异常错误**

### 要求

1. **不要修改其他功能**：
   - ❌ 不要改数据库同步逻辑（已经正确）
   - ❌ 不要改UI组件（parse-sites-modal, ultra-compact-site-grid, website-card）
   - ❌ 不要改认证流程

2. **只诊断和修复**：
   - ✅ 找出导致 "Application error: a client-side exception" 的根本原因
   - ✅ 修复后确保页面能正常加载和显示
   - ✅ 不引入新的问题

---

## 可能的问题点（参考）

根据之前的调试，可能相关的文件：

1. **`components/auth-modal.tsx`** (line 26-27)
   - 使用 `useGeo()` 获取 `languageCode`
   - 可能在地理位置数据未就绪时出错

2. **`lib/database/cloudbase-client.ts`** (line 36)
   - CloudBase SDK 立即初始化
   - 可能在某些环境下初始化失败

3. **`app/page.tsx`** (line 278)
   - `createDatabaseAdapter(isChina, user.id)`
   - `isChina` 可能在某些时候为 undefined

---

## 验证方案

修复后请确认：

1. ✅ 移动浏览器能正常打开 mornhub.help
2. ✅ 能看到网站列表（不是错误页面）
3. ✅ 其他功能不受影响（登录、收藏、自定义网站）

---

## Git操作建议

1. 基于当前 `b9e3fd0` 提交创建修复
2. 提交信息格式：`fix: 修复移动浏览器客户端异常错误`
3. 只包含必要的最小改动

---

**请Codex专注于解决这个浏览器报错问题，不要触碰其他已经工作正常的部分。**
