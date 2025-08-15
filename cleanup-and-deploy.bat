@echo off
echo 🧹 GClaude Enterprise 系統清理與部署腳本
echo ============================================

echo.
echo 📋 步驟 1: 檢查必要工具...
where railway >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI 未安裝，正在安裝...
    npm install -g @railway/cli
) else (
    echo ✅ Railway CLI 已安裝
)

where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI 未安裝，正在安裝...
    npm install -g vercel
) else (
    echo ✅ Vercel CLI 已安裝
)

echo.
echo 🧹 步驟 2: 清理舊專案...
echo.
echo 【Railway 清理】
echo 請手動執行以下命令清理 Railway 舊專案：
echo   railway login
echo   railway list
echo   railway delete [PROJECT_ID]  # 對每個舊專案執行
echo.
echo 【Vercel 清理】
echo 請手動執行以下命令清理 Vercel 舊專案：
echo   vercel login
echo   vercel list
echo   vercel remove [PROJECT_NAME]  # 對每個舊專案執行
echo.
echo 【Render 清理】
echo 請訪問 https://dashboard.render.com/ 手動刪除舊服務
echo.

pause
echo.
echo 🚀 步驟 3: 部署到 Railway...
echo.

echo 初始化 Railway 專案...
railway login
railway init gclaude-enterprise-system

echo 設定環境變量...
railway env set PORT=3007
railway env set NODE_ENV=production
railway env set JWT_SECRET=gclaude-enterprise-super-secret-key-2024
railway env set TELEGRAM_BOT_TOKEN=7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc
railway env set TELEGRAM_BOSS_GROUP_ID=-1002658082392

echo 開始部署...
railway up

echo.
echo ✅ 部署完成！
echo.
echo 📋 請進行以下測試：
echo 1. 訪問健康檢查端點: /api/health
echo 2. 測試管理員登入: admin/admin123
echo 3. 測試員工登入: employee/employee123
echo 4. 驗證權限分離是否正確
echo 5. 確認 Telegram 通知功能
echo.

pause