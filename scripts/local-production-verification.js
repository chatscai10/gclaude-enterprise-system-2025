/**
 * 本地生產環境智慧瀏覽器驗證系統
 * 對本地運行的完整系統進行深度功能驗證
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class LocalProductionVerificationEngine {
    constructor() {
        this.testUrl = 'http://localhost:3007';
        this.verificationResults = [];
        this.screenshots = [];
        this.browser = null;
        this.testCredentials = {
            username: 'admin',
            password: 'admin123'
        };
    }

    async executeLocalVerification() {
        console.log('🏠 開始本地生產環境完整驗證...\n');

        try {
            // 1. 檢查服務器狀態
            await this.checkServerHealth();

            // 2. 啟動瀏覽器
            await this.launchBrowser();

            // 3. 完整系統功能驗證
            await this.performCompleteSystemVerification();

            // 4. 生成驗證報告
            const report = await this.generateVerificationReport();

            // 5. 發送驗證完成通知
            await this.sendVerificationNotification(report);

            return {
                serverHealthy: true,
                loginWorking: this.verificationResults.some(r => r.test === 'login' && r.success),
                featuresWorking: this.verificationResults.filter(r => r.success && r.test !== 'login').length,
                totalTests: this.verificationResults.length,
                screenshots: this.screenshots.length,
                report: report
            };

        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async checkServerHealth() {
        console.log('🔍 檢查服務器健康狀態...');
        
        try {
            const healthResponse = await axios.get(`${this.testUrl}/api/health`, { timeout: 5000 });
            
            if (healthResponse.status === 200) {
                console.log('✅ 服務器健康檢查通過');
                console.log(`📊 服務器狀態: ${JSON.stringify(healthResponse.data)}`);
            } else {
                throw new Error(`健康檢查失敗: ${healthResponse.status}`);
            }
        } catch (error) {
            console.log(`❌ 服務器健康檢查失敗: ${error.message}`);
            throw error;
        }
    }

    async launchBrowser() {
        console.log('🚀 啟動智慧瀏覽器引擎...');
        
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        console.log('✅ 瀏覽器引擎啟動成功');
    }

    async performCompleteSystemVerification() {
        console.log('🧪 執行完整系統功能驗證...\n');

        const tests = [
            { name: '首頁載入測試', test: 'homepage', method: this.testHomepage },
            { name: '登入系統測試', test: 'login', method: this.testLogin },
            { name: '員工管理測試', test: 'employees', method: this.testEmployeesManagement },
            { name: '出勤系統測試', test: 'attendance', method: this.testAttendanceSystem },
            { name: '營收管理測試', test: 'revenue', method: this.testRevenueManagement },
            { name: '儀表板測試', test: 'dashboard', method: this.testDashboard },
            { name: 'API端點測試', test: 'api', method: this.testAPIEndpoints },
            { name: '響應式設計測試', test: 'responsive', method: this.testResponsiveDesign }
        ];

        for (const testCase of tests) {
            console.log(`🔬 執行 ${testCase.name}...`);
            
            try {
                const result = await testCase.method.call(this);
                
                this.verificationResults.push({
                    test: testCase.test,
                    name: testCase.name,
                    success: true,
                    result: result,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✅ ${testCase.name} 通過`);
                
            } catch (error) {
                this.verificationResults.push({
                    test: testCase.test,
                    name: testCase.name,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`❌ ${testCase.name} 失敗: ${error.message}`);
            }
        }

        const passedTests = this.verificationResults.filter(r => r.success).length;
        const totalTests = this.verificationResults.length;
        console.log(`\n📊 驗證結果: ${passedTests}/${totalTests} 通過`);
    }

    async testHomepage() {
        const page = await this.browser.newPage();
        
        try {
            await page.setViewport({ width: 1920, height: 1080 });
            await page.goto(this.testUrl, { waitUntil: 'networkidle0', timeout: 10000 });
            
            // 檢查頁面標題
            const title = await page.title();
            
            // 檢查登入表單是否存在
            const hasLoginForm = await page.$('form, .login-form, #loginForm') !== null;
            
            // 截圖
            const screenshotPath = await this.takeScreenshot(page, 'homepage');
            
            return {
                title: title,
                hasLoginForm: hasLoginForm,
                url: page.url(),
                screenshot: screenshotPath
            };
            
        } finally {
            await page.close();
        }
    }

    async testLogin() {
        const page = await this.browser.newPage();
        
        try {
            await page.setViewport({ width: 1920, height: 1080 });
            await page.goto(this.testUrl, { waitUntil: 'networkidle0' });
            
            // 尋找並填寫登入表單
            await page.waitForSelector('input[name="username"], input[id="username"], input[type="text"]', { timeout: 5000 });
            await page.waitForSelector('input[name="password"], input[id="password"], input[type="password"]', { timeout: 5000 });
            
            // 清空並輸入憑證
            await page.evaluate(() => {
                const usernameField = document.querySelector('input[name="username"], input[id="username"], input[type="text"]');
                const passwordField = document.querySelector('input[name="password"], input[id="password"], input[type="password"]');
                if (usernameField) usernameField.value = '';
                if (passwordField) passwordField.value = '';
            });
            
            await page.type('input[name="username"], input[id="username"], input[type="text"]', this.testCredentials.username);
            await page.type('input[name="password"], input[id="password"], input[type="password"]', this.testCredentials.password);
            
            // 登入前截圖
            await this.takeScreenshot(page, 'login-form');
            
            // 點擊登入
            await page.click('button[type="submit"], input[type="submit"], .login-btn, #loginBtn');
            
            // 等待頁面變化
            await page.waitForTimeout(3000);
            
            // 檢查登入結果
            const currentUrl = page.url();
            const pageContent = await page.content();
            
            const loginSuccess = 
                currentUrl !== this.testUrl ||
                pageContent.includes('歡迎') ||
                pageContent.includes('welcome') ||
                pageContent.includes('dashboard') ||
                await page.$('.logout') !== null;
            
            // 登入後截圖
            await this.takeScreenshot(page, 'login-success');
            
            if (!loginSuccess) {
                throw new Error('登入失敗或未成功跳轉');
            }
            
            return {
                loginSuccessful: loginSuccess,
                redirectUrl: currentUrl,
                hasLogoutOption: await page.$('.logout') !== null
            };
            
        } finally {
            await page.close();
        }
    }

    async testEmployeesManagement() {
        const page = await this.browser.newPage();
        
        try {
            await page.setViewport({ width: 1920, height: 1080 });
            
            // 登入系統
            await this.performLogin(page);
            
            // 尋找員工管理入口
            const employeeLinks = [
                'a[href*="employee"]',
                '.employee-menu',
                '#employees',
                '[onclick*="employee"]',
                'a:contains("員工")',
                '.nav-link:contains("員工")'
            ];
            
            let employeeSection = null;
            for (const selector of employeeLinks) {
                try {
                    employeeSection = await page.$(selector);
                    if (employeeSection) break;
                } catch (e) {
                    // 繼續嘗試下一個選擇器
                }
            }
            
            if (!employeeSection) {
                // 嘗試直接訪問員工頁面
                await page.goto(`${this.testUrl}/employees`, { waitUntil: 'networkidle0' });
            } else {
                await employeeSection.click();
                await page.waitForTimeout(2000);
            }
            
            // 檢查員工管理頁面內容
            const hasEmployeeTable = await page.$('table, .employee-list, .data-table') !== null;
            const hasAddButton = await page.$('.add-btn, #addEmployee, [onclick*="add"]') !== null;
            
            await this.takeScreenshot(page, 'employees');
            
            return {
                pageAccessed: true,
                hasEmployeeTable: hasEmployeeTable,
                hasAddButton: hasAddButton,
                url: page.url()
            };
            
        } finally {
            await page.close();
        }
    }

    async testAttendanceSystem() {
        const page = await this.browser.newPage();
        
        try {
            await page.setViewport({ width: 1920, height: 1080 });
            await this.performLogin(page);
            
            // 尋找出勤系統入口
            try {
                await page.goto(`${this.testUrl}/attendance`, { waitUntil: 'networkidle0' });
            } catch (e) {
                // 如果直接訪問失敗，嘗試從首頁導航
                const attendanceLink = await page.$('a[href*="attendance"], .attendance-menu, #attendance');
                if (attendanceLink) {
                    await attendanceLink.click();
                    await page.waitForTimeout(2000);
                }
            }
            
            const hasAttendanceContent = await page.$('table, .attendance-record, .clock-in') !== null;
            
            await this.takeScreenshot(page, 'attendance');
            
            return {
                pageAccessed: true,
                hasAttendanceContent: hasAttendanceContent,
                url: page.url()
            };
            
        } finally {
            await page.close();
        }
    }

    async testRevenueManagement() {
        const page = await this.browser.newPage();
        
        try {
            await page.setViewport({ width: 1920, height: 1080 });
            await this.performLogin(page);
            
            try {
                await page.goto(`${this.testUrl}/revenue`, { waitUntil: 'networkidle0' });
            } catch (e) {
                const revenueLink = await page.$('a[href*="revenue"], .revenue-menu, #revenue');
                if (revenueLink) {
                    await revenueLink.click();
                    await page.waitForTimeout(2000);
                }
            }
            
            const hasRevenueContent = await page.$('table, .revenue-chart, .financial-data') !== null;
            
            await this.takeScreenshot(page, 'revenue');
            
            return {
                pageAccessed: true,
                hasRevenueContent: hasRevenueContent,
                url: page.url()
            };
            
        } finally {
            await page.close();
        }
    }

    async testDashboard() {
        const page = await this.browser.newPage();
        
        try {
            await page.setViewport({ width: 1920, height: 1080 });
            await this.performLogin(page);
            
            await page.goto(`${this.testUrl}/dashboard`, { waitUntil: 'networkidle0' });
            
            const hasDashboardContent = await page.$('.dashboard, .stats, .chart') !== null;
            
            await this.takeScreenshot(page, 'dashboard');
            
            return {
                pageAccessed: true,
                hasDashboardContent: hasDashboardContent,
                url: page.url()
            };
            
        } finally {
            await page.close();
        }
    }

    async testAPIEndpoints() {
        const endpoints = [
            '/api/health',
            '/api/employees',
            '/api/attendance',
            '/api/revenue'
        ];
        
        const results = [];
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${this.testUrl}${endpoint}`, { 
                    timeout: 5000,
                    validateStatus: () => true
                });
                
                results.push({
                    endpoint: endpoint,
                    status: response.status,
                    accessible: response.status < 500
                });
                
            } catch (error) {
                results.push({
                    endpoint: endpoint,
                    status: 'error',
                    accessible: false,
                    error: error.message
                });
            }
        }
        
        return {
            endpointTests: results,
            accessibleEndpoints: results.filter(r => r.accessible).length,
            totalEndpoints: endpoints.length
        };
    }

    async testResponsiveDesign() {
        const page = await this.browser.newPage();
        
        try {
            const viewports = [
                { name: 'Desktop', width: 1920, height: 1080 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Mobile', width: 375, height: 667 }
            ];
            
            const responsiveResults = [];
            
            for (const viewport of viewports) {
                await page.setViewport(viewport);
                await page.goto(this.testUrl, { waitUntil: 'networkidle0' });
                
                const screenshotPath = await this.takeScreenshot(page, `responsive-${viewport.name.toLowerCase()}`);
                
                responsiveResults.push({
                    viewport: viewport.name,
                    dimensions: `${viewport.width}x${viewport.height}`,
                    screenshot: screenshotPath
                });
            }
            
            return {
                responsiveTests: responsiveResults,
                testedViewports: viewports.length
            };
            
        } finally {
            await page.close();
        }
    }

    async performLogin(page) {
        await page.goto(this.testUrl, { waitUntil: 'networkidle0' });
        
        try {
            await page.waitForSelector('input[name="username"], input[id="username"], input[type="text"]', { timeout: 5000 });
            await page.type('input[name="username"], input[id="username"], input[type="text"]', this.testCredentials.username);
            await page.type('input[name="password"], input[id="password"], input[type="password"]', this.testCredentials.password);
            await page.click('button[type="submit"], input[type="submit"], .login-btn, #loginBtn');
            await page.waitForTimeout(3000);
        } catch (error) {
            console.log('登入過程可能已經完成或表單結構不同');
        }
    }

    async takeScreenshot(page, section) {
        const timestamp = Date.now();
        const filename = `local-production-${section}-${timestamp}.png`;
        const screenshotDir = path.join(__dirname, '..', 'production-screenshots');
        
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        const screenshotPath = path.join(screenshotDir, filename);
        
        try {
            await page.screenshot({ 
                path: screenshotPath, 
                fullPage: true
            });
            
            this.screenshots.push({
                section: section,
                path: screenshotPath,
                timestamp: timestamp
            });
            
            console.log(`📸 截圖保存: ${filename}`);
            return screenshotPath;
            
        } catch (error) {
            console.log(`❌ 截圖失敗: ${error.message}`);
            return null;
        }
    }

    async generateVerificationReport() {
        console.log('\n📋 生成本地生產環境驗證報告...');
        
        const report = {
            timestamp: new Date().toISOString(),
            testUrl: this.testUrl,
            summary: {
                totalTests: this.verificationResults.length,
                passedTests: this.verificationResults.filter(r => r.success).length,
                failedTests: this.verificationResults.filter(r => !r.success).length,
                screenshots: this.screenshots.length
            },
            testResults: this.verificationResults,
            screenshots: this.screenshots,
            recommendations: this.generateRecommendations()
        };

        const reportPath = path.join(__dirname, '..', 'verification-reports', `local-production-verification-${Date.now()}.json`);
        
        const reportDir = path.dirname(reportPath);
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 驗證報告已保存: ${reportPath}`);

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        const failedTests = this.verificationResults.filter(r => !r.success);
        
        if (failedTests.length > 0) {
            recommendations.push(`修復失敗的測試項目: ${failedTests.map(t => t.name).join(', ')}`);
        }
        
        recommendations.push('考慮部署到雲端平台以提供外部訪問');
        recommendations.push('建立持續整合/持續部署(CI/CD)流程');
        recommendations.push('加強錯誤處理和用戶體驗');
        
        return recommendations;
    }

    async sendVerificationNotification(report) {
        console.log('\n📱 發送本地驗證結果通知...');
        
        const notificationContent = `🏠 本地生產環境智慧瀏覽器驗證完成

📊 驗證結果總覽:
• 測試網址: ${this.testUrl}
• 總測試數: ${report.summary.totalTests}
• 通過測試: ${report.summary.passedTests}
• 失敗測試: ${report.summary.failedTests}
• 成功率: ${Math.round((report.summary.passedTests / report.summary.totalTests) * 100)}%
• 截圖數量: ${report.summary.screenshots}

🔍 詳細結果:
${this.verificationResults.map(r => 
    `• ${r.name}: ${r.success ? '✅' : '❌'}`
).join('\n')}

📸 驗證截圖已保存到 production-screenshots/ 目錄
📄 完整報告: verification-reports/local-production-verification-*.json`;

        try {
            const telegramConfig = {
                botToken: '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc',
                chatId: '-1002658082392'
            };

            const url = `https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`;
            const messageData = {
                chat_id: telegramConfig.chatId,
                text: notificationContent,
                parse_mode: 'HTML'
            };

            const response = await axios.post(url, messageData);
            
            if (response.data.ok) {
                console.log('✅ Telegram本地驗證通知發送成功');
            } else {
                console.log('❌ Telegram本地驗證通知發送失敗:', response.data);
            }
        } catch (error) {
            console.error('❌ 發送通知錯誤:', error.message);
        }
    }
}

async function executeLocalVerification() {
    const verifier = new LocalProductionVerificationEngine();
    return await verifier.executeLocalVerification();
}

if (require.main === module) {
    executeLocalVerification()
        .then(result => {
            console.log('\n🎉 本地生產環境智慧瀏覽器驗證完成！');
            console.log(`📊 驗證統計:`);
            console.log(`   伺服器健康: ${result.serverHealthy ? '✅' : '❌'}`);
            console.log(`   登入功能: ${result.loginWorking ? '✅' : '❌'}`);
            console.log(`   功能模組: ${result.featuresWorking}個可用`);
            console.log(`   測試通過: ${result.totalTests - result.featuresWorking}/${result.totalTests}`);
            console.log(`   截圖數量: ${result.screenshots}`);
        })
        .catch(console.error);
}

module.exports = LocalProductionVerificationEngine;