/**
 * 智慧網站驗證引擎 - 端到端真實網站驗證
 * 專為 GClaude Enterprise System 設計
 * 網址: https://19d0da178aa2bf26851964c80723e3a4.serveo.net
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SmartWebsiteVerificationEngine {
    constructor() {
        this.baseUrl = 'https://19d0da178aa2bf26851964c80723e3a4.serveo.net';
        this.testResults = {
            basicConnectivity: {},
            uiTests: {},
            functionalTests: {},
            performanceTests: {},
            browserAutomation: {},
            issues: [],
            recommendations: []
        };
        this.screenshotsDir = path.join(__dirname, 'verification-screenshots');
        this.reportsDir = path.join(__dirname, 'verification-reports');
        
        // 確保目錄存在
        [this.screenshotsDir, this.reportsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * 🔍 階段 1: 基礎連通性測試
     */
    async testBasicConnectivity() {
        console.log('🔍 開始基礎連通性測試...');
        const tests = [
            { name: '主頁載入', url: `${this.baseUrl}/` },
            { name: 'API健康檢查', url: `${this.baseUrl}/api/health` },
            { name: 'API測試端點', url: `${this.baseUrl}/api/test` },
            { name: '登入頁面', url: `${this.baseUrl}/login.html` }
        ];

        for (const test of tests) {
            try {
                const startTime = Date.now();
                const response = await fetch(test.url);
                const endTime = Date.now();
                const loadTime = endTime - startTime;
                
                this.testResults.basicConnectivity[test.name] = {
                    status: response.status,
                    statusText: response.statusText,
                    loadTime: loadTime,
                    success: response.status === 200,
                    headers: Object.fromEntries(response.headers.entries())
                };
                
                console.log(`✅ ${test.name}: ${response.status} (${loadTime}ms)`);
            } catch (error) {
                this.testResults.basicConnectivity[test.name] = {
                    success: false,
                    error: error.message
                };
                console.log(`❌ ${test.name}: ${error.message}`);
                this.testResults.issues.push(`連通性問題: ${test.name} - ${error.message}`);
            }
        }
    }

    /**
     * 🌐 階段 2: 智慧瀏覽器自動化測試
     */
    async runBrowserAutomation() {
        console.log('🌐 啟動智慧瀏覽器自動化測試...');
        let browser = null;
        
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            
            // 測試 1: 主頁載入
            await this.testHomepageLoad(page);
            
            // 測試 2: 登入功能 (管理員)
            await this.testLoginFunctionality(page, 'admin', 'admin123');
            
            // 測試 3: 儀表板功能
            await this.testDashboardFunctionality(page);
            
            // 測試 4: 各模組頁面
            await this.testModulePages(page);
            
            // 測試 5: 響應式設計
            await this.testResponsiveDesign(page);
            
        } catch (error) {
            console.error('瀏覽器自動化測試錯誤:', error);
            this.testResults.issues.push(`瀏覽器自動化錯誤: ${error.message}`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async testHomepageLoad(page) {
        try {
            console.log('測試主頁載入...');
            const startTime = Date.now();
            await page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
            const endTime = Date.now();
            
            // 截圖
            await page.screenshot({
                path: path.join(this.screenshotsDir, `homepage-${Date.now()}.png`),
                fullPage: true
            });
            
            // 檢查頁面標題
            const title = await page.title();
            const isLoginPage = await page.$('input[name="username"]') !== null;
            
            this.testResults.browserAutomation.homepageLoad = {
                success: true,
                loadTime: endTime - startTime,
                title: title,
                isLoginPage: isLoginPage
            };
            
            console.log(`✅ 主頁載入成功: ${title} (${endTime - startTime}ms)`);
        } catch (error) {
            console.error('主頁載入失敗:', error);
            this.testResults.browserAutomation.homepageLoad = {
                success: false,
                error: error.message
            };
        }
    }

    async testLoginFunctionality(page, username, password) {
        try {
            console.log(`測試登入功能 (${username})...`);
            
            // 確保在登入頁面
            await page.goto(`${this.baseUrl}/login.html`, { waitUntil: 'networkidle0' });
            
            // 填寫登入表單
            await page.waitForSelector('input[name="username"]', { timeout: 5000 });
            await page.type('input[name="username"]', username);
            await page.type('input[name="password"]', password);
            
            // 截圖表單填寫狀態
            await page.screenshot({
                path: path.join(this.screenshotsDir, `login-form-${username}-${Date.now()}.png`)
            });
            
            // 提交表單
            const loginButton = await page.$('button[type="submit"], .login-button');
            if (loginButton) {
                await loginButton.click();
                
                // 等待頁面跳轉或響應
                await page.waitForTimeout(3000);
                
                // 檢查是否成功登入 (檢查URL變化或儀表板元素)
                const currentUrl = page.url();
                const hasDashboard = await page.$('.dashboard') !== null;
                
                // 截圖登入結果
                await page.screenshot({
                    path: path.join(this.screenshotsDir, `login-result-${username}-${Date.now()}.png`)
                });
                
                this.testResults.browserAutomation.login = {
                    success: currentUrl.includes('dashboard') || hasDashboard,
                    username: username,
                    finalUrl: currentUrl,
                    hasDashboard: hasDashboard
                };
                
                console.log(`✅ 登入測試完成: ${username} -> ${currentUrl}`);
            } else {
                throw new Error('找不到登入按鈕');
            }
            
        } catch (error) {
            console.error(`登入測試失敗 (${username}):`, error);
            this.testResults.browserAutomation.login = {
                success: false,
                username: username,
                error: error.message
            };
        }
    }

    async testDashboardFunctionality(page) {
        try {
            console.log('測試儀表板功能...');
            
            // 嘗試導航到儀表板
            await page.goto(`${this.baseUrl}/dashboard.html`, { waitUntil: 'networkidle0' });
            
            // 檢查儀表板元素
            const dashboardElements = await page.evaluate(() => {
                return {
                    hasStatsCards: document.querySelectorAll('.stat-card, .stats-card').length > 0,
                    hasSidebar: document.querySelector('.sidebar, .nav-menu') !== null,
                    hasQuickActions: document.querySelectorAll('.quick-action, .action-button').length > 0,
                    title: document.title
                };
            });
            
            // 截圖儀表板
            await page.screenshot({
                path: path.join(this.screenshotsDir, `dashboard-${Date.now()}.png`),
                fullPage: true
            });
            
            this.testResults.browserAutomation.dashboard = {
                success: true,
                elements: dashboardElements
            };
            
            console.log('✅ 儀表板測試完成');
        } catch (error) {
            console.error('儀表板測試失敗:', error);
            this.testResults.browserAutomation.dashboard = {
                success: false,
                error: error.message
            };
        }
    }

    async testModulePages(page) {
        console.log('測試各模組頁面...');
        const modules = [
            { name: '員工管理', url: `${this.baseUrl}/employees.html` },
            { name: '出勤管理', url: `${this.baseUrl}/attendance.html` },
            { name: '營收記錄', url: `${this.baseUrl}/revenue.html` }
        ];

        for (const module of modules) {
            try {
                await page.goto(module.url, { waitUntil: 'networkidle0' });
                
                // 檢查頁面載入成功
                const pageInfo = await page.evaluate(() => ({
                    title: document.title,
                    hasTable: document.querySelector('table') !== null,
                    hasForm: document.querySelector('form') !== null,
                    hasButtons: document.querySelectorAll('button').length > 0
                }));
                
                // 截圖
                await page.screenshot({
                    path: path.join(this.screenshotsDir, `module-${module.name}-${Date.now()}.png`)
                });
                
                this.testResults.browserAutomation.modules = this.testResults.browserAutomation.modules || {};
                this.testResults.browserAutomation.modules[module.name] = {
                    success: true,
                    pageInfo: pageInfo
                };
                
                console.log(`✅ ${module.name} 模組測試完成`);
            } catch (error) {
                console.error(`${module.name} 模組測試失敗:`, error);
                this.testResults.browserAutomation.modules = this.testResults.browserAutomation.modules || {};
                this.testResults.browserAutomation.modules[module.name] = {
                    success: false,
                    error: error.message
                };
            }
        }
    }

    async testResponsiveDesign(page) {
        console.log('測試響應式設計...');
        const viewports = [
            { name: 'Desktop', width: 1920, height: 1080 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Mobile', width: 375, height: 667 }
        ];

        for (const viewport of viewports) {
            try {
                await page.setViewport(viewport);
                await page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
                
                // 截圖不同螢幕尺寸
                await page.screenshot({
                    path: path.join(this.screenshotsDir, `responsive-${viewport.name}-${Date.now()}.png`)
                });
                
                this.testResults.browserAutomation.responsive = this.testResults.browserAutomation.responsive || {};
                this.testResults.browserAutomation.responsive[viewport.name] = {
                    success: true,
                    viewport: viewport
                };
                
                console.log(`✅ ${viewport.name} 響應式測試完成`);
            } catch (error) {
                console.error(`${viewport.name} 響應式測試失敗:`, error);
            }
        }
    }

    /**
     * 🔍 階段 3: 效能和安全性測試
     */
    async testPerformanceAndSecurity() {
        console.log('🔍 開始效能和安全性測試...');
        
        // HTTPS 檢測
        try {
            const response = await fetch(this.baseUrl);
            this.testResults.performanceTests.httpsSupport = {
                success: this.baseUrl.startsWith('https://'),
                secure: response.url.startsWith('https://')
            };
        } catch (error) {
            this.testResults.performanceTests.httpsSupport = {
                success: false,
                error: error.message
            };
        }
        
        // 載入速度測試
        const loadTimeTests = [];
        for (let i = 0; i < 3; i++) {
            const startTime = Date.now();
            try {
                await fetch(this.baseUrl);
                loadTimeTests.push(Date.now() - startTime);
            } catch (error) {
                console.error('載入速度測試失敗:', error);
            }
        }
        
        this.testResults.performanceTests.loadSpeed = {
            average: loadTimeTests.reduce((a, b) => a + b, 0) / loadTimeTests.length,
            tests: loadTimeTests
        };
        
        console.log(`載入速度平均: ${this.testResults.performanceTests.loadSpeed.average}ms`);
    }

    /**
     * 📊 生成完整驗證報告
     */
    generateReport() {
        const reportData = {
            timestamp: new Date().toISOString(),
            websiteUrl: this.baseUrl,
            testResults: this.testResults,
            summary: {
                totalTests: 0,
                successfulTests: 0,
                failedTests: 0,
                successRate: 0
            }
        };

        // 計算測試統計
        const countTests = (obj) => {
            let total = 0, successful = 0;
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key].success !== undefined) {
                    total++;
                    if (obj[key].success) successful++;
                } else if (typeof obj[key] === 'object') {
                    const [subTotal, subSuccessful] = countTests(obj[key]);
                    total += subTotal;
                    successful += subSuccessful;
                }
            }
            return [total, successful];
        };

        const [totalTests, successfulTests] = countTests(this.testResults);
        reportData.summary = {
            totalTests,
            successfulTests,
            failedTests: totalTests - successfulTests,
            successRate: Math.round((successfulTests / totalTests) * 100)
        };

        // 生成報告文件
        const reportPath = path.join(this.reportsDir, `verification-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

        // 生成 HTML 報告
        const htmlReport = this.generateHTMLReport(reportData);
        const htmlPath = path.join(this.reportsDir, `verification-report-${Date.now()}.html`);
        fs.writeFileSync(htmlPath, htmlReport);

        console.log(`📊 驗證報告已生成:`);
        console.log(`JSON: ${reportPath}`);
        console.log(`HTML: ${htmlPath}`);

        return reportData;
    }

    generateHTMLReport(reportData) {
        return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GClaude Enterprise 網站驗證報告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        .header { text-align: center; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .section { margin-bottom: 30px; }
        .section h3 { color: #007bff; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .success { background-color: #d4edda; border-left: 4px solid #28a745; }
        .error { background-color: #f8d7da; border-left: 4px solid #dc3545; }
        .info { background-color: #d1ecf1; border-left: 4px solid #17a2b8; }
        .timestamp { color: #666; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 GClaude Enterprise 系統驗證報告</h1>
            <p>網站: <strong>${reportData.websiteUrl}</strong></p>
            <p class="timestamp">生成時間: ${new Date(reportData.timestamp).toLocaleString('zh-TW')}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <h3>總測試數</h3>
                <p style="font-size: 2em; margin: 0;">${reportData.summary.totalTests}</p>
            </div>
            <div class="stat-card">
                <h3>成功測試</h3>
                <p style="font-size: 2em; margin: 0;">${reportData.summary.successfulTests}</p>
            </div>
            <div class="stat-card">
                <h3>失敗測試</h3>
                <p style="font-size: 2em; margin: 0;">${reportData.summary.failedTests}</p>
            </div>
            <div class="stat-card">
                <h3>成功率</h3>
                <p style="font-size: 2em; margin: 0;">${reportData.summary.successRate}%</p>
            </div>
        </div>

        <div class="section">
            <h3>📊 測試結果詳情</h3>
            ${JSON.stringify(reportData.testResults, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}
        </div>

        ${reportData.testResults.issues.length > 0 ? `
        <div class="section">
            <h3>⚠️ 發現的問題</h3>
            ${reportData.testResults.issues.map(issue => `<div class="test-result error">${issue}</div>`).join('')}
        </div>
        ` : ''}
        
        ${reportData.testResults.recommendations.length > 0 ? `
        <div class="section">
            <h3>💡 建議改進</h3>
            ${reportData.testResults.recommendations.map(rec => `<div class="test-result info">${rec}</div>`).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>`;
    }

    /**
     * 🚀 主要執行方法
     */
    async execute() {
        console.log('🚀 開始 GClaude Enterprise 系統端到端驗證...');
        console.log(`🌐 目標網站: ${this.baseUrl}`);
        
        try {
            // 階段 1: 基礎連通性測試
            await this.testBasicConnectivity();
            
            // 階段 2: 智慧瀏覽器自動化測試
            await this.runBrowserAutomation();
            
            // 階段 3: 效能和安全性測試
            await this.testPerformanceAndSecurity();
            
            // 生成報告
            const report = this.generateReport();
            
            console.log('\n🎉 驗證完成！');
            console.log(`📊 總測試數: ${report.summary.totalTests}`);
            console.log(`✅ 成功: ${report.summary.successfulTests}`);
            console.log(`❌ 失敗: ${report.summary.failedTests}`);
            console.log(`📈 成功率: ${report.summary.successRate}%`);
            
            return report;
            
        } catch (error) {
            console.error('驗證執行錯誤:', error);
            throw error;
        }
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    const verificationEngine = new SmartWebsiteVerificationEngine();
    verificationEngine.execute()
        .then(report => {
            console.log('\n✅ 驗證引擎執行完成！');
            console.log(`📊 詳細報告已保存`);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ 驗證引擎執行失敗:', error);
            process.exit(1);
        });
}

module.exports = SmartWebsiteVerificationEngine;