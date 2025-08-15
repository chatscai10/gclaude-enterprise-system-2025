/**
 * 快速修復測試 - 識別並修復關鍵問題
 */

const puppeteer = require('puppeteer');

async function quickDiagnostic() {
    console.log('🔍 快速系統診斷...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    try {
        // 1. 檢查登入頁面
        console.log('📝 檢查登入頁面...');
        await page.goto('http://localhost:3007', { waitUntil: 'networkidle2' });
        
        const hasLoginForm = await page.$('#username') && await page.$('#password');
        console.log(`登入表單: ${hasLoginForm ? '✅ 存在' : '❌ 缺失'}`);
        
        // 2. 執行登入
        if (hasLoginForm) {
            console.log('🔐 執行登入...');
            await page.type('#username', 'admin');
            await page.type('#password', 'admin123');
            await page.click('#loginBtn');
            
            await page.waitForTimeout(3000);
            
            // 3. 檢查登入後頁面
            const currentUrl = page.url();
            console.log(`當前URL: ${currentUrl}`);
            
            // 檢查導航是否存在
            const navItems = await page.$$('.nav-link');
            console.log(`導航項目數量: ${navItems.length}`);
            
            if (navItems.length > 0) {
                console.log('📋 導航項目:');
                for (let i = 0; i < Math.min(navItems.length, 5); i++) {
                    const text = await navItems[i].evaluate(el => el.textContent.trim());
                    const dataSection = await navItems[i].evaluate(el => el.getAttribute('data-section'));
                    console.log(`  - ${text} (data-section: ${dataSection})`);
                }
            }
            
            // 4. 檢查儀表板內容
            const dashboardSection = await page.$('#dashboard-section');
            console.log(`儀表板區段: ${dashboardSection ? '✅ 存在' : '❌ 缺失'}`);
            
            // 5. 檢查是否有JavaScript錯誤
            const errors = await page.evaluate(() => {
                return window.jsErrors || [];
            });
            console.log(`JavaScript錯誤: ${errors.length === 0 ? '✅ 無錯誤' : `❌ ${errors.length}個錯誤`}`);
            
            // 6. 嘗試點擊營收分析
            const revenueLink = await page.$('a[data-section="revenue"]');
            if (revenueLink) {
                console.log('💰 測試營收分析頁面...');
                await revenueLink.click();
                await page.waitForTimeout(2000);
                
                const revenueSection = await page.$('#revenue-section');
                console.log(`營收區段: ${revenueSection ? '✅ 存在' : '❌ 缺失'}`);
                
                // 檢查新增營收按鈕
                const addRevenueBtn = await page.$('button[data-bs-target="#addRevenueModal"]');
                if (addRevenueBtn) {
                    console.log('💰 測試營收輸入介面...');
                    await addRevenueBtn.click();
                    await page.waitForTimeout(1000);
                    
                    // 檢查新格式欄位
                    const onSiteInput = await page.$('#onSiteSales');
                    const bonusTypeRadio = await page.$('input[name="bonus_type"]');
                    const storeSelect = await page.$('#revenueStore');
                    
                    console.log(`現場營業額欄位: ${onSiteInput ? '✅ 新格式' : '❌ 舊格式'}`);
                    console.log(`獎金類別選擇: ${bonusTypeRadio ? '✅ 存在' : '❌ 缺失'}`);
                    console.log(`分店選擇: ${storeSelect ? '✅ 存在' : '❌ 缺失'}`);
                    
                    if (storeSelect) {
                        const storeOptions = await page.evaluate(() => {
                            const select = document.querySelector('#revenueStore');
                            return Array.from(select.options).map(option => option.textContent);
                        });
                        console.log(`分店選項: ${storeOptions.join(', ')}`);
                    }
                }
            }
        }
        
        console.log('\n⏳ 保持瀏覽器開啟10秒供檢查...');
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('❌ 診斷過程出錯:', error.message);
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    quickDiagnostic().catch(console.error);
}

module.exports = quickDiagnostic;