/**
 * 簡化API測試 - 使用curl命令檢查端點
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class SimpleAPITest {
    constructor() {
        this.baseUrl = 'http://localhost:3007';
        this.authToken = null;
    }

    async login() {
        console.log('🔐 執行登入以獲取認證令牌...');
        
        try {
            const curlCmd = `curl -s -X POST ${this.baseUrl}/api/auth/login -H "Content-Type: application/json" -d "{\\"username\\":\\"admin\\",\\"password\\":\\"admin123\\"}"`;
            const { stdout } = await execPromise(curlCmd);
            
            const data = JSON.parse(stdout);
            
            if (data.success && data.token) {
                this.authToken = data.token;
                console.log('✅ 登入成功，獲得認證令牌');
                return true;
            } else {
                console.log('❌ 登入失敗:', data.message);
                return false;
            }
        } catch (error) {
            console.log(`❌ 登入錯誤: ${error.message}`);
            return false;
        }
    }

    async testEndpoint(method, path, data = null) {
        const url = `${this.baseUrl}${path}`;
        let curlCmd = `curl -s -X ${method} ${url}`;
        
        if (this.authToken) {
            curlCmd += ` -H "Authorization: Bearer ${this.authToken}"`;
        }
        
        if (data && (method === 'POST' || method === 'PUT')) {
            curlCmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`;
        }

        try {
            const { stdout, stderr } = await execPromise(curlCmd);
            
            if (stderr) {
                console.log(`❌ ${method} ${path} - 錯誤: ${stderr}`);
                return false;
            }
            
            try {
                const response = JSON.parse(stdout);
                console.log(`✅ ${method} ${path} - 成功`);
                return response;
            } catch {
                if (stdout.includes('<!DOCTYPE html>')) {
                    console.log(`❌ ${method} ${path} - 返回HTML頁面(可能是404)`);
                } else {
                    console.log(`✅ ${method} ${path} - 成功 (非JSON響應)`);
                }
                return stdout;
            }
        } catch (error) {
            console.log(`❌ ${method} ${path} - 連線錯誤: ${error.message}`);
            return false;
        }
    }

    async runTests() {
        console.log('🚀 開始簡化API端點測試...\n');

        // 登入
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            console.log('無法繼續測試，登入失敗');
            return;
        }

        console.log('\n📝 測試核心端點:');
        await this.testEndpoint('GET', '/api/auth/verify');
        await this.testEndpoint('GET', '/api/employees/stats/overview');
        await this.testEndpoint('GET', '/api/health');
        
        console.log('\n📝 測試其他端點:');
        await this.testEndpoint('GET', '/api/employees');
        await this.testEndpoint('GET', '/api/attendance');
        await this.testEndpoint('GET', '/api/revenue');
        await this.testEndpoint('GET', '/api/products');

        console.log('\n🎯 API測試完成！');
    }
}

if (require.main === module) {
    const test = new SimpleAPITest();
    test.runTests().catch(console.error);
}

module.exports = SimpleAPITest;