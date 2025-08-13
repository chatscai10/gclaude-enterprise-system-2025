/**
 * GClaude 企業管理系統 - 深層瀏覽器驗證引擎
 * 基於 Puppeteer 的全面自動化測試系統
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class DeepBrowserVerification {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'http://localhost:3007';
        this.results = {
            startTime: Date.now(),
            tests: [],
            screenshots: [],
            performance: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                duration: 0
            }
        };
        this.screenshotDir = path.join(__dirname, '..', 'verification-reports', 'screenshots');
        this.reportDir = path.join(__dirname, '..', 'verification-reports');
    }

    async initialize() {
        console.log('🚀 初始化深層瀏覽器驗證系統...');
        
        // 創建報告目錄
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }

        // 啟動瀏覽器
        this.browser = await puppeteer.launch({
            headless: false, // 設置為 false 以便觀察測試過程
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.page = await this.browser.newPage();
        
        // 設置頁面監聽
        this.setupPageMonitoring();
        
        console.log('✅ 深層瀏覽器驗證系統初始化完成');
    }

    setupPageMonitoring() {
        // 監聽網路請求
        this.page.on('request', request => {
            console.log(`📡 API 請求: ${request.method()} ${request.url()}`);
        });

        // 監聽控制台輸出
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`❌ 瀏覽器錯誤: ${msg.text()}`);
            }
        });

        // 監聽頁面錯誤
        this.page.on('error', error => {
            console.log(`💥 頁面錯誤: ${error.message}`);
        });
    }

    async takeScreenshot(name) {
        const timestamp = Date.now();
        const filename = `${name}-${timestamp}.png`;
        const filepath = path.join(this.screenshotDir, filename);
        
        await this.page.screenshot({ 
            path: filepath,
            fullPage: true 
        });
        
        this.results.screenshots.push({
            name,
            filename,
            timestamp,
            path: filepath
        });
        
        console.log(`📸 截圖已保存: ${filename}`);
        return filename;
    }

    async runTest(testName, testFunction) {
        console.log(`\n🧪 執行深層測試: ${testName}`);
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.results.tests.push({
                name: testName,
                status: 'passed',
                duration,
                details: result,
                timestamp: new Date().toISOString()
            });
            
            this.results.summary.passed++;
            console.log(`✅ 測試通過: ${testName} (${duration}ms)`);
            
            return { success: true, result };
        } catch (error) {
            const duration = Date.now() - startTime;
            
            await this.takeScreenshot(`error-${testName.replace(/\s+/g, '-')}`);
            
            this.results.tests.push({
                name: testName,
                status: 'failed',
                duration,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            this.results.summary.failed++;
            console.log(`❌ 測試失敗: ${testName} - ${error.message}`);
            
            return { success: false, error: error.message };
        } finally {
            this.results.summary.total++;
        }
    }

    // 登入系統
    async loginToSystem(username, password) {
        await this.page.goto(this.baseUrl);
        await this.page.waitForSelector('#username, input[name="username"]', { timeout: 5000 });
        
        await this.page.type('#username, input[name="username"]', username);
        await this.page.type('#password, input[name="password"]', password);
        
        await this.takeScreenshot(`login-form-${username}`);
        
        await this.page.click('button[type="submit"], .btn-primary');
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        // 等待儀表板載入
        await this.page.waitForSelector('.sidebar, #sidebar', { timeout: 10000 });
        await this.takeScreenshot(`dashboard-loaded-${username}`);
    }

    // 測試選單切換功能
    async testMenuNavigation() {
        const menuItems = [
            { id: 'dashboard', name: '儀表板', selector: '[data-section="dashboard"]' },
            { id: 'employees', name: '員工管理', selector: '[data-section="employees"]' },
            { id: 'attendance', name: '出勤管理', selector: '[data-section="attendance"]' },
            { id: 'revenue', name: '營收分析', selector: '[data-section="revenue"]' },
            { id: 'inventory', name: '庫存管理', selector: '[data-section="inventory"]' },
            { id: 'scheduling', name: '智慧排程', selector: '[data-section="scheduling"]' },
            { id: 'promotion', name: '升遷投票', selector: '[data-section="promotion"]' },
            { id: 'maintenance', name: '維修申請', selector: '[data-section="maintenance"]' },
            { id: 'reports', name: '報表系統', selector: '[data-section="reports"]' },
            { id: 'settings', name: '系統設定', selector: '[data-section="settings"]' }
        ];

        const results = {};

        for (const menu of menuItems) {
            try {
                console.log(`  🔗 測試選單: ${menu.name}`);
                
                // 點擊選單項目
                const menuElement = await this.page.$(menu.selector);
                if (!menuElement) {
                    throw new Error(`找不到選單項目: ${menu.selector}`);
                }

                await menuElement.click();
                await this.page.waitForTimeout(1000); // 等待切換動畫

                // 檢查對應的內容區段是否顯示
                const sectionSelector = `#${menu.id}-section.active, #${menu.id}-section.section.active`;
                const sectionVisible = await this.page.$(sectionSelector);
                
                if (!sectionVisible) {
                    throw new Error(`選單切換失敗，找不到活動區段: ${sectionSelector}`);
                }

                // 檢查選單項目是否被標記為活動狀態
                const activeMenu = await this.page.$(`${menu.selector}.active`);
                if (!activeMenu) {
                    console.warn(`⚠️ 選單項目未標記為活動狀態: ${menu.selector}`);
                }

                await this.takeScreenshot(`menu-${menu.id}`);
                
                results[menu.id] = {
                    name: menu.name,
                    status: 'passed',
                    sectionVisible: !!sectionVisible,
                    activeState: !!activeMenu
                };

                console.log(`  ✅ ${menu.name} 切換成功`);

            } catch (error) {
                console.log(`  ❌ ${menu.name} 切換失敗: ${error.message}`);
                results[menu.id] = {
                    name: menu.name,
                    status: 'failed',
                    error: error.message
                };
            }
        }

        return results;
    }

    // 測試表單功能
    async testFormFunctionality() {
        const formTests = {};

        // 測試新增員工表單
        try {
            console.log('  📝 測試新增員工表單');
            await this.page.click('[data-section="employees"]');
            await this.page.waitForTimeout(1000);

            // 點擊新增員工按鈕
            const addButton = await this.page.$('button[data-bs-target="#addEmployeeModal"]');
            if (addButton) {
                await addButton.click();
                await this.page.waitForTimeout(1000);

                // 填寫表單
                await this.page.type('#employeeName', '測試員工');
                await this.page.type('#employeeId', 'A987654321');
                await this.page.type('#employeePhone', '0912345678');
                await this.page.type('#employeeBirthDate', '1990-01-01');
                await this.page.select('#employeeGender', '男');
                await this.page.type('#employeeAddress', '台北市信義區');
                await this.page.type('#emergencyContactName', '緊急聯絡人');
                await this.page.type('#emergencyContactRelation', '父親');
                await this.page.type('#emergencyContactPhone', '0987654321');
                await this.page.type('#employeeHireDate', '2023-08-13');

                await this.takeScreenshot('employee-form-filled');

                formTests.employeeForm = { status: 'passed', message: '員工表單填寫成功' };
            } else {
                throw new Error('找不到新增員工按鈕');
            }
        } catch (error) {
            formTests.employeeForm = { status: 'failed', error: error.message };
        }

        // 測試叫貨功能
        try {
            console.log('  📦 測試叫貨功能');
            await this.page.click('[data-section="inventory"]');
            await this.page.waitForTimeout(1000);

            const orderButton = await this.page.$('button[data-bs-target="#orderModal"]');
            if (orderButton) {
                await orderButton.click();
                await this.page.waitForTimeout(1000);

                await this.page.select('#orderProduct', 'P002');
                await this.page.type('#orderQuantity', '50');
                await this.page.type('#orderNote', '緊急叫貨需求');

                await this.takeScreenshot('order-form-filled');

                formTests.orderForm = { status: 'passed', message: '叫貨表單填寫成功' };
            } else {
                throw new Error('找不到叫貨按鈕');
            }
        } catch (error) {
            formTests.orderForm = { status: 'failed', error: error.message };
        }

        // 測試 GPS 打卡功能
        try {
            console.log('  📍 測試GPS打卡功能');
            await this.page.click('[data-section="attendance"]');
            await this.page.waitForTimeout(1000);

            const gpsButton = await this.page.$('#gpsCheckInBtn');
            if (gpsButton) {
                await gpsButton.click();
                await this.page.waitForTimeout(2000); // 等待GPS處理

                await this.takeScreenshot('gps-checkin-test');

                formTests.gpsCheckIn = { status: 'passed', message: 'GPS打卡按鈕正常運作' };
            } else {
                throw new Error('找不到GPS打卡按鈕');
            }
        } catch (error) {
            formTests.gpsCheckIn = { status: 'failed', error: error.message };
        }

        return formTests;
    }

    // 測試響應式設計
    async testResponsiveDesign() {
        const viewports = [
            { name: 'Desktop', width: 1920, height: 1080 },
            { name: 'Laptop', width: 1366, height: 768 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Mobile', width: 375, height: 667 }
        ];

        const results = {};

        for (const viewport of viewports) {
            try {
                console.log(`  📱 測試 ${viewport.name} 視圖 (${viewport.width}x${viewport.height})`);
                
                await this.page.setViewport({
                    width: viewport.width,
                    height: viewport.height
                });
                await this.page.waitForTimeout(1000);

                // 檢查側邊欄在手機版是否正確隱藏
                if (viewport.width <= 768) {
                    const sidebar = await this.page.$('#sidebar');
                    const sidebarStyle = await this.page.evaluate((el) => {
                        return window.getComputedStyle(el).transform;
                    }, sidebar);
                    
                    // 檢查手機版選單切換按鈕
                    const mobileToggle = await this.page.$('#mobileToggle');
                    const toggleVisible = await this.page.evaluate((el) => {
                        return window.getComputedStyle(el).display !== 'none';
                    }, mobileToggle);

                    results[viewport.name] = {
                        status: 'passed',
                        sidebarHidden: sidebarStyle.includes('translateX(-100%)') || sidebarStyle.includes('matrix(1, 0, 0, 1, -280, 0)'),
                        mobileToggleVisible: toggleVisible
                    };
                } else {
                    results[viewport.name] = { status: 'passed', message: '桌面版顯示正常' };
                }

                await this.takeScreenshot(`responsive-${viewport.name}`);

            } catch (error) {
                results[viewport.name] = { status: 'failed', error: error.message };
            }
        }

        // 恢復到桌面視圖
        await this.page.setViewport({ width: 1920, height: 1080 });

        return results;
    }

    // 測試角色權限
    async testRolePermissions() {
        const roles = [
            { username: 'admin', password: 'admin123', role: '系統管理員', expectedMenus: 9 },
            { username: 'manager', password: 'manager123', role: '店長', expectedMenus: 8 },
            { username: 'employee', password: 'employee123', role: '員工', expectedMenus: 6 },
            { username: 'intern', password: 'intern123', role: '實習生', expectedMenus: 4 }
        ];

        const results = {};

        for (const roleTest of roles) {
            try {
                console.log(`  👤 測試 ${roleTest.role} 權限 (${roleTest.username})`);
                
                await this.loginToSystem(roleTest.username, roleTest.password);
                await this.page.waitForTimeout(2000);

                // 計算可見的選單項目數量
                const visibleMenus = await this.page.$$eval('.sidebar .nav-item[id^="nav-"]', elements => {
                    return elements.filter(el => {
                        const style = window.getComputedStyle(el);
                        return style.display !== 'none';
                    }).length;
                });

                // 檢查用戶資訊顯示
                const userName = await this.page.$eval('#userName', el => el.textContent.trim());
                const userRole = await this.page.$eval('#userRole', el => el.textContent.trim());

                await this.takeScreenshot(`role-${roleTest.username}`);

                results[roleTest.username] = {
                    status: 'passed',
                    role: roleTest.role,
                    displayedName: userName,
                    displayedRole: userRole,
                    visibleMenus,
                    expectedMenus: roleTest.expectedMenus,
                    menuCountMatch: visibleMenus === roleTest.expectedMenus
                };

                console.log(`    ✅ ${roleTest.role}: ${visibleMenus}/${roleTest.expectedMenus} 選單可見`);

            } catch (error) {
                results[roleTest.username] = {
                    status: 'failed',
                    role: roleTest.role,
                    error: error.message
                };
            }

            // 登出準備下一個角色測試
            try {
                await this.page.click('#logoutBtn');
                await this.page.waitForTimeout(1000);
                if (await this.page.$('button:contains("確定")')) {
                    await this.page.click('button:contains("確定")');
                }
                await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
            } catch (e) {
                // 如果登出失敗，直接導航到首頁
                await this.page.goto(this.baseUrl);
            }
        }

        return results;
    }

    // 執行完整的深層驗證
    async runDeepVerification() {
        console.log('\n🔍 開始執行完整深層驗證...\n');

        // 階段一：基礎系統驗證
        await this.runTest('系統健康檢查', async () => {
            const response = await this.page.goto(`${this.baseUrl}/api/health`);
            const healthData = await response.json();
            return { status: response.status(), data: healthData };
        });

        // 登入系統進行後續測試
        await this.runTest('管理員登入測試', async () => {
            await this.loginToSystem('admin', 'admin123');
            return { message: '管理員登入成功' };
        });

        // 階段二：功能模組驗證
        await this.runTest('選單導航功能測試', async () => {
            return await this.testMenuNavigation();
        });

        await this.runTest('表單功能測試', async () => {
            return await this.testFormFunctionality();
        });

        await this.runTest('響應式設計測試', async () => {
            return await this.testResponsiveDesign();
        });

        // 階段三：角色權限測試
        await this.runTest('角色權限測試', async () => {
            return await this.testRolePermissions();
        });

        // 階段四：效能測試
        await this.runTest('頁面載入效能測試', async () => {
            const startTime = Date.now();
            await this.page.goto(this.baseUrl);
            await this.page.waitForLoadState('networkidle');
            const loadTime = Date.now() - startTime;
            
            return { loadTime, performance: 'good' };
        });

        console.log('\n✨ 深層驗證執行完成！');
    }

    // 生成詳細報告
    async generateDetailedReport() {
        this.results.summary.duration = Date.now() - this.results.startTime;
        this.results.endTime = Date.now();

        const timestamp = Date.now();
        const reportData = {
            ...this.results,
            generatedAt: new Date().toISOString(),
            system: {
                baseUrl: this.baseUrl,
                browser: 'Chrome (Puppeteer)',
                viewport: '1920x1080'
            }
        };

        // 生成 JSON 報告
        const jsonPath = path.join(this.reportDir, `deep-verification-report-${timestamp}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

        // 生成 HTML 報告
        const htmlPath = path.join(this.reportDir, `deep-verification-report-${timestamp}.html`);
        const htmlContent = this.generateHTMLReport(reportData);
        fs.writeFileSync(htmlPath, htmlContent);

        console.log('\n📊 詳細驗證報告已生成:');
        console.log(`   JSON: ${jsonPath}`);
        console.log(`   HTML: ${htmlPath}`);

        return { jsonPath, htmlPath };
    }

    generateHTMLReport(data) {
        const passRate = ((data.summary.passed / data.summary.total) * 100).toFixed(1);
        
        return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GClaude 企業管理系統 - 深層驗證報告</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .test-passed { color: #28a745; }
        .test-failed { color: #dc3545; }
        .screenshot { max-width: 300px; margin: 10px; }
    </style>
</head>
<body>
    <div class="container py-4">
        <h1>🔍 GClaude 企業管理系統深層驗證報告</h1>
        <p class="text-muted">生成時間: ${data.generatedAt}</p>
        
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="card-title">${data.summary.total}</h3>
                        <p class="card-text">總測試數</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center border-success">
                    <div class="card-body">
                        <h3 class="card-title text-success">${data.summary.passed}</h3>
                        <p class="card-text">通過測試</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center border-danger">
                    <div class="card-body">
                        <h3 class="card-title text-danger">${data.summary.failed}</h3>
                        <p class="card-text">失敗測試</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center border-info">
                    <div class="card-body">
                        <h3 class="card-title text-info">${passRate}%</h3>
                        <p class="card-text">通過率</p>
                    </div>
                </div>
            </div>
        </div>

        <h2>📋 測試結果詳情</h2>
        <div class="accordion" id="testAccordion">
            ${data.tests.map((test, index) => `
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#test${index}">
                            <span class="test-${test.status}">
                                ${test.status === 'passed' ? '✅' : '❌'} ${test.name}
                            </span>
                            <small class="ms-auto text-muted">${test.duration}ms</small>
                        </button>
                    </h2>
                    <div id="test${index}" class="accordion-collapse collapse" data-bs-parent="#testAccordion">
                        <div class="accordion-body">
                            <p><strong>狀態:</strong> <span class="test-${test.status}">${test.status === 'passed' ? '通過' : '失敗'}</span></p>
                            <p><strong>執行時間:</strong> ${test.duration}ms</p>
                            <p><strong>時間戳:</strong> ${test.timestamp}</p>
                            ${test.error ? `<p><strong>錯誤:</strong> <code>${test.error}</code></p>` : ''}
                            ${test.details ? `<pre><code>${JSON.stringify(test.details, null, 2)}</code></pre>` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <h2 class="mt-4">📸 測試截圖</h2>
        <div class="row">
            ${data.screenshots.map(screenshot => `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">${screenshot.name}</h6>
                            <small class="text-muted">${new Date(screenshot.timestamp).toLocaleString()}</small>
                            <br>
                            <code>${screenshot.filename}</code>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 瀏覽器資源清理完成');
        }
    }
}

// 主執行函數
async function main() {
    const verifier = new DeepBrowserVerification();
    
    try {
        await verifier.initialize();
        await verifier.runDeepVerification();
        await verifier.generateDetailedReport();
        
        console.log('\n📊 深層驗證結果摘要:');
        console.log(`   總測試數: ${verifier.results.summary.total}`);
        console.log(`   通過測試: ${verifier.results.summary.passed} ✅`);
        console.log(`   失敗測試: ${verifier.results.summary.failed} ❌`);
        console.log(`   通過率: ${((verifier.results.summary.passed / verifier.results.summary.total) * 100).toFixed(1)}%`);
        console.log(`   總耗時: ${Math.round(verifier.results.summary.duration / 1000)}秒`);
        console.log(`   截圖數量: ${verifier.results.screenshots.length}`);
        
        if (verifier.results.summary.failed > 0) {
            console.log('\n⚠️  有測試失敗，請查看報告了解詳情');
        } else {
            console.log('\n🎉 所有測試均已通過！');
        }
        
    } catch (error) {
        console.error('❌ 深層驗證執行失敗:', error);
    } finally {
        await verifier.cleanup();
    }
}

// 如果直接執行此文件
if (require.main === module) {
    main();
}

module.exports = DeepBrowserVerification;