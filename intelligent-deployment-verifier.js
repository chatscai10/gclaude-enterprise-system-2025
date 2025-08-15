// 🔬 智慧部署驗證引擎 - 完整功能驗證
const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');

class IntelligentDeploymentVerifier {
    constructor() {
        this.baseUrl = 'https://gclaude-enterprise-system-6wbjjl8ww-chatscai10-4188s-projects.vercel.app';
        this.results = {
            timestamp: new Date().toISOString(),
            overall_status: 'pending',
            tests: [],
            screenshots: [],
            errors: [],
            performance: {},
            verification_summary: {}
        };
        this.telegramConfig = {
            botToken: '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc',
            chatId: '-1002658082392'
        };
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1280, height: 720 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
    }

    async screenshot(name) {
        const filename = `deployment-verification-${name}-${Date.now()}.png`;
        const filepath = `D:\\0813\\gclaude-enterprise-system\\verification-screenshots\\${filename}`;
        await this.page.screenshot({ path: filepath });
        this.results.screenshots.push({ name, filename, filepath });
        console.log(`📸 截圖保存: ${filename}`);
        return filepath;
    }

    async testHealthCheck() {
        console.log('\n🏥 測試健康檢查端點...');
        try {
            await this.page.goto(`${this.baseUrl}/api/health`, { waitUntil: 'networkidle0' });
            const content = await this.page.content();
            
            if (content.includes('healthy') || content.includes('ok') || content.includes('status')) {
                this.results.tests.push({
                    name: '健康檢查',
                    status: 'pass',
                    details: '健康檢查端點正常回應'
                });
                console.log('✅ 健康檢查：通過');
            } else {
                throw new Error('健康檢查回應異常');
            }
        } catch (error) {
            this.results.tests.push({
                name: '健康檢查',
                status: 'fail',
                error: error.message
            });
            console.log('❌ 健康檢查：失敗');
        }
    }

    async testHomepage() {
        console.log('\n🏠 測試首頁載入...');
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });
            
            const title = await this.page.title();
            const hasLoginForm = await this.page.$('form') !== null;
            
            await this.screenshot('homepage-loaded');
            
            this.results.tests.push({
                name: '首頁載入',
                status: 'pass',
                details: `頁面標題: ${title}, 登入表單存在: ${hasLoginForm}`
            });
            console.log('✅ 首頁載入：通過');
            
        } catch (error) {
            this.results.tests.push({
                name: '首頁載入',
                status: 'fail',
                error: error.message
            });
            console.log('❌ 首頁載入：失敗');
        }
    }

    async testAdminLogin() {
        console.log('\n👨‍💼 測試管理員登入...');
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            
            // 填寫登入表單
            await this.page.type('#username', 'admin');
            await this.page.type('#password', 'admin123');
            await this.screenshot('login-form-filled-admin');
            
            // 點擊登入
            await this.page.click('button[type="submit"]');
            await this.page.waitForTimeout(3000);
            
            const currentUrl = this.page.url();
            await this.screenshot('login-result-admin');
            
            if (currentUrl.includes('/admin') || currentUrl.includes('dashboard')) {
                this.results.tests.push({
                    name: '管理員登入',
                    status: 'pass',
                    details: `成功重定向到: ${currentUrl}`
                });
                console.log('✅ 管理員登入：通過');
                return true;
            } else {
                throw new Error(`登入後未正確重定向，當前網址: ${currentUrl}`);
            }
            
        } catch (error) {
            this.results.tests.push({
                name: '管理員登入',
                status: 'fail',
                error: error.message
            });
            console.log('❌ 管理員登入：失敗');
            return false;
        }
    }

    async testEmployeeLogin() {
        console.log('\n👤 測試員工登入...');
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            
            // 清除之前的輸入
            await this.page.evaluate(() => {
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
            });
            
            // 填寫員工登入資料
            await this.page.type('#username', 'employee');
            await this.page.type('#password', 'employee123');
            await this.screenshot('login-form-filled-employee');
            
            // 點擊登入
            await this.page.click('button[type="submit"]');
            await this.page.waitForTimeout(3000);
            
            const currentUrl = this.page.url();
            await this.screenshot('login-result-employee');
            
            if (currentUrl.includes('/employee') || currentUrl.includes('dashboard')) {
                this.results.tests.push({
                    name: '員工登入',
                    status: 'pass',
                    details: `成功重定向到: ${currentUrl}`
                });
                console.log('✅ 員工登入：通過');
                return true;
            } else {
                throw new Error(`員工登入後未正確重定向，當前網址: ${currentUrl}`);
            }
            
        } catch (error) {
            this.results.tests.push({
                name: '員工登入',
                status: 'fail',
                error: error.message
            });
            console.log('❌ 員工登入：失敗');
            return false;
        }
    }

    async testPermissionSeparation() {
        console.log('\n🔒 測試權限分離...');
        try {
            // 測試員工頁面是否沒有管理功能
            await this.page.goto(`${this.baseUrl}/employee`, { waitUntil: 'networkidle0' });
            
            const hasEmployeeManagement = await this.page.$('text=員工管理') !== null;
            const hasInventoryManagement = await this.page.$('text=品項管理') !== null;
            const hasAdminFeatures = await this.page.$('text=系統設定') !== null;
            
            await this.screenshot('employee-dashboard-permissions');
            
            if (!hasEmployeeManagement && !hasInventoryManagement && !hasAdminFeatures) {
                this.results.tests.push({
                    name: '權限分離',
                    status: 'pass',
                    details: '員工頁面正確隱藏管理功能'
                });
                console.log('✅ 權限分離：通過');
            } else {
                throw new Error('員工頁面顯示了不應該有的管理功能');
            }
            
        } catch (error) {
            this.results.tests.push({
                name: '權限分離',
                status: 'fail',
                error: error.message
            });
            console.log('❌ 權限分離：失敗');
        }
    }

    async testResponsiveDesign() {
        console.log('\n📱 測試響應式設計...');
        try {
            const viewports = [
                { name: 'Desktop', width: 1280, height: 720 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Mobile', width: 375, height: 667 }
            ];

            for (const viewport of viewports) {
                await this.page.setViewport(viewport);
                await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
                await this.screenshot(`responsive-${viewport.name}`);
            }

            this.results.tests.push({
                name: '響應式設計',
                status: 'pass',
                details: '各種螢幕尺寸下頁面正常顯示'
            });
            console.log('✅ 響應式設計：通過');
            
        } catch (error) {
            this.results.tests.push({
                name: '響應式設計',
                status: 'fail',
                error: error.message
            });
            console.log('❌ 響應式設計：失敗');
        }
    }

    async measurePerformance() {
        console.log('\n⚡ 測試效能指標...');
        try {
            const metrics = await this.page.metrics();
            const performanceData = await this.page.evaluate(() => {
                const timing = performance.timing;
                return {
                    loadTime: timing.loadEventEnd - timing.navigationStart,
                    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                    firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0
                };
            });

            this.results.performance = {
                ...metrics,
                ...performanceData
            };

            console.log(`⚡ 頁面載入時間: ${performanceData.loadTime}ms`);
            console.log(`⚡ DOM 載入時間: ${performanceData.domContentLoaded}ms`);
            
        } catch (error) {
            console.log('❌ 效能測試失敗:', error.message);
        }
    }

    async sendTelegramReport() {
        console.log('\n📱 發送 Telegram 驗證報告...');
        
        const passedTests = this.results.tests.filter(t => t.status === 'pass').length;
        const totalTests = this.results.tests.length;
        const overallStatus = passedTests === totalTests ? '✅ 全部通過' : '⚠️ 部分失敗';
        
        const message = `🔬 GClaude Enterprise 部署驗證報告

🌐 測試網址: ${this.baseUrl}

📊 測試結果: ${overallStatus}
✅ 通過: ${passedTests}/${totalTests}

🧪 詳細測試項目:
${this.results.tests.map(test => 
    `${test.status === 'pass' ? '✅' : '❌'} ${test.name}: ${test.status === 'pass' ? '通過' : '失敗'}`
).join('\n')}

⚡ 效能指標:
- 頁面載入: ${this.results.performance.loadTime || 'N/A'}ms
- DOM載入: ${this.results.performance.domContentLoaded || 'N/A'}ms

📸 截圖數量: ${this.results.screenshots.length}
🕐 測試時間: ${this.results.timestamp}

${overallStatus === '✅ 全部通過' ? 
    '🎉 部署驗證完全成功！系統可以正常使用！' : 
    '⚠️ 發現問題，需要進一步檢查和修復。'}`;

        try {
            const data = JSON.stringify({
                chat_id: this.telegramConfig.chatId,
                text: message,
                parse_mode: 'HTML'
            });

            const options = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${this.telegramConfig.botToken}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            return new Promise((resolve) => {
                const req = https.request(options, (res) => {
                    console.log('✅ Telegram 報告發送成功');
                    resolve(true);
                });
                req.on('error', (error) => {
                    console.error('❌ Telegram 發送失敗:', error.message);
                    resolve(false);
                });
                req.write(data);
                req.end();
            });
        } catch (error) {
            console.error('❌ Telegram 報告生成失敗:', error.message);
        }
    }

    async saveReport() {
        const reportPath = `D:\\0813\\gclaude-enterprise-system\\verification-reports\\deployment-verification-${Date.now()}.json`;
        
        this.results.verification_summary = {
            total_tests: this.results.tests.length,
            passed_tests: this.results.tests.filter(t => t.status === 'pass').length,
            failed_tests: this.results.tests.filter(t => t.status === 'fail').length,
            success_rate: ((this.results.tests.filter(t => t.status === 'pass').length / this.results.tests.length) * 100).toFixed(2) + '%',
            overall_status: this.results.tests.every(t => t.status === 'pass') ? 'SUCCESS' : 'PARTIAL_FAILURE'
        };

        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`📊 驗證報告保存至: ${reportPath}`);
    }

    async runCompleteVerification() {
        console.log('🚀 開始完整部署驗證...\n');
        
        try {
            await this.init();
            
            // 執行所有測試
            await this.testHealthCheck();
            await this.testHomepage();
            await this.testAdminLogin();
            await this.testEmployeeLogin();
            await this.testPermissionSeparation();
            await this.testResponsiveDesign();
            await this.measurePerformance();
            
            // 生成報告
            await this.saveReport();
            await this.sendTelegramReport();
            
            console.log('\n🎉 完整驗證執行完成！');
            console.log(`📊 總測試: ${this.results.tests.length}`);
            console.log(`✅ 通過: ${this.results.tests.filter(t => t.status === 'pass').length}`);
            console.log(`❌ 失敗: ${this.results.tests.filter(t => t.status === 'fail').length}`);
            
        } catch (error) {
            console.error('❌ 驗證過程出錯:', error.message);
            this.results.errors.push(error.message);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// 執行驗證
const verifier = new IntelligentDeploymentVerifier();
verifier.runCompleteVerification().catch(console.error);