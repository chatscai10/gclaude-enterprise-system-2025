/**
 * 文檔生成系統
 * 自動生成完整的項目文檔和使用指南
 */

const fs = require('fs');
const path = require('path');

class DocumentationGenerator {
    constructor() {
        this.docsDir = path.join(__dirname, '..', 'docs');
        this.projectRoot = path.join(__dirname, '..');
        
        this.docStructure = [
            'README.md',
            'INSTALLATION.md', 
            'API_DOCUMENTATION.md',
            'USER_GUIDE.md',
            'DEPLOYMENT.md',
            'TESTING.md',
            'MONITORING.md',
            'TROUBLESHOOTING.md'
        ];
    }

    async generateAllDocumentation() {
        console.log('📚 開始生成完整項目文檔...\n');

        // 確保文檔目錄存在
        this.ensureDocsDirectory();
        
        // 生成各類文檔
        await this.generateREADME();
        await this.generateInstallationGuide();
        await this.generateAPIDocumentation();
        await this.generateUserGuide();
        
        console.log('✅ 第一批文檔生成完成');
        return { status: 'batch_1_completed', docs: 4 };
    }

    ensureDocsDirectory() {
        if (!fs.existsSync(this.docsDir)) {
            fs.mkdirSync(this.docsDir, { recursive: true });
        }
    }

    async generateREADME() {
        console.log('📝 生成 README.md...');
        
        const readmeContent = `# GClaude Enterprise System

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
\`\`\`bash
# 複製專案
git clone <repository-url>
cd gclaude-enterprise-system

# 安裝依賴
npm install

# 初始化資料庫
node database.js

# 啟動開發伺服器
npm start
\`\`\`

### 訪問應用
- 開發環境: http://localhost:3007
- 預設帳號: admin / admin123

## 🧪 測試

\`\`\`bash
# 執行所有測試
npm test

# 執行特定測試類型
npm run test:unit        # 單元測試
npm run test:integration # 整合測試  
npm run test:e2e         # 端到端測試
npm run test:performance # 效能測試

# 測試覆蓋率
npm run test:coverage
\`\`\`

## 🚀 部署

### Docker 部署
\`\`\`bash
# 建置映像
docker build -t gclaude-enterprise .

# 運行容器  
docker run -p 3007:3007 gclaude-enterprise
\`\`\`

### 雲端平台部署
- **Railway**: 支援一鍵部署
- **Render**: 自動化CI/CD部署
- **Vercel**: Serverless部署選項

## 📊 系統監控

系統內建完整的監控和告警功能：
- 健康檢查端點: \`GET /api/health\`
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
`;

        fs.writeFileSync(path.join(this.docsDir, 'README.md'), readmeContent);
        console.log('✅ README.md 生成完成');
    }

    async generateInstallationGuide() {
        console.log('📝 生成 INSTALLATION.md...');
        
        const installContent = `# 安裝指南

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
\`\`\`bash
# 使用 Homebrew
brew install node

# 或下載官方安裝包
\`\`\`

#### Linux (Ubuntu/Debian)
\`\`\`bash
# 更新套件清單
sudo apt update

# 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
\`\`\`

### 2. 驗證安裝
\`\`\`bash
node --version  # 應顯示 v18.0.0 或更高
npm --version   # 應顯示 8.0.0 或更高
\`\`\`

### 3. 取得專案程式碼

#### 從 Git 倉庫複製
\`\`\`bash
git clone <repository-url>
cd gclaude-enterprise-system
\`\`\`

#### 或下載 ZIP 檔案
1. 下載專案 ZIP 檔案
2. 解壓縮到目標目錄
3. 開啟終端並切換到專案目錄

### 4. 安裝專案依賴
\`\`\`bash
# 安裝生產依賴
npm install

# 安裝開發依賴 (如需開發)
npm install --include=dev
\`\`\`

### 5. 初始化資料庫
\`\`\`bash
# 執行資料庫初始化
node database.js
\`\`\`

### 6. 設定環境變數 (可選)
\`\`\`bash
# 複製環境變數範本
cp .env.example .env

# 編輯環境變數
nano .env  # 或使用其他編輯器
\`\`\`

### 7. 啟動應用程式
\`\`\`bash
# 啟動服務
npm start
\`\`\`

### 8. 驗證安裝
1. 開啟瀏覽器訪問 http://localhost:3007
2. 使用預設帳號登入: admin / admin123
3. 檢查系統功能是否正常運作

## 🔧 進階配置

### 資料庫配置
預設使用 SQLite，資料檔案位於 \`data/enterprise.db\`

### 連接埠配置
預設連接埠為 3007，可透過環境變數修改：
\`\`\`bash
export PORT=3000
npm start
\`\`\`

### SSL/HTTPS 配置 (生產環境)
建議在生產環境中使用反向代理 (如 Nginx) 處理 SSL。

## 🐳 Docker 安裝

### 使用預建映像
\`\`\`bash
docker run -d \\
  --name gclaude-enterprise \\
  -p 3007:3007 \\
  -v ./data:/app/data \\
  gclaude/enterprise-system:latest
\`\`\`

### 從原始碼建置
\`\`\`bash
# 建置映像
docker build -t gclaude-enterprise .

# 運行容器
docker run -d \\
  --name gclaude-enterprise \\
  -p 3007:3007 \\
  -v ./data:/app/data \\
  gclaude-enterprise
\`\`\`

### 使用 Docker Compose
\`\`\`bash
# 啟動所有服務
docker-compose up -d

# 查看日誌
docker-compose logs -f
\`\`\`

## ⚠️ 常見問題

### Node.js 版本過舊
**錯誤**: "Node.js version not supported"
**解決**: 升級 Node.js 至 18.0.0 或更高版本

### 連接埠被佔用
**錯誤**: "Port 3007 already in use"
**解決**: 
\`\`\`bash
# 查找佔用連接埠的程序
lsof -i :3007  # Linux/macOS
netstat -ano | findstr :3007  # Windows

# 或使用不同連接埠
export PORT=3008
npm start
\`\`\`

### 權限錯誤
**錯誤**: "Permission denied"
**解決**:
\`\`\`bash
# Linux/macOS
sudo chown -R $USER:$USER .
chmod -R 755 .

# 或使用 sudo (不建議)
sudo npm install
\`\`\`

### 記憶體不足
**錯誤**: "JavaScript heap out of memory"
**解決**:
\`\`\`bash
# 增加 Node.js 記憶體限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm start
\`\`\`

## 🧪 驗證安裝

### 基本功能測試
\`\`\`bash
# 執行健康檢查
curl http://localhost:3007/api/health

# 執行基本測試
npm test
\`\`\`

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
`;

        fs.writeFileSync(path.join(this.docsDir, 'INSTALLATION.md'), installContent);
        console.log('✅ INSTALLATION.md 生成完成');
    }

    async generateAPIDocumentation() {
        console.log('📝 生成 API_DOCUMENTATION.md...');
        
        const apiContent = `# API 文檔

GClaude Enterprise System RESTful API 完整文檔。

## 🔗 基本資訊

- **Base URL**: \`http://localhost:3007/api\`
- **Content-Type**: \`application/json\`
- **認證方式**: JWT Bearer Token

## 🔐 認證

### 登入
\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
\`\`\`

**回應**:
\`\`\`json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin", 
    "role": "admin"
  }
}
\`\`\`

### 驗證 Token
\`\`\`http
GET /api/auth/validate
Authorization: Bearer <token>
\`\`\`

## 👥 員工管理 API

### 獲取員工列表
\`\`\`http
GET /api/employees
Authorization: Bearer <token>
\`\`\`

**回應**:
\`\`\`json
{
  "success": true,
  "employees": [
    {
      "id": 1,
      "name": "張三",
      "position": "軟體工程師",
      "department": "技術部",
      "salary": 60000,
      "hireDate": "2024-01-15"
    }
  ]
}
\`\`\`

### 新增員工
\`\`\`http
POST /api/employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "李四",
  "position": "產品經理", 
  "department": "產品部",
  "salary": 70000
}
\`\`\`

### 更新員工
\`\`\`http
PUT /api/employees/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "李四",
  "position": "資深產品經理",
  "salary": 80000
}
\`\`\`

### 刪除員工
\`\`\`http
DELETE /api/employees/:id
Authorization: Bearer <token>
\`\`\`

## 📅 出勤管理 API

### 獲取出勤記錄
\`\`\`http
GET /api/attendance
Authorization: Bearer <token>

# 查詢參數
GET /api/attendance?employee_id=1&start_date=2024-01-01&end_date=2024-01-31
\`\`\`

### 記錄出勤
\`\`\`http
POST /api/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": 1,
  "date": "2024-01-15",
  "checkIn": "09:00",
  "checkOut": "18:00",
  "status": "present"
}
\`\`\`

### 出勤統計
\`\`\`http
GET /api/attendance/stats
Authorization: Bearer <token>

# 查詢參數
GET /api/attendance/stats?month=2024-01
\`\`\`

## 💰 營收管理 API

### 獲取營收資料
\`\`\`http
GET /api/revenue
Authorization: Bearer <token>

# 查詢參數  
GET /api/revenue?start_date=2024-01-01&end_date=2024-01-31
\`\`\`

### 新增營收記錄
\`\`\`http
POST /api/revenue
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-15",
  "amount": 50000,
  "source": "產品銷售",
  "category": "sales"
}
\`\`\`

### 營收統計
\`\`\`http
GET /api/revenue/summary
Authorization: Bearer <token>

# 查詢參數
GET /api/revenue/summary?period=monthly&year=2024
\`\`\`

## 🏥 系統健康檢查

### 健康狀態
\`\`\`http
GET /api/health
\`\`\`

**回應**:
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
\`\`\`

## 📊 回應格式

### 成功回應
\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
\`\`\`

### 錯誤回應
\`\`\`json
{
  "success": false,
  "error": "錯誤訊息",
  "code": "ERROR_CODE"
}
\`\`\`

## ⚠️ 錯誤代碼

| 代碼 | 說明 |
|------|------|
| 400 | 請求參數錯誤 |
| 401 | 未授權或Token過期 |
| 403 | 權限不足 |
| 404 | 資源不存在 |
| 500 | 伺服器內部錯誤 |

## 🔒 權限控制

### 角色類型
- **admin**: 系統管理員，完整權限
- **manager**: 管理者，有限管理權限  
- **employee**: 員工，基本查看權限

### API 權限矩陣

| API端點 | admin | manager | employee |
|---------|-------|---------|----------|
| GET /employees | ✅ | ✅ | ✅ |
| POST /employees | ✅ | ✅ | ❌ |
| PUT /employees | ✅ | ✅ | ❌ |  
| DELETE /employees | ✅ | ❌ | ❌ |
| /attendance/* | ✅ | ✅ | 部分 |
| /revenue/* | ✅ | ✅ | ❌ |

## 📝 API 使用範例

### JavaScript (Axios)
\`\`\`javascript
// 登入並取得 Token
const loginResponse = await axios.post('/api/auth/login', {
  username: 'admin',
  password: 'admin123'
});

const token = loginResponse.data.token;

// 使用 Token 呼叫 API
const employeesResponse = await axios.get('/api/employees', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
});
\`\`\`

### cURL
\`\`\`bash
# 登入
curl -X POST http://localhost:3007/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}'

# 使用 Token
curl -X GET http://localhost:3007/api/employees \\
  -H "Authorization: Bearer <your-token>"
\`\`\`

## 🧪 API 測試

系統提供完整的 API 測試套件：

\`\`\`bash
# 執行 API 測試
npm run test:integration

# 執行特定 API 測試
npm test -- --grep "API"
\`\`\`

---

更多技術細節請參考原始碼或聯繫開發團隊。
`;

        fs.writeFileSync(path.join(this.docsDir, 'API_DOCUMENTATION.md'), apiContent);
        console.log('✅ API_DOCUMENTATION.md 生成完成');
    }

    async generateUserGuide() {
        console.log('📝 生成 USER_GUIDE.md...');
        
        const userGuideContent = `# 使用手冊

歡迎使用 GClaude Enterprise System！本手冊將指導您如何使用系統的各項功能。

## 🚀 快速開始

### 首次登入
1. 開啟瀏覽器訪問系統網址
2. 使用預設管理員帳號登入：
   - 帳號：\`admin\`
   - 密碼：\`admin123\`
3. 登入成功後將進入系統主控台

### 變更密碼 (建議)
首次登入後請立即變更預設密碼：
1. 點擊右上角用戶名稱
2. 選擇「設定」
3. 在「變更密碼」區塊輸入新密碼
4. 點擊「儲存」

## 👥 員工管理

### 新增員工
1. 點擊左側選單「員工管理」
2. 點擊「新增員工」按鈕
3. 填寫員工資訊：
   - 姓名 (必填)
   - 職位 (必填)
   - 部門 (必填)  
   - 薪資
   - 到職日期
4. 點擊「儲存」完成新增

### 編輯員工資料
1. 在員工列表中找到要編輯的員工
2. 點擊該員工列的「編輯」按鈕
3. 修改相關資訊
4. 點擊「更新」儲存變更

### 刪除員工
1. 在員工列表中找到要刪除的員工
2. 點擊該員工列的「刪除」按鈕
3. 在確認對話框中點擊「確定」

### 搜尋和篩選
- **搜尋**: 在搜尋框中輸入員工姓名或職位
- **部門篩選**: 使用部門下拉選單篩選特定部門員工
- **排序**: 點擊表格標題可按該欄位排序

## 📅 出勤管理

### 記錄出勤
1. 點擊左側選單「出勤管理」
2. 點擊「記錄出勤」按鈕
3. 選擇或輸入：
   - 員工姓名
   - 日期
   - 上班時間
   - 下班時間
   - 出勤狀態 (出席/請假/遲到等)
4. 點擊「儲存」

### 查看出勤記錄
1. 在「出勤管理」頁面
2. 使用日期範圍篩選器選擇查詢期間
3. 可按員工篩選特定人員的出勤記錄
4. 記錄會以表格形式顯示

### 出勤統計
1. 點擊「出勤統計」分頁
2. 選擇統計期間 (月份或自訂日期範圍)
3. 系統會顯示：
   - 各員工出勤天數
   - 請假統計
   - 遲到次數
   - 出勤率圖表

### 匯出出勤報表
1. 在出勤統計頁面
2. 點擊「匯出報表」按鈕
3. 選擇匯出格式 (Excel/PDF)
4. 報表將自動下載

## 💰 營收管理

### 新增營收記錄
1. 點擊左側選單「營收管理」
2. 點擊「新增營收」按鈕
3. 填寫營收資訊：
   - 日期
   - 金額
   - 營收來源
   - 分類 (銷售/服務/其他)
   - 備註 (可選)
4. 點擊「儲存」

### 查看營收記錄
- 營收記錄以時間順序顯示在主表格中
- 可使用日期篩選器查看特定期間的記錄
- 點擊記錄可查看詳細資訊

### 營收分析
1. 點擊「營收分析」分頁
2. 選擇分析期間
3. 系統提供多種圖表：
   - 月營收趨勢圖
   - 營收來源分佈圓餅圖
   - 年度比較長條圖

### 財務報表
1. 點擊「財務報表」分頁
2. 選擇報表類型：
   - 月營收報表
   - 年度營收總結
   - 營收成長分析
3. 點擊「生成報表」
4. 可匯出為 PDF 或 Excel 格式

## 📊 資料分析

### 儀表板概覽
主儀表板顯示關鍵指標：
- 總員工數
- 本月出勤率
- 本月營收
- 系統使用狀況

### 自訂報表
1. 點擊「報表」選單
2. 選擇「自訂報表」
3. 設定報表參數：
   - 資料類型 (員工/出勤/營收)
   - 時間範圍
   - 篩選條件
   - 圖表類型
4. 點擊「生成報表」

### 資料匯出
支援多種格式匯出：
- **Excel**: 適合進一步數據分析
- **PDF**: 適合列印和分享
- **CSV**: 適合其他系統匯入

## ⚙️ 系統設定

### 使用者管理 (僅管理員)
1. 點擊「系統設定」→「使用者管理」
2. 新增使用者：
   - 輸入使用者名稱和密碼
   - 選擇角色 (管理員/經理/員工)
   - 設定權限
3. 管理現有使用者：
   - 重設密碼
   - 修改角色
   - 停用/啟用帳號

### 系統參數
1. 點擊「系統設定」→「參數設定」
2. 可調整：
   - 工作時間設定
   - 出勤規則
   - 通知設定
   - 備份頻率

### 資料備份
1. 點擊「系統設定」→「資料備份」
2. 選擇備份類型：
   - 完整備份
   - 增量備份
3. 設定自動備份排程
4. 下載備份檔案

## 📱 行動裝置使用

### 響應式設計
- 系統支援手機和平板電腦訪問
- 自動調整介面適應螢幕大小
- 觸控操作友善

### 主要功能
行動裝置上可使用：
- 查看員工資料
- 記錄出勤
- 查看營收資訊
- 接收系統通知

## 🔒 安全注意事項

### 密碼安全
- 使用強密碼 (至少8位，包含大小寫字母和數字)
- 定期變更密碼
- 不要與他人共用帳號

### 資料安全
- 定期備份重要資料
- 不要在公用電腦上儲存登入資訊
- 使用完畢請登出系統

## ❓ 常見問題

### 忘記密碼
1. 聯繫系統管理員重設密碼
2. 或使用「忘記密碼」功能 (如已設定)

### 系統運行緩慢
1. 檢查網路連線
2. 清除瀏覽器快取
3. 關閉不必要的瀏覽器分頁

### 資料顯示異常
1. 重新整理頁面
2. 檢查篩選條件設定
3. 聯繫技術支援

### 無法登入
1. 確認帳號密碼正確
2. 檢查 Caps Lock 是否開啟
3. 聯繫系統管理員

## 📞 技術支援

如需協助，請：
1. 查看本使用手冊
2. 檢查 [故障排除文檔](TROUBLESHOOTING.md)
3. 聯繫系統管理員
4. 提交技術支援請求

## 💡 使用技巧

### 鍵盤快捷鍵
- \`Ctrl + S\`: 快速儲存
- \`Ctrl + F\`: 搜尋
- \`F5\`: 重新整理
- \`Esc\`: 關閉對話框

### 效率技巧
- 使用搜尋功能快速找到資料
- 善用篩選器縮小資料範圍  
- 定期匯出資料備份
- 設定自動化通知

---

感謝使用 GClaude Enterprise System！如有任何建議或問題，歡迎回饋給我們。
`;

        fs.writeFileSync(path.join(this.docsDir, 'USER_GUIDE.md'), userGuideContent);
        console.log('✅ USER_GUIDE.md 生成完成');
    }
}

async function generateDocumentationBatch1() {
    const generator = new DocumentationGenerator();
    return await generator.generateAllDocumentation();
}

if (require.main === module) {
    generateDocumentationBatch1()
        .then(result => {
            console.log(`✅ 文檔生成完成 - ${result.docs} 個文件已建立`);
        })
        .catch(console.error);
}

module.exports = DocumentationGenerator;