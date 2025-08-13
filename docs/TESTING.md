# 測試文檔

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

```
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
```

## 🔧 環境設定

### Jest 配置 (package.json)
```json
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
```

### 測試腳本
```json
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
```

## 🧪 單元測試

### 資料庫測試
```javascript
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
```

### API 路由測試
```javascript
describe('API Routes', () => {
  test('should handle health check', () => {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
    
    expect(healthStatus.status).toBe('ok');
  });
});
```

## 🔗 整合測試

### API 端點測試
```javascript
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
```

## 🎭 端到端測試

### 用戶登入流程
```javascript
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
```

## ⚡ 效能測試

### Lighthouse 測試
```javascript
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
```

### 負載測試
```javascript
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
```

## 📊 測試覆蓋率

### 覆蓋率目標
- **行覆蓋率**: ≥ 80%
- **函式覆蓋率**: ≥ 85%  
- **分支覆蓋率**: ≥ 75%
- **語句覆蓋率**: ≥ 80%

### 覆蓋率報告
```bash
# 生成覆蓋率報告
npm run test:coverage

# 查看 HTML 報告
open test-results/coverage/index.html
```

### 覆蓋率徽章
專案 README 中顯示覆蓋率徽章：
```markdown
![Coverage Badge](test-results/coverage/badge.svg)
```

## 🚀 CI/CD 測試

### GitHub Actions 測試流程
```yaml
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
```

### 測試環境配置
```bash
# 設定測試環境變數
export NODE_ENV=test
export TEST_BASE_URL=http://localhost:3007
export CI=true

# 執行 CI 測試
npm run test:ci
```

## 🛠️ 測試工具函式

### TestHelpers 類別
```javascript
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
        name: `測試員工${Math.random()}`,
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
```

## 📝 測試數據管理

### 測試數據庫
```javascript
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
```

### 模擬數據
```javascript
const mockData = {
  employees: [
    { id: 1, name: '張三', position: '工程師' },
    { id: 2, name: '李四', position: '經理' }
  ],
  attendance: [
    { id: 1, employeeId: 1, date: '2024-01-15', status: 'present' }
  ]
};
```

## 🔍 測試除錯

### 除錯技巧
```javascript
// 使用 console.log 除錯
test('debug example', () => {
  const result = someFunction();
  console.log('Debug result:', result);
  expect(result).toBeDefined();
});

// 使用 Jest 除錯模式
// jest --detectOpenHandles --forceExit
```

### 測試隔離
```javascript
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
```

## 📈 測試報告

### HTML 報告
- **Jest HTML Reporter**: 詳細測試結果
- **Coverage Report**: 覆蓋率視覺化報告
- **Performance Report**: Lighthouse 效能報告

### JSON 報告
```bash
# 生成 JSON 報告
jest --json --outputFile=test-results/results.json
```

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
```bash
# 執行單一測試檔案
jest tests/unit/database.test.js

# 監視模式
jest --watch

# 除錯模式
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

## 📞 測試支援

需要測試相關協助：
1. 檢查測試文檔
2. 查看測試範例
3. 聯繫開發團隊
4. 參考 Jest 官方文檔

---

完整的測試確保系統品質和穩定性。建議在開發過程中持續執行測試。
