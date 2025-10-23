# SiteHub 多端应用构建指南

## 📱 一源多现架构

- **唯一内核**：https://mornhub.help（PWA网站）
- **多端容器**：Android、iOS、Mac、Windows仅作为加载网址的壳
- **零修改原则**：所有端直接加载线上网址，网站更新自动生效

---

## 🚀 快速构建

### Mac Desktop
```bash
cd mac-tauri
cargo tauri build
# 输出: src-tauri/target/release/bundle/dmg/SiteHub_1.0.0_x64.dmg
```

### Windows Desktop
```bash
cd windows-tauri
cargo tauri build
# 输出: src-tauri/target/release/bundle/msi/SiteHub_1.0.0_x64.msi
```

### Android
```bash
cd android-twa
./gradlew assembleRelease
# 输出: app/build/outputs/apk/release/app-release.apk
```

### iOS
```bash
cd ios-capacitor
npm install && npm run sync && npm run open
# 在Xcode中Archive
```

---

## ✅ 验收标准

1. 启动后直接显示 https://mornhub.help
2. 全屏无地址栏
3. 中文显示正常
4. 所有功能正常工作

详细文档请查看项目根目录的 `SPEC_多端显化执行手册.md`
