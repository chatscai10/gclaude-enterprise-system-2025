#!/bin/bash
# 自動部署腳本

echo "🚀 開始自動部署..."

# 檢查環境
node --version
npm --version

# 安裝依賴
echo "📦 安裝依賴..."
npm ci --production

# 數據庫初始化
echo "💾 初始化數據庫..."
node -e "require('./database.js')"

# 健康檢查
echo "🏥 執行健康檢查..."
timeout 30 bash -c 'until curl -f http://localhost:${PORT:-3007}/api/health; do sleep 2; done'

echo "✅ 部署完成！"
