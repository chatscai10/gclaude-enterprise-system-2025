/**
 * 跨瀏覽器相容性測試 - GClaude Enterprise System
 * 測試 Chrome、Edge 相容性 (Windows環境)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class CrossBrowserCompatibilityTest {
    constructor(options = {}) {
        this.config = {
            baseUrl: options.baseUrl || 'http://localhost:3007',
            timeout: options.timeout || 30000,
            screenshotDir: path.join(__dirname, '..', 'cross-browser-screenshots'),
            reportDir: path.join(__dirname, '..', 'cross-browser-reports'),
            ...options
        };

        this.results = {
            startTime: Date.now(),
            browsers: [],
            summary: {}
        };
    }

    async initialize() {
        console.log('🌐 初始化跨瀏覽器相容性測試系統...');
        
        // 確保目錄存在
        [this.config.screenshotDir, this.config.reportDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        console.log('✅ 跨瀏覽器測試系統初始化完成');
    }

    async testBrowser(browserName, launchOptions = {}) {
        console.log(`\n🌐 測試瀏覽器: ${browserName}`);
        
        const browserResult = {
            name: browserName,
            startTime: Date.now(),
            tests: [],
            screenshots: [],
            errors: [],
            status: 'running'
        };

        let browser = null;
        let page = null;

        try {
            // 啟動瀏覽器
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--allow-running-insecure-content'
                ],
                ...launchOptions
            });

            page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });

            // 監聽錯誤
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    browserResult.errors.push({
                        type: 'console_error',
                        message: msg.text(),
                        timestamp: Date.now()
                    });
                }
            });

            // 測試首頁載入
            await this.testPageLoad(page, browserResult, browserName);
            
            // 測試登入功能
            await this.testLogin(page, browserResult, browserName);
            
            // 測試儀表板功能
            await this.testDashboard(page, browserResult, browserName);
            
            // 測試響應式設計
            await this.testResponsive(page, browserResult, browserName);

            browserResult.status = 'completed';
            
        } catch (error) {
            browserResult.status = 'failed';
            browserResult.error = {
                message: error.message,
                stack: error.stack
            };
            console.log(`❌ 瀏覽器測試失敗: ${browserName} - ${error.message}`);
            
        } finally {
            if (browser) {
                await browser.close();
            }
        }

        browserResult.duration = Date.now() - browserResult.startTime;
        this.results.browsers.push(browserResult);
        
        console.log(`✅ 瀏覽器測試完成: ${browserName} (${browserResult.duration}ms)`);
        return browserResult;
    }

    async testPageLoad(page, browserResult, browserName) {
        console.log(`  📄 測試首頁載入 - ${browserName}`);
        
        const test = {
            name: '首頁載入',
            startTime: Date.now(),
            status: 'running',
            steps: []
        };

        try {
            await page.goto(this.config.baseUrl, { waitUntil: 'networkidle0' });
            
            const title = await page.title();
            test.steps.push(`頁面標題: ${title}`);
            
            const hasLoginForm = await page.$('#loginForm, .login-form, [data-testid="login-form"]') !== null;
            test.steps.push(`登入表單存在: ${hasLoginForm}`);
            
            // 截圖
            const screenshotPath = path.join(this.config.screenshotDir, `homepage-${browserName}-${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            browserResult.screenshots.push({
                name: `homepage-${browserName}`,
                path: screenshotPath,
                timestamp: Date.now()
            });

            test.status = 'passed';
            test.steps.push('首頁載入測試通過');
            
        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
        }

        test.duration = Date.now() - test.startTime;
        browserResult.tests.push(test);
    }

    async testLogin(page, browserResult, browserName) {
        console.log(`  🔐 測試登入功能 - ${browserName}`);
        
        const test = {
            name: '用戶登入',
            startTime: Date.now(),
            status: 'running',
            steps: []
        };

        try {
            // 填寫登入表單
            await page.type('#username, input[name="username"]', 'admin');
            await page.type('#password, input[name="password"]', 'admin123');
            test.steps.push('登入表單填寫完成');

            // 截圖登入表單
            const loginScreenshotPath = path.join(this.config.screenshotDir, `login-${browserName}-${Date.now()}.png`);
            await page.screenshot({ path: loginScreenshotPath, fullPage: true });
            browserResult.screenshots.push({
                name: `login-${browserName}`,
                path: loginScreenshotPath,
                timestamp: Date.now()
            });

            // 提交表單
            await page.click('#loginBtn, button[type="submit"]');
            test.steps.push('提交登入表單');

            // 等待導航
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
            
            const currentUrl = page.url();
            test.steps.push(`登入後URL: ${currentUrl}`);
            
            // 檢查登入結果
            if (currentUrl.includes('/admin') || currentUrl.includes('/dashboard')) {
                test.status = 'passed';
                test.steps.push('登入成功');
            } else {
                test.status = 'failed';
                test.steps.push('登入失敗 - URL未變更');
            }
            
        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
        }

        test.duration = Date.now() - test.startTime;
        browserResult.tests.push(test);
    }

    async testDashboard(page, browserResult, browserName) {
        console.log(`  📊 測試儀表板功能 - ${browserName}`);
        
        const test = {
            name: '儀表板功能',
            startTime: Date.now(),
            status: 'running',
            steps: []
        };

        try {
            // 等待儀表板載入
            await page.waitForSelector('.dashboard, #dashboard, .main-content', { timeout: 5000 });
            test.steps.push('儀表板載入完成');

            // 檢查統計卡片
            const statsCards = await page.$$('.stat-card, .card, .stats-box');
            test.steps.push(`統計卡片數量: ${statsCards.length}`);

            // 截圖儀表板
            const dashboardScreenshotPath = path.join(this.config.screenshotDir, `dashboard-${browserName}-${Date.now()}.png`);
            await page.screenshot({ path: dashboardScreenshotPath, fullPage: true });
            browserResult.screenshots.push({
                name: `dashboard-${browserName}`,
                path: dashboardScreenshotPath,
                timestamp: Date.now()
            });

            test.status = 'passed';
            test.steps.push('儀表板測試通過');
            
        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
        }

        test.duration = Date.now() - test.startTime;
        browserResult.tests.push(test);
    }

    async testResponsive(page, browserResult, browserName) {
        console.log(`  📱 測試響應式設計 - ${browserName}`);
        
        const test = {
            name: '響應式設計',
            startTime: Date.now(),
            status: 'running',
            steps: []
        };

        try {
            const viewports = [
                { name: 'Desktop', width: 1920, height: 1080 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Mobile', width: 375, height: 667 }
            ];

            for (const viewport of viewports) {
                await page.setViewport({ width: viewport.width, height: viewport.height });
                
                // 截圖
                const responsiveScreenshotPath = path.join(this.config.screenshotDir, 
                    `responsive-${viewport.name}-${browserName}-${Date.now()}.png`);
                await page.screenshot({ path: responsiveScreenshotPath, fullPage: true });
                browserResult.screenshots.push({
                    name: `responsive-${viewport.name}-${browserName}`,
                    path: responsiveScreenshotPath,
                    timestamp: Date.now()
                });

                test.steps.push(`${viewport.name} 視圖測試完成`);
            }

            test.status = 'passed';
            test.steps.push('響應式設計測試通過');
            
        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
        }

        test.duration = Date.now() - test.startTime;
        browserResult.tests.push(test);
    }

    async generateReport() {
        const endTime = Date.now();
        const totalDuration = endTime - this.results.startTime;

        // 計算統計
        const totalTests = this.results.browsers.reduce((sum, browser) => sum + browser.tests.length, 0);
        const passedTests = this.results.browsers.reduce((sum, browser) => 
            sum + browser.tests.filter(t => t.status === 'passed').length, 0);
        const failedTests = totalTests - passedTests;

        this.results.summary = {
            totalBrowsers: this.results.browsers.length,
            completedBrowsers: this.results.browsers.filter(b => b.status === 'completed').length,
            totalTests,
            passedTests,
            failedTests,
            totalDuration,
            timestamp: new Date().toISOString()
        };

        const report = {
            config: this.config,
            results: this.results,
            recommendations: this.generateRecommendations()
        };

        // 保存 JSON 報告
        const reportPath = path.join(this.config.reportDir, `cross-browser-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // 生成 HTML 報告
        const htmlReport = this.generateHTMLReport(report);
        const htmlPath = path.join(this.config.reportDir, `cross-browser-report-${Date.now()}.html`);
        fs.writeFileSync(htmlPath, htmlReport);

        console.log(`\n📊 跨瀏覽器相容性報告已生成:`);
        console.log(`   JSON: ${reportPath}`);
        console.log(`   HTML: ${htmlPath}`);

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        const failedBrowsers = this.results.browsers.filter(b => b.status === 'failed');
        if (failedBrowsers.length > 0) {
            recommendations.push({
                type: 'browser_compatibility',
                title: '修復瀏覽器相容性問題',
                description: `${failedBrowsers.length} 個瀏覽器測試失敗`,
                priority: 'high'
            });
        }

        const browsersWithErrors = this.results.browsers.filter(b => b.errors.length > 0);
        if (browsersWithErrors.length > 0) {
            recommendations.push({
                type: 'console_errors',
                title: '修復控制台錯誤',
                description: `在某些瀏覽器中發現控制台錯誤`,
                priority: 'medium'
            });
        }

        return recommendations;
    }

    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>跨瀏覽器相容性測試報告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; flex: 1; }
        .browser-result { border: 1px solid #dee2e6; margin: 10px 0; border-radius: 5px; }
        .browser-header { background: #e9ecef; padding: 10px; }
        .test-result { margin: 10px; padding: 10px; border-left: 4px solid #28a745; }
        .test-result.failed { border-left-color: #dc3545; }
        .screenshots { display: flex; gap: 10px; flex-wrap: wrap; }
        .screenshot { width: 200px; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌐 跨瀏覽器相容性測試報告</h1>
        <p>GClaude Enterprise System</p>
        <p>測試時間: ${report.results.summary.timestamp}</p>
    </div>

    <div class="summary">
        <div class="stat-card">
            <h3>總瀏覽器數</h3>
            <h2>${report.results.summary.totalBrowsers}</h2>
        </div>
        <div class="stat-card">
            <h3>完成測試</h3>
            <h2>${report.results.summary.completedBrowsers}</h2>
        </div>
        <div class="stat-card">
            <h3>通過測試</h3>
            <h2>${report.results.summary.passedTests}</h2>
        </div>
        <div class="stat-card">
            <h3>失敗測試</h3>
            <h2>${report.results.summary.failedTests}</h2>
        </div>
        <div class="stat-card">
            <h3>總耗時</h3>
            <h2>${Math.round(report.results.summary.totalDuration / 1000)}秒</h2>
        </div>
    </div>

    ${report.results.browsers.map(browser => `
    <div class="browser-result">
        <div class="browser-header">
            <h3>🌐 ${browser.name} ${browser.status === 'completed' ? '✅' : '❌'}</h3>
            <p>耗時: ${Math.round(browser.duration / 1000)}秒 | 測試數: ${browser.tests.length}</p>
        </div>
        
        ${browser.tests.map(test => `
        <div class="test-result ${test.status === 'failed' ? 'failed' : ''}">
            <h4>${test.name} ${test.status === 'passed' ? '✅' : '❌'}</h4>
            <ul>
                ${test.steps.map(step => `<li>${step}</li>`).join('')}
            </ul>
            ${test.error ? `<p style="color: red;">錯誤: ${test.error}</p>` : ''}
        </div>
        `).join('')}
        
        ${browser.screenshots.length > 0 ? `
        <div style="margin: 10px;">
            <h4>📸 截圖</h4>
            <div class="screenshots">
                ${browser.screenshots.map(screenshot => `
                <div class="screenshot">
                    <img src="${screenshot.path}" alt="${screenshot.name}" style="width: 100%; height: auto; border: 1px solid #ccc;">
                    <p style="font-size: 12px; text-align: center;">${screenshot.name}</p>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    </div>
    `).join('')}

    ${report.recommendations.length > 0 ? `
    <div class="recommendations">
        <h3>💡 改進建議</h3>
        ${report.recommendations.map(rec => `
        <div style="margin: 10px 0;">
            <h4>${rec.title} (${rec.priority})</h4>
            <p>${rec.description}</p>
        </div>
        `).join('')}
    </div>
    ` : ''}

</body>
</html>
        `;
    }
}

// 執行跨瀏覽器測試
async function runCrossBrowserTest() {
    const tester = new CrossBrowserCompatibilityTest();
    await tester.initialize();

    // 測試 Chrome (默認)
    await tester.testBrowser('Chrome');
    
    // 測試 Edge (如果可用)
    try {
        await tester.testBrowser('Edge', {
            executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        });
    } catch (error) {
        console.log('⚠️  Edge 瀏覽器測試跳過:', error.message);
    }

    const report = await tester.generateReport();

    console.log(`\n📊 跨瀏覽器相容性測試結果摘要:`);
    console.log(`   總瀏覽器數: ${report.results.summary.totalBrowsers}`);
    console.log(`   完成測試: ${report.results.summary.completedBrowsers} ✅`);
    console.log(`   通過測試: ${report.results.summary.passedTests} ✅`);
    console.log(`   失敗測試: ${report.results.summary.failedTests} ❌`);
    console.log(`   總耗時: ${Math.round(report.results.summary.totalDuration / 1000)}秒`);

    if (report.results.summary.failedTests === 0) {
        console.log('\n🎉 所有跨瀏覽器測試都通過了！');
    } else {
        console.log('\n⚠️  有跨瀏覽器相容性問題需要處理');
    }

    console.log('✨ 跨瀏覽器相容性測試完成！');
    return report;
}

// 執行測試
if (require.main === module) {
    runCrossBrowserTest().catch(console.error);
}

module.exports = { CrossBrowserCompatibilityTest, runCrossBrowserTest };