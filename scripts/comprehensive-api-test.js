/**
 * 全面的API端點測試
 */
const axios = require('axios');

class ComprehensiveAPITester {
    constructor() {
        this.baseURL = 'http://localhost:3007';
        this.token = null;
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🚀 開始全面API測試...\n');

        // 1. 健康檢查
        await this.testHealthEndpoint();
        
        // 2. 認證測試
        await this.testAuthentication();
        
        // 3. 員工管理API
        await this.testEmployeeAPI();
        
        // 4. 產品API
        await this.testProductAPI();
        
        // 5. 出勤API
        await this.testAttendanceAPI();
        
        // 6. 營收API
        await this.testRevenueAPI();
        
        // 7. 維修申請API
        await this.testMaintenanceAPI();

        // 顯示測試結果
        this.showResults();
    }

    async testHealthEndpoint() {
        try {
            const response = await axios.get(`${this.baseURL}/api/health`);
            this.logTest('健康檢查API', true, response.data);
        } catch (error) {
            this.logTest('健康檢查API', false, error.message);
        }
    }

    async testAuthentication() {
        console.log('🔐 測試認證系統...');
        
        // 測試登入
        try {
            const response = await axios.post(`${this.baseURL}/api/auth/login`, {
                username: 'admin',
                password: 'admin123'
            });
            
            if (response.data.success && response.data.token) {
                this.token = response.data.token;
                this.logTest('管理員登入', true, '登入成功並獲取令牌');
            } else {
                this.logTest('管理員登入', false, '未獲取到令牌');
            }
        } catch (error) {
            this.logTest('管理員登入', false, error.message);
        }

        // 測試個人資料獲取
        if (this.token) {
            try {
                const response = await axios.get(`${this.baseURL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${this.token}` }
                });
                this.logTest('獲取個人資料', response.data.success, response.data.message || '成功');
            } catch (error) {
                this.logTest('獲取個人資料', false, error.message);
            }
        }
    }

    async testEmployeeAPI() {
        if (!this.token) return;
        
        console.log('👥 測試員工管理API...');
        
        try {
            // 獲取員工列表
            const listResponse = await axios.get(`${this.baseURL}/api/employees`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            this.logTest('獲取員工列表', listResponse.data.success, `找到 ${listResponse.data.data?.length || 0} 個員工`);

            // 獲取員工統計
            const statsResponse = await axios.get(`${this.baseURL}/api/employees/stats/overview`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            this.logTest('員工統計API', statsResponse.data.success, `總員工數: ${statsResponse.data.data?.total || 0}`);

        } catch (error) {
            this.logTest('員工管理API', false, error.message);
        }
    }

    async testProductAPI() {
        if (!this.token) return;
        
        console.log('📦 測試產品管理API...');
        
        try {
            const response = await axios.get(`${this.baseURL}/api/products`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            this.logTest('獲取產品列表', response.data.success, `找到 ${response.data.data?.length || 0} 個產品`);
            
            // 檢查產品數據完整性
            if (response.data.data && response.data.data.length > 0) {
                const product = response.data.data[0];
                const hasRequiredFields = product.name && product.category && product.current_stock !== undefined;
                this.logTest('產品數據完整性', hasRequiredFields, hasRequiredFields ? '產品數據包含必要欄位' : '產品數據缺少必要欄位');
            }
        } catch (error) {
            this.logTest('產品管理API', false, error.message);
        }
    }

    async testAttendanceAPI() {
        if (!this.token) return;
        
        console.log('⏰ 測試出勤管理API...');
        
        try {
            // 測試打卡功能
            const checkinResponse = await axios.post(`${this.baseURL}/api/attendance/checkin`, {
                location: {
                    latitude: 25.0330,
                    longitude: 121.5654
                },
                type: 'checkin'
            }, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            this.logTest('GPS打卡功能', checkinResponse.data.success, checkinResponse.data.message || '打卡成功');

            // 獲取出勤記錄
            const attendanceResponse = await axios.get(`${this.baseURL}/api/attendance`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            this.logTest('獲取出勤記錄', attendanceResponse.data.success, `找到 ${attendanceResponse.data.data?.length || 0} 筆記錄`);

        } catch (error) {
            this.logTest('出勤管理API', false, error.message);
        }
    }

    async testRevenueAPI() {
        if (!this.token) return;
        
        console.log('💰 測試營收管理API...');
        
        try {
            // 新增營收記錄
            const addResponse = await axios.post(`${this.baseURL}/api/revenue`, {
                record_date: new Date().toISOString().split('T')[0],
                amount: 1000,
                payment_method: 'cash',
                category: 'product_sales',
                description: 'API測試營收記錄',
                store_id: 1
            }, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            this.logTest('新增營收記錄', addResponse.data.success, addResponse.data.message || '新增成功');

            // 獲取營收記錄
            const getResponse = await axios.get(`${this.baseURL}/api/revenue`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            this.logTest('獲取營收記錄', getResponse.data.success, `找到 ${getResponse.data.data?.length || 0} 筆記錄`);

        } catch (error) {
            this.logTest('營收管理API', false, error.message);
        }
    }

    async testMaintenanceAPI() {
        if (!this.token) return;
        
        console.log('🔧 測試維修申請API...');
        
        try {
            const response = await axios.post(`${this.baseURL}/api/maintenance`, {
                title: '測試設備維修',
                description: 'API測試維修申請',
                urgency: 'medium',
                location: '辦公室',
                category: 'equipment'
            }, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            this.logTest('提交維修申請', response.data.success, response.data.message || '申請成功');
        } catch (error) {
            this.logTest('維修申請API', false, error.message);
        }
    }

    logTest(testName, success, message) {
        const status = success ? '✅' : '❌';
        const result = { testName, success, message, timestamp: new Date().toISOString() };
        this.testResults.push(result);
        console.log(`${status} ${testName}: ${message}`);
    }

    showResults() {
        console.log('\n📊 測試結果統計:');
        const passed = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        const passRate = ((passed / total) * 100).toFixed(1);
        
        console.log(`總測試項目: ${total}`);
        console.log(`通過項目: ${passed}`);
        console.log(`失敗項目: ${total - passed}`);
        console.log(`通過率: ${passRate}%`);

        // 顯示失敗的測試
        const failed = this.testResults.filter(r => !r.success);
        if (failed.length > 0) {
            console.log('\n❌ 失敗的測試:');
            failed.forEach(test => {
                console.log(`  - ${test.testName}: ${test.message}`);
            });
        }

        console.log('\n🎉 API測試完成！');
    }
}

// 執行測試
async function runTests() {
    const tester = new ComprehensiveAPITester();
    await tester.runAllTests();
}

if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = ComprehensiveAPITester;