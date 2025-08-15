/**
 * 全面系統測試 - 多分店管理系統
 * 基於Opus Plan Mode的完整測試和驗證
 */

const puppeteer = require('puppeteer');

class ComprehensiveSystemTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    async initialize() {
        console.log('🚀 啟動全面系統測試...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized', '--disable-web-security'],
            devtools: true
        });
        
        this.page = await this.browser.newPage();
        
        // 監聽console事件
        this.page.on('console', msg => {
            if (msg.text().includes('❌') || msg.text().includes('error') || msg.text().includes('Error')) {
                console.log(`🔍 錯誤Console: ${msg.text()}`);
            }
        });
    }

    // 測試1: 登入功能和通知
    async testLoginAndNotification() {
        console.log('📝 測試1: 登入功能和通知系統');
        
        try {
            await this.page.goto('http://localhost:3007', { waitUntil: 'networkidle2' });
            
            // 登入
            await this.page.type('#username', 'admin');
            await this.page.type('#password', 'admin123');
            await this.page.click('#loginBtn');
            
            await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
            
            // 檢查是否成功登入
            const currentUrl = this.page.url();
            const isLoggedIn = currentUrl.includes('dashboard') || await this.page.$('#dashboard-section');
            
            this.testResults.push({
                test: '登入功能',
                passed: isLoggedIn,
                details: isLoggedIn ? '登入成功' : '登入失敗'
            });
            
            console.log(isLoggedIn ? '✅ 登入功能正常' : '❌ 登入功能異常');
            
        } catch (error) {
            console.error('❌ 登入測試失敗:', error.message);
            this.testResults.push({
                test: '登入功能',
                passed: false,
                details: error.message
            });
        }
    }

    // 測試2: 按鈕功能響應
    async testButtonFunctionality() {
        console.log('📝 測試2: 按鈕功能響應檢查');
        
        try {
            // 切換到員工管理
            await this.page.click('a[data-section="employees"]');
            await this.page.waitForTimeout(2000);
            
            // 檢查編輯按鈕
            const editButtons = await this.page.$$('button[onclick*="editEmployee"]');
            const deleteButtons = await this.page.$$('button[onclick*="deleteEmployee"]');
            
            console.log(`📊 找到 ${editButtons.length} 個編輯按鈕`);
            console.log(`📊 找到 ${deleteButtons.length} 個刪除按鈕`);
            
            // 測試按鈕點擊
            let buttonWorks = false;
            if (editButtons.length > 0) {
                await editButtons[0].click();
                await this.page.waitForTimeout(2000);
                
                // 檢查模態框是否出現
                const modal = await this.page.$('#editEmployeeModal.show');
                buttonWorks = modal !== null;
                
                if (modal) {
                    await this.page.click('#editEmployeeModal .btn-close');
                    await this.page.waitForTimeout(1000);
                }
            }
            
            this.testResults.push({
                test: '按鈕功能',
                passed: buttonWorks,
                details: `編輯按鈕${buttonWorks ? '正常工作' : '無反應'}`
            });
            
            console.log(buttonWorks ? '✅ 按鈕功能正常' : '❌ 按鈕功能異常');
            
        } catch (error) {
            console.error('❌ 按鈕測試失敗:', error.message);
            this.testResults.push({
                test: '按鈕功能',
                passed: false,
                details: error.message
            });
        }
    }

    // 測試3: 營收輸入介面 (新格式)
    async testRevenueInput() {
        console.log('📝 測試3: 營收輸入介面檢查');
        
        try {
            // 切換到營收分析
            await this.page.click('a[data-section="revenue"]');
            await this.page.waitForTimeout(2000);
            
            // 打開新增營收模態框
            const addButton = await this.page.$('button[data-bs-target="#addRevenueModal"]');
            if (addButton) {
                await addButton.click();
                await this.page.waitForTimeout(1000);
                
                // 檢查是否有新的輸入欄位格式
                const onSiteInput = await this.page.$('#onSiteSales');
                const pandaInput = await this.page.$('#pandaOrders');
                const bonusTypeRadio = await this.page.$('input[name="bonus_type"]');
                const storeSelect = await this.page.$('#revenueStore');
                
                const hasNewFormat = onSiteInput && pandaInput && bonusTypeRadio && storeSelect;
                
                this.testResults.push({
                    test: '營收輸入格式',
                    passed: hasNewFormat,
                    details: hasNewFormat ? '新格式已實現' : '仍使用舊格式'
                });
                
                console.log(hasNewFormat ? '✅ 營收輸入格式已更新' : '❌ 營收輸入格式未更新');
                
                // 關閉模態框
                await this.page.click('#addRevenueModal .btn-close');
                await this.page.waitForTimeout(1000);
                
            } else {
                this.testResults.push({
                    test: '營收輸入格式',
                    passed: false,
                    details: '找不到新增營收按鈕'
                });
            }
            
        } catch (error) {
            console.error('❌ 營收輸入測試失敗:', error.message);
            this.testResults.push({
                test: '營收輸入格式',
                passed: false,
                details: error.message
            });
        }
    }

    // 測試4: 分店管理功能
    async testStoreManagement() {
        console.log('📝 測試4: 分店管理功能檢查');
        
        try {
            // 檢查分店選擇器是否有正確的選項
            await this.page.click('a[data-section="revenue"]');
            await this.page.waitForTimeout(1000);
            
            const addButton = await this.page.$('button[data-bs-target="#addRevenueModal"]');
            if (addButton) {
                await addButton.click();
                await this.page.waitForTimeout(1000);
                
                // 檢查分店選項
                const storeOptions = await this.page.evaluate(() => {
                    const select = document.querySelector('#revenueStore');
                    if (!select) return [];
                    
                    return Array.from(select.options).map(option => ({
                        value: option.value,
                        text: option.textContent
                    }));
                });
                
                const hasCorrectStores = storeOptions.some(option => 
                    option.text.includes('內壢忠孝店') ||
                    option.text.includes('桃園龍安店') ||
                    option.text.includes('中壢龍崗店')
                );
                
                this.testResults.push({
                    test: '分店管理',
                    passed: hasCorrectStores,
                    details: `分店選項: ${storeOptions.map(o => o.text).join(', ')}`
                });
                
                console.log(hasCorrectStores ? '✅ 分店管理已配置' : '❌ 分店管理未配置');
                
                await this.page.click('#addRevenueModal .btn-close');
                await this.page.waitForTimeout(1000);
            }
            
        } catch (error) {
            console.error('❌ 分店管理測試失敗:', error.message);
            this.testResults.push({
                test: '分店管理',
                passed: false,
                details: error.message
            });
        }
    }

    // 測試5: 系統整體體驗
    async testOverallExperience() {
        console.log('📝 測試5: 系統整體用戶體驗');
        
        try {
            // 測試導航流暢性
            const sections = ['dashboard', 'employees', 'attendance', 'revenue', 'inventory'];
            let navigationWorks = true;
            
            for (const section of sections) {
                await this.page.click(`a[data-section="${section}"]`);
                await this.page.waitForTimeout(1000);
                
                const activeSection = await this.page.$(`#${section}-section.active`);
                if (!activeSection) {
                    navigationWorks = false;
                    break;
                }
            }
            
            // 檢查是否有JavaScript錯誤
            const hasErrors = await this.page.evaluate(() => {
                return window.jsErrors && window.jsErrors.length > 0;
            });
            
            this.testResults.push({
                test: '整體體驗',
                passed: navigationWorks && !hasErrors,
                details: `導航: ${navigationWorks ? '正常' : '異常'}, JS錯誤: ${hasErrors ? '有' : '無'}`
            });
            
            console.log(navigationWorks && !hasErrors ? '✅ 整體體驗良好' : '❌ 整體體驗需要改善');
            
        } catch (error) {
            console.error('❌ 整體體驗測試失敗:', error.message);
            this.testResults.push({
                test: '整體體驗',
                passed: false,
                details: error.message
            });
        }
    }

    // 生成測試報告
    generateReport() {
        console.log('\n📋 系統測試報告:');
        console.log('='.repeat(60));
        
        let totalTests = this.testResults.length;
        let passedTests = this.testResults.filter(r => r.passed).length;
        let failedTests = totalTests - passedTests;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.details}`);
        });
        
        console.log('='.repeat(60));
        console.log(`📊 測試結果統計:`);
        console.log(`   總測試數: ${totalTests}`);
        console.log(`   通過測試: ${passedTests}`);
        console.log(`   失敗測試: ${failedTests}`);
        console.log(`   成功率: ${Math.round((passedTests / totalTests) * 100)}%`);
        
        if (passedTests === totalTests) {
            console.log('🎉 所有測試都通過！系統運作正常。');
        } else if (passedTests >= totalTests * 0.8) {
            console.log('⚠️ 大部分測試通過，但仍有改善空間。');
        } else {
            console.log('❌ 系統存在重大問題，需要立即修復。');
        }
        
        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: Math.round((passedTests / totalTests) * 100),
            details: this.testResults
        };
    }

    // 執行完整測試流程
    async runFullTest() {
        try {
            await this.initialize();
            
            await this.testLoginAndNotification();
            await this.testButtonFunctionality();
            await this.testRevenueInput();
            await this.testStoreManagement();
            await this.testOverallExperience();
            
            const report = this.generateReport();
            
            // 等待用戶查看結果
            console.log('\n⏳ 瀏覽器將保持開啟30秒供查看...');
            await this.page.waitForTimeout(30000);
            
            return report;
            
        } catch (error) {
            console.error('❌ 測試執行失敗:', error);
            return { error: error.message };
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// 執行測試
async function runComprehensiveTest() {
    const tester = new ComprehensiveSystemTest();
    const results = await tester.runFullTest();
    
    console.log('\n🎯 測試完成！');
    return results;
}

if (require.main === module) {
    runComprehensiveTest().catch(console.error);
}

module.exports = ComprehensiveSystemTest;