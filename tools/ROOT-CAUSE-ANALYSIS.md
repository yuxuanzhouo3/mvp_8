# React Error #185 根因分析

## 最大问题：**Context 循环更新** 🔥

### 问题链路：

```
1. GeoContext 初始化 → 调用 API → 设置 location
   ↓
2. location 变化 → 重新计算 geoLanguageCode
   ↓
3. LanguageContext 的 useEffect 检测到 geoLanguageCode 变化
   ↓
4. 调用 setLanguageState(effectiveGeoLanguage)
   ↓
5. language 变化 → 触发所有使用 language 的组件重渲染
   ↓
6. 回到步骤 1... (如果 location 再次变化)
```

### 关键代码：

**contexts/language-context.tsx** (第 25-34 行)
```tsx
useEffect(() => {
  const stored = wxStorage.get<string>("sitehub_language")
  if (stored === "zh" || stored === "en") {
    setLanguageState(stored)
    setIsAuto(false)
  } else {
    setLanguageState(effectiveGeoLanguage)  // ⚠️ 每次 geoLanguageCode 变化都会调用
    setIsAuto(true)
  }
}, [effectiveGeoLanguage])  // ⚠️ 依赖变化导致反复执行
```

## 解决方案

### 方案1：添加值比较（最简单）✅

```tsx
useEffect(() => {
  const stored = wxStorage.get<string>("sitehub_language")
  const newLanguage = stored === "zh" || stored === "en" ? stored : effectiveGeoLanguage
  
  // ✅ 只在值真正变化时才更新
  setLanguageState(prev => {
    if (prev === newLanguage) return prev
    return newLanguage
  })
  
  setIsAuto(prev => {
    const shouldBeAuto = !(stored === "zh" || stored === "en")
    if (prev === shouldBeAuto) return prev
    return shouldBeAuto
  })
}, [effectiveGeoLanguage])
```

### 方案2：使用 useRef 记录上一次的值

```tsx
const prevEffectiveGeoLanguage = useRef(effectiveGeoLanguage)

useEffect(() => {
  if (prevEffectiveGeoLanguage.current === effectiveGeoLanguage) return
  
  const stored = wxStorage.get<string>("sitehub_language")
  if (stored === "zh" || stored === "en") {
    setLanguageState(stored)
    setIsAuto(false)
  } else {
    setLanguageState(effectiveGeoLanguage)
    setIsAuto(true)
  }
  
  prevEffectiveGeoLanguage.current = effectiveGeoLanguage
}, [effectiveGeoLanguage])
```

### 方案3：完全移除依赖（最激进）

```tsx
useEffect(() => {
  const stored = wxStorage.get<string>("sitehub_language")
  if (stored === "zh" || stored === "en") {
    setLanguageState(stored)
    setIsAuto(false)
  } else {
    setLanguageState(effectiveGeoLanguage)
    setIsAuto(true)
  }
}, [])  // ⚠️ 只执行一次，不响应 geoLanguageCode 变化
```

## 我的推荐

**使用方案1**：最小改动，最安全。

