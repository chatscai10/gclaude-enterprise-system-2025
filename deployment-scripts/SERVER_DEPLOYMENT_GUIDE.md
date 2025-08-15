# GClaude Enterprise System - 伺服器部署指南

## 🚀 部署選項

### 選項 1: 一鍵部署 (推薦給新手)
在全新的 Ubuntu 20.04+ 伺服器上執行：
```bash
wget https://raw.githubusercontent.com/your-repo/one-click-deploy.sh
chmod +x one-click-deploy.sh
sudo ./one-click-deploy.sh your-domain.com
```

### 選項 2: 分步部署 (進階使用者)

#### 步驟 1: 初始化伺服器
```bash
# 在 root 權限下執行
chmod +x server-init.sh
./server-init.sh
```

#### 步驟 2: 部署應用程式
```bash
# 切換到 gclaude 使用者
su - gclaude

# 上傳應用程式文件到 /opt/gclaude-enterprise
# 然後執行部署腳本
chmod +x app-deploy.sh
./app-deploy.sh your-domain.com
```

#### 步驟 3: 配置 SSL (可選)
```bash
sudo certbot --nginx -d your-domain.com
```

## 📋 系統要求

### 硬體要求
- CPU: 1 核心以上 (建議 2 核心)
- RAM: 1GB 以上 (建議 2GB)
- 硬碟: 10GB 以上可用空間
- 網路: 穩定的網際網路連接

### 軟體要求
- 作業系統: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Root 權限
- 已開放的防火牆端口: 22, 80, 443, 3007

### 網域要求 (可選)
- 已註冊的網域名稱
- DNS A 記錄指向伺服器 IP
- 用於 SSL 憑證申請

## 🔧 部署後設定

### 1. 修改預設密碼
登入系統後立即修改所有預設帳號密碼：
- admin / admin123
- manager / manager123  
- employee / employee123
- intern / intern123

### 2. 配置 Telegram 通知
編輯 `.env` 文件中的 Telegram 設定：
```bash
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
TELEGRAM_BOSS_CHAT_ID=YOUR_BOSS_CHAT_ID
TELEGRAM_EMPLOYEE_CHAT_ID=YOUR_EMPLOYEE_CHAT_ID
```

### 3. 設定自動備份
編輯 crontab 添加自動備份：
```bash
crontab -e
# 每天凌晨 2 點備份
0 2 * * * /opt/gclaude-enterprise/deployment-scripts/backup.sh
```

### 4. 配置監控
設定系統監控和警報：
```bash
# 每 5 分鐘檢查一次
*/5 * * * * /opt/gclaude-enterprise/deployment-scripts/monitor.sh
```

## 🛠️ 維護操作

### 日常管理命令
```bash
# 查看服務狀態
pm2 status

# 查看即時日誌
pm2 logs gclaude-enterprise --lines 100

# 重啟服務
pm2 restart gclaude-enterprise

# 查看系統資源
htop

# 查看磁碟使用
df -h
```

### 更新應用程式
```bash
cd /opt/gclaude-enterprise
./deployment-scripts/update.sh
```

### 備份和還原
```bash
# 手動備份
./deployment-scripts/backup.sh

# 還原備份 (將備份文件複製回原位置)
cp /opt/gclaude-enterprise/data/backups/enterprise_YYYYMMDD_HHMMSS.db /opt/gclaude-enterprise/data/enterprise.db
pm2 restart gclaude-enterprise
```

## 🔒 安全最佳實踐

### 1. 系統安全
- 定期更新系統套件
- 使用強密碼和 SSH 金鑰
- 配置 fail2ban 防止暴力破解
- 定期檢查系統日誌

### 2. 應用程式安全
- 修改所有預設密碼
- 定期更新 Node.js 依賴
- 監控應用程式日誌
- 備份重要數據

### 3. 網路安全
- 使用 SSL/TLS 加密
- 配置適當的防火牆規則
- 隱藏 Nginx 版本資訊
- 設定安全標頭

## 🚨 故障排除

### 常見問題

1. **服務無法啟動**
```bash
# 檢查日誌
pm2 logs gclaude-enterprise

# 檢查端口占用
netstat -tlnp | grep :3007

# 檢查配置文件
cat /opt/gclaude-enterprise/.env
```

2. **無法訪問網站**
```bash
# 檢查 Nginx 狀態
systemctl status nginx

# 檢查 Nginx 配置
nginx -t

# 檢查防火牆
ufw status
```

3. **數據庫問題**
```bash
# 檢查數據庫文件
ls -la /opt/gclaude-enterprise/data/

# 檢查權限
ls -la /opt/gclaude-enterprise/data/enterprise.db
```

4. **SSL 憑證問題**
```bash
# 檢查憑證狀態
certbot certificates

# 更新憑證
certbot renew
```

### 緊急恢復
如果系統出現嚴重問題：

1. 停止服務：`pm2 stop gclaude-enterprise`
2. 從備份還原數據庫
3. 檢查配置文件
4. 重新啟動服務：`pm2 start gclaude-enterprise`

## 📞 技術支援

### 日誌位置
- 應用程式日誌: `/opt/gclaude-enterprise/logs/`
- PM2 日誌: `~/.pm2/logs/`
- Nginx 日誌: `/var/log/nginx/`
- 系統日誌: `/var/log/syslog`

### 監控指標
- CPU 使用率
- 記憶體使用量
- 磁碟空間
- 網路流量
- 應用程式響應時間
- 錯誤率

### 獲得幫助
1. 查看應用程式日誌
2. 檢查系統資源
3. 查詢錯誤訊息
4. 聯繫技術支援

---
**更新日期**: 2025-08-14T02:45:50.472Z
**版本**: 2.0.0
**支援**: GClaude Enterprise System
