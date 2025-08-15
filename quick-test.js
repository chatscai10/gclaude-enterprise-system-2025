/**
 * 快速系統測試
 */

const puppeteer = require('puppeteer');

async function quickTest() {
    console.log('🚀 啟動快速系統測試...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('📝 測試1: 登入功能');
        await page.goto('http://localhost:3007', { waitUntil: 'networkidle2' });
        
        await page.type('#username', 'admin');
        await page.type('#password', 'admin123');
        await page.click('#loginBtn');
        
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log(`登入後URL: ${currentUrl}`);
        
        // 檢查頁面標題來確認是否在正確頁面
        const pageTitle = await page.title();
        console.log(`頁面標題: ${pageTitle}`);
        
        // 檢查是否有editEmployee函數
        const hasEditFunction = await page.evaluate(() => {
            return typeof editEmployee === 'function';
        });
        console.log(`editEmployee函數存在: ${hasEditFunction}`);
        
        if (currentUrl.includes('admin') || currentUrl.includes('dashboard')) {
            console.log('✅ 登入成功');
        } else {
            console.log('❌ 登入失敗');
        }
        
        console.log('📝 測試2: 按鈕功能檢查');
        
        // 切換到員工管理頁面
        const employeeNavLink = await page.$('a[data-section="employees"]');
        if (employeeNavLink) {
            await employeeNavLink.click();
            await page.waitForTimeout(1000);
        }
        
        // 檢查編輯按鈕
        const editButtons = await page.$$('button[onclick*="editEmployee"]');
        console.log(`📊 找到 ${editButtons.length} 個編輯按鈕`);
        
        if (editButtons.length > 0) {
            console.log('測試第一個編輯按鈕...');
            
            // 檢查按鈕的onclick屬性
            const onclickAttr = await editButtons[0].evaluate(el => el.getAttribute('onclick'));
            console.log(`按鈕onclick屬性: ${onclickAttr}`);
            
            // 測試Bootstrap模態框是否正常工作
            const bootstrapTest = await page.evaluate(() => {
                try {
                    const modal = document.getElementById('editEmployeeModal');
                    const bootstrapModal = new bootstrap.Modal(modal);
                    bootstrapModal.show();
                    
                    setTimeout(() => {
                        return modal.classList.contains('show');
                    }, 1000);
                    
                    return 'Bootstrap模態框測試完成';
                } catch (error) {
                    return `Bootstrap錯誤: ${error.message}`;
                }
            });
            console.log(`Bootstrap測試: ${bootstrapTest}`);
            
            await page.waitForTimeout(2000);
            
            // 檢查模態框是否顯示
            const bootstrapModalVisible = await page.evaluate(() => {
                const modal = document.getElementById('editEmployeeModal');
                return modal && modal.classList.contains('show');
            });
            console.log(`Bootstrap模態框可見: ${bootstrapModalVisible}`);
            
            // 手動執行onclick函數來測試
            const result = await page.evaluate(() => {
                try {
                    if (typeof editEmployee === 'function') {
                        editEmployee('001');
                        return '函數執行成功';
                    } else {
                        return 'editEmployee函數不存在';
                    }
                } catch (error) {
                    return `執行錯誤: ${error.message}`;
                }
            });
            console.log(`手動執行結果: ${result}`);
            
            await editButtons[0].click();
            await page.waitForTimeout(2000);
            
            await page.waitForTimeout(2000);
            
            // 檢查模態框是否存在並可見
            const modal = await page.$('#editEmployeeModal');
            const modalVisible = await page.evaluate(() => {
                const modal = document.getElementById('editEmployeeModal');
                return modal && modal.classList.contains('show');
            });
            
            console.log(`模態框元素: ${modal ? '存在' : '不存在'}`);
            console.log(`模態框可見: ${modalVisible ? '是' : '否'}`);
            
            if (modalVisible) {
                console.log('✅ 編輯模態框成功打開');
            } else {
                console.log('❌ 編輯模態框未開啟');
                
                // 檢查console錯誤
                const logs = await page.evaluate(() => {
                    return window.lastEditEmployeeLog || '無日誌';
                });
                console.log(`最後日誌: ${logs}`);
            }
        }
        
        console.log('📝 測試3: 營收輸入格式檢查');
        
        // 切換到營收管理頁面
        const revenueNavLink = await page.$('a[data-section="revenue"]');
        if (revenueNavLink) {
            await revenueNavLink.click();
            await page.waitForTimeout(1000);
        }
        
        // 檢查新增營收按鈕並點擊
        const addRevenueBtn = await page.$('button[data-bs-target="#addRevenueModal"]');
        if (addRevenueBtn) {
            await addRevenueBtn.click();
            await page.waitForTimeout(1000);
            
            // 檢查輸入欄位格式
            const onSiteSalesInput = await page.$('#onSiteSales');
            const pandaOrdersInput = await page.$('#pandaOrders');
            
            if (onSiteSalesInput && pandaOrdersInput) {
                console.log('✅ 營收輸入格式已更新為直接輸入');
            } else {
                console.log('❌ 營收輸入格式仍有問題');
            }
        }
        
        console.log('📝 測試4: 分店選擇功能');
        
        const storeSelect = await page.$('#revenueStore');
        if (storeSelect) {
            const options = await page.$$eval('#revenueStore option', options => 
                options.map(option => option.textContent.trim())
            );
            console.log(`分店選項: ${options.join(', ')}`);
            
            if (options.length >= 4) {
                console.log('✅ 分店管理已配置');
            } else {
                console.log('❌ 分店配置不完整');
            }
        }
        
        console.log('\n📋 快速測試完成');
        
        await page.waitForTimeout(5000);
        
    } catch (error) {
        console.error('❌ 測試過程出錯:', error.message);
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    quickTest().catch(console.error);
}

module.exports = quickTest;