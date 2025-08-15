/**
 * 手動按鈕功能測試
 * 開啟瀏覽器並保持開啟，讓用戶手動測試按鈕
 */

const puppeteer = require('puppeteer');

async function manualButtonTest() {
    console.log('🧪 開啟瀏覽器進行手動按鈕測試...');
    console.log('📋 測試步驟:');
    console.log('1. 瀏覽器將自動開啟並登入');
    console.log('2. 手動點擊各個編輯和刪除按鈕');
    console.log('3. 驗證模態框是否正常顯示');
    console.log('4. 測試完成後關閉瀏覽器');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
        devtools: true  // 開啟開發者工具
    });
    
    const page = await browser.newPage();
    
    try {
        // 訪問並登入
        console.log('🔐 自動登入中...');
        await page.goto('http://localhost:3007', { waitUntil: 'networkidle2' });
        await page.type('#username', 'admin');
        await page.type('#password', 'admin123');
        await page.click('#loginBtn');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        console.log('✅ 已自動登入，現在可以手動測試按鈕功能');
        console.log('📝 請按照以下步驟測試:');
        console.log('');
        console.log('🔸 步驟1: 點擊左側導航「員工管理」');
        console.log('🔸 步驟2: 點擊任一員工的「編輯」按鈕');
        console.log('🔸 步驟3: 查看編輯模態框是否正常彈出');
        console.log('🔸 步驟4: 關閉模態框，嘗試「刪除」按鈕');
        console.log('🔸 步驟5: 切換到「出勤管理」重複測試');
        console.log('🔸 步驟6: 切換到「營收分析」重複測試');
        console.log('');
        console.log('⚡ 如果按鈕有反應，說明修復成功！');
        console.log('❌ 如果按鈕無反應，請檢查瀏覽器控制台錯誤訊息');
        console.log('');
        console.log('🛑 測試完成後按任意鍵關閉瀏覽器...');
        
        // 監聽console事件來確認JavaScript是否正常工作
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('編輯') || text.includes('刪除') || text.includes('Dashboard') || text.includes('載入')) {
                console.log(`🔍 瀏覽器Console: ${text}`);
            }
        });
        
        // 等待用戶輸入
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', () => {
            console.log('👋 關閉瀏覽器...');
            browser.close();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
        await browser.close();
    }
}

// 執行測試
if (require.main === module) {
    manualButtonTest().catch(console.error);
}

module.exports = manualButtonTest;