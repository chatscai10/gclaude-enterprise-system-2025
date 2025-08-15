const axios = require('axios');

async function validateDeployments() {
    console.log('🔍 開始驗證部署網址...');
    
    const urls = [
        'http://localhost:3007/api/health',
        // 部署完成後請取消下面網址的註解並測試
        // 'https://gclaude-enterprise-system-production.railway.app/api/health',
        // 'https://gclaude-enterprise-system-vercel.app/api/health'
    ];
    
    const results = [];
    
    for (const url of urls) {
        try {
            console.log(`📡 檢查: ${url}`);
            const response = await axios.get(url, { timeout: 10000 });
            
            if (response.status === 200) {
                console.log(`✅ ${url} - 健康狀態正常`);
                results.push({ url, status: 'healthy', data: response.data });
            } else {
                console.log(`⚠️ ${url} - 狀態碼: ${response.status}`);
                results.push({ url, status: 'warning', statusCode: response.status });
            }
            
        } catch (error) {
            console.log(`❌ ${url} - 連線失敗: ${error.message}`);
            results.push({ url, status: 'error', error: error.message });
        }
    }
    
    console.log('\n📊 驗證結果總覽:');
    results.forEach(result => {
        const status = result.status === 'healthy' ? '✅' : 
                      result.status === 'warning' ? '⚠️' : '❌';
        console.log(`${status} ${result.url}: ${result.status}`);
    });
    
    return results;
}

if (require.main === module) {
    validateDeployments().catch(console.error);
}

module.exports = validateDeployments;