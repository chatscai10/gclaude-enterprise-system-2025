const puppeteer = require('puppeteer');

async function testNavigation() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--disable-web-security']
    });

    try {
        const page = await browser.newPage();
        
        // 登入
        await page.goto('http://localhost:3007', { waitUntil: 'networkidle0' });
        await page.waitForSelector('#username', { timeout: 10000 });
        await page.type('#username', 'admin');
        await page.type('#password', 'admin123');
        await page.click('#loginBtn');
        
        // 等待登入完成
        await page.waitForTimeout(2000);
        console.log('✅ 登入成功');
        
        // 檢查頁面是否有錯誤
        const errors = await page.evaluate(() => {
            return {
                hasErrors: !!window.hasErrors,
                consoleErrors: window.consoleErrors || [],
                windowKeys: Object.keys(window).filter(k => k.includes('switch')),
                scriptTags: document.querySelectorAll('script').length
            };
        });
        console.log('頁面狀態:', errors);
        
        // 測試導航切換
        const testSections = ['employees', 'attendance', 'revenue'];
        
        for (const section of testSections) {
            console.log(`\n📍 測試切換到: ${section}`);
            
            // 點擊導航
            await page.click(`a[data-section="${section}"]`);
            await page.waitForTimeout(1500);
            
            // 檢查狀態
            const result = await page.evaluate((s) => {
                const element = document.querySelector(`#${s}-section`);
                return {
                    exists: !!element,
                    hasActive: element ? element.classList.contains('active') : false,
                    allClasses: element ? Array.from(element.classList) : [],
                    switchExists: typeof window.switchSection === 'function'
                };
            }, section);
            
            console.log(`  - Section存在: ${result.exists}`);
            console.log(`  - 有active class: ${result.hasActive}`);
            console.log(`  - 所有class: ${result.allClasses.join(', ')}`);
            console.log(`  - switchSection函數存在: ${result.switchExists}`);
            
            if (result.hasActive) {
                console.log(`  ✅ ${section} 切換成功`);
            } else {
                console.log(`  ❌ ${section} 切換失敗`);
            }
        }
        
    } catch (error) {
        console.error('測試失敗:', error);
    } finally {
        await browser.close();
    }
}

testNavigation().catch(console.error);