# GClaude Enterprise System

🚀 現代化企業管理系統，提供員工管理、出勤追蹤、營收分析等完整功能。

## 🌟 主要功能

- **👥 員工管理**: 完整的員工資料管理和組織架構
- **📅 出勤系統**: 智慧出勤記錄和統計分析  
- **💰 營收管理**: 營收追蹤和財務報表生成
- **📊 資料分析**: 視覺化圖表和統計報告
- **🔐 權限控制**: 多層級用戶權限管理
- **📱 響應式設計**: 支援桌面和行動裝置

## 🛠️ 技術架構

### 後端技術
- **Node.js** - 伺服器運行環境
- **Express.js** - Web 應用程式框架  
- **SQLite** - 輕量級資料庫
- **JWT** - 安全認證機制

### 前端技術
- **HTML5** - 現代網頁標準
- **CSS3** - 響應式設計樣式
- **JavaScript ES6+** - 互動功能實現
- **Chart.js** - 資料視覺化

### 開發工具
- **Jest** - 單元測試框架
- **Puppeteer** - E2E測試自動化
- **Docker** - 容器化部署
- **GitHub Actions** - CI/CD流程

## 📦 快速開始

### 安裝需求
- Node.js 18+
- npm 或 yarn
- Git

### 本地開發
```bash
# 複製專案
git clone <repository-url>
cd gclaude-enterprise-system

# 安裝依賴
npm install

# 初始化資料庫
node database.js

# 啟動開發伺服器
npm start
```

### 訪問應用
- 開發環境: http://localhost:3007
- 預設帳號: admin / admin123

## 🧪 測試

```bash
# 執行所有測試
npm test

# 執行特定測試類型
npm run test:unit        # 單元測試
npm run test:integration # 整合測試  
npm run test:e2e         # 端到端測試
npm run test:performance # 效能測試

# 測試覆蓋率
npm run test:coverage
```

## 🚀 部署

### Docker 部署
```bash
# 建置映像
docker build -t gclaude-enterprise .

# 運行容器  
docker run -p 3007:3007 gclaude-enterprise
```

### 雲端平台部署
- **Railway**: 支援一鍵部署
- **Render**: 自動化CI/CD部署
- **Vercel**: Serverless部署選項

## 📊 系統監控

系統內建完整的監控和告警功能：
- 健康檢查端點: `GET /api/health`
- 效能監控儀表板: http://localhost:3008
- Telegram告警通知整合

## 📚 詳細文檔

- [安裝指南](docs/INSTALLATION.md)
- [API文檔](docs/API_DOCUMENTATION.md) 
- [使用手冊](docs/USER_GUIDE.md)
- [部署指南](docs/DEPLOYMENT.md)
- [測試文檔](docs/TESTING.md)
- [監控文檔](docs/MONITORING.md)
- [故障排除](docs/TROUBLESHOOTING.md)

## 🤝 貢獻

歡迎提交Issues和Pull Requests來改善此專案。

## 📄 授權

此專案基於 MIT 授權條款開源。

## 🙏 致謝

感謝所有貢獻者和開源社群的支持。

---

🤖 Generated with Claude Code | Co-Authored-By: Claude <noreply@anthropic.com>
