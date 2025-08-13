/**
 * 文檔生成系統 - 第二批
 * 生成部署、測試、監控、故障排除文檔
 */

const fs = require('fs');
const path = require('path');

class DocumentationGeneratorBatch2 {
    constructor() {
        this.docsDir = path.join(__dirname, '..', 'docs');
    }

    async generateSecondBatchDocs() {
        console.log('📚 開始生成第二批文檔...\n');

        await this.generateDeploymentGuide();
        await this.generateTestingGuide(); 
        await this.generateMonitoringGuide();
        await this.generateTroubleshootingGuide();

        console.log('✅ 第二批文檔生成完成');
        return { status: 'batch_2_completed', docs: 4 };
    }

    async generateDeploymentGuide() {
        console.log('📝 生成 DEPLOYMENT.md...');
        
        const deploymentContent = `# 部署指南

本指南說明如何將 GClaude Enterprise System 部署到不同的生產環境。

## 🚀 部署選項

### 1. 雲端平台部署
- **Railway** - 推薦，支援自動部署
- **Render** - 免費方案可用
- **Vercel** - Serverless 部署
- **Heroku** - 傳統 PaaS 平台

### 2. 容器化部署  
- **Docker** - 本地或雲端容器
- **Docker Compose** - 多服務編排
- **Kubernetes** - 大規模容器管理

### 3. 傳統部署
- **VPS** - 虛擬私有伺服器
- **專用伺服器** - 物理伺服器部署

## 🌐 Railway 部署 (推薦)

### 準備工作
1. 註冊 [Railway 帳號](https://railway.app)
2. 安裝 Railway CLI
3. 準備 GitHub 代碼庫

### 自動部署步驟
\`\`\`bash
# 1. 安裝 Railway CLI
npm install -g @railway/cli

# 2. 登入 Railway
railway login

# 3. 初始化專案
railway init

# 4. 設定環境變數
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="your-secure-jwt-secret"
railway variables set TELEGRAM_BOT_TOKEN="your-bot-token"
railway variables set TELEGRAM_CHAT_ID="your-chat-id"

# 5. 部署
railway up --detach
\`\`\`

### 手動部署 (GitHub 整合)
1. 登入 Railway 控制台
2. 點擊 "New Project" 
3. 選擇 "Deploy from GitHub repo"
4. 選擇您的代碼庫
5. Railway 會自動檢測並部署

## 🌊 Render 部署

### Web Service 部署
1. 登入 [Render 控制台](https://render.com)
2. 點擊 "New" → "Web Service"
3. 連接 GitHub 代碼庫
4. 配置服務設定：
   - **Name**: gclaude-enterprise-system
   - **Environment**: Node
   - **Build Command**: \`npm install\`
   - **Start Command**: \`node enterprise-server.js\`

### 環境變數設定
在 Render 控制台設定以下環境變數：
\`\`\`
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret-here
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
PORT=10000
\`\`\`

## ⚡ Vercel 部署

### Serverless 部署
\`\`\`bash
# 1. 安裝 Vercel CLI
npm i -g vercel

# 2. 部署到 Vercel
vercel --prod

# 3. 設定環境變數
vercel env add NODE_ENV
vercel env add JWT_SECRET
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_CHAT_ID
\`\`\`

### 注意事項
- Vercel 適合靜態內容和 API Routes
- SQLite 資料庫需要使用外部服務 (如 PlanetScale)
- 無狀態設計確保 Serverless 相容性

## 🐳 Docker 部署

### 單容器部署
\`\`\`bash
# 1. 建置 Docker 映像
docker build -t gclaude-enterprise .

# 2. 運行容器
docker run -d \\
  --name gclaude-enterprise \\
  -p 3007:3007 \\
  -v ./data:/app/data \\
  -e NODE_ENV=production \\
  -e JWT_SECRET="your-jwt-secret" \\
  gclaude-enterprise
\`\`\`

### Docker Compose 部署
\`\`\`bash
# 1. 啟動所有服務
docker-compose up -d

# 2. 查看服務狀態
docker-compose ps

# 3. 查看日誌
docker-compose logs -f gclaude-enterprise
\`\`\`

### Docker Compose 設定檔
\`\`\`yaml
version: '3.8'

services:
  gclaude-enterprise:
    build: .
    ports:
      - "3007:3007"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=\${JWT_SECRET}
      - TELEGRAM_BOT_TOKEN=\${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_CHAT_ID=\${TELEGRAM_CHAT_ID}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - gclaude-enterprise
    restart: unless-stopped
\`\`\`

## 🏗️ Kubernetes 部署

### 基本 Deployment
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gclaude-enterprise
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gclaude-enterprise
  template:
    metadata:
      labels:
        app: gclaude-enterprise
    spec:
      containers:
      - name: gclaude-enterprise
        image: gclaude/enterprise-system:latest
        ports:
        - containerPort: 3007
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: gclaude-secrets
              key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: gclaude-enterprise-service
spec:
  selector:
    app: gclaude-enterprise
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3007
  type: LoadBalancer
\`\`\`

## 🖥️ VPS 部署

### 系統需求
- Ubuntu 20.04 LTS 或更高版本
- 至少 1GB RAM
- Node.js 18+
- PM2 或類似的程序管理器

### 部署步驟
\`\`\`bash
# 1. 更新系統
sudo apt update && sudo apt upgrade -y

# 2. 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安裝 PM2
sudo npm install pm2 -g

# 4. 複製程式碼
git clone <your-repo-url>
cd gclaude-enterprise-system

# 5. 安裝依賴
npm ci --production

# 6. 設定環境變數
cp .env.example .env
nano .env

# 7. 初始化資料庫
node database.js

# 8. 使用 PM2 啟動
pm2 start enterprise-server.js --name gclaude-enterprise
pm2 startup
pm2 save
\`\`\`

### PM2 設定檔 (ecosystem.config.js)
\`\`\`javascript
module.exports = {
  apps: [{
    name: 'gclaude-enterprise',
    script: 'enterprise-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3007
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3007
    }
  }]
};
\`\`\`

## 🔒 SSL/HTTPS 配置

### Let's Encrypt (推薦)
\`\`\`bash
# 1. 安裝 Certbot
sudo apt install certbot python3-certbot-nginx

# 2. 獲取 SSL 證書
sudo certbot --nginx -d your-domain.com

# 3. 自動更新證書
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
\`\`\`

### Nginx 反向代理設定
\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

## 📊 部署後檢查

### 健康檢查
\`\`\`bash
# 檢查服務狀態
curl -f https://your-domain.com/api/health

# 檢查回應時間
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/
\`\`\`

### 效能測試
\`\`\`bash
# 使用 Apache Bench
ab -n 100 -c 10 https://your-domain.com/api/health

# 使用 wrk
wrk -t12 -c400 -d30s --timeout 10s https://your-domain.com/
\`\`\`

## 🔄 CI/CD 自動部署

### GitHub Actions 示例
\`\`\`yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to Railway
      uses: railwayapp/railway-deploy@v1
      with:
        railway-token: \${{ secrets.RAILWAY_TOKEN }}
\`\`\`

## 📋 部署檢查清單

### 部署前
- [ ] 代碼已推送到代碼庫
- [ ] 環境變數已設定
- [ ] 資料庫已準備
- [ ] SSL 證書已配置
- [ ] 域名已設定

### 部署後
- [ ] 應用程式正常啟動
- [ ] 健康檢查通過
- [ ] 所有功能正常運作
- [ ] 監控系統已設定
- [ ] 備份機制已啟用

## ⚠️ 常見部署問題

### 記憶體不足
- 增加伺服器記憶體
- 優化 Node.js heap size
- 使用 cluster mode

### 連接埠衝突
- 檢查連接埠使用狀況
- 修改應用程式連接埠
- 配置反向代理

### 資料庫連線失敗
- 檢查資料庫設定
- 確認連線字串正確
- 檢查防火牆設定

## 📞 技術支援

部署過程中如遇問題：
1. 檢查應用程式日誌
2. 參考故障排除文檔
3. 聯繫技術團隊
4. 查看平台文檔

---

部署完成後，建議設定[監控系統](MONITORING.md)以確保系統穩定運行。
`;

        fs.writeFileSync(path.join(this.docsDir, 'DEPLOYMENT.md'), deploymentContent);
        console.log('✅ DEPLOYMENT.md 生成完成');
    }

    async generateTestingGuide() {
        console.log('📝 生成 TESTING.md...');
        
        const testingContent = `# 測試文檔

本文檔說明 GClaude Enterprise System 的完整測試策略和執行方式。

## 🧪 測試架構

### 測試類型
- **單元測試** - 個別函式和模組測試
- **整合測試** - API 端點和服務整合測試  
- **端到端測試** - 完整用戶流程測試
- **效能測試** - 系統效能和負載測試

### 測試工具
- **Jest** - JavaScript 測試框架
- **Supertest** - HTTP 斷言庫
- **Puppeteer** - 瀏覽器自動化
- **Lighthouse** - 效能分析工具

## 📁 測試目錄結構

\`\`\`
tests/
├── unit/                 # 單元測試
│   ├── database.test.js  # 資料庫測試
│   └── api-routes.test.js # API 路由測試
├── integration/          # 整合測試
│   └── api-integration.test.js
├── e2e/                  # 端到端測試
│   └── user-flows.test.js
├── performance/          # 效能測試
│   └── lighthouse-test.js
├── helpers/              # 測試輔助工具
│   ├── setup.js         # Jest 設定
│   └── test-helpers.js  # 測試工具函式
└── fixtures/             # 測試數據
    └── sample-data.json
\`\`\`

## 🔧 環境設定

### Jest 配置 (package.json)
\`\`\`json
{
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "**/*.js",
      "!**/node_modules/**",
      "!**/tests/**"
    ],
    "coverageDirectory": "test-results/coverage",
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
\`\`\`

### 測試腳本
\`\`\`json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:performance": "node tests/performance/lighthouse-test.js",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
\`\`\`

## 🧪 單元測試

### 資料庫測試
\`\`\`javascript
describe('Database Operations', () => {
  test('should create employee', () => {
    const employeeData = {
      name: '測試員工',
      position: '測試職位',
      department: '測試部門',
      salary: 50000
    };
    
    expect(employeeData).toHaveProperty('name');
    expect(employeeData.salary).toBeGreaterThan(0);
  });
});
\`\`\`

### API 路由測試
\`\`\`javascript
describe('API Routes', () => {
  test('should handle health check', () => {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
    
    expect(healthStatus.status).toBe('ok');
  });
});
\`\`\`

## 🔗 整合測試

### API 端點測試
\`\`\`javascript
const request = require('supertest');
const app = require('../../enterprise-server');

describe('API Integration', () => {
  test('GET /api/health should return 200', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
      
    expect(response.body).toHaveProperty('status');
  });
  
  test('POST /api/auth/login should authenticate', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
      
    expect([200, 401]).toContain(response.status);
  });
});
\`\`\`

## 🎭 端到端測試

### 用戶登入流程
\`\`\`javascript
const puppeteer = require('puppeteer');

describe('User Login Flow', () => {
  let browser, page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true'
    });
    page = await browser.newPage();
  });
  
  test('should login with valid credentials', async () => {
    await page.goto('http://localhost:3007');
    
    const loginForm = await page.$('#loginForm');
    if (loginForm) {
      await page.type('#username', 'admin');
      await page.type('#password', 'admin123');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('localhost:3007');
    }
  });
  
  afterAll(async () => {
    await browser.close();
  });
});
\`\`\`

## ⚡ 效能測試

### Lighthouse 測試
\`\`\`javascript
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

describe('Performance Tests', () => {
  test('should meet performance benchmarks', async () => {
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless']
    });
    
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port
    };
    
    const runnerResult = await lighthouse('http://localhost:3007', options);
    await chrome.kill();
    
    const score = runnerResult.lhr.categories.performance.score * 100;
    expect(score).toBeGreaterThanOrEqual(50);
  });
});
\`\`\`

### 負載測試
\`\`\`javascript
describe('Load Tests', () => {
  test('should handle concurrent requests', async () => {
    const requests = Array(10).fill().map(() => 
      fetch('http://localhost:3007/api/health')
    );
    
    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.ok).length;
    
    expect(successCount).toBeGreaterThanOrEqual(8);
  });
});
\`\`\`

## 📊 測試覆蓋率

### 覆蓋率目標
- **行覆蓋率**: ≥ 80%
- **函式覆蓋率**: ≥ 85%  
- **分支覆蓋率**: ≥ 75%
- **語句覆蓋率**: ≥ 80%

### 覆蓋率報告
\`\`\`bash
# 生成覆蓋率報告
npm run test:coverage

# 查看 HTML 報告
open test-results/coverage/index.html
\`\`\`

### 覆蓋率徽章
專案 README 中顯示覆蓋率徽章：
\`\`\`markdown
![Coverage Badge](test-results/coverage/badge.svg)
\`\`\`

## 🚀 CI/CD 測試

### GitHub Actions 測試流程
\`\`\`yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm run test:ci
      
    - name: Upload coverage
      uses: codecov/codecov-action@v2
\`\`\`

### 測試環境配置
\`\`\`bash
# 設定測試環境變數
export NODE_ENV=test
export TEST_BASE_URL=http://localhost:3007
export CI=true

# 執行 CI 測試
npm run test:ci
\`\`\`

## 🛠️ 測試工具函式

### TestHelpers 類別
\`\`\`javascript
class TestHelpers {
  static createTestUser(userData = {}) {
    return {
      id: Date.now(),
      username: 'testuser',
      password: 'testpass123',
      ...userData
    };
  }
  
  static async loginUser(app, credentials) {
    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials);
    return response;
  }
  
  static generateTestData(type, count = 1) {
    const generators = {
      employee: () => ({
        name: \`測試員工\${Math.random()}\`,
        position: '測試職位',
        salary: 50000
      }),
      attendance: () => ({
        employeeId: 1,
        date: new Date().toISOString().split('T')[0],
        status: 'present'
      })
    };
    
    return Array.from({ length: count }, generators[type]);
  }
}
\`\`\`

## 📝 測試數據管理

### 測試數據庫
\`\`\`javascript
// 測試前設定
beforeAll(async () => {
  // 使用記憶體資料庫
  process.env.DATABASE_URL = ':memory:';
  await initializeDatabase();
});

// 每個測試後清理
afterEach(async () => {
  await clearTestData();
});
\`\`\`

### 模擬數據
\`\`\`javascript
const mockData = {
  employees: [
    { id: 1, name: '張三', position: '工程師' },
    { id: 2, name: '李四', position: '經理' }
  ],
  attendance: [
    { id: 1, employeeId: 1, date: '2024-01-15', status: 'present' }
  ]
};
\`\`\`

## 🔍 測試除錯

### 除錯技巧
\`\`\`javascript
// 使用 console.log 除錯
test('debug example', () => {
  const result = someFunction();
  console.log('Debug result:', result);
  expect(result).toBeDefined();
});

// 使用 Jest 除錯模式
// jest --detectOpenHandles --forceExit
\`\`\`

### 測試隔離
\`\`\`javascript
// 確保測試獨立性
describe('isolated tests', () => {
  let testInstance;
  
  beforeEach(() => {
    testInstance = new TestClass();
  });
  
  afterEach(() => {
    testInstance = null;
  });
});
\`\`\`

## 📈 測試報告

### HTML 報告
- **Jest HTML Reporter**: 詳細測試結果
- **Coverage Report**: 覆蓋率視覺化報告
- **Performance Report**: Lighthouse 效能報告

### JSON 報告
\`\`\`bash
# 生成 JSON 報告
jest --json --outputFile=test-results/results.json
\`\`\`

## ⚠️ 測試最佳實踐

### 撰寫原則
1. **AAA 模式**: Arrange, Act, Assert
2. **單一職責**: 每個測試只驗證一個功能
3. **獨立性**: 測試間不應相互依賴
4. **可讀性**: 清楚的測試名稱和描述

### 常見陷阱
- 避免過度模擬 (over-mocking)
- 避免測試實作細節
- 避免脆弱的測試 (brittle tests)
- 避免測試間共享狀態

## 🚨 測試故障排除

### 常見錯誤
1. **模組找不到**: 檢查 import 路徑
2. **測試超時**: 增加 timeout 設定
3. **非同步問題**: 正確使用 async/await
4. **記憶體洩漏**: 清理測試資源

### 除錯命令
\`\`\`bash
# 執行單一測試檔案
jest tests/unit/database.test.js

# 監視模式
jest --watch

# 除錯模式
node --inspect-brk ./node_modules/.bin/jest --runInBand
\`\`\`

## 📞 測試支援

需要測試相關協助：
1. 檢查測試文檔
2. 查看測試範例
3. 聯繫開發團隊
4. 參考 Jest 官方文檔

---

完整的測試確保系統品質和穩定性。建議在開發過程中持續執行測試。
`;

        fs.writeFileSync(path.join(this.docsDir, 'TESTING.md'), testingContent);
        console.log('✅ TESTING.md 生成完成');
    }

    async generateMonitoringGuide() {
        console.log('📝 生成 MONITORING.md...');
        
        const monitoringContent = `# 監控文檔

本文檔說明 GClaude Enterprise System 的完整監控和告警系統。

## 📊 監控概述

### 監控類型
- **健康監控** - 服務可用性檢查
- **效能監控** - 系統效能指標追蹤
- **錯誤監控** - 錯誤和異常追蹤
- **業務監控** - 關鍵業務指標監控

### 監控目標
- **可用性**: 99.9% 系統正常運行時間
- **回應時間**: API 回應時間 < 500ms
- **錯誤率**: 系統錯誤率 < 1%
- **資源使用**: CPU < 70%, 記憶體 < 80%

## 🏥 健康檢查

### 健康檢查端點
\`\`\`
GET /api/health
\`\`\`

**回應範例**:
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "database": "connected",
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB"
  }
}
\`\`\`

### 深度健康檢查
\`\`\`
GET /api/health/deep
\`\`\`

檢查項目：
- 資料庫連線狀態
- 外部服務連線
- 檔案系統存取
- 記憶體使用狀況

## 📈 效能監控

### 關鍵指標
- **回應時間**: API 端點回應時間
- **吞吐量**: 每秒請求數 (RPS)
- **併發用戶**: 同時線上用戶數
- **資源使用率**: CPU、記憶體、磁碟

### Node.js 內建監控
\`\`\`javascript
// 記憶體使用監控
const memoryUsage = process.memoryUsage();
console.log('Memory Usage:', {
  rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
  heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
  heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
});

// CPU 使用監控
const cpuUsage = process.cpuUsage();
console.log('CPU Usage:', cpuUsage);
\`\`\`

## 🖥️ 監控儀表板

### 啟動儀表板
\`\`\`bash
# 啟動監控儀表板
node scripts/start-monitoring.js
\`\`\`

訪問: http://localhost:3008

### 儀表板功能
- **即時系統狀態**: 服務健康度和效能指標
- **歷史數據圖表**: 趨勢分析和模式識別  
- **告警管理**: 告警規則設定和歷史記錄
- **服務清單**: 所有監控目標狀態概覽

### 監控指標
\`\`\`javascript
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "targets": [
    {
      "name": "Railway Production",
      "url": "https://gclaude-enterprise.railway.app",
      "status": "up",
      "responseTime": 245,
      "uptime": "99.95%"
    },
    {
      "name": "Render Production", 
      "url": "https://gclaude-enterprise.onrender.com",
      "status": "up",
      "responseTime": 312,
      "uptime": "99.87%"
    }
  ],
  "summary": {
    "totalTargets": 2,
    "healthyTargets": 2,
    "averageResponseTime": "278ms",
    "overallUptime": "99.91%"
  }
}
\`\`\`

## 🚨 告警系統

### 告警類型
- **服務異常**: 服務無法訪問或回應錯誤
- **效能告警**: 回應時間過長或資源使用過高
- **錯誤告警**: 錯誤率超過閾值
- **業務告警**: 關鍵業務指標異常

### Telegram 告警
系統支援自動 Telegram 告警通知：

**設定**:
\`\`\`bash
# 環境變數設定
export TELEGRAM_BOT_TOKEN="your-bot-token"
export TELEGRAM_CHAT_ID="your-chat-id"
\`\`\`

**告警訊息範例**:
\`\`\`
🚨 系統告警

類型: 服務異常
目標: Railway Production
訊息: HTTP 500 Internal Server Error
時間: 2024-01-15 10:30:00
持續時間: 2 分鐘

請立即檢查系統狀態。
\`\`\`

### 告警規則配置
\`\`\`javascript
const alertRules = [
  {
    name: 'Service Down',
    condition: 'target_status == "down"',
    severity: 'critical',
    cooldown: 5 // 分鐘
  },
  {
    name: 'High Response Time',
    condition: 'response_time > 2000',
    severity: 'warning', 
    cooldown: 15
  },
  {
    name: 'Low Uptime',
    condition: 'uptime < 99',
    severity: 'warning',
    cooldown: 30
  }
];
\`\`\`

## 📝 日誌監控

### 日誌格式
\`\`\`javascript
// 結構化日誌格式
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info|warn|error",
  "message": "描述訊息",
  "service": "gclaude-enterprise",
  "requestId": "req-12345",
  "userId": "user-456",
  "metadata": {
    "endpoint": "/api/employees",
    "method": "GET",
    "statusCode": 200,
    "responseTime": 125
  }
}
\`\`\`

### 日誌聚合
\`\`\`bash
# 使用 Winston 進行日誌管理
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
\`\`\`

### 日誌分析
關鍵日誌監控指標：
- **錯誤率**: 錯誤日誌 / 總日誌數
- **回應時間**: API 請求回應時間分佈
- **使用模式**: 最常用的功能和端點
- **異常模式**: 錯誤集中時間和原因

## 📊 業務監控

### 關鍵業務指標 (KPI)
- **活躍用戶數**: 日/週/月活躍用戶
- **功能使用率**: 各功能模組使用頻率
- **資料增長**: 員工、出勤、營收數據增長趨勢
- **系統效能**: 用戶操作完成時間

### 業務監控端點
\`\`\`
GET /api/metrics/business
\`\`\`

**回應範例**:
\`\`\`json
{
  "activeUsers": {
    "daily": 25,
    "weekly": 78,
    "monthly": 156
  },
  "featureUsage": {
    "employeeManagement": 45,
    "attendanceTracking": 32,
    "revenueAnalysis": 23
  },
  "dataGrowth": {
    "employees": "+5 this month",
    "attendanceRecords": "+234 this month", 
    "revenueEntries": "+18 this month"
  }
}
\`\`\`

## 🔧 監控配置

### 監控間隔設定
\`\`\`javascript
const monitoringConfig = {
  intervals: {
    healthCheck: 5,      // 分鐘
    performanceCheck: 15, // 分鐘  
    systemCheck: 30,     // 分鐘
    reportGeneration: 60  // 分鐘
  },
  thresholds: {
    responseTime: 2000,   // ms
    errorRate: 5,         // %
    uptime: 99,          // %
    memoryUsage: 80,     // %
    cpuUsage: 70         // %
  }
};
\`\`\`

### 監控目標管理
\`\`\`javascript
// 新增監控目標
const newTarget = {
  name: 'New Service',
  url: 'https://new-service.example.com',
  type: 'web',
  timeout: 10000,
  enabled: true
};

// 更新監控配置
await monitoringSystem.addTarget('production', newTarget);
\`\`\`

## 📈 效能分析

### 效能報告
系統定期生成效能分析報告：
- **回應時間趨勢**: 7天/30天回應時間變化
- **錯誤率分析**: 錯誤類型和頻率統計  
- **資源使用趨勢**: CPU/記憶體使用變化
- **用戶行為分析**: 高峰時段和使用模式

### 效能優化建議
基於監控數據提供優化建議：
- **回應時間優化**: API 緩存、資料庫查詢優化
- **資源優化**: 記憶體管理、CPU 使用優化
- **擴展建議**: 負載平衡、橫向擴展建議

## 🔍 故障檢測

### 自動故障檢測
- **服務異常檢測**: HTTP 錯誤碼監控
- **效能異常檢測**: 回應時間突然增加
- **資源異常檢測**: CPU/記憶體使用激增
- **業務異常檢測**: 關鍵指標異常下降

### 故障回應流程
1. **自動檢測**: 監控系統檢測到異常
2. **告警發送**: 自動發送 Telegram 告警
3. **問題分析**: 查看監控數據和日誌
4. **修復操作**: 執行修復措施
5. **狀態確認**: 確認問題已解決

## 📱 行動監控

### 手機訪問
監控儀表板支援行動裝置：
- **響應式設計**: 適應手機螢幕
- **關鍵指標**: 重點顯示關鍵監控數據
- **告警通知**: Telegram 即時推送告警

### 監控 App
可考慮開發專用監控 App：
- **推播通知**: 即時告警推播
- **快速操作**: 常用監控操作快捷方式
- **離線查看**: 快取重要監控數據

## 🛠️ 監控維護

### 定期維護任務
- **日誌輪轉**: 定期清理舊日誌檔案
- **數據清理**: 清理過期監控數據
- **配置檢查**: 檢查監控配置正確性
- **效能調優**: 監控系統本身效能優化

### 監控系統備份
\`\`\`bash
# 備份監控配置
cp monitoring/config/monitoring-config.json backup/

# 備份監控數據
cp -r monitoring/logs backup/logs-$(date +%Y%m%d)

# 備份監控報告
cp -r monitoring/reports backup/reports-$(date +%Y%m%d)
\`\`\`

## 📞 監控支援

### 監控問題排除
1. 檢查監控系統本身狀態
2. 驗證網路連線和權限
3. 查看監控系統日誌
4. 測試告警通知功能

### 聯繫支援
如遇監控相關問題：
- 查看監控系統日誌
- 檢查 Telegram Bot 設定
- 聯繫系統管理員
- 參考故障排除文檔

---

完善的監控系統是保證系統穩定運行的關鍵。建議定期檢查監控數據和告警設定。
`;

        fs.writeFileSync(path.join(this.docsDir, 'MONITORING.md'), monitoringContent);
        console.log('✅ MONITORING.md 生成完成');
    }

    async generateTroubleshootingGuide() {
        console.log('📝 生成 TROUBLESHOOTING.md...');
        
        const troubleshootingContent = `# 故障排除指南

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
\`\`\`bash
# 檢查服務是否運行
ps aux | grep node
systemctl status gclaude-enterprise  # 如使用 systemd
pm2 status  # 如使用 PM2
\`\`\`

2. 檢查連接埠
\`\`\`bash
# 檢查連接埠是否監聽
netstat -tlnp | grep :3007
lsof -i :3007
\`\`\`

3. 重啟服務
\`\`\`bash
# PM2 重啟
pm2 restart gclaude-enterprise

# 手動重啟
npm start

# Docker 重啟
docker restart gclaude-enterprise
\`\`\`

### 資料庫連線失敗
**症狀**: 系統啟動失敗，顯示資料庫錯誤

**錯誤訊息範例**:
\`\`\`
Error: SQLITE_CANTOPEN: unable to open database file
\`\`\`

**解決步驟**:
1. 檢查資料庫檔案
\`\`\`bash
# 檢查資料庫檔案是否存在
ls -la data/enterprise.db

# 檢查檔案權限
chmod 666 data/enterprise.db
chmod 755 data/
\`\`\`

2. 重建資料庫
\`\`\`bash
# 備份現有資料庫（如果存在）
cp data/enterprise.db data/enterprise.db.backup

# 重新初始化資料庫
node database.js
\`\`\`

## ⚠️ 常見錯誤

### 1. 連接埠被佔用
**錯誤**: \`Error: listen EADDRINUSE: address already in use :::3007\`

**解決方法**:
\`\`\`bash
# 找出佔用連接埠的程序
lsof -ti:3007 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3007   # Windows

# 或使用不同連接埠
export PORT=3008
npm start
\`\`\`

### 2. 記憶體不足
**錯誤**: \`JavaScript heap out of memory\`

**解決方法**:
\`\`\`bash
# 增加 Node.js 記憶體限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm start

# 或在 package.json 中設定
"start": "node --max-old-space-size=4096 enterprise-server.js"
\`\`\`

### 3. 模組找不到
**錯誤**: \`Cannot find module 'express'\`

**解決方法**:
\`\`\`bash
# 重新安裝依賴
npm install

# 清除 npm 快取
npm cache clean --force
rm -rf node_modules
npm install
\`\`\`

### 4. 權限錯誤
**錯誤**: \`EACCES: permission denied\`

**解決方法**:
\`\`\`bash
# 修正檔案權限
sudo chown -R $USER:$USER .
chmod -R 755 .

# 避免使用 sudo npm（建議）
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
\`\`\`

## 🔐 認證問題

### JWT Token 相關問題
**症狀**: 登入後立即被登出，或 API 返回 401

**可能原因**:
- JWT_SECRET 未設定或變更
- Token 過期時間設定錯誤
- 時間同步問題

**解決步驟**:
1. 檢查環境變數
\`\`\`bash
echo $JWT_SECRET
# 應該有值，如果沒有則設定
export JWT_SECRET="your-secure-secret-key"
\`\`\`

2. 檢查系統時間
\`\`\`bash
# 確保系統時間正確
date
# 如需要，同步時間
sudo ntpdate -s time.nist.gov  # Linux
\`\`\`

3. 清除瀏覽器快取
- 清除瀏覽器 localStorage
- 重新登入系統

### 登入失敗
**症狀**: 使用正確帳密無法登入

**檢查步驟**:
1. 驗證預設帳號
\`\`\`bash
# 檢查資料庫中的用戶
sqlite3 data/enterprise.db "SELECT * FROM users;"
\`\`\`

2. 重設管理員密碼
\`\`\`javascript
// 臨時腳本重設密碼
const bcrypt = require('bcrypt');
const hashedPassword = bcrypt.hashSync('admin123', 10);
console.log('New hashed password:', hashedPassword);
// 手動更新資料庫
\`\`\`

## 📊 效能問題

### 系統回應緩慢
**症狀**: 頁面載入時間過長，API 回應慢

**診斷步驟**:
1. 檢查系統資源
\`\`\`bash
# CPU 和記憶體使用率
top
htop
free -h

# 磁碟使用率
df -h
\`\`\`

2. 分析日誌
\`\`\`bash
# 查看錯誤日誌
tail -f logs/error.log

# 查看訪問日誌
tail -f logs/access.log
\`\`\`

3. 資料庫效能
\`\`\`bash
# 檢查資料庫檔案大小
ls -lh data/enterprise.db

# SQLite 分析
sqlite3 data/enterprise.db "ANALYZE;"
\`\`\`

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
\`\`\`bash
# 使用 Node.js 效能分析
node --prof enterprise-server.js
node --prof-process isolate-*.log > processed.txt

# 或使用 clinic.js
npm install -g clinic
clinic doctor -- node enterprise-server.js
\`\`\`

## 🌐 網路問題

### API 請求失敗
**症狀**: 前端無法連接後端 API

**檢查清單**:
1. 網路連線
\`\`\`bash
# 測試 API 連線
curl -I http://localhost:3007/api/health
\`\`\`

2. CORS 問題
檢查控制台是否有 CORS 錯誤，確保後端正確設定 CORS 標頭。

3. 代理設定
如使用反向代理，檢查 Nginx/Apache 設定。

### SSL/HTTPS 問題
**症狀**: HTTPS 網站顯示不安全或無法訪問

**解決步驟**:
1. 檢查證書
\`\`\`bash
# 檢查證書有效期
openssl x509 -in /path/to/cert.pem -text -noout

# 測試 SSL 連線
openssl s_client -connect your-domain.com:443
\`\`\`

2. 更新證書
\`\`\`bash
# Let's Encrypt 證書更新
sudo certbot renew

# 重載 Nginx
sudo nginx -s reload
\`\`\`

## 💾 資料問題

### 資料遺失或損壞
**症狀**: 資料顯示不正確或遺失

**緊急處理**:
1. 停止服務避免進一步損壞
\`\`\`bash
pm2 stop gclaude-enterprise
\`\`\`

2. 檢查資料庫完整性
\`\`\`bash
sqlite3 data/enterprise.db "PRAGMA integrity_check;"
\`\`\`

3. 從備份恢復
\`\`\`bash
# 恢復最近的備份
cp backup/enterprise-backup-latest.db data/enterprise.db
\`\`\`

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
\`\`\`
docker: Error response from daemon: port is already allocated
\`\`\`

**解決方法**:
\`\`\`bash
# 查看佔用連接埠的容器
docker ps -a

# 停止衝突的容器
docker stop <container-id>

# 使用不同連接埠
docker run -p 3008:3007 gclaude-enterprise
\`\`\`

### 資料持久化問題
**症狀**: 容器重啟後資料消失

**解決方法**:
\`\`\`bash
# 確保正確掛載資料卷
docker run -v ./data:/app/data gclaude-enterprise

# 檢查資料卷
docker volume ls
docker volume inspect <volume-name>
\`\`\`

## 📱 Telegram 告警問題

### 告警通知未收到
**檢查步驟**:
1. 驗證 Bot Token
\`\`\`bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
\`\`\`

2. 檢查 Chat ID
\`\`\`bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates"
\`\`\`

3. 測試發送訊息
\`\`\`bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "<CHAT_ID>", "text": "測試訊息"}'
\`\`\`

## 🔧 開發環境問題

### 熱重載不工作
**症狀**: 修改程式碼後需要手動重啟

**解決方法**:
\`\`\`bash
# 使用 nodemon
npm install -g nodemon
nodemon enterprise-server.js

# 或使用 PM2 watch 模式
pm2 start enterprise-server.js --watch
\`\`\`

### 測試失敗
**常見問題**:
1. 測試環境資料庫設定
2. 異步操作未正確處理
3. 測試間狀態污染

**解決方法**:
\`\`\`bash
# 單獨運行失敗的測試
jest tests/unit/specific-test.test.js --verbose

# 清理測試環境
rm -rf test-results/
npm run test:clean
\`\`\`

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
\`\`\`bash
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
\`\`\`

---

記住：大多數問題都有解決方案，保持冷靜並系統性地排除問題。
`;

        fs.writeFileSync(path.join(this.docsDir, 'TROUBLESHOOTING.md'), troubleshootingContent);
        console.log('✅ TROUBLESHOOTING.md 生成完成');
    }
}

if (require.main === module) {
    const generator = new DocumentationGeneratorBatch2();
    generator.generateSecondBatchDocs()
        .then(result => {
            console.log(`✅ 第二批文檔生成完成 - ${result.docs} 個文件已建立`);
        })
        .catch(console.error);
}

module.exports = DocumentationGeneratorBatch2;