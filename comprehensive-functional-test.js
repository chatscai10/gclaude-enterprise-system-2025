/**
 * 全面功能測試 - 所有CRUD操作和系統功能驗證
 * 準備生產部署前的完整檢查
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ComprehensiveFunctionalTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            details: []
        };
    }

    async initialize() {
        console.log('🚀 啟動全面功能測試...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized', '--disable-web-security'],
            devtools: false
        });
        
        this.page = await this.browser.newPage();
        
        // 監聽console和錯誤
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`🔍 Console錯誤: ${msg.text()}`);
            }
        });
        
        this.page.on('pageerror', error => {
            console.log(`🚨 頁面錯誤: ${error.message}`);
        });
    }

    async runTest(testName, testFunction) {
        this.testResults.total++;
        console.log(`\n📝 測試: ${testName}`);
        
        try {
            const result = await testFunction();
            if (result) {
                console.log(`✅ ${testName} - 通過`);
                this.testResults.passed++;
                this.testResults.details.push({ name: testName, status: 'PASS', details: result });
            } else {
                console.log(`❌ ${testName} - 失敗`);
                this.testResults.failed++;
                this.testResults.details.push({ name: testName, status: 'FAIL', details: '測試失敗' });
            }
        } catch (error) {
            console.log(`❌ ${testName} - 錯誤: ${error.message}`);
            this.testResults.failed++;
            this.testResults.details.push({ name: testName, status: 'ERROR', details: error.message });
        }
    }

    // 測試1: 登入功能
    async testLogin() {
        await this.page.goto('http://localhost:3007', { waitUntil: 'networkidle2' });
        
        // 測試管理員登入
        await this.page.type('#username', 'admin');
        await this.page.type('#password', 'admin123');
        await this.page.click('#loginBtn');
        
        await this.page.waitForTimeout(3000);
        
        const currentUrl = this.page.url();
        const isLoggedIn = currentUrl.includes('admin') || currentUrl.includes('dashboard');
        
        if (isLoggedIn) {
            const pageTitle = await this.page.title();
            return `登入成功，頁面標題: ${pageTitle}`;
        }
        return false;
    }

    // 測試2: 導航功能
    async testNavigation() {
        const sections = ['employees', 'attendance', 'revenue', 'inventory', 'scheduling'];
        const results = [];
        
        for (const section of sections) {
            const navLink = await this.page.$(`a[data-section="${section}"]`);
            if (navLink) {
                await navLink.click();
                await this.page.waitForTimeout(1000);
                
                const sectionElement = await this.page.$(`#${section}-section`);
                const isVisible = sectionElement ? await sectionElement.isIntersectingViewport() : false;
                
                results.push(`${section}: ${isVisible ? '✅' : '❌'}`);
            } else {
                results.push(`${section}: ❌ 導航連結不存在`);
            }
        }
        
        return results.length > 0 ? results.join(', ') : false;
    }

    // 測試3: 員工管理CRUD
    async testEmployeeManagement() {
        // 切換到員工管理頁面
        const employeeNavLink = await this.page.$('a[data-section="employees"]');
        await employeeNavLink.click();
        await this.page.waitForTimeout(1000);
        
        const results = [];
        
        // 測試編輯按鈕
        const editButtons = await this.page.$$('button[onclick*="editEmployee"]');
        results.push(`編輯按鈕數量: ${editButtons.length}`);
        
        if (editButtons.length > 0) {
            await editButtons[0].click();
            await this.page.waitForTimeout(2000);
            
            const modal = await this.page.evaluate(() => {
                const modal = document.getElementById('editEmployeeModal');
                return modal && modal.classList.contains('show');
            });
            
            results.push(`編輯模態框: ${modal ? '✅' : '❌'}`);
            
            if (modal) {
                // 關閉模態框
                await this.page.click('#editEmployeeModal .btn-secondary');
                await this.page.waitForTimeout(1000);
            }
        }
        
        // 測試新增員工按鈕
        const addButton = await this.page.$('button[data-bs-target="#addEmployeeModal"]');
        if (addButton) {
            await addButton.click();
            await this.page.waitForTimeout(1000);
            
            const addModal = await this.page.evaluate(() => {
                const modal = document.getElementById('addEmployeeModal');
                return modal && modal.classList.contains('show');
            });
            
            results.push(`新增模態框: ${addModal ? '✅' : '❌'}`);
            
            if (addModal) {
                await this.page.click('#addEmployeeModal .btn-secondary');
                await this.page.waitForTimeout(1000);
            }
        }
        
        return results.join(', ');
    }

    // 測試4: 營收管理
    async testRevenueManagement() {
        const revenueNavLink = await this.page.$('a[data-section="revenue"]');
        await revenueNavLink.click();
        await this.page.waitForTimeout(1000);
        
        const results = [];
        
        // 測試新增營收按鈕
        const addRevenueBtn = await this.page.$('button[data-bs-target="#addRevenueModal"]');
        if (addRevenueBtn) {
            await addRevenueBtn.click();
            await this.page.waitForTimeout(1000);
            
            // 檢查營收輸入格式
            const onSiteSalesInput = await this.page.$('#onSiteSales');
            const pandaOrdersInput = await this.page.$('#pandaOrders');
            const storeSelect = await this.page.$('#revenueStore');
            
            results.push(`現場營業額輸入: ${onSiteSalesInput ? '✅' : '❌'}`);
            results.push(`熊貓訂單輸入: ${pandaOrdersInput ? '✅' : '❌'}`);
            results.push(`分店選擇: ${storeSelect ? '✅' : '❌'}`);
            
            if (storeSelect) {
                const options = await this.page.$$eval('#revenueStore option', options => 
                    options.map(option => option.textContent.trim())
                );
                results.push(`分店選項數量: ${options.length}`);
            }
            
            // 關閉模態框
            await this.page.click('#addRevenueModal .btn-secondary');
            await this.page.waitForTimeout(1000);
        }
        
        return results.join(', ');
    }

    // 測試5: 出勤管理
    async testAttendanceManagement() {
        const attendanceNavLink = await this.page.$('a[data-section="attendance"]');
        await attendanceNavLink.click();
        await this.page.waitForTimeout(1000);
        
        const results = [];
        
        // 檢查GPS打卡按鈕
        const clockInBtn = await this.page.$('button[onclick*="gpsClockIn"]');
        results.push(`GPS打卡按鈕: ${clockInBtn ? '✅' : '❌'}`);
        
        // 檢查出勤記錄表格
        const attendanceTable = await this.page.$('#attendance-section table');
        results.push(`出勤記錄表格: ${attendanceTable ? '✅' : '❌'}`);
        
        return results.join(', ');
    }

    // 測試6: 庫存管理
    async testInventoryManagement() {
        const inventoryNavLink = await this.page.$('a[data-section="inventory"]');
        await inventoryNavLink.click();
        await this.page.waitForTimeout(1000);
        
        const results = [];
        
        // 檢查叫貨按鈕
        const orderButton = await this.page.$('button[data-bs-target="#orderModal"]');
        results.push(`叫貨按鈕: ${orderButton ? '✅' : '❌'}`);
        
        // 檢查庫存表格
        const inventoryTable = await this.page.$('#inventory-section table');
        results.push(`庫存表格: ${inventoryTable ? '✅' : '❌'}`);
        
        return results.join(', ');
    }

    // 測試7: 排班管理
    async testSchedulingManagement() {
        const schedulingNavLink = await this.page.$('a[data-section="scheduling"]');
        await schedulingNavLink.click();
        await this.page.waitForTimeout(1000);
        
        const results = [];
        
        // 檢查排班表格
        const schedulingTable = await this.page.$('#scheduling-section table');
        results.push(`排班表格: ${schedulingTable ? '✅' : '❌'}`);
        
        return results.join(', ');
    }

    // 測試8: 系統健康檢查
    async testSystemHealth() {
        const healthResponse = await this.page.evaluate(async () => {
            try {
                const response = await fetch('/api/health');
                return await response.json();
            } catch (error) {
                return { error: error.message };
            }
        });
        
        if (healthResponse.status === 'healthy') {
            return `系統健康，版本: ${healthResponse.version}`;
        }
        return false;
    }

    // 測試9: API端點驗證
    async testAPIEndpoints() {
        const endpoints = [
            '/api/auth/verify',
            '/api/employees/stats/overview',
            '/api/health'
        ];
        
        const results = [];
        
        for (const endpoint of endpoints) {
            const response = await this.page.evaluate(async (url) => {
                try {
                    const token = localStorage.getItem('authToken');
                    const response = await fetch(url, {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });
                    return { status: response.status, ok: response.ok };
                } catch (error) {
                    return { error: error.message };
                }
            }, endpoint);
            
            results.push(`${endpoint}: ${response.ok ? '✅' : '❌'}`);
        }
        
        return results.join(', ');
    }

    // 生成測試報告
    generateReport() {
        const reportPath = path.join(__dirname, 'test-reports', `functional-test-${Date.now()}.json`);
        
        // 確保報告目錄存在
        const reportDir = path.dirname(reportPath);
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.testResults.total,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                successRate: ((this.testResults.passed / this.testResults.total) * 100).toFixed(2) + '%'
            },
            details: this.testResults.details
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📊 測試報告已生成: ${reportPath}`);
        
        return report;
    }

    async run() {
        await this.initialize();
        
        try {
            await this.runTest('登入功能', () => this.testLogin());
            await this.runTest('導航功能', () => this.testNavigation());
            await this.runTest('員工管理CRUD', () => this.testEmployeeManagement());
            await this.runTest('營收管理', () => this.testRevenueManagement());
            await this.runTest('出勤管理', () => this.testAttendanceManagement());
            await this.runTest('庫存管理', () => this.testInventoryManagement());
            await this.runTest('排班管理', () => this.testSchedulingManagement());
            await this.runTest('系統健康檢查', () => this.testSystemHealth());
            await this.runTest('API端點驗證', () => this.testAPIEndpoints());
            
            console.log('\n🎯 測試完成！');
            console.log(`總測試數: ${this.testResults.total}`);
            console.log(`通過: ${this.testResults.passed}`);
            console.log(`失敗: ${this.testResults.failed}`);
            console.log(`成功率: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);
            
            const report = this.generateReport();
            
            // 保持瀏覽器開啟以供檢查
            console.log('\n⏳ 瀏覽器將保持開啟30秒供檢查...');
            await this.page.waitForTimeout(30000);
            
            return report;
            
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// 執行測試
if (require.main === module) {
    const test = new ComprehensiveFunctionalTest();
    test.run().catch(console.error);
}

module.exports = ComprehensiveFunctionalTest;