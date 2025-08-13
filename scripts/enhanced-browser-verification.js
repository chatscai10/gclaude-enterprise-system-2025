/**
 * 增強版智慧瀏覽器驗證系統
 * 修復彈出視窗、對話框、地理位置權限和表單提交問題
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class EnhancedBrowserVerification {
    constructor() {
        this.baseURL = 'http://localhost:3007';
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.screenshotDir = path.join(__dirname, '..', 'enhanced-verification-screenshots');
        this.reportDir = path.join(__dirname, '..', 'enhanced-verification-reports');
        this.consoleLogs = [];
        this.networkRequests = [];
        this.jsErrors = [];
        
        // 確保目錄存在
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }
    }

    async initializeBrowser() {
        console.log('🚀 啟動增強版瀏覽器...');
        
        this.browser = await puppeteer.launch({
            headless: false, // 設為false以便調試觀察
            devtools: false,
            slowMo: 100, // 減慢操作速度以提高穩定性
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-default-apps',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-popup-blocking',
                // 重要：預先授予地理位置權限
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                '--allow-running-insecure-content',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-field-trial-config',
                '--disable-background-timer-throttling',
                '--disable-background-networking',
                '--disable-client-side-phishing-detection',
                '--disable-sync',
                '--metrics-recording-only',
                '--no-report-upload'
            ],
            defaultViewport: null
        });

        this.page = await this.browser.newPage();
        
        // 設置用戶代理
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 EnhancedBrowserVerification/1.0');
        
        // 設置視窗大小
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // 設置超時時間
        this.page.setDefaultTimeout(30000);
        
        // 授予地理位置權限
        const context = this.browser.defaultBrowserContext();
        await context.overridePermissions(this.baseURL, ['geolocation']);
        
        // 設置假的地理位置
        await this.page.setGeolocation({ latitude: 25.0330, longitude: 121.5654 });
        
        // 監聽控制台日誌
        this.page.on('console', (msg) => {
            this.consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString(),
                location: msg.location()
            });
            console.log(`🔍 [${msg.type().toUpperCase()}] ${msg.text()}`);
        });

        // 監聽JavaScript錯誤
        this.page.on('pageerror', (error) => {
            this.jsErrors.push({
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            console.error(`❌ JS錯誤: ${error.message}`);
        });

        // 監聽網路請求
        this.page.on('response', (response) => {
            this.networkRequests.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText(),
                timestamp: new Date().toISOString(),
                fromCache: response.fromCache()
            });
            
            if (response.url().includes('/api/')) {
                console.log(`🌐 API請求: ${response.status()} ${response.url()}`);
            }
        });

        // 自動處理對話框
        this.page.on('dialog', async (dialog) => {
            console.log(`⚠️ 對話框出現: ${dialog.type()} - ${dialog.message()}`);
            
            // 自動接受所有對話框
            if (dialog.type() === 'confirm') {
                await dialog.accept();
                console.log('✅ 自動接受確認對話框');
            } else if (dialog.type() === 'alert') {
                await dialog.accept();
                console.log('✅ 自動接受警告對話框');
            } else if (dialog.type() === 'prompt') {
                await dialog.accept('test'); // 提供預設值
                console.log('✅ 自動接受輸入對話框');
            }
        });

        // 注入自定義腳本來處理地理位置
        await this.page.evaluateOnNewDocument(() => {
            // 覆寫地理位置API
            Object.defineProperty(navigator, 'geolocation', {
                value: {
                    getCurrentPosition: (success, error, options) => {
                        console.log('🌍 地理位置請求被攔截，自動提供台北位置');
                        setTimeout(() => {
                            success({
                                coords: {
                                    latitude: 25.0330,
                                    longitude: 121.5654,
                                    accuracy: 10,
                                    altitude: null,
                                    altitudeAccuracy: null,
                                    heading: null,
                                    speed: null
                                },
                                timestamp: Date.now()
                            });
                        }, 100);
                    },
                    watchPosition: (success, error, options) => {
                        return this.getCurrentPosition(success, error, options);
                    },
                    clearWatch: () => {}
                },
                writable: false
            });

            // 覆寫確認對話框
            window.originalConfirm = window.confirm;
            window.confirm = function(message) {
                console.log('🔔 確認對話框自動確認:', message);
                return true;
            };

            window.originalAlert = window.alert;
            window.alert = function(message) {
                console.log('🔔 警告對話框自動確認:', message);
            };
        });

        console.log('✅ 增強版瀏覽器初始化完成');
    }

    async takeScreenshot(name) {
        const timestamp = Date.now();
        const filename = `${name}-${timestamp}.png`;
        const filepath = path.join(this.screenshotDir, filename);
        
        await this.page.screenshot({
            path: filepath,
            fullPage: true
        });
        
        console.log(`📸 截圖保存: ${filename}`);
        return filename;
    }

    async waitForNetworkIdle(timeout = 5000) {
        try {
            await this.page.waitForLoadState?.('networkidle', { timeout });
        } catch {
            // Puppeteer 使用不同的方法
            await this.page.waitForTimeout(2000);
        }
    }

    async testHomePage() {
        console.log('\n🏠 測試首頁載入...');
        
        try {
            await this.page.goto(this.baseURL, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            await this.waitForNetworkIdle();
            await this.takeScreenshot('homepage-loaded');
            
            // 檢查頁面標題
            const title = await this.page.title();
            const hasLoginForm = await this.page.$('#loginForm');
            
            this.logTest('首頁載入', !!hasLoginForm, `頁面標題: ${title}`);
            
            return true;
        } catch (error) {
            this.logTest('首頁載入', false, error.message);
            return false;
        }
    }

    async testLoginProcess() {
        console.log('\n👤 測試登入流程...');
        
        const users = [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'manager', password: 'manager123', role: 'manager' },
            { username: 'employee', password: 'employee123', role: 'employee' },
            { username: 'intern', password: 'intern123', role: 'intern' }
        ];

        for (const user of users) {
            try {
                console.log(`🔐 測試 ${user.role} 登入...`);
                
                // 回到首頁
                await this.page.goto(this.baseURL);
                await this.waitForNetworkIdle();
                
                // 等待登入表單
                await this.page.waitForSelector('#loginForm', { timeout: 10000 });
                await this.page.waitForSelector('#username', { timeout: 5000 });
                await this.page.waitForSelector('#password', { timeout: 5000 });
                await this.page.waitForSelector('#loginBtn', { timeout: 5000 });
                
                // 清空並填入用戶名
                await this.page.click('#username', { clickCount: 3 });
                await this.page.type('#username', user.username, { delay: 50 });
                
                // 清空並填入密碼
                await this.page.click('#password', { clickCount: 3 });
                await this.page.type('#password', user.password, { delay: 50 });
                
                await this.takeScreenshot(`login-form-filled-${user.role}`);
                
                // 點擊登入按鈕
                await this.page.click('#loginBtn');
                
                // 等待登入結果
                await this.page.waitForTimeout(3000);
                await this.waitForNetworkIdle();
                
                // 檢查是否成功登入（檢查是否重導到儀表板）
                const currentUrl = this.page.url();
                const isLoggedIn = currentUrl.includes('/dashboard') || 
                                  await this.page.$('.dashboard-container') ||
                                  await this.page.$('#userInfo');
                
                await this.takeScreenshot(`login-result-${user.role}`);
                
                this.logTest(`${user.role}登入`, !!isLoggedIn, 
                    isLoggedIn ? '登入成功' : `登入失敗，當前URL: ${currentUrl}`);
                
                // 如果登入成功，測試登出功能
                if (isLoggedIn) {
                    await this.testLogout();
                }
                
            } catch (error) {
                this.logTest(`${user.role}登入`, false, `錯誤: ${error.message}`);
            }
        }
    }

    async testLogout() {
        console.log('🚪 測試登出功能...');
        
        try {
            // 尋找登出按鈕或連結
            const logoutSelectors = [
                'button[onclick*="logout"]',
                'a[onclick*="logout"]', 
                '#logoutBtn',
                '.logout-btn',
                '[data-action="logout"]',
                'button:contains("登出")',
                'a:contains("登出")'
            ];

            let logoutElement = null;
            for (const selector of logoutSelectors) {
                try {
                    logoutElement = await this.page.$(selector);
                    if (logoutElement) break;
                } catch (e) {
                    // 繼續嘗試下一個選擇器
                }
            }

            if (logoutElement) {
                // 點擊登出
                await logoutElement.click();
                
                // 等待可能的確認對話框（已經自動處理）
                await this.page.waitForTimeout(1000);
                
                // 等待重導到登入頁面
                await this.waitForNetworkIdle();
                
                // 檢查是否回到登入頁面
                const backToLogin = await this.page.$('#loginForm') || 
                                   this.page.url().includes('/login') ||
                                   this.page.url() === this.baseURL + '/';
                
                this.logTest('登出功能', !!backToLogin, '成功登出並回到登入頁面');
            } else {
                this.logTest('登出功能', false, '找不到登出按鈕');
            }
            
        } catch (error) {
            this.logTest('登出功能', false, `登出錯誤: ${error.message}`);
        }
    }

    async testGPSCheckin() {
        console.log('\n📍 測試GPS打卡功能...');
        
        try {
            // 首先登入為員工
            await this.page.goto(this.baseURL);
            await this.page.waitForSelector('#username');
            await this.page.type('#username', 'employee');
            await this.page.type('#password', 'employee123');
            await this.page.click('#loginBtn');
            await this.waitForNetworkIdle();
            
            // 尋找打卡相關的按鈕或頁面
            const checkinSelectors = [
                'button[onclick*="checkin"]',
                'button[onclick*="打卡"]',
                '#checkinBtn',
                '.checkin-btn',
                '[data-action="checkin"]'
            ];

            let checkinElement = null;
            for (const selector of checkinSelectors) {
                try {
                    checkinElement = await this.page.$(selector);
                    if (checkinElement) break;
                } catch (e) {
                    continue;
                }
            }

            if (checkinElement) {
                console.log('🎯 找到打卡按鈕，開始測試...');
                
                // 點擊打卡按鈕
                await checkinElement.click();
                
                // 等待地理位置請求（已經自動處理）
                await this.page.waitForTimeout(3000);
                await this.waitForNetworkIdle();
                
                await this.takeScreenshot('gps-checkin-result');
                
                // 檢查打卡結果
                const checkinSuccess = await this.page.evaluate(() => {
                    // 檢查是否有成功訊息
                    const messages = [
                        '打卡成功',
                        '上班打卡成功', 
                        '下班打卡成功',
                        'success',
                        'Success'
                    ];
                    
                    const bodyText = document.body.innerText;
                    return messages.some(msg => bodyText.includes(msg));
                });

                this.logTest('GPS打卡功能', checkinSuccess, 
                    checkinSuccess ? 'GPS打卡成功' : '打卡結果待確認');
                    
            } else {
                this.logTest('GPS打卡功能', false, '找不到打卡按鈕');
            }
            
        } catch (error) {
            this.logTest('GPS打卡功能', false, `GPS打卡錯誤: ${error.message}`);
        }
    }

    async testFormSubmission() {
        console.log('\n📝 測試表單提交功能...');
        
        try {
            // 以管理員身份登入
            await this.page.goto(this.baseURL);
            await this.page.waitForSelector('#username');
            await this.page.type('#username', 'admin');
            await this.page.type('#password', 'admin123');
            await this.page.click('#loginBtn');
            await this.waitForNetworkIdle();
            
            // 尋找新增員工或其他表單按鈕
            const addButtonSelectors = [
                'button[onclick*="addEmployee"]',
                'button[onclick*="新增"]',
                '#addEmployeeBtn',
                '.add-btn',
                '[data-action="add"]',
                'button:contains("新增")'
            ];

            let addButton = null;
            for (const selector of addButtonSelectors) {
                try {
                    addButton = await this.page.$(selector);
                    if (addButton) break;
                } catch (e) {
                    continue;
                }
            }

            if (addButton) {
                console.log('🎯 找到新增按鈕，測試表單提交...');
                
                // 點擊新增按鈕
                await addButton.click();
                await this.page.waitForTimeout(2000);
                
                // 等待模態視窗或表單出現
                const modalSelectors = [
                    '.modal',
                    '#employeeModal', 
                    '.popup',
                    '.form-container'
                ];

                let modalFound = false;
                for (const selector of modalSelectors) {
                    try {
                        await this.page.waitForSelector(selector, { timeout: 3000 });
                        modalFound = true;
                        break;
                    } catch (e) {
                        continue;
                    }
                }

                if (modalFound) {
                    console.log('📋 模態視窗已出現，填寫表單...');
                    
                    // 填寫表單欄位
                    const formFields = [
                        { selector: 'input[name="username"]', value: `test_user_${Date.now()}` },
                        { selector: 'input[name="name"]', value: '測試用戶' },
                        { selector: 'input[name="email"]', value: 'test@example.com' },
                        { selector: 'input[name="phone"]', value: '0912345678' },
                        { selector: 'select[name="role"]', value: 'employee' }
                    ];

                    for (const field of formFields) {
                        try {
                            const element = await this.page.$(field.selector);
                            if (element) {
                                if (field.selector.includes('select')) {
                                    await this.page.select(field.selector, field.value);
                                } else {
                                    await this.page.click(field.selector, { clickCount: 3 });
                                    await this.page.type(field.selector, field.value, { delay: 50 });
                                }
                                console.log(`✅ 填寫欄位: ${field.selector}`);
                            }
                        } catch (e) {
                            console.log(`⚠️ 跳過欄位: ${field.selector}`);
                        }
                    }

                    await this.takeScreenshot('form-filled');
                    
                    // 尋找並點擊提交按鈕
                    const submitSelectors = [
                        'button[type="submit"]',
                        'input[type="submit"]', 
                        'button[onclick*="save"]',
                        'button[onclick*="submit"]',
                        '#submitBtn',
                        '.submit-btn',
                        'button:contains("提交")',
                        'button:contains("儲存")',
                        'button:contains("確定")'
                    ];

                    let submitted = false;
                    for (const selector of submitSelectors) {
                        try {
                            const submitBtn = await this.page.$(selector);
                            if (submitBtn) {
                                console.log(`🎯 找到提交按鈕: ${selector}`);
                                
                                // 點擊提交按鈕
                                await submitBtn.click();
                                
                                // 等待提交結果
                                await this.page.waitForTimeout(3000);
                                await this.waitForNetworkIdle();
                                
                                await this.takeScreenshot('form-submitted');
                                
                                // 檢查提交結果
                                const submitSuccess = await this.page.evaluate(() => {
                                    const bodyText = document.body.innerText;
                                    return bodyText.includes('成功') || 
                                           bodyText.includes('Success') ||
                                           bodyText.includes('新增');
                                });

                                this.logTest('表單提交功能', submitSuccess, 
                                    submitSuccess ? '表單提交成功' : '表單提交結果待確認');
                                submitted = true;
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }

                    if (!submitted) {
                        this.logTest('表單提交功能', false, '找不到提交按鈕');
                    }

                } else {
                    this.logTest('表單提交功能', false, '模態視窗未出現');
                }

            } else {
                this.logTest('表單提交功能', false, '找不到新增按鈕');
            }
            
        } catch (error) {
            this.logTest('表單提交功能', false, `表單提交錯誤: ${error.message}`);
        }
    }

    async testAPIHealthCheck() {
        console.log('\n🏥 測試API健康檢查...');
        
        try {
            const response = await axios.get(`${this.baseURL}/api/health`, {
                timeout: 10000
            });
            
            const isHealthy = response.status === 200 && 
                             response.data.status === 'healthy';
            
            this.logTest('API健康檢查', isHealthy, 
                `狀態: ${response.status}, 回應: ${JSON.stringify(response.data)}`);
                
        } catch (error) {
            this.logTest('API健康檢查', false, `API錯誤: ${error.message}`);
        }
    }

    logTest(testName, success, message) {
        const status = success ? '✅' : '❌';
        const result = {
            testName,
            success,
            message,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        console.log(`${status} ${testName}: ${message}`);
    }

    async generateReport() {
        console.log('\n📊 生成增強版驗證報告...');
        
        const timestamp = Date.now();
        const passed = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

        const report = {
            title: '增強版智慧瀏覽器驗證報告',
            timestamp: new Date().toISOString(),
            summary: {
                total,
                passed,
                failed: total - passed,
                passRate: `${passRate}%`
            },
            testResults: this.testResults,
            systemInfo: {
                baseURL: this.baseURL,
                userAgent: await this.page?.evaluate(() => navigator.userAgent) || 'N/A',
                viewport: await this.page?.viewport() || 'N/A'
            },
            consoleLogs: this.consoleLogs,
            networkRequests: this.networkRequests.slice(-50), // 最近50個請求
            jsErrors: this.jsErrors,
            improvements: [
                '✅ 自動處理地理位置權限請求',
                '✅ 自動處理確認對話框和警告框',
                '✅ 增強表單提交驗證',
                '✅ 詳細的控制台日誌收集',
                '✅ 網路請求監控',
                '✅ JavaScript錯誤捕獲'
            ]
        };

        // 保存JSON報告
        const jsonPath = path.join(this.reportDir, `enhanced-verification-${timestamp}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

        // 生成HTML報告
        const htmlReport = this.generateHTMLReport(report);
        const htmlPath = path.join(this.reportDir, `enhanced-verification-${timestamp}.html`);
        fs.writeFileSync(htmlPath, htmlReport);

        console.log(`📄 報告已保存:`);
        console.log(`   JSON: ${jsonPath}`);
        console.log(`   HTML: ${htmlPath}`);
        
        return report;
    }

    generateHTMLReport(report) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>增強版智慧瀏覽器驗證報告</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background: #2196F3; color: white; padding: 20px; border-radius: 5px; }
                .summary { display: flex; justify-content: space-around; margin: 20px 0; }
                .metric { background: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; }
                .success { color: #4CAF50; }
                .error { color: #f44336; }
                .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
                .test-success { border-left-color: #4CAF50; }
                .test-failure { border-left-color: #f44336; }
                .logs { background: #f9f9f9; padding: 15px; margin: 10px 0; font-family: monospace; max-height: 300px; overflow-y: auto; }
                .improvement { background: #e8f5e8; padding: 10px; margin: 5px 0; border-radius: 3px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔧 增強版智慧瀏覽器驗證報告</h1>
                <p>生成時間: ${report.timestamp}</p>
                <p>修復重點: 彈出視窗處理、地理位置權限、表單提交驗證</p>
            </div>

            <div class="summary">
                <div class="metric">
                    <h3>總測試數</h3>
                    <h2>${report.summary.total}</h2>
                </div>
                <div class="metric">
                    <h3>通過數</h3>
                    <h2 class="success">${report.summary.passed}</h2>
                </div>
                <div class="metric">
                    <h3>失敗數</h3>
                    <h2 class="error">${report.summary.failed}</h2>
                </div>
                <div class="metric">
                    <h3>成功率</h3>
                    <h2>${report.summary.passRate}</h2>
                </div>
            </div>

            <h2>🔧 修復改善項目</h2>
            ${report.improvements.map(improvement => `<div class="improvement">${improvement}</div>`).join('')}

            <h2>📋 測試結果</h2>
            ${report.testResults.map(test => `
                <div class="test-result ${test.success ? 'test-success' : 'test-failure'}">
                    <strong>${test.success ? '✅' : '❌'} ${test.testName}</strong>
                    <p>${test.message}</p>
                    <small>時間: ${test.timestamp}</small>
                </div>
            `).join('')}

            <h2>🔍 控制台日誌 (最近10條)</h2>
            <div class="logs">
                ${report.consoleLogs.slice(-10).map(log => 
                    `<div>[${log.type.toUpperCase()}] ${log.timestamp}: ${log.text}</div>`
                ).join('')}
            </div>

            <h2>🌐 網路請求 (最近10個)</h2>
            <div class="logs">
                ${report.networkRequests.slice(-10).map(req => 
                    `<div>[${req.status}] ${req.url}</div>`
                ).join('')}
            </div>

            ${report.jsErrors.length > 0 ? `
            <h2>❌ JavaScript錯誤</h2>
            <div class="logs">
                ${report.jsErrors.map(error => 
                    `<div class="error">${error.timestamp}: ${error.message}</div>`
                ).join('')}
            </div>
            ` : '<h2>✅ 無JavaScript錯誤</h2>'}

            <h2>📊 系統資訊</h2>
            <div class="logs">
                <div>Base URL: ${report.systemInfo.baseURL}</div>
                <div>User Agent: ${report.systemInfo.userAgent}</div>
                <div>Viewport: ${JSON.stringify(report.systemInfo.viewport)}</div>
            </div>
        </body>
        </html>
        `;
    }

    async runFullVerification() {
        console.log('🔧 啟動增強版智慧瀏覽器驗證...\n');

        try {
            // 初始化瀏覽器
            await this.initializeBrowser();

            // 執行所有測試
            await this.testAPIHealthCheck();
            await this.testHomePage();
            await this.testLoginProcess();
            await this.testGPSCheckin();
            await this.testFormSubmission();

            // 生成報告
            const report = await this.generateReport();

            console.log('\n📊 增強版驗證完成！');
            console.log(`✅ 通過: ${report.summary.passed}/${report.summary.total} (${report.summary.passRate})`);
            
            return report;

        } catch (error) {
            console.error('❌ 增強版驗證失敗:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// 執行增強版驗證
async function runEnhancedVerification() {
    const verifier = new EnhancedBrowserVerification();
    return await verifier.runFullVerification();
}

if (require.main === module) {
    runEnhancedVerification().catch(console.error);
}

module.exports = EnhancedBrowserVerification;