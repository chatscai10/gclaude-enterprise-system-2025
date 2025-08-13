/**
 * 生產環境部署編排器
 * 自動化部署流程和環境配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionDeploymentOrchestrator {
    constructor() {
        this.deploymentConfig = {
            platforms: ['railway', 'render', 'vercel'],
            domains: {
                railway: 'gclaude-enterprise.railway.app',
                render: 'gclaude-enterprise.onrender.com',
                vercel: 'gclaude-enterprise.vercel.app'
            },
            environment: {
                NODE_ENV: 'production',
                JWT_SECRET: 'gclaude-enterprise-jwt-secret-prod-2025',
                DATABASE_URL: 'sqlite:./data/enterprise.db',
                TELEGRAM_BOT_TOKEN: '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc',
                TELEGRAM_CHAT_ID: '-1002658082392',
                PORT: '${PORT}' // 平台動態分配
            },
            healthCheck: '/api/health',
            buildCommand: 'npm install',
            startCommand: 'node enterprise-server.js'
        };
        
        this.deploymentStatus = {
            prepared: false,
            configured: false,
            deployed: false,
            verified: false
        };
    }

    async orchestrateDeployment() {
        console.log('🚀 開始生產環境部署編排...\n');

        try {
            // 1. 準備部署環境
            await this.prepareDeploymentEnvironment();
            
            // 2. 生成部署配置
            await this.generateDeploymentConfigs();
            
            // 3. 創建環境變數配置
            await this.createEnvironmentConfigs();
            
            // 4. 生成部署腳本
            await this.generateDeploymentScripts();
            
            // 5. 創建Docker配置
            await this.createDockerConfig();
            
            // 6. 生成部署檢查清單
            await this.generateDeploymentChecklist();

            console.log('\n✅ 生產環境部署準備完成！');
            return this.deploymentStatus;

        } catch (error) {
            console.error('❌ 部署編排失敗:', error.message);
            throw error;
        }
    }

    async prepareDeploymentEnvironment() {
        console.log('📦 準備部署環境...');
        
        // 檢查必要文件
        const requiredFiles = [
            'package.json',
            'enterprise-server.js',
            'database.js',
            'routes/complete-api.js'
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(__dirname, '..', file))) {
                throw new Error(`必要文件缺失: ${file}`);
            }
        }

        // 確保數據目錄存在
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.deploymentStatus.prepared = true;
        console.log('✅ 部署環境準備完成');
    }

    async generateDeploymentConfigs() {
        console.log('⚙️ 生成部署配置文件...');

        // Railway 配置
        const railwayConfig = {
            "$schema": "https://railway.app/railway.schema.json",
            "build": {
                "builder": "NIXPACKS",
                "buildCommand": this.deploymentConfig.buildCommand
            },
            "deploy": {
                "startCommand": this.deploymentConfig.startCommand,
                "healthcheckPath": this.deploymentConfig.healthCheck,
                "healthcheckTimeout": 60,
                "restartPolicyType": "ON_FAILURE",
                "restartPolicyMaxRetries": 3
            }
        };

        fs.writeFileSync(
            path.join(__dirname, '..', 'railway.json'),
            JSON.stringify(railwayConfig, null, 2)
        );

        // Render 配置
        const renderConfig = `
services:
  - type: web
    name: gclaude-enterprise-system
    env: node
    plan: free
    buildCommand: ${this.deploymentConfig.buildCommand}
    startCommand: ${this.deploymentConfig.startCommand}
    healthCheckPath: ${this.deploymentConfig.healthCheck}
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        sync: false
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      - key: TELEGRAM_CHAT_ID
        sync: false
`;

        fs.writeFileSync(
            path.join(__dirname, '..', 'render.yaml'),
            renderConfig.trim()
        );

        // Vercel 配置
        const vercelConfig = {
            "version": 2,
            "name": "gclaude-enterprise-system",
            "builds": [
                {
                    "src": "enterprise-server.js",
                    "use": "@vercel/node"
                }
            ],
            "routes": [
                {
                    "src": "/(.*)",
                    "dest": "/enterprise-server.js"
                }
            ],
            "env": {
                "NODE_ENV": "production"
            },
            "functions": {
                "enterprise-server.js": {
                    "maxDuration": 30
                }
            }
        };

        fs.writeFileSync(
            path.join(__dirname, '..', 'vercel.json'),
            JSON.stringify(vercelConfig, null, 2)
        );

        // Procfile
        fs.writeFileSync(
            path.join(__dirname, '..', 'Procfile'),
            `web: ${this.deploymentConfig.startCommand}`
        );

        console.log('✅ 部署配置文件生成完成');
    }

    async createEnvironmentConfigs() {
        console.log('🔐 創建環境變數配置...');

        // 生產環境變數
        const envContent = Object.entries(this.deploymentConfig.environment)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        fs.writeFileSync(
            path.join(__dirname, '..', '.env.production'),
            envContent
        );

        // 環境變數範例
        const envExampleContent = Object.keys(this.deploymentConfig.environment)
            .map(key => `${key}=your_${key.toLowerCase()}_here`)
            .join('\n');

        fs.writeFileSync(
            path.join(__dirname, '..', '.env.example'),
            envExampleContent
        );

        console.log('✅ 環境變數配置完成');
    }

    async generateDeploymentScripts() {
        console.log('📝 生成部署腳本...');

        // 部署腳本
        const deployScript = `#!/bin/bash
# 自動部署腳本

echo "🚀 開始自動部署..."

# 檢查環境
node --version
npm --version

# 安裝依賴
echo "📦 安裝依賴..."
npm ci --production

# 數據庫初始化
echo "💾 初始化數據庫..."
node -e "require('./database.js')"

# 健康檢查
echo "🏥 執行健康檢查..."
timeout 30 bash -c 'until curl -f http://localhost:\${PORT:-3007}/api/health; do sleep 2; done'

echo "✅ 部署完成！"
`;

        fs.writeFileSync(
            path.join(__dirname, '..', 'deploy.sh'),
            deployScript
        );

        // Windows 部署腳本
        const deployBat = `@echo off
echo 🚀 開始自動部署...

node --version
npm --version

echo 📦 安裝依賴...
npm ci --production

echo 💾 初始化數據庫...
node -e "require('./database.js')"

echo ✅ 部署完成！
`;

        fs.writeFileSync(
            path.join(__dirname, '..', 'deploy.bat'),
            deployBat
        );

        console.log('✅ 部署腳本生成完成');
    }

    async createDockerConfig() {
        console.log('🐳 創建Docker配置...');

        // Dockerfile
        const dockerfile = `# 使用官方 Node.js 18 LTS 映像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package 文件
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production && npm cache clean --force

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# 複製應用程序文件
COPY --chown=nodeuser:nodejs . .

# 創建數據目錄
RUN mkdir -p data && chown nodeuser:nodejs data

# 切換到非 root 用戶
USER nodeuser

# 暴露端口
EXPOSE 3007

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3007/api/health || exit 1

# 啟動應用
CMD ["node", "enterprise-server.js"]
`;

        fs.writeFileSync(
            path.join(__dirname, '..', 'Dockerfile'),
            dockerfile
        );

        // Docker Compose
        const dockerCompose = `version: '3.8'

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
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3007/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - gclaude-enterprise
    restart: unless-stopped
`;

        fs.writeFileSync(
            path.join(__dirname, '..', 'docker-compose.yml'),
            dockerCompose
        );

        // .dockerignore
        const dockerignore = `node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.cache
.temp
logs
*.log
*.tmp
.DS_Store
Thumbs.db
`;

        fs.writeFileSync(
            path.join(__dirname, '..', '.dockerignore'),
            dockerignore
        );

        console.log('✅ Docker配置完成');
    }

    async generateDeploymentChecklist() {
        console.log('📋 生成部署檢查清單...');

        const checklist = `# 🚀 生產環境部署檢查清單

## 📋 部署前檢查

### ✅ 代碼準備
- [ ] 所有測試通過 (API: 100%, 安全: 100%, 瀏覽器: 98%)
- [ ] 代碼已推送到 Git 倉庫
- [ ] 版本標籤已創建
- [ ] 生產分支已更新

### ✅ 環境配置
- [ ] 環境變數已配置 (.env.production)
- [ ] JWT_SECRET 已設置為生產密鑰
- [ ] Telegram Bot Token 已驗證
- [ ] 數據庫連接字串已配置

### ✅ 平台配置
- [ ] Railway 專案已創建
- [ ] Render 服務已配置
- [ ] Vercel 專案已設置
- [ ] 域名已配置 (可選)

## 🚀 部署流程

### Railway 部署
\`\`\`bash
# 1. 連接 Railway
railway login

# 2. 初始化專案
railway init

# 3. 設置環境變數
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="your-jwt-secret"
railway variables set TELEGRAM_BOT_TOKEN="your-bot-token"
railway variables set TELEGRAM_CHAT_ID="your-chat-id"

# 4. 部署
railway up
\`\`\`

### Render 部署
1. 連接 GitHub 倉庫
2. 選擇 Web Service
3. 配置構建設置：
   - Build Command: \`npm install\`
   - Start Command: \`node enterprise-server.js\`
4. 設置環境變數
5. 啟動部署

### Vercel 部署
\`\`\`bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
\`\`\`

### Docker 部署
\`\`\`bash
# 構建映像
docker build -t gclaude-enterprise .

# 運行容器
docker run -p 3007:3007 \\
  -e NODE_ENV=production \\
  -e JWT_SECRET="your-jwt-secret" \\
  -e TELEGRAM_BOT_TOKEN="your-bot-token" \\
  -e TELEGRAM_CHAT_ID="your-chat-id" \\
  gclaude-enterprise

# 或使用 Docker Compose
docker-compose up -d
\`\`\`

## ✅ 部署後驗證

### 健康檢查
- [ ] API 健康檢查通過: \`GET /api/health\`
- [ ] 登入功能正常: \`POST /api/auth/login\`
- [ ] 數據庫連接正常
- [ ] Telegram 通知功能測試

### 功能驗證
- [ ] 管理員登入測試
- [ ] 員工管理功能測試
- [ ] 出勤系統測試
- [ ] 營收管理測試
- [ ] 權限控制驗證

### 效能檢查
- [ ] 頁面載入時間 < 3秒
- [ ] API 回應時間 < 500ms
- [ ] 記憶體使用量正常
- [ ] CPU 使用率正常

### 安全檢查
- [ ] HTTPS 證書有效
- [ ] JWT Token 安全配置
- [ ] API 端點權限控制
- [ ] 敏感資訊不暴露

## 📊 監控設置

### 基本監控
- [ ] 服務運行狀態監控
- [ ] API 端點可用性監控
- [ ] 錯誤率監控
- [ ] 回應時間監控

### 進階監控
- [ ] 資源使用率監控
- [ ] 使用者行為分析
- [ ] 安全事件監控
- [ ] 自動告警設置

## 🚨 故障排除

### 常見問題
1. **502/503 錯誤**
   - 檢查服務是否正常啟動
   - 檢查端口配置
   - 檢查環境變數

2. **數據庫連接失敗**
   - 檢查數據庫檔案權限
   - 檢查數據目錄是否存在
   - 檢查 SQLite 模組安裝

3. **JWT 認證失敗**
   - 檢查 JWT_SECRET 環境變數
   - 檢查 Token 格式
   - 檢查過期時間設置

4. **Telegram 通知失敗**
   - 檢查 Bot Token 有效性
   - 檢查 Chat ID 正確性
   - 檢查網路連接

## 📞 緊急聯絡

- **Telegram 群組**: -1002658082392
- **健康檢查**: \`/api/health\`
- **系統狀態**: 自動 Telegram 通知
- **日誌查看**: 平台控制台

---

**部署日期**: ${new Date().toISOString()}
**版本**: 2.0.0
**狀態**: 準備就緒 🚀
`;

        fs.writeFileSync(
            path.join(__dirname, '..', 'DEPLOYMENT_CHECKLIST.md'),
            checklist
        );

        console.log('✅ 部署檢查清單完成');
    }
}

async function orchestrateDeployment() {
    const orchestrator = new ProductionDeploymentOrchestrator();
    return await orchestrator.orchestrateDeployment();
}

if (require.main === module) {
    orchestrateDeployment()
        .then(status => {
            console.log('\n🎉 生產環境部署編排完成！');
        })
        .catch(console.error);
}

module.exports = ProductionDeploymentOrchestrator;