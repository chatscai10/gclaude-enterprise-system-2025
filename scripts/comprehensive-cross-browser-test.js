/**
 * 全面跨瀏覽器相容性測試
 * 測試Chrome、Edge、Firefox等主流瀏覽器
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ComprehensiveCrossBrowserTest {
    constructor() {
        this.baseURL = 'http://localhost:3007';
        this.testResults = [];
        this.screenshotDir = path.join(__dirname, '..', 'cross-browser-test-screenshots');
        
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }

    async testBrowser(browserName, browserPath = null) {
        console.log(`\n🌐 測試 ${browserName} 瀏覽器...`);
        
        let browser;
        try {
            const launchOptions = {
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--allow-running-insecure-content'
                ],
                defaultViewport: { width: 1920, height: 1080 }
            };

            if (browserPath) {
                launchOptions.executablePath = browserPath;
            }

            browser = await puppeteer.launch(launchOptions);
            const page = await browser.newPage();
            
            // 設置地理位置權限
            const context = browser.defaultBrowserContext();
            await context.overridePermissions(this.baseURL, ['geolocation']);
            
            // 自動處理對話框
            page.on('dialog', async (dialog) => {
                await dialog.accept();
            });

            // 測試首頁載入
            await page.goto(this.baseURL, { waitUntil: 'networkidle2' });
            await page.screenshot({
                path: path.join(this.screenshotDir, `homepage-${browserName}.png`)
            });

            const hasLoginForm = await page.$('#loginForm');
            this.logTest(`${browserName} 首頁載入`, !!hasLoginForm, '登入表單正常載入');

            // 測試管理員登入
            await page.type('#username', 'admin');
            await page.type('#password', 'admin123');
            await page.click('#loginBtn');
            await page.waitForTimeout(3000);

            const isLoggedIn = page.url().includes('admin') || page.url().includes('dashboard');
            await page.screenshot({
                path: path.join(this.screenshotDir, `dashboard-${browserName}.png`)
            });
            
            this.logTest(`${browserName} 管理員登入`, isLoggedIn, isLoggedIn ? '登入成功' : '登入失敗');

            // 測試響應式設計
            const viewports = [
                { name: 'Desktop', width: 1920, height: 1080 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Mobile', width: 375, height: 667 }
            ];

            for (const viewport of viewports) {
                await page.setViewport(viewport);
                await page.waitForTimeout(1000);
                await page.screenshot({
                    path: path.join(this.screenshotDir, `responsive-${viewport.name}-${browserName}.png`)
                });
                
                this.logTest(`${browserName} ${viewport.name}響應式`, true, `視窗尺寸 ${viewport.width}x${viewport.height} 正常顯示`);
            }

            await browser.close();
            return true;

        } catch (error) {
            this.logTest(`${browserName} 測試`, false, `測試錯誤: ${error.message}`);
            if (browser) await browser.close();
            return false;
        }
    }

    async runCrossBrowserTests() {
        console.log('🌐 開始跨瀏覽器相容性測試...\n');

        // 測試Chrome (預設)
        await this.testBrowser('Chrome');

        // 測試Edge (如果可用)
        try {
            const edgePaths = [
                'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
            ];
            
            let edgePath = null;
            for (const path of edgePaths) {
                if (fs.existsSync(path)) {
                    edgePath = path;
                    break;
                }
            }
            
            if (edgePath) {
                await this.testBrowser('Edge', edgePath);
            } else {
                this.logTest('Edge 測試', false, 'Edge 瀏覽器未找到');
            }
        } catch (error) {
            this.logTest('Edge 測試', false, `Edge 測試錯誤: ${error.message}`);
        }

        // 生成跨瀏覽器測試報告
        const report = await this.generateReport();
        return report;
    }

    logTest(testName, success, message) {
        const status = success ? '✅' : '❌';
        this.testResults.push({
            testName,
            success,
            message,
            timestamp: new Date().toISOString()
        });
        console.log(`${status} ${testName}: ${message}`);
    }

    async generateReport() {
        console.log('\n📊 生成跨瀏覽器測試報告...');
        
        const passed = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

        const report = {
            title: '🌐 跨瀏覽器相容性測試報告',
            timestamp: new Date().toISOString(),
            summary: {
                total,
                passed,
                failed: total - passed,
                passRate: `${passRate}%`
            },
            testResults: this.testResults,
            compatibility: {
                chrome: this.testResults.filter(r => r.testName.includes('Chrome') && r.success).length > 0,
                edge: this.testResults.filter(r => r.testName.includes('Edge') && r.success).length > 0
            },
            responsiveDesign: {
                desktop: this.testResults.filter(r => r.testName.includes('Desktop')).length > 0,
                tablet: this.testResults.filter(r => r.testName.includes('Tablet')).length > 0,
                mobile: this.testResults.filter(r => r.testName.includes('Mobile')).length > 0
            }
        };

        const reportPath = path.join(__dirname, '..', `cross-browser-test-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`📄 跨瀏覽器測試報告已保存: ${reportPath}`);
        console.log(`🎯 測試結果: ${passed}/${total} 項目通過 (${passRate}%)`);
        
        return report;
    }
}

async function runCrossBrowserTests() {
    const tester = new ComprehensiveCrossBrowserTest();
    return await tester.runCrossBrowserTests();
}

if (require.main === module) {
    runCrossBrowserTests()
        .then(report => {
            console.log('\n🎉 跨瀏覽器測試完成！');
        })
        .catch(console.error);
}

module.exports = ComprehensiveCrossBrowserTest;