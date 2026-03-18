#!/bin/bash

echo "🚀 上传业务域名校验文件到云开发静态托管"
echo "========================================="

# 环境ID
ENV_ID="cloudbase-1gnip2iaa08260e5"

# 检查是否安装了 cloudbase CLI
if ! command -v tcb &> /dev/null; then
    echo "❌ 未安装 Cloudbase CLI"
    echo "📥 正在安装..."
    npm install -g @cloudbase/cli
fi

# 检查 cloudbase-static 目录
if [ ! -d "cloudbase-static" ]; then
    echo "❌ cloudbase-static 目录不存在"
    exit 1
fi

# 检查目录中是否有校验文件
VERIFY_FILE=$(ls cloudbase-static/wx*.txt 2>/dev/null | head -n 1)

if [ -z "$VERIFY_FILE" ]; then
    echo "❌ 未找到校验文件 (wx*.txt)"
    echo "请将微信提供的校验文件复制到 cloudbase-static 目录"
    exit 1
fi

echo "✅ 找到校验文件: $VERIFY_FILE"
echo ""

# 登录提示
echo "📝 请先登录腾讯云..."
tcb login

# 上传文件
echo ""
echo "📤 上传文件到静态托管..."
tcb hosting deploy cloudbase-static -e $ENV_ID

echo ""
echo "✅ 上传完成!"
echo "请继续配置DNS和绑定域名"

