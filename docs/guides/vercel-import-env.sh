#!/bin/bash
# Vercel 环境变量一键导入脚本

echo "🚀 开始导入环境变量到 Vercel..."

# 读取环境变量文件
ENV_FILE=".env.vercel.production"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 未找到 $ENV_FILE 文件"
    exit 1
fi

# 临时设置环境变量
export $(cat "$ENV_FILE" | grep -v '^#' | xargs)

# 使用 vercel env 命令导入
while IFS='=' read -r key value; do
    # 跳过注释和空行
    [[ $key =~ ^#.*$ ]] && continue
    [[ -z $key ]] && continue
    
    echo "添加: $key"
    # 根据值判断是否标记为 sensitive
    if [[ $value =~ (SECRET|KEY|TOKEN|PASSWORD|PASSWD)$ ]]; then
        vercel env add "$key" production --yes
    else
        vercel env add "$key" production --yes
    fi
done < "$ENV_FILE"

echo "✅ 环境变量导入完成！"

