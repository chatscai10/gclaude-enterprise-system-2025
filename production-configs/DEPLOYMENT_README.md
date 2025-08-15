# GClaude Enterprise System - 生產部署指南

## 📋 部署前檢查清單

### 系統要求
- [x] Node.js 18+ 已安裝
- [x] PM2 已安裝
- [x] Nginx 已配置 (可選)
- [x] SSL 憑證已準備 (可選)
- [x] 防火牆已配置

### 配置檢查
- [x] .env.production 已配置
- [x] Telegram Bot Token 有效
- [x] 數據庫路徑可寫入
- [x] 日誌目錄可寫入

## 🚀 快速部署

### 方法 1: 使用部署腳本 (推薦)
```bash
chmod +x deploy.sh
./deploy.sh
```

### 方法 2: 手動部署
```bash
# 1. 安裝依賴
npm ci --only=production

# 2. 複製配置
cp production-configs/.env.production .env
cp production-configs/ecosystem.config.js .

# 3. 初始化數據庫
node seed-data-manager.js

# 4. 啟動服務
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 方法 3: Docker 部署
```bash
# 複製 Docker 文件
cp production-configs/Dockerfile .
cp production-configs/docker-compose.yml .

# 啟動容器
docker-compose up -d
```

## 📊 服務管理

### PM2 命令
```bash
# 查看狀態
pm2 status

# 查看日誌
pm2 logs gclaude-enterprise

# 重啟服務
pm2 restart gclaude-enterprise

# 停止服務
pm2 stop gclaude-enterprise

# 監控
pm2 monit
```

### 健康檢查
```bash
# 檢查服務健康
curl http://localhost:3007/api/health

# 運行監控腳本
./monitor.sh
```

### 備份管理
```bash
# 手動備份
./backup.sh

# 設定自動備份 (crontab)
0 2 * * * /path/to/backup.sh
```

## 🔧 故障排除

### 常見問題

1. **服務無法啟動**
   - 檢查 .env 配置
   - 查看 pm2 日誌: `pm2 logs gclaude-enterprise`
   - 確認端口 3007 未被占用

2. **數據庫連接失敗**
   - 確認 data 目錄存在且可寫入
   - 檢查數據庫文件權限

3. **Telegram 通知失敗**
   - 驗證 Bot Token
   - 檢查群組 ID
   - 確認網路連接

### 日誌位置
- 應用日誌: `./logs/`
- PM2 日誌: `~/.pm2/logs/`
- Nginx 日誌: `/var/log/nginx/`

## 🔒 安全考量

### 重要安全設定
1. **更改預設密碼**
   - 管理員密碼: admin123 → 強密碼
   - JWT Secret: 使用隨機生成的密鑰

2. **SSL/TLS 配置**
   - 使用有效的 SSL 憑證
   - 配置 HSTS 標頭
   - 禁用不安全的 TLS 版本

3. **防火牆設定**
   - 只開放必要端口 (80, 443)
   - 限制 SSH 訪問
   - 配置 fail2ban

4. **定期更新**
   - 定期更新 Node.js 依賴
   - 監控安全漏洞
   - 備份重要數據

## 📈 性能優化

### 建議配置
- 使用 PM2 cluster 模式
- 配置 Nginx 反向代理
- 啟用 Gzip 壓縮
- 設定適當的快取策略

### 監控指標
- CPU 使用率
- 記憶體使用量
- 磁碟空間
- 響應時間
- 錯誤率

## 📞 支援

如需技術支援，請聯繫：
- 系統管理員
- 查看日誌文件
- 提交 GitHub Issue

---
**部署日期**: 2025-08-14T07:49:18.575Z
**版本**: 2.0.0
