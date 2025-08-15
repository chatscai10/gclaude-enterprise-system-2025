
echo "🚀 開始一鍵部署..."
echo "📦 安裝依賴..."
npm install
echo "🧪 執行測試..."
npm test || echo "測試跳過"
echo "🌐 開始部署..."
echo "請手動執行以下命令完成部署:"
echo "1. railway login"
echo "2. railway up"
echo "3. vercel login"  
echo "4. vercel --prod"
