#!/bin/bash

echo "🧹 GClaude Enterprise 系統清理與部署腳本"
echo "============================================"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}📋 步驟 1: 檢查必要工具...${NC}"

# 檢查 Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI 未安裝，正在安裝...${NC}"
    npm install -g @railway/cli
else
    echo -e "${GREEN}✅ Railway CLI 已安裝${NC}"
fi

# 檢查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI 未安裝，正在安裝...${NC}"
    npm install -g vercel
else
    echo -e "${GREEN}✅ Vercel CLI 已安裝${NC}"
fi

echo ""
echo -e "${YELLOW}🧹 步驟 2: 清理舊專案...${NC}"
echo ""
echo "【Railway 清理】"
echo "請手動執行以下命令清理 Railway 舊專案："
echo "  railway login"
echo "  railway list"
echo "  railway delete [PROJECT_ID]  # 對每個舊專案執行"
echo ""
echo "【Vercel 清理】"
echo "請手動執行以下命令清理 Vercel 舊專案："
echo "  vercel login"
echo "  vercel list"
echo "  vercel remove [PROJECT_NAME]  # 對每個舊專案執行"
echo ""
echo "【Render 清理】"
echo "請訪問 https://dashboard.render.com/ 手動刪除舊服務"
echo ""

read -p "清理完成後按 Enter 繼續..."

echo ""
echo -e "${BLUE}🚀 步驟 3: 部署到 Railway...${NC}"
echo ""

echo "初始化 Railway 專案..."
railway login
railway init gclaude-enterprise-system

echo "設定環境變量..."
railway env set PORT=3007
railway env set NODE_ENV=production
railway env set JWT_SECRET=gclaude-enterprise-super-secret-key-2024
railway env set TELEGRAM_BOT_TOKEN=7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc
railway env set TELEGRAM_BOSS_GROUP_ID=-1002658082392

echo "開始部署..."
railway up

echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo -e "${YELLOW}📋 請進行以下測試：${NC}"
echo "1. 訪問健康檢查端點: /api/health"
echo "2. 測試管理員登入: admin/admin123"
echo "3. 測試員工登入: employee/employee123"
echo "4. 驗證權限分離是否正確"
echo "5. 確認 Telegram 通知功能"
echo ""