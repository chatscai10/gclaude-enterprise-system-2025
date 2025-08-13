# 故障排除指南

本指南幫助您診斷和解決 GClaude Enterprise System 常見問題。

## 🚨 緊急問題

### 系統完全無法訪問
**症狀**: 網站無法載入，返回連接錯誤

**可能原因**:
- 伺服器當機
- 網路連線問題  
- DNS 解析錯誤
- 防火牆封鎖

**解決步驟**:
1. 檢查伺服器狀態
```bash
# 檢查服務是否運行
ps aux | grep node
systemctl status gclaude-enterprise  # 如使用 systemd
pm2 status  # 如使用 PM2
```

2. 檢查連接埠
```bash
# 檢查連接埠是否監聽
netstat -tlnp | grep :3007
lsof -i :3007
```

3. 重啟服務
```bash
# PM2 重啟
pm2 restart gclaude-enterprise

# 手動重啟
npm start

# Docker 重啟
docker restart gclaude-enterprise
```

### 資料庫連線失敗
**症狀**: 系統啟動失敗，顯示資料庫錯誤

**錯誤訊息範例**:
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**解決步驟**:
1. 檢查資料庫檔案
```bash
# 檢查資料庫檔案是否存在
ls -la data/enterprise.db

# 檢查檔案權限
chmod 666 data/enterprise.db
chmod 755 data/
```

2. 重建資料庫
```bash
# 備份現有資料庫（如果存在）
cp data/enterprise.db data/enterprise.db.backup

# 重新初始化資料庫
node database.js
```

## ⚠️ 常見錯誤

### 1. 連接埠被佔用
**錯誤**: `Error: listen EADDRINUSE: address already in use :::3007`

**解決方法**:
```bash
# 找出佔用連接埠的程序
lsof -ti:3007 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3007   # Windows

# 或使用不同連接埠
export PORT=3008
npm start
```

### 2. 記憶體不足
**錯誤**: `JavaScript heap out of memory`

**解決方法**:
```bash
# 增加 Node.js 記憶體限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm start

# 或在 package.json 中設定
"start": "node --max-old-space-size=4096 enterprise-server.js"
```

### 3. 模組找不到
**錯誤**: `Cannot find module 'express'`

**解決方法**:
```bash
# 重新安裝依賴
npm install

# 清除 npm 快取
npm cache clean --force
rm -rf node_modules
npm install
```

### 4. 權限錯誤
**錯誤**: `EACCES: permission denied`

**解決方法**:
```bash
# 修正檔案權限
sudo chown -R $USER:$USER .
chmod -R 755 .

# 避免使用 sudo npm（建議）
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

## 🔐 認證問題

### JWT Token 相關問題
**症狀**: 登入後立即被登出，或 API 返回 401

**可能原因**:
- JWT_SECRET 未設定或變更
- Token 過期時間設定錯誤
- 時間同步問題

**解決步驟**:
1. 檢查環境變數
```bash
echo $JWT_SECRET
# 應該有值，如果沒有則設定
export JWT_SECRET="your-secure-secret-key"
```

2. 檢查系統時間
```bash
# 確保系統時間正確
date
# 如需要，同步時間
sudo ntpdate -s time.nist.gov  # Linux
```

3. 清除瀏覽器快取
- 清除瀏覽器 localStorage
- 重新登入系統

### 登入失敗
**症狀**: 使用正確帳密無法登入

**檢查步驟**:
1. 驗證預設帳號
```bash
# 檢查資料庫中的用戶
sqlite3 data/enterprise.db "SELECT * FROM users;"
```

2. 重設管理員密碼
```javascript
// 臨時腳本重設密碼
const bcrypt = require('bcrypt');
const hashedPassword = bcrypt.hashSync('admin123', 10);
console.log('New hashed password:', hashedPassword);
// 手動更新資料庫
```

## 📊 效能問題

### 系統回應緩慢
**症狀**: 頁面載入時間過長，API 回應慢

**診斷步驟**:
1. 檢查系統資源
```bash
# CPU 和記憶體使用率
top
htop
free -h

# 磁碟使用率
df -h
```

2. 分析日誌
```bash
# 查看錯誤日誌
tail -f logs/error.log

# 查看訪問日誌
tail -f logs/access.log
```

3. 資料庫效能
```bash
# 檢查資料庫檔案大小
ls -lh data/enterprise.db

# SQLite 分析
sqlite3 data/enterprise.db "ANALYZE;"
```

**優化建議**:
- 增加伺服器記憶體
- 啟用 gzip 壓縮
- 實施資料庫索引
- 使用快取機制

### 高 CPU 使用率
**可能原因**:
- 無限迴圈或遞歸
- 大量並發請求
- 低效的演算法
- 資料庫查詢效能差

**解決方法**:
```bash
# 使用 Node.js 效能分析
node --prof enterprise-server.js
node --prof-process isolate-*.log > processed.txt

# 或使用 clinic.js
npm install -g clinic
clinic doctor -- node enterprise-server.js
```

## 🌐 網路問題

### API 請求失敗
**症狀**: 前端無法連接後端 API

**檢查清單**:
1. 網路連線
```bash
# 測試 API 連線
curl -I http://localhost:3007/api/health
```

2. CORS 問題
檢查控制台是否有 CORS 錯誤，確保後端正確設定 CORS 標頭。

3. 代理設定
如使用反向代理，檢查 Nginx/Apache 設定。

### SSL/HTTPS 問題
**症狀**: HTTPS 網站顯示不安全或無法訪問

**解決步驟**:
1. 檢查證書
```bash
# 檢查證書有效期
openssl x509 -in /path/to/cert.pem -text -noout

# 測試 SSL 連線
openssl s_client -connect your-domain.com:443
```

2. 更新證書
```bash
# Let's Encrypt 證書更新
sudo certbot renew

# 重載 Nginx
sudo nginx -s reload
```

## 💾 資料問題

### 資料遺失或損壞
**症狀**: 資料顯示不正確或遺失

**緊急處理**:
1. 停止服務避免進一步損壞
```bash
pm2 stop gclaude-enterprise
```

2. 檢查資料庫完整性
```bash
sqlite3 data/enterprise.db "PRAGMA integrity_check;"
```

3. 從備份恢復
```bash
# 恢復最近的備份
cp backup/enterprise-backup-latest.db data/enterprise.db
```

### 資料同步問題
**症狀**: 不同頁面顯示的資料不一致

**可能原因**:
- 快取問題
- 資料庫事務問題
- 多用戶併發更新

**解決方法**:
1. 清除快取
2. 重新整理頁面
3. 檢查資料庫事務設定

## 🐳 Docker 問題

### 容器啟動失敗
**常見錯誤**:
```
docker: Error response from daemon: port is already allocated
```

**解決方法**:
```bash
# 查看佔用連接埠的容器
docker ps -a

# 停止衝突的容器
docker stop <container-id>

# 使用不同連接埠
docker run -p 3008:3007 gclaude-enterprise
```

### 資料持久化問題
**症狀**: 容器重啟後資料消失

**解決方法**:
```bash
# 確保正確掛載資料卷
docker run -v ./data:/app/data gclaude-enterprise

# 檢查資料卷
docker volume ls
docker volume inspect <volume-name>
```

## 📱 Telegram 告警問題

### 告警通知未收到
**檢查步驟**:
1. 驗證 Bot Token
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
```

2. 檢查 Chat ID
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates"
```

3. 測試發送訊息
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage"   -H "Content-Type: application/json"   -d '{"chat_id": "<CHAT_ID>", "text": "測試訊息"}'
```

## 🔧 開發環境問題

### 熱重載不工作
**症狀**: 修改程式碼後需要手動重啟

**解決方法**:
```bash
# 使用 nodemon
npm install -g nodemon
nodemon enterprise-server.js

# 或使用 PM2 watch 模式
pm2 start enterprise-server.js --watch
```

### 測試失敗
**常見問題**:
1. 測試環境資料庫設定
2. 異步操作未正確處理
3. 測試間狀態污染

**解決方法**:
```bash
# 單獨運行失敗的測試
jest tests/unit/specific-test.test.js --verbose

# 清理測試環境
rm -rf test-results/
npm run test:clean
```

## 📋 診斷檢查清單

### 基本檢查
- [ ] 服務是否運行
- [ ] 連接埠是否可訪問
- [ ] 資料庫檔案是否存在
- [ ] 環境變數是否設定
- [ ] 日誌檔案有無錯誤

### 進階檢查
- [ ] 系統資源使用狀況
- [ ] 網路連線品質
- [ ] 資料庫完整性
- [ ] 快取狀態
- [ ] 外部服務依賴

## 📞 取得協助

### 自助排除步驟
1. 查閱本故障排除指南
2. 檢查系統日誌
3. 搜尋錯誤訊息
4. 查看 GitHub Issues

### 聯繫支援
如問題仍未解決：
1. 收集錯誤日誌和系統資訊
2. 描述問題重現步驟
3. 提供系統環境資訊
4. 聯繫技術支援團隊

### 日誌收集腳本
```bash
#!/bin/bash
# 收集診斷資訊
echo "=== System Info ===" > debug-info.txt
uname -a >> debug-info.txt
node --version >> debug-info.txt
npm --version >> debug-info.txt

echo "=== Process Status ===" >> debug-info.txt
pm2 status >> debug-info.txt 2>&1

echo "=== Recent Logs ===" >> debug-info.txt
tail -100 logs/error.log >> debug-info.txt 2>&1

echo "=== Database Check ===" >> debug-info.txt
sqlite3 data/enterprise.db "PRAGMA integrity_check;" >> debug-info.txt 2>&1

echo "診斷資訊已保存到 debug-info.txt"
```

---

記住：大多數問題都有解決方案，保持冷靜並系統性地排除問題。
