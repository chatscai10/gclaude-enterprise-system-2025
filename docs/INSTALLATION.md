# 安裝指南

本指南將協助您在不同環境中安裝和配置 GClaude Enterprise System。

## 🔧 系統需求

### 最低需求
- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本  
- **記憶體**: 512MB RAM
- **硬碟**: 500MB 可用空間
- **作業系統**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)

### 建議需求
- **Node.js**: 20.0.0 或更高版本
- **記憶體**: 2GB RAM
- **硬碟**: 2GB 可用空間

## 📦 安裝步驟

### 1. 安裝 Node.js

#### Windows
1. 前往 [Node.js官網](https://nodejs.org/)
2. 下載 LTS 版本
3. 執行安裝程式並按照指示完成安裝

#### macOS
```bash
# 使用 Homebrew
brew install node

# 或下載官方安裝包
```

#### Linux (Ubuntu/Debian)
```bash
# 更新套件清單
sudo apt update

# 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 驗證安裝
```bash
node --version  # 應顯示 v18.0.0 或更高
npm --version   # 應顯示 8.0.0 或更高
```

### 3. 取得專案程式碼

#### 從 Git 倉庫複製
```bash
git clone <repository-url>
cd gclaude-enterprise-system
```

#### 或下載 ZIP 檔案
1. 下載專案 ZIP 檔案
2. 解壓縮到目標目錄
3. 開啟終端並切換到專案目錄

### 4. 安裝專案依賴
```bash
# 安裝生產依賴
npm install

# 安裝開發依賴 (如需開發)
npm install --include=dev
```

### 5. 初始化資料庫
```bash
# 執行資料庫初始化
node database.js
```

### 6. 設定環境變數 (可選)
```bash
# 複製環境變數範本
cp .env.example .env

# 編輯環境變數
nano .env  # 或使用其他編輯器
```

### 7. 啟動應用程式
```bash
# 啟動服務
npm start
```

### 8. 驗證安裝
1. 開啟瀏覽器訪問 http://localhost:3007
2. 使用預設帳號登入: admin / admin123
3. 檢查系統功能是否正常運作

## 🔧 進階配置

### 資料庫配置
預設使用 SQLite，資料檔案位於 `data/enterprise.db`

### 連接埠配置
預設連接埠為 3007，可透過環境變數修改：
```bash
export PORT=3000
npm start
```

### SSL/HTTPS 配置 (生產環境)
建議在生產環境中使用反向代理 (如 Nginx) 處理 SSL。

## 🐳 Docker 安裝

### 使用預建映像
```bash
docker run -d \
  --name gclaude-enterprise \
  -p 3007:3007 \
  -v ./data:/app/data \
  gclaude/enterprise-system:latest
```

### 從原始碼建置
```bash
# 建置映像
docker build -t gclaude-enterprise .

# 運行容器
docker run -d \
  --name gclaude-enterprise \
  -p 3007:3007 \
  -v ./data:/app/data \
  gclaude-enterprise
```

### 使用 Docker Compose
```bash
# 啟動所有服務
docker-compose up -d

# 查看日誌
docker-compose logs -f
```

## ⚠️ 常見問題

### Node.js 版本過舊
**錯誤**: "Node.js version not supported"
**解決**: 升級 Node.js 至 18.0.0 或更高版本

### 連接埠被佔用
**錯誤**: "Port 3007 already in use"
**解決**: 
```bash
# 查找佔用連接埠的程序
lsof -i :3007  # Linux/macOS
netstat -ano | findstr :3007  # Windows

# 或使用不同連接埠
export PORT=3008
npm start
```

### 權限錯誤
**錯誤**: "Permission denied"
**解決**:
```bash
# Linux/macOS
sudo chown -R $USER:$USER .
chmod -R 755 .

# 或使用 sudo (不建議)
sudo npm install
```

### 記憶體不足
**錯誤**: "JavaScript heap out of memory"
**解決**:
```bash
# 增加 Node.js 記憶體限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

## 🧪 驗證安裝

### 基本功能測試
```bash
# 執行健康檢查
curl http://localhost:3007/api/health

# 執行基本測試
npm test
```

### 完整功能驗證
1. 訪問主頁面
2. 測試登入功能  
3. 檢查員工管理功能
4. 驗證出勤系統
5. 測試營收報表

## 📞 取得支援

如果遇到安裝問題，請：
1. 檢查 [故障排除文檔](TROUBLESHOOTING.md)
2. 查看 GitHub Issues
3. 聯繫技術支援

---

安裝完成後，請參考 [使用手冊](USER_GUIDE.md) 了解如何使用系統功能。
