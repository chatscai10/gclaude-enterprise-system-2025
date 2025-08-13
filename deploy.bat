@echo off
echo 🚀 開始自動部署...

node --version
npm --version

echo 📦 安裝依賴...
npm ci --production

echo 💾 初始化數據庫...
node -e "require('./database.js')"

echo ✅ 部署完成！
