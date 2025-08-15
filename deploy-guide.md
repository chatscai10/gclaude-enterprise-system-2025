# 🚀 GClaude Enterprise System 部署指南

## 📋 部署前準備檢查清單

✅ Git 倉庫已初始化並提交  
✅ Railway CLI 已安裝 (v4.6.3)  
✅ Vercel CLI 已安裝 (v44.7.3)  
✅ Docker配置文件已準備  
✅ 環境變數配置就緒  

---

## 🌐 Railway 部署步驟

### 1. 登入 Railway
```bash
railway login
# 這會開啟瀏覽器進行OAuth認證
```

### 2. 初始化 Railway 專案
```bash
cd "D:\0813\gclaude-enterprise-system"
railway init
# 選擇 "Create new project"
# 專案名稱: gclaude-enterprise-system
```

### 3. 部署到 Railway
```bash
railway up
# 這會自動偵測Node.js專案並開始部署
```

### 4. 設定環境變數
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3007
```

### 5. 獲取部署網址
```bash
railway domain
# 或者到 Railway Dashboard 查看
```

---

## ▲ Vercel 部署步驟

### 1. 登入 Vercel
```bash
vercel login
# 輸入email進行認證
```

### 2. 部署專案
```bash
cd "D:\0813\gclaude-enterprise-system"
vercel
# 選擇設定:
# - Set up and deploy? Yes
# - Which scope? (選擇你的帳號)
# - Link to existing project? No
# - Project name? gclaude-enterprise-system
# - In which directory? ./
# - Want to override settings? No
```

### 3. 生產部署
```bash
vercel --prod
```

---

## 🐳 Docker 部署步驟

### 1. 建置 Docker 映像
```bash
cd "D:\0813\gclaude-enterprise-system"
docker build -t gclaude-enterprise .
```

### 2. 運行容器
```bash
docker run -d \
  --name gclaude-enterprise \
  -p 3007:3007 \
  -v ./data:/app/data \
  gclaude-enterprise
```

### 3. 檢查容器狀態
```bash
docker ps
docker logs gclaude-enterprise
```

---

## 🌍 GitHub Pages 靜態部署

### 1. 創建 GitHub 倉庫
```bash
git remote add origin https://github.com/yourusername/gclaude-enterprise-system.git
git branch -M main
git push -u origin main
```

### 2. 啟用 GitHub Actions
- 到 GitHub 倉庫設定
- 啟用 Actions
- 使用提供的 `.github/workflows/deploy.yml`

---

## 🔧 部署後驗證步驟

### 1. 健康檢查
```bash
curl https://your-app-url.com/api/health
```

### 2. 功能測試
```bash
# 執行我們的瀏覽器驗證腳本
node scripts/production-browser-verification.js
```

### 3. 監控設定
- 檢查 Telegram 通知是否正常
- 驗證監控儀表板訪問

---

## 📊 部署狀態監控

部署完成後，請訪問：

- **主要應用**: https://your-app-url.com
- **健康檢查**: https://your-app-url.com/api/health  
- **API文檔**: https://your-app-url.com/api
- **監控儀表板**: https://your-app-url.com:3008

---

## ⚠️ 常見問題解決

### Railway 部署失敗
```bash
railway logs
railway restart
```

### Vercel 部署失敗
```bash
vercel logs
vercel --debug
```

### Docker 容器問題
```bash
docker logs gclaude-enterprise
docker exec -it gclaude-enterprise sh
```

---

## 🎯 下一步建議

1. 設定自訂網域名稱
2. 配置 SSL 憑證
3. 設定 CDN 加速
4. 建立監控告警
5. 定期備份資料

---

**🤖 Generated with Claude Code | Co-Authored-By: Claude <noreply@anthropic.com>**