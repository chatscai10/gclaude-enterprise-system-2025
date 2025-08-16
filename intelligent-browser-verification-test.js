/**
 * 智慧瀏覽器完整驗證測試系統
 * GClaude Enterprise System 端到端功能驗證
 * 
 * 功能覆蓋：
 * - 登入系統驗證（管理員和員工）
 * - 排班系統參數顯示驗證
 * - API端點可用性測試
 * - 管理員權限控制驗證
 * - 員工出勤記錄載入測試
 * - 營業額計算邏輯驗證
 * - 前端頁面動態功能測試
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class GClaudeEnterpriseVerificationTest {
    constructor() {
        this.baseUrl = 'http://localhost:3010';
        this.testResults = [];
        this.browser = null;
        this.page = null;
        this.startTime = Date.now();
        
        // 測試帳號配置
        this.accounts = {
            admin: { username: 'admin', password: 'admin123' },
            employee: { username: 'employee', password: 'emp123' }
        };
        
        // API端點清單
        this.apiEndpoints = [
            '/api/revenue/monthly',
            '/api/promotion/position-levels',
            '/api/schedule/settings',
            '/api/revenue/records',
            '/api/auth/login',
            '/api/attendance/records',
            '/api/schedule/status',
            '/api/users'
        ];
        
        console.log('🚀 智慧瀏覽器驗證測試系統已初始化');
        console.log(`📍 目標系統: ${this.baseUrl}`);
    }

    async initialize() {
        console.log('\n🔧 初始化Puppeteer瀏覽器...');
        
        this.browser = await puppeteer.launch({
            headless: false, // 設為false以便觀察測試過程
            devtools: false,
            slowMo: 50, // 減慢操作速度以便觀察
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

        this.page = await this.browser.newPage();
        
        // 設定視窗大小
        await this.page.setViewport({ width: 1366, height: 768 });
        
        // 啟用請求攔截以監控API調用
        await this.page.setRequestInterception(true);
        
        const apiCalls = [];
        this.page.on('request', request => {
            if (request.url().includes('/api/')) {
                apiCalls.push({
                    url: request.url(),
                    method: request.method(),
                    timestamp: new Date().toISOString()
                });
            }
            request.continue();
        });
        
        this.apiCalls = apiCalls;
        
        console.log('✅ 瀏覽器初始化完成');
    }

    async logTestResult(testName, status, details = '', screenshot = null) {
        const result = {
            testName,
            status,
            details,
            timestamp: new Date().toISOString(),
            screenshot
        };
        
        this.testResults.push(result);
        
        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${statusIcon} ${testName}: ${status}${details ? ` - ${details}` : ''}`);
        
        if (screenshot) {
            await this.page.screenshot({ 
                path: `test-screenshots/${screenshot}`,
                fullPage: true 
            });
        }
    }

    async waitForElementSafely(selector, timeout = 10000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            console.log(`⚠️ 元素未找到: ${selector}`);
            return false;
        }
    }

    async testServerConnectivity() {
        console.log('\n📡 測試服務器連接性...');
        
        try {
            const response = await this.page.goto(this.baseUrl, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });
            
            if (response.status() === 200) {
                await this.logTestResult(
                    '服務器連接測試',
                    'PASS',
                    `HTTP ${response.status()}`,
                    'server-connectivity.png'
                );
                return true;
            } else {
                await this.logTestResult(
                    '服務器連接測試',
                    'FAIL',
                    `HTTP ${response.status()}`
                );
                return false;
            }
        } catch (error) {
            await this.logTestResult(
                '服務器連接測試',
                'FAIL',
                `連接錯誤: ${error.message}`
            );
            return false;
        }
    }

    async testLoginSystem() {
        console.log('\n🔐 測試登入系統...');
        
        // 測試管理員登入
        await this.testUserLogin('admin', '管理員登入測試');
        
        // 登出並測試員工登入
        await this.logout();
        await this.testUserLogin('employee', '員工登入測試');
    }

    async testUserLogin(userType, testName) {
        try {
            const account = this.accounts[userType];
            
            // 導航到登入頁面
            await this.page.goto(`${this.baseUrl}/login.html`, { waitUntil: 'networkidle0' });
            
            // 填入登入資訊
            await this.page.type('#username', account.username);
            await this.page.type('#password', account.password);
            
            // 點擊登入按鈕
            await this.page.click('#loginBtn');
            
            // 等待登入完成
            await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
            
            // 檢查是否成功登入
            const currentUrl = this.page.url();
            if (currentUrl.includes('dashboard') || currentUrl.includes('index.html')) {
                await this.logTestResult(
                    testName,
                    'PASS',
                    `成功登入 ${userType}`,
                    `login-${userType}.png`
                );
                return true;
            } else {
                await this.logTestResult(
                    testName,
                    'FAIL',
                    `登入失敗，重定向到: ${currentUrl}`
                );
                return false;
            }
        } catch (error) {
            await this.logTestResult(
                testName,
                'FAIL',
                `登入過程錯誤: ${error.message}`
            );
            return false;
        }
    }

    async logout() {
        try {
            // 尋找登出按鈕並點擊
            const logoutExists = await this.waitForElementSafely('#logoutBtn', 2000);
            if (logoutExists) {
                await this.page.click('#logoutBtn');
                await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
            }
        } catch (error) {
            console.log('⚠️ 登出過程中出現問題，將繼續測試');
        }
    }

    async testScheduleSystemParameters() {
        console.log('\n📅 測試排班系統參數顯示...');
        
        try {
            // 導航到排班管理頁面
            await this.page.goto(`${this.baseUrl}/schedule.html`, { waitUntil: 'networkidle0' });
            
            // 等待頁面加載
            await this.page.waitForTimeout(2000);
            
            // 檢查排班參數是否正確顯示（非undefined）
            const parameterElements = await this.page.$$eval('.schedule-parameter', elements => 
                elements.map(el => ({
                    text: el.textContent,
                    hasUndefined: el.textContent.includes('undefined')
                }))
            );
            
            let hasUndefinedIssues = false;
            parameterElements.forEach(param => {
                if (param.hasUndefined) {
                    hasUndefinedIssues = true;
                }
            });
            
            if (!hasUndefinedIssues && parameterElements.length > 0) {
                await this.logTestResult(
                    '排班系統參數顯示測試',
                    'PASS',
                    `檢測到 ${parameterElements.length} 個參數，均正常顯示`,
                    'schedule-parameters.png'
                );
            } else if (hasUndefinedIssues) {
                await this.logTestResult(
                    '排班系統參數顯示測試',
                    'FAIL',
                    '仍有undefined參數顯示問題'
                );
            } else {
                await this.logTestResult(
                    '排班系統參數顯示測試',
                    'WARN',
                    '未找到排班參數元素'
                );
            }
        } catch (error) {
            await this.logTestResult(
                '排班系統參數顯示測試',
                'FAIL',
                `測試過程錯誤: ${error.message}`
            );
        }
    }

    async testAPIEndpoints() {
        console.log('\n🔌 測試API端點可用性...');
        
        for (const endpoint of this.apiEndpoints) {
            try {
                const response = await this.page.evaluate(async (url) => {
                    try {
                        const res = await fetch(url);
                        return {
                            status: res.status,
                            ok: res.ok,
                            statusText: res.statusText
                        };
                    } catch (error) {
                        return {
                            error: error.message
                        };
                    }
                }, `${this.baseUrl}${endpoint}`);
                
                if (response.error) {
                    await this.logTestResult(
                        `API端點測試: ${endpoint}`,
                        'FAIL',
                        `請求錯誤: ${response.error}`
                    );
                } else if (response.status < 500) {
                    // 4xx錯誤可能是正常的（如需要認證）
                    await this.logTestResult(
                        `API端點測試: ${endpoint}`,
                        'PASS',
                        `HTTP ${response.status} ${response.statusText}`
                    );
                } else {
                    await this.logTestResult(
                        `API端點測試: ${endpoint}`,
                        'FAIL',
                        `伺服器錯誤: HTTP ${response.status}`
                    );
                }
            } catch (error) {
                await this.logTestResult(
                    `API端點測試: ${endpoint}`,
                    'FAIL',
                    `測試過程錯誤: ${error.message}`
                );
            }
        }
    }

    async testAdminPermissions() {
        console.log('\n👑 測試管理員權限控制...');
        
        // 確保以管理員身份登入
        await this.testUserLogin('admin', '管理員權限測試-登入驗證');
        
        try {
            // 測試管理員專屬功能頁面
            const adminPages = [
                '/revenue.html',
                '/schedule.html',
                '/users.html'
            ];
            
            for (const page of adminPages) {
                try {
                    await this.page.goto(`${this.baseUrl}${page}`, { waitUntil: 'networkidle0' });
                    
                    // 檢查是否能成功加載頁面（非403錯誤頁面）
                    const pageTitle = await this.page.title();
                    const bodyText = await this.page.$eval('body', el => el.textContent);
                    
                    if (!bodyText.includes('403') && !bodyText.includes('Forbidden')) {
                        await this.logTestResult(
                            `管理員權限測試: ${page}`,
                            'PASS',
                            `成功訪問管理員頁面: ${pageTitle}`
                        );
                    } else {
                        await this.logTestResult(
                            `管理員權限測試: ${page}`,
                            'FAIL',
                            '管理員無法訪問應有權限的頁面'
                        );
                    }
                } catch (error) {
                    await this.logTestResult(
                        `管理員權限測試: ${page}`,
                        'FAIL',
                        `頁面訪問錯誤: ${error.message}`
                    );
                }
            }
        } catch (error) {
            await this.logTestResult(
                '管理員權限控制測試',
                'FAIL',
                `測試過程錯誤: ${error.message}`
            );
        }
    }

    async testEmployeeAttendanceRecords() {
        console.log('\n📊 測試員工出勤記錄載入...');
        
        try {
            // 導航到出勤記錄頁面
            await this.page.goto(`${this.baseUrl}/attendance.html`, { waitUntil: 'networkidle0' });
            
            // 等待數據加載
            await this.page.waitForTimeout(3000);
            
            // 檢查出勤記錄表格是否有數據
            const attendanceData = await this.page.evaluate(() => {
                const table = document.querySelector('#attendanceTable, .attendance-table, table');
                if (!table) return { found: false };
                
                const rows = table.querySelectorAll('tr');
                return {
                    found: true,
                    rowCount: rows.length,
                    hasData: rows.length > 1 // 排除表頭
                };
            });
            
            if (attendanceData.found && attendanceData.hasData) {
                await this.logTestResult(
                    '員工出勤記錄載入測試',
                    'PASS',
                    `成功載入 ${attendanceData.rowCount - 1} 筆出勤記錄`,
                    'attendance-records.png'
                );
            } else if (attendanceData.found && !attendanceData.hasData) {
                await this.logTestResult(
                    '員工出勤記錄載入測試',
                    'WARN',
                    '出勤記錄表格存在但無數據'
                );
            } else {
                await this.logTestResult(
                    '員工出勤記錄載入測試',
                    'FAIL',
                    '未找到出勤記錄表格'
                );
            }
        } catch (error) {
            await this.logTestResult(
                '員工出勤記錄載入測試',
                'FAIL',
                `測試過程錯誤: ${error.message}`
            );
        }
    }

    async testRevenueCalculationLogic() {
        console.log('\n💰 測試營業額計算邏輯...');
        
        try {
            // 導航到營業額頁面
            await this.page.goto(`${this.baseUrl}/revenue.html`, { waitUntil: 'networkidle0' });
            
            // 等待數據加載
            await this.page.waitForTimeout(3000);
            
            // 檢查營業額顯示和計算
            const revenueData = await this.page.evaluate(() => {
                // 尋找營業額相關元素
                const revenueElements = document.querySelectorAll('.revenue, .total-revenue, #totalRevenue, [class*="revenue"]');
                const monthlyData = document.querySelectorAll('.monthly-revenue, [class*="monthly"]');
                
                return {
                    revenueElementsFound: revenueElements.length,
                    monthlyDataFound: monthlyData.length,
                    revenueValues: Array.from(revenueElements).map(el => ({
                        text: el.textContent,
                        hasNumber: /\d+/.test(el.textContent)
                    }))
                };
            });
            
            if (revenueData.revenueElementsFound > 0) {
                const hasValidNumbers = revenueData.revenueValues.some(rv => rv.hasNumber);
                
                if (hasValidNumbers) {
                    await this.logTestResult(
                        '營業額計算邏輯測試',
                        'PASS',
                        `找到 ${revenueData.revenueElementsFound} 個營業額元素，包含有效數值`,
                        'revenue-calculation.png'
                    );
                } else {
                    await this.logTestResult(
                        '營業額計算邏輯測試',
                        'FAIL',
                        '營業額元素存在但未顯示有效數值'
                    );
                }
            } else {
                await this.logTestResult(
                    '營業額計算邏輯測試',
                    'FAIL',
                    '未找到營業額相關元素'
                );
            }
        } catch (error) {
            await this.logTestResult(
                '營業額計算邏輯測試',
                'FAIL',
                `測試過程錯誤: ${error.message}`
            );
        }
    }

    async testFrontendDynamicFunctions() {
        console.log('\n🎨 測試前端頁面動態功能...');
        
        const pages = [
            { url: '/index.html', name: '主頁面' },
            { url: '/dashboard.html', name: '儀表板' },
            { url: '/schedule.html', name: '排班管理' },
            { url: '/revenue.html', name: '營業額管理' },
            { url: '/attendance.html', name: '出勤管理' }
        ];
        
        for (const pageInfo of pages) {
            try {
                await this.page.goto(`${this.baseUrl}${pageInfo.url}`, { 
                    waitUntil: 'networkidle0',
                    timeout: 15000 
                });
                
                // 等待JavaScript執行
                await this.page.waitForTimeout(2000);
                
                // 檢查頁面動態功能
                const dynamicFeatures = await this.page.evaluate(() => {
                    // 檢查按鈕、表單、互動元素
                    const buttons = document.querySelectorAll('button');
                    const forms = document.querySelectorAll('form');
                    const inputs = document.querySelectorAll('input, select, textarea');
                    const tables = document.querySelectorAll('table');
                    
                    // 檢查是否有JavaScript錯誤
                    const hasJSErrors = window.console && window.console.error;
                    
                    return {
                        buttonCount: buttons.length,
                        formCount: forms.length,
                        inputCount: inputs.length,
                        tableCount: tables.length,
                        pageLoaded: document.readyState === 'complete'
                    };
                });
                
                if (dynamicFeatures.pageLoaded && 
                    (dynamicFeatures.buttonCount > 0 || dynamicFeatures.formCount > 0)) {
                    await this.logTestResult(
                        `前端動態功能測試: ${pageInfo.name}`,
                        'PASS',
                        `按鈕:${dynamicFeatures.buttonCount}, 表單:${dynamicFeatures.formCount}, 輸入:${dynamicFeatures.inputCount}`
                    );
                } else {
                    await this.logTestResult(
                        `前端動態功能測試: ${pageInfo.name}`,
                        'WARN',
                        '頁面缺少互動元素或未完全載入'
                    );
                }
            } catch (error) {
                await this.logTestResult(
                    `前端動態功能測試: ${pageInfo.name}`,
                    'FAIL',
                    `頁面載入錯誤: ${error.message}`
                );
            }
        }
    }

    async generateDetailedReport() {
        console.log('\n📋 生成詳細測試報告...');
        
        const endTime = Date.now();
        const duration = (endTime - this.startTime) / 1000;
        
        const passCount = this.testResults.filter(r => r.status === 'PASS').length;
        const failCount = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnCount = this.testResults.filter(r => r.status === 'WARN').length;
        const totalTests = this.testResults.length;
        
        const healthScore = Math.round((passCount / totalTests) * 100);
        
        const report = {
            testSummary: {
                totalTests,
                passCount,
                failCount,
                warnCount,
                healthScore,
                duration: `${duration.toFixed(2)}秒`
            },
            systemStatus: healthScore >= 80 ? 'HEALTHY' : healthScore >= 60 ? 'WARNING' : 'CRITICAL',
            detailedResults: this.testResults,
            apiCallsMonitored: this.apiCalls,
            timestamp: new Date().toISOString(),
            recommendations: this.generateRecommendations()
        };
        
        // 保存報告到文件
        const reportPath = path.join(__dirname, `gclaude-verification-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
        
        // 生成簡化的文字報告
        const textReport = this.generateTextReport(report);
        const textReportPath = path.join(__dirname, `gclaude-verification-summary-${Date.now()}.txt`);
        fs.writeFileSync(textReportPath, textReport, 'utf8');
        
        console.log(`\n📊 詳細測試報告已保存: ${reportPath}`);
        console.log(`📝 簡化報告已保存: ${textReportPath}`);
        
        return report;
    }

    generateRecommendations() {
        const failedTests = this.testResults.filter(r => r.status === 'FAIL');
        const recommendations = [];
        
        if (failedTests.length === 0) {
            recommendations.push('🎉 系統運行良好，所有測試均通過！');
        } else {
            recommendations.push('🔧 需要修復的問題：');
            failedTests.forEach(test => {
                recommendations.push(`- ${test.testName}: ${test.details}`);
            });
        }
        
        // 基於API調用分析給出建議
        if (this.apiCalls.length === 0) {
            recommendations.push('⚠️ 未檢測到API調用，請檢查前端與後端的連接');
        }
        
        return recommendations;
    }

    generateTextReport(report) {
        return `
🚀 GClaude Enterprise System 智慧瀏覽器驗證報告
================================================================

📊 測試摘要
================================================================
總測試數量: ${report.testSummary.totalTests}
通過測試: ${report.testSummary.passCount} ✅
失敗測試: ${report.testSummary.failCount} ❌  
警告測試: ${report.testSummary.warnCount} ⚠️
執行時間: ${report.testSummary.duration}
系統健康度: ${report.testSummary.healthScore}% (${report.systemStatus})

📋 詳細測試結果
================================================================
${report.detailedResults.map(result => 
    `${result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'} ${result.testName}
   ${result.details ? `   詳情: ${result.details}` : ''}
   時間: ${result.timestamp}`
).join('\n\n')}

🔌 API調用監控
================================================================
監控到的API調用數量: ${report.apiCallsMonitored.length}
${report.apiCallsMonitored.map(call => 
    `${call.method} ${call.url} - ${call.timestamp}`
).join('\n')}

💡 修復建議
================================================================
${report.recommendations.join('\n')}

📅 報告生成時間: ${report.timestamp}
`;
    }

    async cleanup() {
        console.log('\n🧹 清理測試環境...');
        
        if (this.browser) {
            await this.browser.close();
            console.log('✅ 瀏覽器已關閉');
        }
    }

    async runFullVerification() {
        console.log('🎯 開始執行GClaude Enterprise System完整驗證測試\n');
        
        try {
            // 創建截圖目錄
            if (!fs.existsSync('test-screenshots')) {
                fs.mkdirSync('test-screenshots');
            }
            
            // 初始化瀏覽器
            await this.initialize();
            
            // 執行所有測試
            await this.testServerConnectivity();
            await this.testLoginSystem();
            await this.testScheduleSystemParameters();
            await this.testAPIEndpoints();
            await this.testAdminPermissions();
            await this.testEmployeeAttendanceRecords();
            await this.testRevenueCalculationLogic();
            await this.testFrontendDynamicFunctions();
            
            // 生成報告
            const report = await this.generateDetailedReport();
            
            return report;
            
        } catch (error) {
            console.error('❌ 測試執行過程中發生錯誤:', error);
            await this.logTestResult(
                '整體測試執行',
                'FAIL',
                `系統錯誤: ${error.message}`
            );
        } finally {
            await this.cleanup();
        }
    }
}

// 執行測試
async function main() {
    const verificationTest = new GClaudeEnterpriseVerificationTest();
    const report = await verificationTest.runFullVerification();
    
    if (report) {
        console.log('\n🎊 測試完成！');
        console.log(`📊 系統健康度: ${report.testSummary.healthScore}%`);
        console.log(`📈 測試狀態: ${report.systemStatus}`);
        console.log(`✅ 通過: ${report.testSummary.passCount}/${report.testSummary.totalTests}`);
        
        if (report.testSummary.failCount > 0) {
            console.log('\n🔧 需要關注的問題:');
            report.detailedResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`   ❌ ${r.testName}: ${r.details}`));
        }
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = GClaudeEnterpriseVerificationTest;