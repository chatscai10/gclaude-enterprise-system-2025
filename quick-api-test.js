// 快速 API 測試
const https = require('https');

async function testAPI(path, method = 'GET', data = null) {
    const baseUrl = 'https://gclaude-enterprise-system-6wbjjl8ww-chatscai10-4188s-projects.vercel.app';
    const url = new URL(path, baseUrl);
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                console.log(`${method} ${path}:`);
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response: ${body.substring(0, 200)}...`);
                console.log('---');
                resolve({ status: res.statusCode, body, headers: res.headers });
            });
        });

        req.on('error', (error) => {
            console.log(`❌ ${method} ${path}: ${error.message}`);
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 快速 API 測試開始...\n');
    
    try {
        // 測試健康檢查
        await testAPI('/api/health');
        
        // 測試首頁
        await testAPI('/');
        
        // 測試登入 API
        await testAPI('/api/auth/login', 'POST', {
            username: 'admin',
            password: 'admin123'
        });
        
        // 測試管理員頁面
        await testAPI('/admin');
        
        // 測試員工頁面  
        await testAPI('/employee');
        
    } catch (error) {
        console.error('測試過程出錯:', error.message);
    }
}

runTests();