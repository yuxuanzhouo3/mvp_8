#!/bin/bash
echo "🔍 查找所有可能导致无限循环的 setState 调用..."
echo ""

echo "=== 检查 app/page.tsx 中所有 setState 调用 ==="
grep -n "set[A-Z]" app/page.tsx | grep -v "useState\|const.*=.*set"
echo ""

echo "=== 检查是否有函数在渲染期间直接调用 setState ==="
grep -B5 -A5 "if.*setState\|&&.*setState\|||.*setState" app/page.tsx | head -50
echo ""

echo "=== 检查 UltraCompactSiteGrid 的 props ==="
grep -A20 "UltraCompactSiteGrid" app/page.tsx | grep -E "sites=|onRemove=|onReorder=|onToggleFavorite=|favorites="

