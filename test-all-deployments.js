const axios = require('axios');

async function testAllDeployments() {
    console.log('🧪 開始測試所有部署網址...\n');
    
    const testUrls = [
        { name: '本地開發', url: 'http://localhost:3007/api/health' },
        // 添加真實的ngrok網址或其他部署網址進行測試
    ];
    
    for (const test of testUrls) {
        try {
            console.log(`📡 測試 ${test.name}: ${test.url}`);
            const response = await axios.get(test.url, { timeout: 10000 });
            
            if (response.status === 200) {
                console.log(`✅ ${test.name} - 健康狀態正常`);
                console.log(`📊 回應數據:`, response.data);
            }
            
        } catch (error) {
            console.log(`❌ ${test.name} - 連線失敗: ${error.message}`);
        }
        
        console.log();
    }
}

// 網址功能測試
async function testWebsiteFeatures(baseUrl) {
    console.log(`🔍 測試網站功能: ${baseUrl}`);
    
    const tests = [
        { name: '首頁', path: '/' },
        { name: '健康檢查', path: '/api/health' },
        { name: '員工API', path: '/api/employees' },
        { name: '出勤API', path: '/api/attendance' },
        { name: '營收API', path: '/api/revenue' }
    ];
    
    for (const test of tests) {
        try {
            const response = await axios.get(baseUrl + test.path, { 
                timeout: 5000,
                validateStatus: () => true 
            });
            
            const status = response.status < 400 ? '✅' : '⚠️';
            console.log(`${status} ${test.name}: ${response.status}`);
            
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.message}`);
        }
    }
}

if (require.main === module) {
    testAllDeployments().catch(console.error);
}

module.exports = { testAllDeployments, testWebsiteFeatures };