const puppeteer = require('puppeteer');

async function debugNavigation() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--disable-web-security']
    });

    try {
        const page = await browser.newPage();
        
        // 監聽控制台訊息
        page.on('console', msg => console.log('瀏覽器控制台:', msg.text()));
        page.on('pageerror', error => console.log('頁面錯誤:', error.message));
        
        // 登入
        await page.goto('http://localhost:3007', { waitUntil: 'networkidle0' });
        await page.waitForSelector('#username', { timeout: 10000 });
        await page.type('#username', 'admin');
        await page.type('#password', 'admin123');
        await page.click('#loginBtn');
        
        await page.waitForTimeout(3000);
        console.log('✅ 登入成功');
        
        // 檢查導航連結
        const navLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('.sidebar .nav-link'));
            return links.map(link => ({
                text: link.textContent?.trim(),
                section: link.dataset.section,
                hasClickEvent: !!link.onclick,
                visible: link.offsetParent !== null
            }));
        });
        
        console.log('導航連結:', navLinks);
        
        // 手動觸發點擊事件並檢查
        console.log('\n📍 測試員工管理導航');
        
        const beforeClick = await page.evaluate(() => {
            const employeeSection = document.getElementById('employees-section');
            return {
                exists: !!employeeSection,
                classes: employeeSection ? Array.from(employeeSection.classList) : [],
                displayStyle: employeeSection ? window.getComputedStyle(employeeSection).display : 'none'
            };
        });
        
        console.log('點擊前狀態:', beforeClick);
        
        // 點擊員工管理連結
        await page.evaluate(() => {
            const link = document.querySelector('a[data-section="employees"]');
            if (link) {
                console.log('找到員工管理連結，準備點擊');
                link.click();
            } else {
                console.log('未找到員工管理連結');
            }
        });
        
        await page.waitForTimeout(2000);
        
        const afterClick = await page.evaluate(() => {
            const employeeSection = document.getElementById('employees-section');
            return {
                exists: !!employeeSection,
                classes: employeeSection ? Array.from(employeeSection.classList) : [],
                displayStyle: employeeSection ? window.getComputedStyle(employeeSection).display : 'none'
            };
        });
        
        console.log('點擊後狀態:', afterClick);
        
        // 檢查是否成功切換
        if (afterClick.classes.includes('active')) {
            console.log('✅ 導航切換成功！');
        } else {
            console.log('❌ 導航切換失敗');
        }
        
        await page.waitForTimeout(5000);
        
    } catch (error) {
        console.error('測試失敗:', error);
    } finally {
        await browser.close();
    }
}

debugNavigation().catch(console.error);