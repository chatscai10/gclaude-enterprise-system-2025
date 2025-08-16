# 🔄 更新雲端部署指南

## 🚨 發現問題
雲端部署版本 (`https://gclaude-enterprise-system-2025.onrender.com`) 缺少最新的修復：
- ❌ 員工註冊 API (`/api/employee/register`) 不存在
- ❌ Telegram 通知修復未部署
- ✅ 登入功能正常工作
- ✅ 健康檢查正常

## 📋 需要更新的功能

### 1. 員工註冊系統
- 新增 `/api/employee/register` API 端點
- 修復 Telegram 通知格式
- 性別和關係文字轉換功能

### 2. 統一工作台
- 統一員工工作台 (`/dashboard`)
- 統一管理員工作台 (`/admin`)
- 統一首頁 (`/index.html`)

## 🚀 更新部署的方法

### 方法 1: GitHub 推送 (推薦)
1. 將本地修復推送到 GitHub
2. Render 會自動檢測並重新部署
3. 等待部署完成

### 方法 2: 手動部署
1. 在 Render Dashboard 點擊 "Manual Deploy"
2. 選擇最新的 commit
3. 等待重新部署

### 方法 3: 重新連接儲存庫
1. 刪除現有服務
2. 重新創建並連接更新後的 GitHub 儲存庫

## 📝 部署檢查清單

部署完成後需要測試：

### ✅ 基本功能測試
```bash
# 健康檢查
curl https://gclaude-enterprise-system-2025.onrender.com/api/health

# 首頁測試
curl -I https://gclaude-enterprise-system-2025.onrender.com/

# 登入測試
curl -X POST https://gclaude-enterprise-system-2025.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 🆕 新功能測試
```bash
# 員工註冊測試
curl -X POST https://gclaude-enterprise-system-2025.onrender.com/api/employee/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "雲端測試員工",
    "id_card": "E111222333",
    "birth_date": "1990-07-15",
    "gender": "male",
    "license_number": "LIC123456",
    "phone": "0966777888",
    "address": "台北市信義區雲端大樓",
    "emergency_contact_name": "測試家人",
    "emergency_contact_phone": "0977888999",
    "emergency_contact_relation": "parent"
  }'
```

### 📱 Telegram 通知測試
註冊成功後應該收到格式化的通知：
```
🟟 新員工資料登入

🟟 日期: 2025/8/16
🟟 姓名: 雲端測試員工
🟟 身份證: E111222333
🟟 生日: 1990-07-15
⚥ 性別: 男性
🟟 駕照: 有
🟟 電話: 0966777888
🟟 地址: 台北市信義區雲端大樓
🟟 緊急聯絡人: 測試家人 (父母)
🟟 緊急電話: 0977888999
🟟 到職日: 待安排
🟟 分店: 待分配
🟟 職位: 待分配
```

## 🔧 故障排除

### 如果員工註冊 API 仍然不存在：
1. 檢查 `server.js` 是否包含員工註冊路由
2. 確認 Render 使用的是正確的分支
3. 檢查環境變數設定

### 如果 Telegram 通知仍顯示 undefined：
1. 確認 `telegram-notifier.js` 包含修復
2. 檢查輔助函數 `getGenderText()` 和 `getRelationText()`
3. 驗證環境變數設定

## 📊 當前測試結果

### ✅ 正常功能
- 健康檢查: 正常
- 首頁載入: 正常 (HTTP 200)
- 登入系統: 正常 (admin/admin123)

### ❌ 待修復功能
- 員工註冊 API: 404 錯誤
- Telegram 通知: 未測試（因為註冊不可用）

## 🎯 下一步行動

1. **立即更新部署** - 推送最新代碼到 GitHub
2. **等待重新部署** - Render 自動檢測並部署
3. **重新測試** - 驗證所有功能正常
4. **Telegram 測試** - 確認通知格式修復

---

**重要：** 一旦部署更新完成，所有功能將完全正常，包括修復後的 Telegram 通知格式！🚀