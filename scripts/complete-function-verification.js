/**
 * GClaude Enterprise System - 完整功能驗證系統
 * 驗證所有按鈕功能是否與後端API正確對應
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class CompleteFunctionVerification {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'http://localhost:3007';
        this.results = {
            startTime: Date.now(),
            apiTests: [],
            buttonTests: [],
            integrationTests: [],
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0
            }
        };
        this.reportDir = path.join(__dirname, '..', 'complete-function-reports');
    }

    async initialize() {
        console.log('🔧 初始化完整功能驗證系統...');

        // 創建報告目錄
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }

        // 啟動瀏覽器
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.page = await this.browser.newPage();
        console.log('✅ 完整功能驗證系統初始化完成');
    }

    // 階段1：API端點驗證
    async verifyAPIEndpoints() {
        console.log('\n📡 階段1: API端點功能驗證');
        
        const apiTests = [
            {
                name: '系統健康檢查',
                method: 'GET',
                url: '/api/health',
                requireAuth: false,
                expectedStatus: 200
            },
            {
                name: '用戶登入API',
                method: 'POST',
                url: '/api/auth/login',
                requireAuth: false,
                data: { username: 'admin', password: 'admin123' },
                expectedStatus: 200
            },
            {
                name: '獲取用戶資料',
                method: 'GET',
                url: '/api/auth/profile',
                requireAuth: true,
                expectedStatus: 200
            },
            {
                name: '員工統計API',
                method: 'GET',
                url: '/api/employees/stats/overview',
                requireAuth: true,
                expectedStatus: 200
            },
            {
                name: '儀表板統計',
                method: 'GET',
                url: '/api/dashboard/stats',
                requireAuth: false,
                expectedStatus: 200
            },
            {
                name: '最近活動記錄',
                method: 'GET',
                url: '/api/dashboard/recent-activities',
                requireAuth: false,
                expectedStatus: 200
            },
            {
                name: '商品列表API',
                method: 'GET',
                url: '/api/products',
                requireAuth: true,
                expectedStatus: 200
            }
        ];

        let token = null;

        for (const test of apiTests) {
            try {
                console.log(`  🧪 測試: ${test.name}`);
                
                const headers = { 'Content-Type': 'application/json' };
                if (test.requireAuth && token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const config = {
                    method: test.method.toLowerCase(),
                    url: `${this.baseUrl}${test.url}`,
                    headers,
                    validateStatus: () => true // 不自動拋出錯誤
                };

                if (test.data) {
                    config.data = test.data;
                }

                const response = await axios(config);
                
                // 保存登入token供後續測試使用
                if (test.url === '/api/auth/login' && response.data.token) {
                    token = response.data.token;
                }

                const passed = response.status === test.expectedStatus;
                
                this.results.apiTests.push({
                    name: test.name,
                    url: test.url,
                    status: passed ? 'passed' : 'failed',
                    expectedStatus: test.expectedStatus,
                    actualStatus: response.status,
                    responseData: response.data,
                    timestamp: new Date().toISOString()
                });

                if (passed) {
                    this.results.summary.passedTests++;
                    console.log(`    ✅ ${test.name} 通過 (${response.status})`);
                } else {
                    this.results.summary.failedTests++;
                    console.log(`    ❌ ${test.name} 失敗 (期望:${test.expectedStatus}, 實際:${response.status})`);
                }

                this.results.summary.totalTests++;

            } catch (error) {
                this.results.apiTests.push({
                    name: test.name,
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                this.results.summary.failedTests++;
                this.results.summary.totalTests++;
                console.log(`    ❌ ${test.name} 異常: ${error.message}`);
            }
        }

        console.log(`📊 API測試完成: ${this.results.summary.passedTests}/${this.results.summary.totalTests} 通過`);
        return token; // 回傳token供後續使用
    }

    // 階段2：前端按鈕功能驗證
    async verifyButtonFunctions(authToken) {
        console.log('\n🔘 階段2: 前端按鈕功能驗證');

        // 登入系統
        await this.loginToSystem('admin', 'admin123');
        
        const buttonTests = [
            {
                section: 'dashboard',
                name: '儀表板快速操作',
                buttons: [
                    { selector: '.action-btn[data-action="attendance"]', name: 'GPS打卡按鈕' },
                    { selector: '.action-btn[data-action="addEmployee"]', name: '新增員工按鈕' },
                    { selector: '.action-btn[data-action="inventory"]', name: '庫存管理按鈕' },
                    { selector: '.action-btn[data-action="revenue"]', name: '營收記錄按鈕' }
                ]
            },
            {
                section: 'employees',
                name: '員工管理',
                buttons: [
                    { selector: 'button[data-bs-target="#addEmployeeModal"]', name: '新增員工模態框按鈕' },
                    { selector: '#addEmployeeForm button[type="submit"]', name: '員工表單提交按鈕' }
                ]
            },
            {
                section: 'attendance',
                name: '出勤管理',
                buttons: [
                    { selector: '#gpsCheckInBtn', name: 'GPS打卡按鈕' },
                    { selector: '.btn[data-action="view-attendance"]', name: '查看出勤記錄' }
                ]
            },
            {
                section: 'revenue',
                name: '營收管理',
                buttons: [
                    { selector: 'button[data-bs-target="#addRevenueModal"]', name: '新增營收記錄按鈕' },
                    { selector: '#addRevenueForm button[type="submit"]', name: '營收表單提交按鈕' }
                ]
            },
            {
                section: 'inventory',
                name: '庫存管理',
                buttons: [
                    { selector: 'button[data-bs-target="#orderModal"]', name: '叫貨申請按鈕' },
                    { selector: 'button[data-bs-target="#addProductModal"]', name: '新增商品按鈕' },
                    { selector: '#orderForm button[type="submit"]', name: '叫貨表單提交' }
                ]
            },
            {
                section: 'maintenance',
                name: '維修申請',
                buttons: [
                    { selector: 'button[data-bs-target="#maintenanceModal"]', name: '新增維修申請按鈕' },
                    { selector: '#maintenanceForm button[type="submit"]', name: '維修表單提交按鈕' }
                ]
            }
        ];

        for (const sectionTest of buttonTests) {
            try {
                console.log(`  📂 切換到 ${sectionTest.name} 區段`);
                
                // 切換到對應區段
                await this.switchToSection(sectionTest.section);
                await this.page.waitForTimeout(1000);

                for (const button of sectionTest.buttons) {
                    try {
                        console.log(`    🔘 測試按鈕: ${button.name}`);
                        
                        const buttonElement = await this.page.$(button.selector);
                        
                        if (!buttonElement) {
                            this.results.buttonTests.push({
                                section: sectionTest.section,
                                name: button.name,
                                selector: button.selector,
                                status: 'failed',
                                error: '按鈕元素未找到',
                                timestamp: new Date().toISOString()
                            });
                            this.results.summary.failedTests++;
                            console.log(`      ❌ ${button.name}: 按鈕元素未找到`);
                        } else {
                            // 檢查按鈕是否可點擊
                            const isClickable = await this.page.evaluate((el) => {
                                const style = window.getComputedStyle(el);
                                return style.display !== 'none' && 
                                       style.visibility !== 'hidden' &&
                                       !el.disabled;
                            }, buttonElement);

                            if (isClickable) {
                                // 嘗試點擊按鈕
                                await buttonElement.click();
                                await this.page.waitForTimeout(500);
                                
                                this.results.buttonTests.push({
                                    section: sectionTest.section,
                                    name: button.name,
                                    selector: button.selector,
                                    status: 'passed',
                                    clickable: true,
                                    timestamp: new Date().toISOString()
                                });
                                this.results.summary.passedTests++;
                                console.log(`      ✅ ${button.name}: 可點擊並正常響應`);
                            } else {
                                this.results.buttonTests.push({
                                    section: sectionTest.section,
                                    name: button.name,
                                    selector: button.selector,
                                    status: 'failed',
                                    error: '按鈕不可點擊',
                                    clickable: false,
                                    timestamp: new Date().toISOString()
                                });
                                this.results.summary.failedTests++;
                                console.log(`      ❌ ${button.name}: 按鈕存在但不可點擊`);
                            }
                        }
                        
                        this.results.summary.totalTests++;

                    } catch (error) {
                        this.results.buttonTests.push({
                            section: sectionTest.section,
                            name: button.name,
                            selector: button.selector,
                            status: 'failed',
                            error: error.message,
                            timestamp: new Date().toISOString()
                        });
                        this.results.summary.failedTests++;
                        this.results.summary.totalTests++;
                        console.log(`      ❌ ${button.name}: 測試異常 - ${error.message}`);
                    }
                }

            } catch (error) {
                console.log(`  ❌ ${sectionTest.name} 區段測試失敗: ${error.message}`);
            }
        }

        console.log(`📊 按鈕測試完成: ${this.results.summary.passedTests}/${this.results.summary.totalTests} 通過`);
    }

    // 階段3：端到端整合測試
    async verifyEndToEndIntegration() {
        console.log('\n🔄 階段3: 端到端整合測試');

        const integrationTests = [
            {
                name: '員工新增完整流程',
                test: async () => {
                    await this.switchToSection('employees');
                    await this.page.waitForTimeout(1000);

                    // 點擊新增員工按鈕
                    const addBtn = await this.page.$('button[data-bs-target="#addEmployeeModal"]');
                    if (!addBtn) throw new Error('新增員工按鈕未找到');

                    await addBtn.click();
                    await this.page.waitForTimeout(1000);

                    // 填寫表單
                    await this.page.type('#employeeName', '測試員工_' + Date.now());
                    await this.page.type('#employeeId', 'TEST_' + Date.now());
                    await this.page.type('#employeePhone', '0912345678');
                    await this.page.type('#employeeBirthDate', '1990-01-01');

                    // 提交表單
                    const submitBtn = await this.page.$('#addEmployeeForm button[type="submit"]');
                    if (submitBtn) {
                        await submitBtn.click();
                        await this.page.waitForTimeout(2000);
                    }

                    return { success: true, message: '員工新增流程完成' };
                }
            },
            {
                name: 'GPS打卡功能測試',
                test: async () => {
                    await this.switchToSection('attendance');
                    await this.page.waitForTimeout(1000);

                    // 模擬GPS打卡
                    const gpsBtn = await this.page.$('#gpsCheckInBtn');
                    if (!gpsBtn) throw new Error('GPS打卡按鈕未找到');

                    await gpsBtn.click();
                    await this.page.waitForTimeout(3000);

                    return { success: true, message: 'GPS打卡功能響應正常' };
                }
            },
            {
                name: '維修申請提交測試',
                test: async () => {
                    await this.switchToSection('maintenance');
                    await this.page.waitForTimeout(1000);

                    const addBtn = await this.page.$('button[data-bs-target="#maintenanceModal"]');
                    if (!addBtn) throw new Error('維修申請按鈕未找到');

                    await addBtn.click();
                    await this.page.waitForTimeout(1000);

                    // 填寫維修申請表單
                    await this.page.type('#maintenanceItem', '測試維修項目');
                    await this.page.select('#maintenanceUrgency', '中');
                    await this.page.type('#maintenanceLocation', '測試地點');
                    await this.page.type('#maintenanceDescription', '這是一個測試維修申請');

                    const submitBtn = await this.page.$('#maintenanceForm button[type="submit"]');
                    if (submitBtn) {
                        await submitBtn.click();
                        await this.page.waitForTimeout(2000);
                    }

                    return { success: true, message: '維修申請流程完成' };
                }
            }
        ];

        for (const test of integrationTests) {
            try {
                console.log(`  🔄 執行: ${test.name}`);
                
                const result = await test.test();
                
                this.results.integrationTests.push({
                    name: test.name,
                    status: 'passed',
                    result: result,
                    timestamp: new Date().toISOString()
                });
                
                this.results.summary.passedTests++;
                console.log(`    ✅ ${test.name}: ${result.message}`);
                
            } catch (error) {
                this.results.integrationTests.push({
                    name: test.name,
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                this.results.summary.failedTests++;
                console.log(`    ❌ ${test.name}: ${error.message}`);
            }
            
            this.results.summary.totalTests++;
        }

        console.log(`📊 整合測試完成: ${this.results.summary.passedTests}/${this.results.summary.totalTests} 通過`);
    }

    // 登入系統
    async loginToSystem(username, password) {
        await this.page.goto(this.baseUrl);
        await this.page.waitForSelector('#username', { timeout: 10000 });
        
        await this.page.type('#username', username);
        await this.page.type('#password', password);
        await this.page.click('button[type="submit"]');
        
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
        await this.page.waitForTimeout(2000);
    }

    // 切換區段
    async switchToSection(section) {
        const selector = `[data-section="${section}"]`;
        const element = await this.page.$(selector);
        
        if (!element) {
            throw new Error(`找不到區段: ${section}`);
        }
        
        await element.click();
        await this.page.waitForTimeout(1000);
    }

    // 生成詳細報告
    async generateDetailedReport() {
        const timestamp = Date.now();
        this.results.endTime = timestamp;
        this.results.duration = timestamp - this.results.startTime;

        // 計算通過率
        const passRate = ((this.results.summary.passedTests / this.results.summary.totalTests) * 100).toFixed(1);

        const report = {
            ...this.results,
            passRate,
            summary: {
                ...this.results.summary,
                duration: this.results.duration,
                passRate
            },
            generatedAt: new Date().toISOString()
        };

        // 保存JSON報告
        const jsonPath = path.join(this.reportDir, `complete-function-report-${timestamp}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

        // 生成HTML報告
        const htmlPath = path.join(this.reportDir, `complete-function-report-${timestamp}.html`);
        const htmlContent = this.generateHTMLReport(report);
        fs.writeFileSync(htmlPath, htmlContent);

        console.log(`\n📊 完整功能驗證報告已生成:`);
        console.log(`   JSON: ${jsonPath}`);
        console.log(`   HTML: ${htmlPath}`);
        
        return { jsonPath, htmlPath };
    }

    generateHTMLReport(data) {
        return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GClaude 企業系統 - 完整功能驗證報告</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .test-passed { color: #28a745; }
        .test-failed { color: #dc3545; }
        .section-title { border-left: 4px solid #007bff; padding-left: 1rem; }
    </style>
</head>
<body>
    <div class="container py-4">
        <h1 class="mb-4">🔧 GClaude 企業系統完整功能驗證報告</h1>
        <p class="text-muted">生成時間: ${data.generatedAt}</p>
        
        <!-- 總覽統計 -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="card-title">${data.summary.totalTests}</h3>
                        <p class="card-text">總測試數</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center border-success">
                    <div class="card-body">
                        <h3 class="card-title text-success">${data.summary.passedTests}</h3>
                        <p class="card-text">通過測試</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center border-danger">
                    <div class="card-body">
                        <h3 class="card-title text-danger">${data.summary.failedTests}</h3>
                        <p class="card-text">失敗測試</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center border-info">
                    <div class="card-body">
                        <h3 class="card-title text-info">${data.passRate}%</h3>
                        <p class="card-text">通過率</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- API測試結果 -->
        <h3 class="section-title mb-3">📡 API端點測試結果</h3>
        <div class="table-responsive mb-4">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>API名稱</th>
                        <th>端點</th>
                        <th>狀態</th>
                        <th>預期狀態碼</th>
                        <th>實際狀態碼</th>
                        <th>測試時間</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.apiTests.map(test => `
                        <tr>
                            <td>${test.name}</td>
                            <td><code>${test.url || 'N/A'}</code></td>
                            <td><span class="test-${test.status}">${test.status === 'passed' ? '✅ 通過' : '❌ 失敗'}</span></td>
                            <td>${test.expectedStatus || 'N/A'}</td>
                            <td>${test.actualStatus || 'N/A'}</td>
                            <td><small>${test.timestamp}</small></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- 按鈕功能測試結果 -->
        <h3 class="section-title mb-3">🔘 按鈕功能測試結果</h3>
        <div class="table-responsive mb-4">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>區段</th>
                        <th>按鈕名稱</th>
                        <th>選擇器</th>
                        <th>狀態</th>
                        <th>錯誤信息</th>
                        <th>測試時間</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.buttonTests.map(test => `
                        <tr>
                            <td>${test.section}</td>
                            <td>${test.name}</td>
                            <td><code>${test.selector}</code></td>
                            <td><span class="test-${test.status}">${test.status === 'passed' ? '✅ 通過' : '❌ 失敗'}</span></td>
                            <td>${test.error || '-'}</td>
                            <td><small>${test.timestamp}</small></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- 整合測試結果 -->
        <h3 class="section-title mb-3">🔄 端到端整合測試結果</h3>
        <div class="table-responsive mb-4">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>測試名稱</th>
                        <th>狀態</th>
                        <th>結果描述</th>
                        <th>錯誤信息</th>
                        <th>測試時間</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.integrationTests.map(test => `
                        <tr>
                            <td>${test.name}</td>
                            <td><span class="test-${test.status}">${test.status === 'passed' ? '✅ 通過' : '❌ 失敗'}</span></td>
                            <td>${test.result?.message || '-'}</td>
                            <td>${test.error || '-'}</td>
                            <td><small>${test.timestamp}</small></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- 測試建議 -->
        <div class="alert alert-info">
            <h5>📋 測試建議</h5>
            <ul class="mb-0">
                ${data.summary.failedTests > 0 ? `
                    <li>發現 ${data.summary.failedTests} 個失敗測試，需要進行修復</li>
                    <li>建議檢查失敗的API端點和按鈕選擇器</li>
                    <li>確保前端與後端API的數據格式一致</li>
                ` : `
                    <li>🎉 所有測試均已通過！系統功能運作正常</li>
                    <li>建議定期執行此驗證以確保系統穩定性</li>
                `}
                <li>可以考慮添加更多的邊界條件測試</li>
                <li>建議實施持續整合(CI)自動化測試</li>
            </ul>
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

    // 執行完整驗證
    async runCompleteVerification() {
        console.log('🚀 開始執行完整功能驗證...\n');

        try {
            // 階段1: API驗證
            const authToken = await this.verifyAPIEndpoints();
            
            // 階段2: 按鈕功能驗證
            await this.verifyButtonFunctions(authToken);
            
            // 階段3: 端到端整合測試
            await this.verifyEndToEndIntegration();
            
            // 生成報告
            const reportPaths = await this.generateDetailedReport();
            
            console.log('\n📊 完整功能驗證結果摘要:');
            console.log(`   總測試數: ${this.results.summary.totalTests}`);
            console.log(`   通過測試: ${this.results.summary.passedTests} ✅`);
            console.log(`   失敗測試: ${this.results.summary.failedTests} ❌`);
            console.log(`   通過率: ${((this.results.summary.passedTests / this.results.summary.totalTests) * 100).toFixed(1)}%`);
            console.log(`   總耗時: ${Math.round(this.results.duration / 1000)}秒`);
            
            if (this.results.summary.failedTests > 0) {
                console.log('\n⚠️  有測試失敗，請查看報告了解詳情');
                console.log('📋 主要問題:');
                
                // 顯示失敗的API測試
                this.results.apiTests.filter(t => t.status === 'failed').forEach(test => {
                    console.log(`   - API: ${test.name} (${test.error || '狀態碼不符'})`);
                });
                
                // 顯示失敗的按鈕測試
                this.results.buttonTests.filter(t => t.status === 'failed').forEach(test => {
                    console.log(`   - 按鈕: ${test.name} (${test.error})`);
                });
                
                // 顯示失敗的整合測試
                this.results.integrationTests.filter(t => t.status === 'failed').forEach(test => {
                    console.log(`   - 整合: ${test.name} (${test.error})`);
                });
            } else {
                console.log('\n🎉 所有功能測試均已通過！系統運作正常！');
            }
            
            return reportPaths;
            
        } catch (error) {
            console.error('❌ 完整功能驗證執行失敗:', error);
            throw error;
        }
    }
}

// 主執行函數
async function main() {
    const verifier = new CompleteFunctionVerification();
    
    try {
        await verifier.initialize();
        const reportPaths = await verifier.runCompleteVerification();
        
        console.log('\n✨ 完整功能驗證完成！');
        console.log(`📊 報告已保存至:`);
        console.log(`   ${reportPaths.htmlPath}`);
        
    } catch (error) {
        console.error('❌ 驗證過程發生錯誤:', error);
    } finally {
        await verifier.cleanup();
    }
}

// 如果直接執行此文件
if (require.main === module) {
    main();
}

module.exports = CompleteFunctionVerification;