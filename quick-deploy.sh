#!/bin/bash

echo "🚀 GClaude Enterprise System - 快速部署腳本"
echo "==========================================="
echo ""

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 請先安裝 Node.js 18 或更高版本"
    exit 1
fi

# 檢查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 請先安裝 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 安裝依賴
echo "📦 安裝依賴套件..."
npm install

# 檢查安裝結果
if [ $? -eq 0 ]; then
    echo "✅ 依賴安裝完成"
else
    echo "❌ 依賴安裝失敗"
    exit 1
fi

echo ""
echo "🎯 可用的部署選項:"
echo "1. Render.com (推薦)"
echo "2. Railway"
echo "3. Vercel"
echo "4. Google Cloud Run"
echo ""
echo "📋 部署檔案已準備完成:"
echo "• render.yaml - Render.com 自動部署"
echo "• Dockerfile - 容器化部署"
echo "• .gitignore - Git 忽略檔案"
echo ""
echo "🔗 快速部署到 Render:"
echo "https://render.com/deploy?repo=YOUR_GITHUB_REPO_URL"
echo ""
echo "✨ 部署就緒！請按照 deployment-status.json 中的指引進行部署"
        