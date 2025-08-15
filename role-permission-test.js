/**
 * 用戶權限系統測試
 * 驗證不同角色的訪問控制
 */

const puppeteer = require('puppeteer');

class RolePermissionTest {
    constructor() {
        this.browser = null;
        this.testResults = [];
    }

    async initialize() {
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
    }

    async testRole(username, password, expectedRole) {
        console.log(`\n📝 測試角色: ${username} (${expectedRole})`);
        
        const page = await this.browser.newPage();
        
        try {
            // 登入
            await page.goto('http://localhost:3007', { waitUntil: 'networkidle2' });
            await page.type('#username', username);
            await page.type('#password', password);
            await page.click('#loginBtn');
            await page.waitForTimeout(3000);
            
            const currentUrl = page.url();
            const isLoggedIn = currentUrl.includes('admin') || currentUrl.includes('dashboard');
            
            if (!isLoggedIn) {
                console.log(`❌ ${username} 登入失敗`);
                await page.close();
                return { username, role: expectedRole, success: false, reason: '登入失敗' };
            }
            
            console.log(`✅ ${username} 登入成功`);
            
            // 檢查可用的導航選項
            const navLinks = await page.$$('.nav-link[data-section]');
            const availableSections = [];
            
            for (const link of navLinks) {
                const section = await link.evaluate(el => el.getAttribute('data-section'));
                const isVisible = await link.isIntersectingViewport();
                if (isVisible) {
                    availableSections.push(section);
                }
            }
            
            console.log(`  可用功能: ${availableSections.join(', ')}`);
            
            // 測試員工管理頁面訪問
            let canAccessEmployees = false;
            if (availableSections.includes('employees')) {
                const employeeLink = await page.$('a[data-section="employees"]');
                await employeeLink.click();
                await page.waitForTimeout(1000);
                
                const employeeSection = await page.$('#employees-section');
                canAccessEmployees = employeeSection && await employeeSection.isIntersectingViewport();
            }
            
            // 測試營收管理頁面訪問
            let canAccessRevenue = false;
            if (availableSections.includes('revenue')) {
                const revenueLink = await page.$('a[data-section="revenue"]');
                await revenueLink.click();
                await page.waitForTimeout(1000);
                
                const revenueSection = await page.$('#revenue-section');
                canAccessRevenue = revenueSection && await revenueSection.isIntersectingViewport();
            }
            
            // 驗證權限是否符合預期
            const expectedPermissions = this.getExpectedPermissions(expectedRole);
            const actualPermissions = {
                employees: canAccessEmployees,
                revenue: canAccessRevenue,
                sections: availableSections
            };
            
            console.log(`  員工管理: ${canAccessEmployees ? '✅' : '❌'}`);
            console.log(`  營收管理: ${canAccessRevenue ? '✅' : '❌'}`);
            
            await page.close();
            
            return {
                username,
                role: expectedRole,
                success: true,
                permissions: actualPermissions,
                expected: expectedPermissions
            };
            
        } catch (error) {
            console.log(`❌ ${username} 測試錯誤: ${error.message}`);
            await page.close();
            return { username, role: expectedRole, success: false, reason: error.message };
        }
    }

    getExpectedPermissions(role) {
        switch (role) {
            case 'admin':
                return {
                    employees: true,
                    revenue: true,
                    expectedSections: ['employees', 'attendance', 'revenue', 'inventory', 'scheduling', 'promotion', 'maintenance', 'settings']
                };
            case 'manager':
                return {
                    employees: true,
                    revenue: true,
                    expectedSections: ['employees', 'attendance', 'revenue', 'inventory', 'scheduling', 'promotion', 'maintenance']
                };
            case 'employee':
                return {
                    employees: false,
                    revenue: false,
                    expectedSections: ['attendance', 'inventory', 'scheduling']
                };
            case 'intern':
                return {
                    employees: false,
                    revenue: false,
                    expectedSections: ['attendance', 'inventory']
                };
            default:
                return { employees: false, revenue: false, expectedSections: [] };
        }
    }

    async run() {
        await this.initialize();
        
        console.log('🚀 開始用戶權限系統測試...');
        
        const testUsers = [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'manager', password: 'manager123', role: 'manager' },
            { username: 'employee', password: 'employee123', role: 'employee' },
            { username: 'intern', password: 'intern123', role: 'intern' }
        ];
        
        for (const user of testUsers) {
            const result = await this.testRole(user.username, user.password, user.role);
            this.testResults.push(result);
        }
        
        this.generateReport();
        
        console.log('\n⏳ 瀏覽器將保持開啟15秒供檢查...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        await this.browser.close();
    }

    generateReport() {
        console.log('\n📊 權限測試報告:');
        console.log('=====================================');
        
        let allPassed = true;
        
        for (const result of this.testResults) {
            if (result.success) {
                console.log(`\n👤 ${result.username} (${result.role}):`);
                console.log(`  登入: ✅`);
                console.log(`  可用功能: ${result.permissions.sections.join(', ')}`);
                
                // 檢查關鍵權限
                const expected = result.expected;
                const actual = result.permissions;
                
                const employeeAccess = actual.employees === expected.employees;
                const revenueAccess = actual.revenue === expected.revenue;
                
                console.log(`  員工管理權限: ${employeeAccess ? '✅' : '❌'} (預期: ${expected.employees}, 實際: ${actual.employees})`);
                console.log(`  營收管理權限: ${revenueAccess ? '✅' : '❌'} (預期: ${expected.revenue}, 實際: ${actual.revenue})`);
                
                if (!employeeAccess || !revenueAccess) {
                    allPassed = false;
                }
            } else {
                console.log(`\n👤 ${result.username} (${result.role}): ❌ ${result.reason}`);
                allPassed = false;
            }
        }
        
        console.log(`\n🎯 總體結果: ${allPassed ? '✅ 全部通過' : '❌ 有問題需要修復'}`);
        
        return allPassed;
    }
}

if (require.main === module) {
    const test = new RolePermissionTest();
    test.run().catch(console.error);
}

module.exports = RolePermissionTest;