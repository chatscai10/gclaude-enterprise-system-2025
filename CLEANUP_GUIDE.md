# 🧹 第三方伺服器清理與部署指南

## 📋 清理步驟

### 1. Railway 清理
```bash
# 安裝 Railway CLI (如果還沒安裝)
npm install -g @railway/cli

# 登入 Railway
railway login

# 查看所有專案
railway list

# 刪除舊專案 (逐一執行)
railway delete [PROJECT_ID]

# 或者透過網頁界面：
# 1. 訪問 https://railway.app/dashboard
# 2. 點擊每個舊專案
# 3. Settings > Danger > Delete Project
```

### 2. Render 清理
```bash
# Render 沒有 CLI，需要透過網頁界面清理：
# 1. 訪問 https://dashboard.render.com/
# 2. 點擊每個舊服務
# 3. Settings > Delete Service
# 4. 確認刪除
```

### 3. Vercel 清理
```bash
# 安裝 Vercel CLI (如果還沒安裝)
npm install -g vercel

# 登入 Vercel
vercel login

# 查看所有專案
vercel list

# 刪除舊專案 (逐一執行)
vercel remove [PROJECT_NAME]

# 或者透過網頁界面：
# 1. 訪問 https://vercel.com/dashboard
# 2. 點擊每個舊專案
# 3. Settings > Advanced > Delete Project
```

## 🚀 重新部署步驟

### Railway 部署 (推薦)
1. **建立新專案**
```bash
# 在專案目錄執行
cd /path/to/gclaude-enterprise-system
railway login
railway init
railway add
```

2. **設定環境變量**
```bash
railway env set PORT=3007
railway env set NODE_ENV=production
railway env set JWT_SECRET=gclaude-enterprise-super-secret-key-2024
railway env set TELEGRAM_BOT_TOKEN=7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc
railway env set TELEGRAM_BOSS_GROUP_ID=-1002658082392
```

3. **部署**
```bash
railway up
```

### Render 部署 (替代方案)
1. **GitHub 連接**
   - 確保程式碼已推送到 GitHub
   - 在 Render 儀表板連接 GitHub repo

2. **建立 Web Service**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

3. **設定環境變量**
   - 在 Render 服務設定中添加所有環境變量

### Vercel 部署 (替代方案)
1. **部署命令**
```bash
vercel --prod
```

2. **設定環境變量**
```bash
vercel env add PORT
vercel env add NODE_ENV
vercel env add JWT_SECRET
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_BOSS_GROUP_ID
```

## ✅ 部署後驗證清單

### 基本功能測試
- [ ] 健康檢查: `https://your-app.railway.app/api/health`
- [ ] 登入頁面: `https://your-app.railway.app/`
- [ ] 管理員登入: admin/admin123 → 重定向到 `/admin`
- [ ] 員工登入: employee/employee123 → 重定向到 `/employee`

### 權限分離測試
- [ ] 管理員頁面顯示完整管理功能
- [ ] 員工頁面只顯示員工功能
- [ ] 品項管理等管理功能不顯示給員工

### Telegram 通知測試
- [ ] 管理員登入 → 只發送到老闆群組
- [ ] 員工登入 → 只發送到老闆群組
- [ ] 其他通知按分類發送

### API 功能測試
- [ ] 員工管理 API
- [ ] 出勤打卡 API
- [ ] 營收記錄 API
- [ ] 維修申請 API
- [ ] 升遷投票 API

## 🎯 清理優先順序

1. **Railway** - 主要部署平台
2. **Render** - 備用平台
3. **Vercel** - 靜態/Serverless 平台

## 📱 部署成功指標

部署成功後應該獲得：
- ✅ 穩定的公共 URL
- ✅ 健康檢查通過
- ✅ 所有 API 端點可用
- ✅ 權限分離正確運作
- ✅ Telegram 通知正常

## 🚨 注意事項

1. **資料庫**：使用 SQLite，會自動創建
2. **檔案存儲**：避免本地檔案存儲，考慮雲端存儲
3. **環境變量**：確保所有敏感資訊透過環境變量設定
4. **監控**：部署後設定監控和日誌