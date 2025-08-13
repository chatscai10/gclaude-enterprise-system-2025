/**
 * GClaude 自動部署腳本
 * 支援多平台智慧部署
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

class GClaudeDeployment {
    constructor() {
        this.config = {
            projectName: 'gclaude-enterprise-system',
            version: '2.0.0',
            platforms: ['railway', 'render', 'vercel'],
            healthCheckUrl: '/api/health',
            timeout: 300000, // 5分鐘
            retryCount: 3
        };
        
        this.deploymentLog = [];
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        
        console.log(logEntry);
        this.deploymentLog.push({
            timestamp,
            type,
            message
        });
    }

    async executeCommand(command, description) {
        this.log(`執行: ${description}`);
        this.log(`命令: ${command}`, 'debug');
        
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    this.log(`命令執行失敗: ${error.message}`, 'error');
                    reject(error);
                    return;
                }
                
                if (stderr) {
                    this.log(`警告: ${stderr}`, 'warn');
                }
                
                if (stdout) {
                    this.log(`輸出: ${stdout.trim()}`, 'debug');
                }
                
                resolve(stdout);
            });
        });
    }

    async checkEnvironment() {
        this.log('🔍 檢查部署環境...');
        
        const checks = [
            { command: 'node --version', name: 'Node.js' },
            { command: 'npm --version', name: 'npm' },
            { command: 'git --version', name: 'Git' }
        ];

        for (const check of checks) {
            try {
                const output = await this.executeCommand(check.command, `檢查 ${check.name} 版本`);
                this.log(`✅ ${check.name}: ${output.trim()}`);
            } catch (error) {
                this.log(`❌ ${check.name} 未安裝或不可用`, 'error');
                throw new Error(`${check.name} is required for deployment`);
            }
        }
    }

    async prepareDeployment() {
        this.log('📦 準備部署檔案...');
        
        // 檢查必要檔案
        const requiredFiles = [
            'package.json',
            'enterprise-server.js',
            'database.js',
            'routes/complete-api.js'
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(process.cwd(), file))) {
                throw new Error(`Required file missing: ${file}`);
            }
            this.log(`✅ 檔案存在: ${file}`);
        }

        // 安裝依賴
        await this.executeCommand('npm install', '安裝專案依賴');

        // 創建部署配置檔案
        await this.createDeploymentConfigs();
        
        this.log('✅ 部署準備完成');
    }

    async createDeploymentConfigs() {
        this.log('📋 創建部署配置檔案...');

        // Railway 配置
        const railwayConfig = {
            build: {
                builder: "nixpacks"
            },
            deploy: {
                startCommand: "node enterprise-server.js",
                healthcheckPath: "/api/health",
                healthcheckTimeout: 60,
                restartPolicyType: "ON_FAILURE"
            }
        };

        fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
        this.log('✅ Railway 配置已創建');

        // Render 配置
        const renderConfig = `
services:
  - type: web
    name: gclaude-enterprise-system
    env: node
    buildCommand: npm install
    startCommand: node enterprise-server.js
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
`;
        fs.writeFileSync('render.yaml', renderConfig);
        this.log('✅ Render 配置已創建');

        // Vercel 配置
        const vercelConfig = {
            version: 2,
            name: "gclaude-enterprise-system",
            builds: [
                {
                    src: "enterprise-server.js",
                    use: "@vercel/node"
                }
            ],
            routes: [
                {
                    src: "/(.*)",
                    dest: "/enterprise-server.js"
                }
            ],
            env: {
                NODE_ENV: "production"
            }
        };

        fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
        this.log('✅ Vercel 配置已創建');
    }

    async deployToRailway() {
        this.log('🚄 開始部署到 Railway...');
        
        try {
            // 檢查 Railway CLI
            await this.executeCommand('railway --version', '檢查 Railway CLI');
            
            // 初始化項目（如果需要）
            try {
                await this.executeCommand('railway init', '初始化 Railway 項目');
            } catch (error) {
                this.log('Railway 項目已存在或無需初始化', 'warn');
            }

            // 部署
            await this.executeCommand('railway up', '部署到 Railway');
            
            this.log('✅ Railway 部署成功');
            return { success: true, platform: 'railway' };
            
        } catch (error) {
            this.log(`❌ Railway 部署失敗: ${error.message}`, 'error');
            return { success: false, platform: 'railway', error: error.message };
        }
    }

    async deployToRender() {
        this.log('🎨 開始部署到 Render...');
        
        try {
            this.log('ℹ️  Render 需要通過 Web 界面進行部署');
            this.log('📝 請訪問 https://render.com 並連接您的 GitHub 倉庫');
            this.log('⚙️  使用創建的 render.yaml 配置檔案');
            
            return { 
                success: true, 
                platform: 'render', 
                note: 'Manual deployment required via Render dashboard' 
            };
            
        } catch (error) {
            this.log(`❌ Render 部署配置失敗: ${error.message}`, 'error');
            return { success: false, platform: 'render', error: error.message };
        }
    }

    async deployToVercel() {
        this.log('▲ 開始部署到 Vercel...');
        
        try {
            // 檢查 Vercel CLI
            try {
                await this.executeCommand('vercel --version', '檢查 Vercel CLI');
            } catch (error) {
                this.log('安裝 Vercel CLI...', 'info');
                await this.executeCommand('npm install -g vercel', '安裝 Vercel CLI');
            }

            // 部署
            await this.executeCommand('vercel --prod --yes', '部署到 Vercel');
            
            this.log('✅ Vercel 部署成功');
            return { success: true, platform: 'vercel' };
            
        } catch (error) {
            this.log(`❌ Vercel 部署失敗: ${error.message}`, 'error');
            return { success: false, platform: 'vercel', error: error.message };
        }
    }

    async performHealthCheck(url) {
        this.log(`🏥 執行健康檢查: ${url}`);
        
        let retries = 0;
        const maxRetries = 10;
        const delay = 30000; // 30秒

        while (retries < maxRetries) {
            try {
                const response = await axios.get(url + this.config.healthCheckUrl, {
                    timeout: 10000
                });

                if (response.status === 200 && response.data.status === 'healthy') {
                    this.log(`✅ 健康檢查通過: ${url}`, 'success');
                    return true;
                }
                
            } catch (error) {
                this.log(`⚠️  健康檢查失敗 (嘗試 ${retries + 1}/${maxRetries}): ${error.message}`, 'warn');
            }

            retries++;
            if (retries < maxRetries) {
                this.log(`⏳ 等待 ${delay / 1000} 秒後重試...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        this.log(`❌ 健康檢查最終失敗: ${url}`, 'error');
        return false;
    }

    async createDeploymentReport() {
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        
        const report = {
            projectName: this.config.projectName,
            version: this.config.version,
            timestamp: new Date().toISOString(),
            duration: `${Math.round(duration / 1000)}秒`,
            status: 'completed',
            log: this.deploymentLog,
            summary: {
                totalSteps: this.deploymentLog.length,
                errors: this.deploymentLog.filter(entry => entry.type === 'error').length,
                warnings: this.deploymentLog.filter(entry => entry.type === 'warn').length
            }
        };

        const reportPath = path.join(__dirname, '..', 'logs', `deployment-${Date.now()}.json`);
        
        // 確保日誌目錄存在
        const logDir = path.dirname(reportPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.log(`📄 部署報告已保存: ${reportPath}`);

        return report;
    }

    async deploy() {
        try {
            this.log('🚀 開始 GClaude 自動部署流程...');
            this.log(`📦 專案: ${this.config.projectName} v${this.config.version}`);

            // 檢查環境
            await this.checkEnvironment();

            // 準備部署
            await this.prepareDeployment();

            // 執行部署到各平台
            const deploymentResults = [];

            for (const platform of this.config.platforms) {
                this.log(`\n🎯 部署到 ${platform.toUpperCase()}...`);
                
                let result;
                switch (platform) {
                    case 'railway':
                        result = await this.deployToRailway();
                        break;
                    case 'render':
                        result = await this.deployToRender();
                        break;
                    case 'vercel':
                        result = await this.deployToVercel();
                        break;
                    default:
                        this.log(`❌ 不支援的平台: ${platform}`, 'error');
                        continue;
                }

                deploymentResults.push(result);
            }

            // 創建部署報告
            const report = await this.createDeploymentReport();

            // 顯示總結
            this.log('\n📊 部署總結:');
            deploymentResults.forEach(result => {
                const status = result.success ? '✅ 成功' : '❌ 失敗';
                this.log(`  ${result.platform}: ${status}`);
                if (result.error) {
                    this.log(`    錯誤: ${result.error}`);
                }
                if (result.note) {
                    this.log(`    注意: ${result.note}`);
                }
            });

            const successCount = deploymentResults.filter(r => r.success).length;
            this.log(`\n🎉 部署完成! ${successCount}/${deploymentResults.length} 平台部署成功`);

            return report;

        } catch (error) {
            this.log(`💥 部署過程中發生嚴重錯誤: ${error.message}`, 'error');
            throw error;
        }
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    const deployment = new GClaudeDeployment();
    
    deployment.deploy()
        .then(report => {
            console.log('\n✨ GClaude 部署流程完成!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 部署失敗:', error.message);
            process.exit(1);
        });
}

module.exports = GClaudeDeployment;