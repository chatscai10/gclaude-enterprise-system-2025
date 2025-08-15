/**
 * 調試登入重定向問題
 */

const puppeteer = require('puppeteer');

async function debugLoginRedirect() {
    console.log('🔍 調試登入重定向問題...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
        devtools: true
    });
    
    const page = await browser.newPage();
    
    // 監聽所有console輸出
    page.on('console', msg => {
        console.log(`🔍 Console: ${msg.text()}`);
    });
    
    // 監聽網路請求
    page.on('response', response => {
        if (response.url().includes('/api/')) {
            console.log(`🌐 API Response: ${response.url()} - ${response.status()}`);
        }
    });
    
    try {
        console.log('1. 訪問登入頁面');
        await page.goto('http://localhost:3007', { waitUntil: 'networkidle2' });
        
        console.log('2. 執行登入');
        await page.type('#username', 'admin');
        await page.type('#password', 'admin123');
        
        // 監聽導航事件
        page.on('framenavigated', frame => {
            if (frame === page.mainFrame()) {
                console.log(`📍 頁面導航到: ${frame.url()}`);
            }
        });
        
        await page.click('#loginBtn');
        
        console.log('3. 等待登入處理...');
        await page.waitForTimeout(5000);
        
        console.log('4. 檢查當前頁面狀態');
        const currentUrl = page.url();
        console.log(`當前URL: ${currentUrl}`);
        
        // 檢查頁面內容
        const title = await page.title();
        console.log(`頁面標題: ${title}`);
        
        // 檢查是否有儀表板元素
        const hasSidebar = await page.$('.sidebar');
        const hasNavigation = await page.$('.nav-link');
        const hasDashboardSection = await page.$('#dashboard-section');
        
        console.log(`側邊欄: ${hasSidebar ? '✅ 存在' : '❌ 缺失'}`);
        console.log(`導航: ${hasNavigation ? '✅ 存在' : '❌ 缺失'}`);
        console.log(`儀表板區段: ${hasDashboardSection ? '✅ 存在' : '❌ 缺失'}`);
        
        // 如果沒有導航，手動導航到儀表板
        if (!hasNavigation) {
            console.log('5. 手動導航到儀表板');
            await page.goto('http://localhost:3007/dashboard', { waitUntil: 'networkidle2' });
            await page.waitForTimeout(3000);
            
            const newHasNavigation = await page.$('.nav-link');
            const newHasDashboardSection = await page.$('#dashboard-section');
            
            console.log(`直接訪問後 - 導航: ${newHasNavigation ? '✅ 存在' : '❌ 缺失'}`);
            console.log(`直接訪問後 - 儀表板區段: ${newHasDashboardSection ? '✅ 存在' : '❌ 缺失'}`);
            
            if (newHasNavigation) {
                console.log('6. 測試導航功能');
                const navLinks = await page.$$('.nav-link');
                console.log(`導航連結數量: ${navLinks.length}`);
                
                for (let i = 0; i < Math.min(3, navLinks.length); i++) {
                    const linkText = await navLinks[i].evaluate(el => el.textContent.trim());
                    const dataSection = await navLinks[i].evaluate(el => el.getAttribute('data-section'));
                    console.log(`  ${i+1}. ${linkText} -> ${dataSection}`);
                    
                    // 測試點擊
                    if (dataSection && dataSection !== 'dashboard') {
                        await navLinks[i].click();
                        await page.waitForTimeout(1000);
                        
                        const sectionElement = await page.$(`#${dataSection}-section`);
                        console.log(`     點擊後區段: ${sectionElement ? '✅ 顯示' : '❌ 未顯示'}`);
                    }
                }
            }
        }
        
        console.log('\n⏳ 保持瀏覽器開啟15秒供檢查...');
        await page.waitForTimeout(15000);
        
    } catch (error) {
        console.error('❌ 調試過程出錯:', error.message);
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    debugLoginRedirect().catch(console.error);
}

module.exports = debugLoginRedirect;