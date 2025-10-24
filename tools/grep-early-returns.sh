#!/bin/bash
# 简单的早期返回检查脚本
# 列出所有可能有早期返回的文件和行号（不改码）

echo "🔍 Scanning for potential early returns..."

# 查找所有 React 组件文件中的早期返回模式
grep -RIn --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
  -E "if\s*\(.*\)\s*return" \
  components app 2>/dev/null | \
  grep -v "node_modules" | \
  grep -v ".next" | \
  sed -E 's/:[0-9]+:/:/g' | \
  sort -u

echo ""
echo "💡 Review the output above. Check if these early returns come BEFORE any hooks."
echo "   If they do, they might cause Hook count inconsistency errors."

