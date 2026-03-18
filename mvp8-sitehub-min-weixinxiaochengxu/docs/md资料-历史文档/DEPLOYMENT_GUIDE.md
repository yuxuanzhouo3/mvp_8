# Jeff策略落地部署指南

## 🎯 执行概览

我们已经完成了核心功能开发，现在需要部署和测试。

## 📋 部署清单

### ✅ 已完成
- [x] 剪贴板智能检测功能代码
- [x] 智能文本解析器 (50+平台支持)
- [x] 跨平台API接口设计
- [x] 产品策略文档

### 🔄 进行中
- [ ] 云函数部署
- [ ] 微信小程序权限配置
- [ ] 功能测试

### 📝 待开始
- [ ] MornGPT集成
- [ ] API接口开发
- [ ] 数据同步测试

---

## 🚀 立即执行步骤

### 步骤1：部署云函数 (5分钟)

```bash
# 进入云函数目录
cd taro-apps/mvp8-sitehub-min-02/cloudfunctions/callAIGateway

# 安装依赖（如果还没有）
npm install

# 上传云函数
# 在微信开发者工具中：
# 1. 右键点击 callAIGateway 文件夹
# 2. 选择"上传并部署：云端安装依赖"
# 3. 等待部署完成
```

**部署状态检查**：
- ✅ 云函数列表中显示 `callAIGateway`
- ✅ 状态显示"已部署"
- ✅ 版本号已更新

---

### 步骤2：配置微信小程序权限 (3分钟)

#### 2.1 配置隐私协议

在 `app.json` 中添加权限声明：

```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于为你推荐合适的网站"
    }
  },
  "requiredPrivateInfos": [
    "getClipboardData"
  ],
  "lazyCodeLoading": "requiredComponents"
}
```

#### 2.2 在微信公众平台配置

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入"设置" → "基本设置" → "服务类目"
3. 确保已配置合适的服务类目
4. 进入"设置" → "隐私设置"
5. 在"用户隐私保护指引"中添加：
   ```
   我们将获取你的剪贴板内容，用于智能识别和解析你复制的网站链接。
   你可以随时在设置中关闭此功能。
   ```

#### 2.3 添加隐私协议弹窗

创建 `privacy-agreement.wxml`：

```xml
<view class="privacy-agreement">
  <view class="agreement-content">
    <text class="agreement-title">隐私保护提示</text>
    <text class="agreement-text">
      为了提供更好的服务，我们需要获取你的剪贴板权限，
      用于智能识别你复制的网站链接。
      
      我们承诺：
      • 只在你使用"自定义网站"功能时检测剪贴板
      • 不会上传或保存你的剪贴板内容
      • 你可以随时拒绝授权
    </text>
  </view>
  <button class="agree-btn" bindtap="agreePrivacy">同意并继续</button>
  <button class="disagree-btn" bindtap="disagreePrivacy">暂不授权</button>
</view>
```

---

### 步骤3：本地测试 (10分钟)

#### 3.1 启动开发工具

```bash
# 在微信开发者工具中打开项目
# 路径：taro-apps/mvp8-sitehub-min-02
```

#### 3.2 测试剪贴板功能

**测试场景1：复制单个URL**
```
1. 打开微信聊天
2. 复制一个链接：https://chatgpt.com
3. 返回小程序，切换到"自定义网站"分类
4. 等待2秒，应该弹出提示："检测到剪贴板中包含链接，是否自动解析？"
5. 点击"立即解析"
6. 应该显示解析结果：ChatGPT对话
```

**测试场景2：复制多个URL**
```
1. 复制包含多个链接的文本：
   "推荐两个AI工具：
   https://chatgpt.com
   https://claude.ai"
2. 返回小程序
3. 应该解析出2个链接
4. 点击"一键添加全部"
5. 验证两个网站都被添加
```

**测试场景3：复制无URL文本**
```
1. 复制纯文本："今天天气不错"
2. 返回小程序
3. 不应该弹出任何提示
```

#### 3.3 测试智能解析器

验证以下平台识别是否正确：
- AI工具：chatgpt.com, claude.ai, gemini.google.com
- 开发工具：github.com, gitlab.com, stackoverflow.com
- 社交媒体：weibo.com, twitter.com, xiaohongshu.com
- 视频平台：bilibili.com, youtube.com
- 购物平台：taobao.com, jd.com

---

### 步骤4：提交审核 (待测试完成后)

#### 4.1 准备审核材料

1. **功能截图**：
   - 剪贴板检测提示
   - 智能解析结果
   - 批量添加效果

2. **功能说明**：
   ```
   本次更新内容：
   1. 新增剪贴板智能检测功能，自动识别用户复制的网站链接
   2. 支持50+主流平台智能识别
   3. 优化自定义网站管理体验
   ```

#### 4.2 提交审核

1. 在微信公众平台提交审核
2. 填写版本号：v1.2.0
3. 填写更新说明
4. 等待审核（通常1-3个工作日）

---

## 🔮 下一步：MornGPT集成 (未来2周)

### 集成方案

```javascript
// 在MornGPT中调用SiteHub API
import { CrossPlatformAPI } from '@/utils/cross-platform-api'

// 获取用户收藏的网站
const userSites = await CrossPlatformAPI.getUserFavorites(userId)

// 在对话中引用网站
const context = `用户收藏的网站：${userSites.map(s => s.name).join(', ')}`
```

### API端点开发

需要在Supabase创建Edge Functions：

```typescript
// supabase/functions/get-user-sites/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const { userId } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  const { data, error } = await supabase
    .from('sitehub_custom_sites')
    .select('*')
    .eq('user_id', userId)
  
  return new Response(
    JSON.stringify({ sites: data }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

---

## 📊 预期效果

### 用户体验提升
- ⏱️ **节省时间**: 从复制到添加，从30秒降到5秒
- 🎯 **准确率**: 智能识别准确率 >95%
- 😊 **满意度**: 预期用户满意度提升40%

### 商业价值
- 👥 **用户留存**: 预期月活提升25%
- 💰 **付费转化**: 预期付费率提升15%
- 🔄 **跨产品使用**: 预期30%用户同时使用SiteHub和MornGPT

---

## ⚠️ 注意事项

### 1. 隐私合规
- ✅ 必须在隐私协议中明确说明剪贴板使用目的
- ✅ 必须获得用户明确授权
- ✅ 只在必要时检测剪贴板
- ✅ 不保存或上传剪贴板原始内容

### 2. 性能优化
- ⚡ 定时检查间隔建议2秒以上
- ⚡ 避免在后台持续检查
- ⚡ 检测到相同内容不重复提示

### 3. 用户体验
- 🎯 只在自定义网站分类页面激活
- 🎯 提示文案友好且清晰
- 🎯 提供"不再提示"选项

---

## 🆘 遇到问题？

### 常见问题

**Q1: 剪贴板检测不工作？**
```
A: 检查以下几点：
1. 是否在"自定义网站"分类页面
2. 是否授权了剪贴板权限
3. 控制台是否有错误日志
```

**Q2: 解析不准确？**
```
A: 可以在 text-parser.js 中添加更多平台映射
```

**Q3: 提示过于频繁？**
```
A: 调整检查间隔时间，或添加"不再提示今日"功能
```

---

## 📞 支持

如有问题，请联系：
- 技术支持：dev@mornhub.net
- 产品反馈：feedback@mornhub.net

---

**祝部署顺利！** 🎉






