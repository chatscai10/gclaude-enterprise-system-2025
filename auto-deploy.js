/**
 * 自動化部署到第三方雲端服務腳本
 * 支援 Render.com 和其他雲端平台
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoDeployment {
    constructor() {
        this.config = {
            projectName: 'gclaude-enterprise-system',
            port: process.env.PORT || 3007,
            nodeVersion: '18',
            buildCommand: 'npm install',
            startCommand: 'node server.js',
            envVars: {
                NODE_ENV: 'production',
                JWT_SECRET: 'gclaude-enterprise-jwt-secret-prod-2025',
                TELEGRAM_BOT_TOKEN: '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc',
                TELEGRAM_BOSS_GROUP_ID: '-1002658082392',
                TELEGRAM_EMPLOYEE_GROUP_ID: '-1002658082392'
            }
        };
    }

    async createDeploymentFiles() {
        console.log('🔧 準備部署檔案...');

        // 創建 render.yaml (Render.com 自動部署)
        const renderConfig = {
            services: [{
                type: 'web',
                name: this.config.projectName,
                env: 'node',
                plan: 'free',
                buildCommand: this.config.buildCommand,
                startCommand: this.config.startCommand,
                envVars: Object.entries(this.config.envVars).map(([key, value]) => ({
                    key,
                    value: value.toString()
                })),
                healthCheckPath: '/api/health',
                autoDeploy: true
            }]
        };

        fs.writeFileSync('./render.yaml', require('util').format('%j', renderConfig, null, 2));

        // 創建 Dockerfile
        const dockerfile = `
FROM node:18-alpine

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製應用程式檔案
COPY . .

# 創建必要的目錄
RUN mkdir -p data uploads logs

# 設定權限
RUN chown -R node:node /app
USER node

# 暴露連接埠
EXPOSE ${this.config.port}

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${this.config.port}/api/health || exit 1

# 啟動應用
CMD ["npm", "start"]
        `.trim();

        fs.writeFileSync('./Dockerfile', dockerfile);

        // 創建 .gitignore
        const gitignore = `
node_modules/
*.log
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
.vscode/
*.sqlite
*.db
uploads/
logs/
coverage/
test-results/
verification-reports/
        `.trim();

        fs.writeFileSync('./.gitignore', gitignore);

        console.log('✅ 部署檔案創建完成');
    }

    async checkHealth() {
        console.log('🏥 檢查應用程式健康狀態...');
        
        try {
            // 檢查必要檔案是否存在
            const requiredFiles = [
                'package.json',
                'server.js',
                'database/json-database.js',
                'modules/telegram-notifier.js'
            ];

            for (const file of requiredFiles) {
                if (!fs.existsSync(file)) {
                    throw new Error(`缺少必要檔案: ${file}`);
                }
            }

            console.log('✅ 所有必要檔案檢查通過');
            return true;
        } catch (error) {
            console.error('❌ 健康檢查失敗:', error.message);
            return false;
        }
    }

    async deployToRender() {
        console.log('🚀 開始部署到 Render.com...');
        
        const deploymentGuide = `
🌟 Render.com 部署指南

1. 訪問 https://render.com 並登入
2. 點擊 "New" → "Web Service"
3. 選擇 "Build and deploy from a Git repository"
4. 連接您的 GitHub 倉庫或上傳程式碼
5. 設定以下參數：

📋 基本設定:
   - Name: ${this.config.projectName}
   - Environment: Node
   - Region: Oregon (US West) 或最近的區域
   - Branch: main
   - Build Command: ${this.config.buildCommand}
   - Start Command: ${this.config.startCommand}

🔧 環境變數:
${Object.entries(this.config.envVars).map(([key, value]) => `   - ${key}=${value}`).join('\n')}

🔧 高級設定:
   - Auto-Deploy: Yes
   - Health Check Path: /api/health

6. 點擊 "Create Web Service"
7. 等待部署完成 (大約 2-5 分鐘)

📱 部署完成後:
   - 您將獲得一個 .onrender.com 網址
   - 系統會自動發送 Telegram 通知
   - 可以在 Render 控制台查看日誌和監控

💡 注意事項:
   - 免費方案有使用限制，超過 550 小時/月會暫停
   - 資料使用記憶體存儲，重啟時會重置
   - 建議升級到付費方案以獲得持久存儲
        `;

        console.log(deploymentGuide);

        // 創建部署狀態檔案
        const deploymentStatus = {
            status: 'ready_for_deployment',
            timestamp: new Date().toISOString(),
            platform: 'render.com',
            config: this.config,
            deploymentUrl: 'https://render.com',
            expectedUrl: `https://${this.config.projectName}.onrender.com`,
            healthCheckUrl: `https://${this.config.projectName}.onrender.com/api/health`
        };

        fs.writeFileSync('./deployment-status.json', JSON.stringify(deploymentStatus, null, 2));

        return deploymentStatus;
    }

    async sendTelegramNotification(deploymentInfo) {
        console.log('📱 發送 Telegram 部署通知...');
        
        const message = `
🚀 GClaude Enterprise System 部署就緒

📋 部署資訊:
• 平台: Render.com
• 專案名稱: ${this.config.projectName}
• 預期網址: ${deploymentInfo.expectedUrl}
• 健康檢查: ${deploymentInfo.healthCheckUrl}

⚡ 下一步操作:
1. 訪問 https://render.com
2. 按照部署指南創建服務
3. 部署完成後進行功能測試

🔧 技術規格:
• Node.js: ${this.config.nodeVersion}
• 資料庫: JSON 檔案系統
• 通知: Telegram 整合
• 認證: JWT Token

⏰ 準備時間: ${new Date().toLocaleString('zh-TW')}
📅 狀態: 就緒部署

🎯 下一階段: 雲端部署與驗證測試
        `;

        try {
            const TelegramNotifier = require('./modules/telegram-notifier');
            const notifier = new TelegramNotifier();
            await notifier.sendMessage(this.config.envVars.TELEGRAM_BOSS_GROUP_ID, message);
            console.log('✅ Telegram 通知發送成功');
        } catch (error) {
            console.error('❌ Telegram 通知發送失敗:', error.message);
        }
    }

    async createQuickStartScript() {
        const quickStart = `#!/bin/bash

echo "🚀 GClaude Enterprise System - 快速部署腳本"
echo "==========================================="
echo ""

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 請先安裝 Node.js 18 或更高版本"
    exit 1
fi

# 檢查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 請先安裝 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 安裝依賴
echo "📦 安裝依賴套件..."
npm install

# 檢查安裝結果
if [ $? -eq 0 ]; then
    echo "✅ 依賴安裝完成"
else
    echo "❌ 依賴安裝失敗"
    exit 1
fi

echo ""
echo "🎯 可用的部署選項:"
echo "1. Render.com (推薦)"
echo "2. Railway"
echo "3. Vercel"
echo "4. Google Cloud Run"
echo ""
echo "📋 部署檔案已準備完成:"
echo "• render.yaml - Render.com 自動部署"
echo "• Dockerfile - 容器化部署"
echo "• .gitignore - Git 忽略檔案"
echo ""
echo "🔗 快速部署到 Render:"
echo "https://render.com/deploy?repo=YOUR_GITHUB_REPO_URL"
echo ""
echo "✨ 部署就緒！請按照 deployment-status.json 中的指引進行部署"
        `;

        fs.writeFileSync('./quick-deploy.sh', quickStart);
        
        // 設定執行權限 (Linux/Mac)
        try {
            execSync('chmod +x quick-deploy.sh');
        } catch (error) {
            // Windows 環境忽略權限設定
        }
    }

    async run() {
        console.log('🎯 開始自動化部署準備...\n');

        try {
            // 步驟 1: 健康檢查
            const isHealthy = await this.checkHealth();
            if (!isHealthy) {
                throw new Error('應用程式健康檢查失敗');
            }

            // 步驟 2: 創建部署檔案
            await this.createDeploymentFiles();

            // 步驟 3: 創建快速啟動腳本
            await this.createQuickStartScript();

            // 步驟 4: 準備 Render 部署
            const deploymentInfo = await this.deployToRender();

            // 步驟 5: 發送通知
            await this.sendTelegramNotification(deploymentInfo);

            console.log('\n🎉 自動化部署準備完成！');
            console.log(`📊 部署狀態檔案: deployment-status.json`);
            console.log(`🚀 快速部署腳本: quick-deploy.sh`);
            console.log(`🔗 Render 部署: https://render.com`);

            return {
                success: true,
                deploymentInfo,
                message: '部署準備完成，請手動執行雲端部署'
            };

        } catch (error) {
            console.error('\n❌ 自動化部署失敗:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 執行部署
if (require.main === module) {
    const deployment = new AutoDeployment();
    deployment.run().then(result => {
        if (result.success) {
            console.log('\n✅ 部署準備成功完成');
            process.exit(0);
        } else {
            console.error('\n❌ 部署準備失敗');
            process.exit(1);
        }
    });
}

module.exports = AutoDeployment;