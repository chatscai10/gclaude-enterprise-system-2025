/**
 * API端點驗證測試
 * 檢查所有API端點的可用性和數據流
 */

const http = require('http');
const https = require('https');

class APIValidationTest {
    constructor() {
        this.baseUrl = 'http://localhost:3007';
        this.authToken = null;
        this.testResults = [];
    }

    async login() {
        console.log('🔐 執行登入以獲取認證令牌...');
        
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'admin',
                    password: 'admin123'
                })
            });

            const data = await response.json();
            
            if (data.success && data.token) {
                this.authToken = data.token;
                console.log('✅ 登入成功，獲得認證令牌');
                return true;
            } else {
                console.log('❌ 登入失敗');
                return false;
            }
        } catch (error) {
            console.log(`❌ 登入錯誤: ${error.message}`);
            return false;
        }
    }

    async testEndpoint(method, path, data = null, requireAuth = true) {
        const url = `${this.baseUrl}${path}`;
        const headers = {
            'Content-Type': 'application/json'
        };

        if (requireAuth && this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const options = {
            method,
            headers
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const responseData = await response.text();
            
            let parsedData;
            try {
                parsedData = JSON.parse(responseData);
            } catch {
                parsedData = responseData;
            }

            const result = {
                method,
                path,
                status: response.status,
                ok: response.ok,
                hasData: !!parsedData,
                dataType: typeof parsedData,
                error: !response.ok ? parsedData : null
            };

            this.testResults.push(result);
            
            console.log(`${response.ok ? '✅' : '❌'} ${method} ${path} - ${response.status}`);
            
            if (!response.ok) {
                console.log(`   錯誤: ${typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData)}`);
            }

            return result;
        } catch (error) {
            const result = {
                method,
                path,
                status: 0,
                ok: false,
                error: error.message
            };
            
            this.testResults.push(result);
            console.log(`❌ ${method} ${path} - 連線錯誤: ${error.message}`);
            return result;
        }
    }

    async runTests() {
        console.log('🚀 開始API端點驗證測試...\n');

        // 登入
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            console.log('無法繼續測試，登入失敗');
            return;
        }

        console.log('\n📝 測試認證相關端點:');
        await this.testEndpoint('GET', '/api/auth/verify');
        await this.testEndpoint('GET', '/api/auth/profile');

        console.log('\n📝 測試員工管理端點:');
        await this.testEndpoint('GET', '/api/employees');
        await this.testEndpoint('GET', '/api/employees/stats/overview');
        await this.testEndpoint('GET', '/api/employees/1'); // 單個員工
        await this.testEndpoint('POST', '/api/employees', {
            username: 'testuser',
            password: 'test123',
            name: '測試員工',
            role: 'employee',
            email: 'test@example.com',
            phone: '0912345678'
        });

        console.log('\n📝 測試出勤管理端點:');
        await this.testEndpoint('GET', '/api/attendance');
        await this.testEndpoint('POST', '/api/attendance/checkin', {
            latitude: 25.033,
            longitude: 121.565,
            location: '台北總店'
        });

        console.log('\n📝 測試營收管理端點:');
        await this.testEndpoint('GET', '/api/revenue');
        await this.testEndpoint('POST', '/api/revenue', {
            date: '2025-08-14',
            store_id: 1,
            bonus_type: '平日獎金',
            order_count: 50,
            on_site_sales: 85000,
            panda_orders: 25000,
            gas: 5000,
            utilities: 3000,
            notes: 'API測試營收記錄'
        });

        console.log('\n📝 測試庫存管理端點:');
        await this.testEndpoint('GET', '/api/products');
        await this.testEndpoint('POST', '/api/orders', {
            product_id: 1,
            requested_quantity: 10,
            reason: 'API測試叫貨',
            urgency: 'normal'
        });

        console.log('\n📝 測試維修申請端點:');
        await this.testEndpoint('POST', '/api/maintenance', {
            title: 'API測試維修',
            description: '測試維修申請功能',
            location: '台北總店',
            urgency: 'normal',
            category: 'equipment'
        });

        console.log('\n📝 測試系統端點:');
        await this.testEndpoint('GET', '/api/health', null, false);

        this.generateReport();
    }

    generateReport() {
        console.log('\n📊 API測試報告:');
        console.log('=====================================');
        
        const total = this.testResults.length;
        const passed = this.testResults.filter(r => r.ok).length;
        const failed = total - passed;
        
        console.log(`總測試數: ${total}`);
        console.log(`通過: ${passed}`);
        console.log(`失敗: ${failed}`);
        console.log(`成功率: ${((passed / total) * 100).toFixed(2)}%`);
        
        console.log('\n失敗的端點:');
        const failedTests = this.testResults.filter(r => !r.ok);
        if (failedTests.length === 0) {
            console.log('無');
        } else {
            failedTests.forEach(test => {
                console.log(`- ${test.method} ${test.path} (${test.status})`);
                if (test.error) {
                    console.log(`  錯誤: ${test.error}`);
                }
            });
        }

        return {
            total,
            passed,
            failed,
            successRate: ((passed / total) * 100).toFixed(2) + '%',
            failedEndpoints: failedTests
        };
    }
}

if (require.main === module) {
    const test = new APIValidationTest();
    test.runTests().catch(console.error);
}

module.exports = APIValidationTest;