#!/bin/bash
# 检查可能存在的早期返回问题（Hook 之前的 return）

echo "🔍 Checking for potential early returns before hooks..."

# 查找所有 React 组件文件
files=$(find components app -name "*.tsx" -type f 2>/dev/null)

risky_files=()

for file in $files; do
  # 检查是否包含 Hook（useState, useEffect 等）
  if grep -q "useState\|useEffect\|useMemo\|useCallback\|useRef" "$file" 2>/dev/null; then
    # 检查是否有 if...return 在文件中
    if grep -q "if.*return" "$file" 2>/dev/null; then
      # 获取第一个 Hook 的行号
      first_hook_line=$(grep -n "useState\|useEffect\|useMemo\|useCallback\|useRef" "$file" | head -1 | cut -d: -f1)
      
      # 检查在这之前是否有 return
      if [ -n "$first_hook_line" ]; then
        # 检查 Hook 之前是否有 return 语句
        if head -n "$first_hook_line" "$file" | grep -q "return"; then
          risky_files+=("$file")
        fi
      fi
    fi
  fi
done

if [ ${#risky_files[@]} -eq 0 ]; then
  echo "✅ No risky files found! All components look safe."
else
  echo "⚠️  Found ${#risky_files[@]} potentially risky file(s):"
  for file in "${risky_files[@]}"; do
    echo "  - $file"
  done
  echo ""
  echo "💡 These files may have early returns before hooks. Review them manually."
fi

