# 🚀 GClaude Enterprise Management System v2.0

基於 D:\0809 專案的強化版企業員工管理系統，完全相容 GClaude 伺服器環境。

## 📋 專案特色

### 🏢 核心功能
- **多角色認證系統** - 支援管理員/店長/員工/實習生四級權限
- **GPS智慧打卡** - 地理位置驗證，防止異地打卡
- **營收管理分析** - 自動計算獎金，績效分析報告
- **智慧排程系統** - 6重規則引擎，自動排班優化
- **升遷投票機制** - 匿名投票，公平公正的晉升機制
- **維修申請管理** - 設備維護，工單流程管理
- **報表系統** - 8大核心報表，數據可視化

### 🌟 GClaude 強化功能
- **智慧瀏覽器驗證** - Puppeteer 自動化測試系統
- **Telegram 飛機彙報** - 即時通知與狀態報告
- **自動部署系統** - 支援多平台一鍵部署
- **效能監控** - 即時系統健康監控
- **智慧修復** - 自動檢測問題並提供解決方案

## 🛠️ 技術架構

### 後端技術棧
- **Node.js 18+** + Express.js 4.18
- **SQLite** + Sequelize ORM 6.32
- **JWT** 認證 + bcryptjs 加密
- **Winston** 日誌系統
- **Socket.IO** 即時通訊

### 前端技術棧  
- **HTML5** + **CSS3** + **ES6 JavaScript**
- **Bootstrap 5.3** 響應式框架
- **Chart.js** 數據可視化
- **AJAX** 非同步通訊

### 部署與監控
- **Puppeteer** 瀏覽器自動化
- **Telegraf** Telegram Bot整合
- **Node-cron** 定時任務
- **Helmet** 安全防護
- **Compression** 效能優化

## 📦 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 環境配置
```bash
cp .env.example .env
# 編輯 .env 檔案配置參數
```

### 3. 啟動系統
```bash
# 開發模式
npm run dev

# 生產模式  
npm start
```

### 4. 驗證部署
```bash
# 系統健康檢查
npm run system:health

# 瀏覽器驗證
npm run browser:verify

# 飛機彙報測試
npm run flight:report
```

## 🌐 API 端點

### 認證系統
- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/register` - 用戶註冊  
- `GET /api/auth/profile` - 獲取用戶資料
- `POST /api/auth/logout` - 用戶登出

### 員工管理
- `GET /api/employees` - 員工列表
- `POST /api/employees` - 新增員工
- `PUT /api/employees/:id` - 更新員工
- `DELETE /api/employees/:id` - 刪除員工

### 管理員功能
- `GET /api/admin/stats` - 統計數據
- `GET /api/admin/inventory` - 庫存管理
- `GET /api/admin/revenue` - 營收分析
- `GET /api/admin/schedules` - 排程管理
- `GET /api/admin/promotions` - 升遷投票
- `GET /api/admin/maintenance` - 維修管理

### 系統監控
- `GET /api/health` - 健康檢查
- `GET /api/status` - 系統狀態
- `GET /api/metrics` - 效能指標

## 🚀 部署指南

### GClaude 自動部署
```bash
npm run deploy:gclaude
```

### Railway 部署
```bash
# 1. 安裝 Railway CLI
npm install -g @railway/cli

# 2. 登入並初始化
railway login
railway init

# 3. 部署
railway up
```

### Render 部署
1. 連接 GitHub 倉庫到 [Render](https://render.com)
2. 設定構建命令: `npm install`
3. 設定啟動命令: `npm start`
4. 配置環境變數

### Vercel 部署
```bash
# 1. 安裝 Vercel CLI
npm install -g vercel

# 2. 部署
vercel --prod
```

## 🧪 測試與驗證

### 系統測試
```bash
# 完整系統測試
npm test

# 智慧瀏覽器驗證
npm run browser:verify

# 安全掃描
npm run security:check

# 效能測試
npm run performance:optimize
```

### 測試帳號
- **管理員**: admin / admin123
- **店長**: manager / manager123  
- **員工**: employee / employee123
- **實習生**: intern / intern123

## 📊 系統監控

### 健康檢查端點
- `/api/health` - 基本健康狀態
- `/api/status` - 詳細系統狀態
- `/api/metrics` - 效能指標

### Telegram 通知
系統支援自動 Telegram 通知：
- 用戶註冊通知
- 投票活動提醒
- 系統異常警報
- 定期狀態報告

## 🔧 開發指南

### 項目結構
```
gclaude-enterprise-system/
├── server.js              # 主伺服器檔案
├── package.json           # 依賴配置
├── .env.example           # 環境變數範例
├── routes/                # API 路由
│   ├── auth.js           # 認證路由
│   ├── employees.js      # 員工管理
│   ├── admin.js          # 管理員功能
│   └── api.js            # 通用 API
├── models/               # 數據模型
├── controllers/          # 控制器
├── middleware/           # 中間件
├── services/             # 服務層
├── utils/                # 工具函數
├── database/             # 資料庫相關
├── scripts/              # 部署腳本
├── test/                 # 測試檔案
└── public/               # 前端檔案
    ├── css/              # 樣式檔案
    ├── js/               # JavaScript
    └── *.html            # HTML 頁面
```

### 擴展開發
1. 在 `routes/` 目錄添加新的路由
2. 在 `controllers/` 目錄實現業務邏輯  
3. 在 `models/` 目錄定義數據模型
4. 在 `services/` 目錄添加服務功能

## 🔒 安全特性

- **JWT Token** 認證機制
- **bcryptjs** 密碼加密
- **Helmet** 安全標頭
- **Rate Limiting** 請求限制
- **CORS** 跨域配置
- **Input Validation** 輸入驗證
- **SQL Injection** 防護
- **XSS** 防護

## 📈 效能優化

- **Compression** 回應壓縮
- **Static Caching** 靜態檔案快取
- **Database Indexing** 資料庫索引
- **Connection Pooling** 連線池
- **Memory Management** 記憶體管理
- **Load Balancing** 負載平衡

## 🆘 故障排除

### 常見問題

1. **資料庫連線失敗**
   - 檢查 `.env` 檔案中的資料庫配置
   - 確保資料庫檔案路徑存在

2. **Telegram 通知不工作**
   - 驗證 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_GROUP_ID`
   - 確保機器人已加入目標群組

3. **部署失敗**
   - 檢查環境變數配置
   - 驗證依賴安裝是否完整

### 日誌查看
```bash
# 查看應用日誌
tail -f logs/app.log

# 查看錯誤日誌  
tail -f logs/error.log
```

## 🤝 貢獻指南

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 📞 支援

如有問題或需要協助：
- 📧 Email: support@gclaude-enterprise.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 文檔: [專案文檔](https://docs.gclaude-enterprise.com)

---

**版本**: v2.0.0  
**最後更新**: 2025-08-13  
**開發工具**: Claude Code + GClaude Integration  
**狀態**: 🚀 生產就緒