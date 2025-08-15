# 🎯 一步一步操作指南

## 📋 準備工作（2分鐘）

### 1. 打開命令提示字元
- 按 `Windows鍵 + R`
- 輸入 `cmd` 
- 按 Enter

### 2. 切換到專案目錄
```cmd
cd /d D:\0813\gclaude-enterprise-system
```

## 🧹 第一階段：清理舊專案（5分鐘）

### Railway 清理
```cmd
# 1. 安裝 Railway CLI
npm install -g @railway/cli

# 2. 登入 Railway
railway login
```
🔹 **會自動開啟瀏覽器，請登入您的 Railway 帳號**

```cmd
# 3. 查看現有專案
railway list
```
🔹 **會顯示所有專案列表，記下要刪除的 PROJECT_ID**

```cmd
# 4. 刪除舊專案（對每個舊專案執行）
railway delete [把這裡替換成實際的PROJECT_ID]
```
🔹 **重複執行直到刪除所有舊專案**

### Vercel 清理
```cmd
# 1. 安裝 Vercel CLI
npm install -g vercel

# 2. 登入 Vercel
vercel login
```
🔹 **會自動開啟瀏覽器，請登入您的 Vercel 帳號**

```cmd
# 3. 查看現有專案
vercel list
```

```cmd
# 4. 刪除舊專案（對每個舊專案執行）
vercel remove [把這裡替換成實際的PROJECT_NAME]
```

### Render 清理
🔹 **請手動操作：**
1. 訪問：https://dashboard.render.com/
2. 點擊每個舊服務
3. 點擊 Settings
4. 滾動到底部點擊 "Delete Service"
5. 確認刪除

## 🚀 第二階段：部署新系統（5分鐘）

### 確保在正確目錄
```cmd
cd /d D:\0813\gclaude-enterprise-system
```

### 初始化 Railway 專案
```cmd
railway init
```
🔹 **當詢問專案名稱時，輸入：gclaude-enterprise-system**

### 設定環境變量
```cmd
railway env set PORT 3007
railway env set NODE_ENV production
railway env set JWT_SECRET gclaude-enterprise-super-secret-key-2024
railway env set TELEGRAM_BOT_TOKEN 7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc
railway env set TELEGRAM_BOSS_GROUP_ID -1002658082392
```

### 開始部署
```cmd
railway up
```
🔹 **會自動上傳和部署，等待完成**

## ✅ 第三階段：測試驗證（3分鐘）

### 1. 獲取部署網址
```cmd
railway status
```
🔹 **會顯示您的應用網址，類似：https://xxx.railway.app**

### 2. 測試基本功能
在瀏覽器中依序訪問：

1. **健康檢查**：`https://[您的網址].railway.app/api/health`
   - 應該顯示系統狀態 JSON

2. **登入頁面**：`https://[您的網址].railway.app/`
   - 應該顯示登入表單

3. **管理員測試**：
   - 輸入：admin / admin123
   - 點擊登入
   - 應該重定向到 `/admin` 頁面
   - 應該看到完整的管理功能

4. **員工測試**：
   - 登出後重新登入
   - 輸入：employee / employee123  
   - 點擊登入
   - 應該重定向到 `/employee` 頁面
   - 應該只看到員工相關功能

### 3. 檢查 Telegram 通知
🔹 **登入時檢查您的 Telegram 群組，應該收到登入通知**

## 🎉 完成標準

部署成功的標誌：
- ✅ 獲得 `.railway.app` 網址
- ✅ 健康檢查返回正常狀態
- ✅ 管理員登入後看到管理介面
- ✅ 員工登入後只看到員工功能  
- ✅ 員工看不到品項管理等管理功能
- ✅ Telegram 收到登入通知

## 🆘 遇到問題時

如果遇到任何錯誤：
1. 複製錯誤訊息
2. 提供給我協助診斷
3. 或者嘗試重新執行該步驟

## ⏱️ 總預計時間：15分鐘