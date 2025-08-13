/**
 * 智慧瀏覽器驗證系統 - GClaude Enterprise System
 * 基於 Puppeteer 的全自動功能驗證
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class IntelligentBrowserVerification {
    constructor(options = {}) {
        this.config = {
            baseUrl: options.baseUrl || 'http://localhost:3007',
            headless: options.headless !== false,
            timeout: options.timeout || 30000,
            screenshotDir: path.join(__dirname, '..', 'verification-screenshots'),
            reportDir: path.join(__dirname, '..', 'verification-reports'),
            ...options
        };

        this.results = {
            startTime: Date.now(),
            tests: [],
            screenshots: [],
            errors: [],
            summary: {}
        };

        this.browser = null;
        this.page = null;
    }

    async initialize() {
        console.log('🚀 初始化智慧瀏覽器驗證系統...');
        
        // 確保目錄存在
        [this.config.screenshotDir, this.config.reportDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // 啟動瀏覽器
        this.browser = await puppeteer.launch({
            headless: this.config.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--allow-running-insecure-content'
            ]
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // 設置請求攔截
        await this.page.setRequestInterception(true);
        this.page.on('request', request => {
            console.log(`📡 API 請求: ${request.method()} ${request.url()}`);
            request.continue();
        });

        // 監聽控制台錯誤
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`❌ 控制台錯誤: ${msg.text()}`);
                this.results.errors.push({
                    type: 'console_error',
                    message: msg.text(),
                    timestamp: Date.now()
                });
            }
        });

        // 監聽網路錯誤
        this.page.on('response', response => {
            if (response.status() >= 400) {
                console.log(`🚨 HTTP 錯誤: ${response.status()} ${response.url()}`);
                this.results.errors.push({
                    type: 'http_error',
                    status: response.status(),
                    url: response.url(),
                    timestamp: Date.now()
                });
            }
        });

        console.log('✅ 瀏覽器驗證系統初始化完成');
    }

    async takeScreenshot(name, description = '') {
        const timestamp = Date.now();
        const filename = `${name}-${timestamp}.png`;
        const filepath = path.join(this.config.screenshotDir, filename);
        
        await this.page.screenshot({
            path: filepath,
            fullPage: true
        });

        this.results.screenshots.push({
            name,
            description,
            filename,
            filepath,
            timestamp
        });

        console.log(`📸 截圖已保存: ${filename}`);
        return filepath;
    }

    async runTest(testName, testFunction) {
        console.log(`\n🧪 執行測試: ${testName}`);
        
        const testStart = Date.now();
        const test = {
            name: testName,
            startTime: testStart,
            status: 'running',
            steps: [],
            screenshots: [],
            errors: []
        };

        try {
            await testFunction(test);
            test.status = 'passed';
            test.duration = Date.now() - testStart;
            
            console.log(`✅ 測試通過: ${testName} (${test.duration}ms)`);
            
        } catch (error) {
            test.status = 'failed';
            test.duration = Date.now() - testStart;
            test.error = {
                message: error.message,
                stack: error.stack
            };
            
            console.log(`❌ 測試失敗: ${testName} - ${error.message}`);
            
            // 失敗時截圖
            await this.takeScreenshot(`error-${testName}`, `測試失敗截圖: ${testName}`);
        }

        this.results.tests.push(test);
        return test;
    }

    async testHomePage() {
        return await this.runTest('首頁載入測試', async (test) => {
            // 導航到首頁
            await this.page.goto(this.config.baseUrl, { waitUntil: 'networkidle0' });
            test.steps.push('導航到首頁');

            // 檢查標題
            const title = await this.page.title();
            if (!title) {
                throw new Error('頁面標題為空');
            }
            test.steps.push(`頁面標題: ${title}`);

            // 截圖
            await this.takeScreenshot('homepage', '首頁載入完成');
            
            // 檢查是否有登入表單
            const hasLoginForm = await this.page.$('#loginForm, .login-form, [data-testid="login-form"]') !== null;
            test.steps.push(`登入表單存在: ${hasLoginForm}`);

            if (!hasLoginForm) {
                throw new Error('未找到登入表單');
            }
        });
    }

    async testAPIHealthCheck() {
        return await this.runTest('API 健康檢查', async (test) => {
            // 直接訪問 API
            const response = await this.page.goto(`${this.config.baseUrl}/api/health`, { 
                waitUntil: 'networkidle0' 
            });
            
            if (response.status() !== 200) {
                throw new Error(`Health check failed with status: ${response.status()}`);
            }

            const content = await this.page.content();
            let healthData;
            
            try {
                // 提取 JSON 數據
                const jsonMatch = content.match(/<pre[^>]*>(.*?)<\/pre>/s);
                if (jsonMatch) {
                    healthData = JSON.parse(jsonMatch[1]);
                } else {
                    // 嘗試直接解析
                    const bodyText = await this.page.evaluate(() => document.body.innerText);
                    healthData = JSON.parse(bodyText);
                }
            } catch (error) {
                throw new Error(`無法解析健康檢查回應: ${error.message}`);
            }

            test.steps.push(`API 狀態: ${healthData.status}`);
            test.steps.push(`服務版本: ${healthData.version}`);
            test.steps.push(`運行時間: ${healthData.uptime}秒`);

            if (healthData.status !== 'healthy') {
                throw new Error(`系統狀態異常: ${healthData.status}`);
            }

            await this.takeScreenshot('health-check', 'API 健康檢查結果');
        });
    }

    async testUserLogin(credentials) {
        return await this.runTest(`用戶登入測試: ${credentials.username}`, async (test) => {
            // 回到首頁
            await this.page.goto(this.config.baseUrl, { waitUntil: 'networkidle0' });
            
            // 查找登入表單元素
            const usernameSelector = '#username, input[name="username"], input[type="text"]';
            const passwordSelector = '#password, input[name="password"], input[type="password"]';
            const submitSelector = '#loginBtn, button[type="submit"], .login-btn';

            await this.page.waitForSelector(usernameSelector, { timeout: 5000 });
            await this.page.waitForSelector(passwordSelector, { timeout: 5000 });
            
            // 填寫表單
            await this.page.type(usernameSelector, credentials.username);
            await this.page.type(passwordSelector, credentials.password);
            test.steps.push('表單填寫完成');

            await this.takeScreenshot(`login-form-filled-${credentials.username}`, '登入表單已填寫');

            // 提交表單
            await this.page.click(submitSelector);
            test.steps.push('提交登入表單');

            // 等待響應
            try {
                await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
            } catch (error) {
                // 可能是 AJAX 登入，檢查頁面變化
                await this.page.waitForTimeout(3000);
            }

            await this.takeScreenshot(`login-result-${credentials.username}`, '登入結果');

            // 檢查登入結果
            const currentUrl = this.page.url();
            const pageContent = await this.page.content();
            
            if (pageContent.includes('登入失敗') || pageContent.includes('密碼錯誤')) {
                throw new Error('登入失敗 - 憑證無效');
            }

            if (currentUrl === this.config.baseUrl || currentUrl.endsWith('/login')) {
                // 檢查是否有錯誤訊息
                const errorElement = await this.page.$('.error, .alert-danger, #errorMessage');
                if (errorElement) {
                    const errorText = await this.page.evaluate(el => el.textContent, errorElement);
                    throw new Error(`登入失敗: ${errorText}`);
                }
            }

            test.steps.push(`登入後 URL: ${currentUrl}`);
            test.steps.push('登入成功');
        });
    }

    async testMultipleUsers() {
        const testUsers = [
            { username: 'admin', password: 'admin123', role: '管理員' },
            { username: 'manager', password: 'manager123', role: '店長' },
            { username: 'employee', password: 'employee123', role: '員工' },
            { username: 'intern', password: 'intern123', role: '實習生' }
        ];

        for (const user of testUsers) {
            await this.testUserLogin(user);
            
            // 登出準備下一個測試
            try {
                const logoutBtn = await this.page.$('button:contains("登出"), a:contains("登出"), .logout');
                if (logoutBtn) {
                    await logoutBtn.click();
                    await this.page.waitForTimeout(2000);
                }
            } catch (error) {
                // 忽略登出錯誤，清除 cookies 重新開始
                await this.page.deleteCookie(...(await this.page.cookies()));
            }
        }
    }

    async testResponsiveDesign() {
        return await this.runTest('響應式設計測試', async (test) => {
            const devices = [
                { name: 'Desktop', width: 1920, height: 1080 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Mobile', width: 375, height: 667 }
            ];

            for (const device of devices) {
                await this.page.setViewport({ 
                    width: device.width, 
                    height: device.height 
                });
                
                await this.page.goto(this.config.baseUrl, { waitUntil: 'networkidle0' });
                await this.takeScreenshot(`responsive-${device.name}`, `${device.name} 視圖`);
                
                test.steps.push(`${device.name} 視圖測試完成`);
            }

            // 恢復桌面視圖
            await this.page.setViewport({ width: 1920, height: 1080 });
        });
    }

    async generateReport() {
        const endTime = Date.now();
        const duration = endTime - this.results.startTime;

        this.results.summary = {
            totalTests: this.results.tests.length,
            passedTests: this.results.tests.filter(t => t.status === 'passed').length,
            failedTests: this.results.tests.filter(t => t.status === 'failed').length,
            totalDuration: duration,
            averageTestDuration: duration / this.results.tests.length,
            totalScreenshots: this.results.screenshots.length,
            totalErrors: this.results.errors.length,
            timestamp: new Date().toISOString()
        };

        const report = {
            config: this.config,
            results: this.results,
            recommendations: this.generateRecommendations()
        };

        // 保存 JSON 報告
        const reportPath = path.join(this.config.reportDir, `verification-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // 生成 HTML 報告
        const htmlReport = this.generateHTMLReport(report);
        const htmlPath = path.join(this.config.reportDir, `verification-report-${Date.now()}.html`);
        fs.writeFileSync(htmlPath, htmlReport);

        console.log(`📊 驗證報告已生成:`);
        console.log(`   JSON: ${reportPath}`);
        console.log(`   HTML: ${htmlPath}`);

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.results.errors.length > 0) {
            recommendations.push({
                type: 'error',
                title: '修復發現的錯誤',
                description: `發現 ${this.results.errors.length} 個錯誤需要處理`,
                priority: 'high'
            });
        }

        if (this.results.tests.filter(t => t.status === 'failed').length > 0) {
            recommendations.push({
                type: 'test_failure',
                title: '修復失敗的測試',
                description: '有測試用例失敗，需要檢查相關功能',
                priority: 'high'
            });
        }

        const slowTests = this.results.tests.filter(t => t.duration > 10000);
        if (slowTests.length > 0) {
            recommendations.push({
                type: 'performance',
                title: '優化系統效能',
                description: `發現 ${slowTests.length} 個緩慢的操作，建議優化效能`,
                priority: 'medium'
            });
        }

        return recommendations;
    }

    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>GClaude 智慧瀏覽器驗證報告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .passed { color: #22c55e; } .failed { color: #ef4444; } .warning { color: #f59e0b; }
        .test-item { margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #ddd; }
        .test-item.passed { border-left-color: #22c55e; }
        .test-item.failed { border-left-color: #ef4444; }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
        .screenshot { text-align: center; }
        .screenshot img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 GClaude 智慧瀏覽器驗證報告</h1>
        <p>生成時間: ${new Date(report.results.summary.timestamp).toLocaleString('zh-TW')}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>測試總覽</h3>
            <p>總測試數: ${report.results.summary.totalTests}</p>
            <p class="passed">通過: ${report.results.summary.passedTests}</p>
            <p class="failed">失敗: ${report.results.summary.failedTests}</p>
        </div>
        
        <div class="card">
            <h3>執行時間</h3>
            <p>總耗時: ${Math.round(report.results.summary.totalDuration / 1000)}秒</p>
            <p>平均測試時間: ${Math.round(report.results.summary.averageTestDuration / 1000)}秒</p>
        </div>
        
        <div class="card">
            <h3>資源統計</h3>
            <p>截圖數量: ${report.results.summary.totalScreenshots}</p>
            <p>錯誤數量: ${report.results.summary.totalErrors}</p>
        </div>
    </div>
    
    <div class="card">
        <h2>測試結果詳情</h2>
        ${report.results.tests.map(test => `
            <div class="test-item ${test.status}">
                <h3>${test.name} - <span class="${test.status}">${test.status === 'passed' ? '✅ 通過' : '❌ 失敗'}</span></h3>
                <p>執行時間: ${test.duration}ms</p>
                ${test.steps ? `<ul>${test.steps.map(step => `<li>${step}</li>`).join('')}</ul>` : ''}
                ${test.error ? `<p class="failed">錯誤: ${test.error.message}</p>` : ''}
            </div>
        `).join('')}
    </div>
    
    ${report.recommendations.length > 0 ? `
    <div class="card">
        <h2>建議事項</h2>
        ${report.recommendations.map(rec => `
            <div class="test-item">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
                <p>優先級: <span class="${rec.priority === 'high' ? 'failed' : 'warning'}">${rec.priority}</span></p>
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>`;
    }

    async run() {
        try {
            await this.initialize();

            console.log('\n🧪 開始執行智慧瀏覽器驗證...');

            // 基本功能測試
            await this.testHomePage();
            await this.testAPIHealthCheck();
            
            // 用戶登入測試
            await this.testMultipleUsers();
            
            // 響應式設計測試
            await this.testResponsiveDesign();

            // 生成報告
            const report = await this.generateReport();

            // 顯示結果摘要
            console.log('\n📊 驗證結果摘要:');
            console.log(`   總測試數: ${report.results.summary.totalTests}`);
            console.log(`   通過測試: ${report.results.summary.passedTests} ✅`);
            console.log(`   失敗測試: ${report.results.summary.failedTests} ❌`);
            console.log(`   總耗時: ${Math.round(report.results.summary.totalDuration / 1000)}秒`);
            console.log(`   截圖數量: ${report.results.summary.totalScreenshots}`);

            return report;

        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    const verification = new IntelligentBrowserVerification({
        baseUrl: process.env.BASE_URL || 'http://localhost:3007',
        headless: process.env.HEADLESS !== 'false'
    });

    verification.run()
        .then(report => {
            console.log('\n✨ 智慧瀏覽器驗證完成!');
            
            if (report.results.summary.failedTests === 0) {
                console.log('🎉 所有測試都通過了!');
                process.exit(0);
            } else {
                console.log('⚠️  有測試失敗，請查看報告了解詳情');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 驗證過程中發生錯誤:', error.message);
            process.exit(1);
        });
}

module.exports = IntelligentBrowserVerification;