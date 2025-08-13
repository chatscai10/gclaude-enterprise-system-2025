/**
 * 生產環境智慧瀏覽器驗證系統
 * 對真實上線網址進行完整功能驗證
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ProductionBrowserVerificationEngine {
    constructor() {
        this.productionUrls = [
            {
                name: 'Railway Production',
                url: 'https://gclaude-enterprise-railway.app',
                platform: 'railway',
                expectedFeatures: ['login', 'employees', 'attendance', 'revenue']
            },
            {
                name: 'Render Production', 
                url: 'https://gclaude-enterprise-render.app',
                platform: 'render',
                expectedFeatures: ['login', 'employees', 'attendance', 'revenue']
            },
            {
                name: 'Local Development',
                url: 'http://localhost:3007',
                platform: 'local',
                expectedFeatures: ['login', 'employees', 'attendance', 'revenue']
            }
        ];
        
        this.verificationResults = [];
        this.screenshots = [];
        this.browser = null;
    }

    async executeProductionVerification() {
        console.log('🌐 開始生產環境智慧瀏覽器驗證...\n');

        try {
            // 1. 啟動瀏覽器
            await this.launchBrowser();

            // 2. 對每個生產網址進行驗證
            for (const productionSite of this.productionUrls) {
                console.log(`\n🔍 驗證生產環境: ${productionSite.name}`);
                await this.verifyProductionSite(productionSite);
            }

            // 3. 生成驗證報告
            const report = await this.generateVerificationReport();

            // 4. 發送驗證結果通知
            await this.sendVerificationNotification(report);

            return {
                totalSites: this.productionUrls.length,
                verifiedSites: this.verificationResults.filter(r => r.accessible).length,
                functionalSites: this.verificationResults.filter(r => r.fullyFunctional).length,
                screenshots: this.screenshots.length,
                report: report
            };

        } finally {
            // 關閉瀏覽器
            if (this.browser) {
                await this.browser.close();
            }
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
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        console.log('✅ 瀏覽器引擎啟動成功');
    }

    async verifyProductionSite(site) {
        const page = await this.browser.newPage();
        
        try {
            // 設定視窗大小
            await page.setViewport({ width: 1920, height: 1080 });
            
            // 設定用戶代理
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            const verificationResult = {
                name: site.name,
                url: site.url,
                platform: site.platform,
                accessible: false,
                loadTime: 0,
                httpStatus: null,
                loginWorking: false,
                featuresWorking: [],
                errors: [],
                screenshots: [],
                fullyFunctional: false,
                timestamp: new Date().toISOString()
            };

            console.log(`📡 正在訪問: ${site.url}`);

            // 1. 基本連線測試
            const startTime = Date.now();
            
            try {
                // 先用axios檢查HTTP狀態
                const httpResponse = await axios.get(`${site.url}/api/health`, { 
                    timeout: 10000,
                    validateStatus: () => true 
                });
                verificationResult.httpStatus = httpResponse.status;
                
                if (httpResponse.status === 200) {
                    console.log('✅ HTTP健康檢查通過');
                } else {
                    console.log(`⚠️ HTTP狀態碼: ${httpResponse.status}`);
                }
            } catch (error) {
                console.log(`❌ HTTP連線失敗: ${error.message}`);
                verificationResult.errors.push(`HTTP連線失敗: ${error.message}`);
            }

            // 2. 瀏覽器頁面載入測試
            try {
                const response = await page.goto(site.url, { 
                    waitUntil: 'networkidle0',
                    timeout: 30000 
                });
                
                verificationResult.loadTime = Date.now() - startTime;
                verificationResult.accessible = !!response && response.ok();
                
                if (verificationResult.accessible) {
                    console.log(`✅ 頁面載入成功 (${verificationResult.loadTime}ms)`);
                    
                    // 截圖
                    const screenshotPath = await this.takeScreenshot(page, site.name, 'homepage');
                    verificationResult.screenshots.push(screenshotPath);
                    
                } else {
                    console.log('❌ 頁面載入失敗');
                    verificationResult.errors.push('頁面無法載入');
                }
                
            } catch (error) {
                console.log(`❌ 瀏覽器載入錯誤: ${error.message}`);
                verificationResult.errors.push(`瀏覽器載入錯誤: ${error.message}`);
            }

            // 3. 登入功能測試
            if (verificationResult.accessible) {
                await this.testLoginFunctionality(page, verificationResult);
            }

            // 4. 核心功能測試
            if (verificationResult.loginWorking) {
                await this.testCoreFeatures(page, verificationResult, site.expectedFeatures);
            }

            // 5. 評估整體功能性
            verificationResult.fullyFunctional = 
                verificationResult.accessible && 
                verificationResult.loginWorking && 
                verificationResult.featuresWorking.length >= 2;

            this.verificationResults.push(verificationResult);
            
            console.log(`📊 ${site.name} 驗證完成:`);
            console.log(`   可訪問: ${verificationResult.accessible ? '✅' : '❌'}`);
            console.log(`   登入: ${verificationResult.loginWorking ? '✅' : '❌'}`);
            console.log(`   功能: ${verificationResult.featuresWorking.length}/${site.expectedFeatures.length}`);

        } catch (error) {
            console.log(`❌ 驗證過程發生錯誤: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async testLoginFunctionality(page, result) {
        console.log('🔐 測試登入功能...');
        
        try {
            // 尋找登入表單
            await page.waitForSelector('input[name="username"], input[id="username"], input[type="text"]', { timeout: 5000 });
            await page.waitForSelector('input[name="password"], input[id="password"], input[type="password"]', { timeout: 5000 });
            
            // 輸入測試帳號
            await page.type('input[name="username"], input[id="username"], input[type="text"]', 'admin');
            await page.type('input[name="password"], input[id="password"], input[type="password"]', 'admin123');
            
            // 截圖登入表單
            const loginScreenshot = await this.takeScreenshot(page, result.name, 'login-form');
            result.screenshots.push(loginScreenshot);
            
            // 點擊登入按鈕
            await page.click('button[type="submit"], input[type="submit"], .login-btn, #loginBtn');
            
            // 等待登入處理
            await page.waitForTimeout(3000);
            
            // 檢查是否成功登入
            const currentUrl = page.url();
            const hasLogoutButton = await page.$('.logout, #logout, [onclick*="logout"]') !== null;
            const hasWelcomeMessage = await page.$('.welcome, .dashboard, .main-content') !== null;
            
            if (hasLogoutButton || hasWelcomeMessage || currentUrl.includes('dashboard') || currentUrl.includes('main')) {
                result.loginWorking = true;
                console.log('✅ 登入功能正常');
                
                // 登入成功截圖
                const successScreenshot = await this.takeScreenshot(page, result.name, 'login-success');
                result.screenshots.push(successScreenshot);
                
            } else {
                console.log('❌ 登入功能異常');
                result.errors.push('登入後頁面狀態異常');
            }
            
        } catch (error) {
            console.log(`❌ 登入測試失敗: ${error.message}`);
            result.errors.push(`登入測試失敗: ${error.message}`);
        }
    }

    async testCoreFeatures(page, result, expectedFeatures) {
        console.log('🧪 測試核心功能模組...');
        
        for (const feature of expectedFeatures) {
            try {
                console.log(`   測試 ${feature} 功能...`);
                
                switch (feature) {
                    case 'employees':
                        await this.testEmployeesFeature(page, result);
                        break;
                    case 'attendance':
                        await this.testAttendanceFeature(page, result);
                        break;
                    case 'revenue':
                        await this.testRevenueFeature(page, result);
                        break;
                    default:
                        console.log(`   ⚠️ 未知功能: ${feature}`);
                }
                
            } catch (error) {
                console.log(`   ❌ ${feature} 功能測試失敗: ${error.message}`);
                result.errors.push(`${feature} 功能測試失敗: ${error.message}`);
            }
        }
    }

    async testEmployeesFeature(page, result) {
        try {
            // 尋找員工管理連結或按鈕
            const employeeLink = await page.$('a[href*="employee"], .employee, #employees, [onclick*="employee"]');
            
            if (employeeLink) {
                await employeeLink.click();
                await page.waitForTimeout(2000);
                
                // 檢查是否進入員工頁面
                const hasEmployeeTable = await page.$('table, .employee-list, .employee-table') !== null;
                const hasAddButton = await page.$('.add-employee, #addEmployee, [onclick*="add"]') !== null;
                
                if (hasEmployeeTable || hasAddButton) {
                    result.featuresWorking.push('employees');
                    console.log('   ✅ 員工管理功能正常');
                    
                    const screenshot = await this.takeScreenshot(page, result.name, 'employees');
                    result.screenshots.push(screenshot);
                } else {
                    console.log('   ❌ 員工管理頁面元素不完整');
                }
            } else {
                console.log('   ❌ 找不到員工管理入口');
            }
        } catch (error) {
            console.log(`   ❌ 員工功能測試錯誤: ${error.message}`);
        }
    }

    async testAttendanceFeature(page, result) {
        try {
            const attendanceLink = await page.$('a[href*="attendance"], .attendance, #attendance, [onclick*="attendance"]');
            
            if (attendanceLink) {
                await attendanceLink.click();
                await page.waitForTimeout(2000);
                
                const hasAttendanceContent = await page.$('.attendance, table, .record') !== null;
                
                if (hasAttendanceContent) {
                    result.featuresWorking.push('attendance');
                    console.log('   ✅ 出勤管理功能正常');
                    
                    const screenshot = await this.takeScreenshot(page, result.name, 'attendance');
                    result.screenshots.push(screenshot);
                } else {
                    console.log('   ❌ 出勤管理頁面內容異常');
                }
            } else {
                console.log('   ❌ 找不到出勤管理入口');
            }
        } catch (error) {
            console.log(`   ❌ 出勤功能測試錯誤: ${error.message}`);
        }
    }

    async testRevenueFeature(page, result) {
        try {
            const revenueLink = await page.$('a[href*="revenue"], .revenue, #revenue, [onclick*="revenue"]');
            
            if (revenueLink) {
                await revenueLink.click();
                await page.waitForTimeout(2000);
                
                const hasRevenueContent = await page.$('.revenue, .chart, table, .financial') !== null;
                
                if (hasRevenueContent) {
                    result.featuresWorking.push('revenue');
                    console.log('   ✅ 營收管理功能正常');
                    
                    const screenshot = await this.takeScreenshot(page, result.name, 'revenue');
                    result.screenshots.push(screenshot);
                } else {
                    console.log('   ❌ 營收管理頁面內容異常');
                }
            } else {
                console.log('   ❌ 找不到營收管理入口');
            }
        } catch (error) {
            console.log(`   ❌ 營收功能測試錯誤: ${error.message}`);
        }
    }

    async takeScreenshot(page, siteName, section) {
        const timestamp = Date.now();
        const filename = `${siteName.replace(/\s+/g, '-')}-${section}-${timestamp}.png`;
        const screenshotDir = path.join(__dirname, '..', 'production-screenshots');
        
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        const screenshotPath = path.join(screenshotDir, filename);
        
        try {
            await page.screenshot({ 
                path: screenshotPath, 
                fullPage: true,
                quality: 90
            });
            
            this.screenshots.push({
                site: siteName,
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
        console.log('\n📋 生成生產環境驗證報告...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalSites: this.productionUrls.length,
                accessibleSites: this.verificationResults.filter(r => r.accessible).length,
                functionalSites: this.verificationResults.filter(r => r.fullyFunctional).length,
                totalScreenshots: this.screenshots.length
            },
            details: this.verificationResults,
            screenshots: this.screenshots,
            recommendations: this.generateRecommendations()
        };

        const reportPath = path.join(__dirname, '..', 'verification-reports', `production-verification-${Date.now()}.json`);
        
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
        
        const accessibleSites = this.verificationResults.filter(r => r.accessible).length;
        const functionalSites = this.verificationResults.filter(r => r.fullyFunctional).length;
        
        if (accessibleSites < this.productionUrls.length) {
            recommendations.push('部分生產網址無法訪問，請檢查部署狀態和DNS配置');
        }
        
        if (functionalSites < accessibleSites) {
            recommendations.push('部分網站功能異常，建議檢查應用程式配置和資料庫連線');
        }
        
        recommendations.push('定期執行生產環境驗證，確保服務穩定性');
        recommendations.push('建立監控告警機制，即時發現問題');
        
        return recommendations;
    }

    async sendVerificationNotification(report) {
        console.log('\n📱 發送驗證結果通知...');
        
        const notificationContent = `🌐 生產環境智慧瀏覽器驗證完成

📊 驗證結果總覽:
• 總計站點: ${report.summary.totalSites}
• 可訪問: ${report.summary.accessibleSites}/${report.summary.totalSites}
• 功能正常: ${report.summary.functionalSites}/${report.summary.totalSites}
• 截圖數量: ${report.summary.totalScreenshots}

🔍 詳細結果:
${this.verificationResults.map(r => 
    `• ${r.name}: ${r.accessible ? '✅' : '❌'} 訪問 | ${r.loginWorking ? '✅' : '❌'} 登入 | ${r.featuresWorking.length} 功能`
).join('\n')}

📸 驗證截圖已保存到 production-screenshots/ 目錄
📄 完整報告: verification-reports/production-verification-*.json`;

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
                console.log('✅ Telegram驗證通知發送成功');
            } else {
                console.log('❌ Telegram驗證通知發送失敗:', response.data);
            }
        } catch (error) {
            console.error('❌ 發送通知錯誤:', error.message);
        }
    }
}

async function executeProductionVerification() {
    const verifier = new ProductionBrowserVerificationEngine();
    return await verifier.executeProductionVerification();
}

if (require.main === module) {
    executeProductionVerification()
        .then(result => {
            console.log('\n🎉 生產環境智慧瀏覽器驗證完成！');
            console.log(`📊 驗證統計:`);
            console.log(`   總計站點: ${result.totalSites}`);
            console.log(`   可訪問站點: ${result.verifiedSites}`);
            console.log(`   功能正常站點: ${result.functionalSites}`);
            console.log(`   截圖數量: ${result.screenshots}`);
        })
        .catch(console.error);
}

module.exports = ProductionBrowserVerificationEngine;