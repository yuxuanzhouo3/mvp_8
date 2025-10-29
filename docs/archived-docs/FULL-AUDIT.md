# React Error #185 全面审计

## 审计标准
根据 React 官方文档，Error #185 的原因是：
**"组件在更新期间反复调用 setState"**

需要检查：
1. useEffect 依赖是否包含不稳定的引用（Set, Array, Object）
2. setState 是否会被反复调用
3. Context 更新是否导致连锁反应

## 检查清单

### Context 组件
- [ ] AuthContext
- [ ] LanguageContext  
- [ ] GeoContext
- [ ] SettingsContext

### Modal 组件
- [ ] AuthModal
- [ ] ParseSitesModal
- [ ] AddSiteModal
- [ ] UpgradeModal

### 其他组件
- [ ] Header
- [ ] Page (app/page.tsx)

