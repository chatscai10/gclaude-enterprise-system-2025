/**
 * 功能操作流程測試
 * 測試完整的業務流程和用戶操作路徑
 */
const axios = require('axios');

class FunctionalFlowTester {
    constructor() {
        this.baseURL = 'http://localhost:3007';
        this.tokens = {};
        this.testResults = [];
        this.createdRecords = {
            employees: [],
            products: [],
            orders: [],
            maintenance: [],
            attendance: [],
            revenue: []
        };
    }

    async runFunctionalTests() {
        console.log('🔄 開始功能流程測試...\n');

        try {
            // 1. 登入流程測試
            await this.testLoginFlow();
            
            // 2. 員工管理流程
            await this.testEmployeeManagementFlow();
            
            // 3. 出勤管理流程
            await this.testAttendanceFlow();
            
            // 4. 營收管理流程
            await this.testRevenueFlow();
            
            // 5. 庫存管理流程
            await this.testInventoryFlow();
            
            // 6. 維修申請流程
            await this.testMaintenanceFlow();
            
            // 7. 權限測試流程
            await this.testPermissionFlow();

            // 顯示測試結果
            this.showResults();

        } catch (error) {
            console.error('❌ 功能測試執行錯誤:', error.message);
        }
    }

    async testLoginFlow() {
        console.log('👤 測試登入流程...');
        
        try {
            // 測試錯誤登入
            const wrongLoginResponse = await axios.post(`${this.baseURL}/api/auth/login`, {
                username: 'admin',
                password: 'wrongpassword'
            }).catch(e => e.response);

            this.logTest('錯誤密碼登入應被拒絕', wrongLoginResponse.status === 401, '正確拒絕錯誤登入');

            // 測試正確登入
            const adminLogin = await axios.post(`${this.baseURL}/api/auth/login`, {
                username: 'admin',
                password: 'admin123'
            });

            this.tokens.admin = adminLogin.data.token;
            this.logTest('管理員登入', adminLogin.data.success, '獲取管理員令牌');

            // 測試獲取個人資料
            const profileResponse = await axios.get(`${this.baseURL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${this.tokens.admin}` }
            });

            this.logTest('獲取個人資料', profileResponse.data.success, `用戶: ${profileResponse.data.data.name}`);

            // 獲取其他角色令牌
            const roles = [
                { username: 'manager', password: 'manager123', role: 'manager' },
                { username: 'employee', password: 'employee123', role: 'employee' },
                { username: 'intern', password: 'intern123', role: 'intern' }
            ];

            for (const role of roles) {
                const response = await axios.post(`${this.baseURL}/api/auth/login`, {
                    username: role.username,
                    password: role.password
                });
                this.tokens[role.role] = response.data.token;
                this.logTest(`${role.role}登入`, response.data.success, `獲取${role.role}令牌`);
            }

        } catch (error) {
            this.logTest('登入流程測試', false, error.message);
        }
    }

    async testEmployeeManagementFlow() {
        console.log('\n👥 測試員工管理流程...');
        
        try {
            // 1. 獲取員工列表
            const employeeListResponse = await axios.get(`${this.baseURL}/api/employees`, {
                headers: { Authorization: `Bearer ${this.tokens.admin}` }
            });

            this.logTest('獲取員工列表', employeeListResponse.data.success, 
                `找到 ${employeeListResponse.data.data.length} 名員工`);

            // 2. 新增員工
            const newEmployee = {
                username: `test_employee_${Date.now()}`,
                password: 'test123456',
                name: '測試員工',
                role: 'employee',
                email: 'test@gclaude.com',
                phone: '02-12345999',
                department_id: 3,
                salary: 40000
            };

            const createResponse = await axios.post(`${this.baseURL}/api/employees`, newEmployee, {
                headers: { Authorization: `Bearer ${this.tokens.admin}` }
            });

            this.logTest('新增員工', createResponse.data.success, '測試員工新增成功');
            this.createdRecords.employees.push(createResponse.data.data.id);

            // 3. 搜尋員工
            const searchResponse = await axios.get(
                `${this.baseURL}/api/employees?search=${encodeURIComponent('測試員工')}`, {
                headers: { Authorization: `Bearer ${this.tokens.admin}` }
            });

            this.logTest('搜尋員工', searchResponse.data.success, 
                `搜尋到 ${searchResponse.data.data.length} 名員工`);

            // 4. 獲取員工統計
            const statsResponse = await axios.get(`${this.baseURL}/api/employees/stats/overview`, {
                headers: { Authorization: `Bearer ${this.tokens.admin}` }
            });

            this.logTest('員工統計', statsResponse.data.success, 
                `總員工數: ${statsResponse.data.data.total}`);

        } catch (error) {
            this.logTest('員工管理流程', false, error.message);
        }
    }

    async testAttendanceFlow() {
        console.log('\n⏰ 測試出勤管理流程...');
        
        try {
            // 1. 上班打卡
            const checkinResponse = await axios.post(`${this.baseURL}/api/attendance/checkin`, {
                latitude: 25.0330,
                longitude: 121.5654,
                location: '台北市信義區松智路1號'
            }, {
                headers: { Authorization: `Bearer ${this.tokens.employee}` }
            });

            this.logTest('上班打卡', checkinResponse.data.success, checkinResponse.data.message);

            // 2. 等待一秒後下班打卡
            await new Promise(resolve => setTimeout(resolve, 1000));

            const checkoutResponse = await axios.post(`${this.baseURL}/api/attendance/checkin`, {
                latitude: 25.0330,
                longitude: 121.5654,
                location: '台北市信義區松智路1號'
            }, {
                headers: { Authorization: `Bearer ${this.tokens.employee}` }
            });

            this.logTest('下班打卡', checkoutResponse.data.success, checkoutResponse.data.message);

            // 3. 查看出勤記錄
            const attendanceResponse = await axios.get(`${this.baseURL}/api/attendance`, {
                headers: { Authorization: `Bearer ${this.tokens.employee}` }
            });

            this.logTest('查看出勤記錄', attendanceResponse.data.success, 
                `找到 ${attendanceResponse.data.data.length} 筆記錄`);

            // 4. 管理員查看所有出勤記錄
            const allAttendanceResponse = await axios.get(`${this.baseURL}/api/attendance`, {
                headers: { Authorization: `Bearer ${this.tokens.admin}` }
            });

            this.logTest('管理員查看所有出勤', allAttendanceResponse.data.success, 
                `管理員可查看 ${allAttendanceResponse.data.data.length} 筆記錄`);

        } catch (error) {
            this.logTest('出勤管理流程', false, error.message);
        }
    }

    async testRevenueFlow() {
        console.log('\n💰 測試營收管理流程...');
        
        try {
            // 1. 新增營收記錄
            const revenueData = {
                record_date: new Date().toISOString().split('T')[0],
                amount: 1500.50,
                payment_method: 'credit_card',
                category: 'product_sales',
                description: '功能測試營收記錄',
                receipt_number: `TEST-${Date.now()}`,
                customer_count: 2
            };

            const addRevenueResponse = await axios.post(`${this.baseURL}/api/revenue`, revenueData, {
                headers: { Authorization: `Bearer ${this.tokens.manager}` }
            });

            this.logTest('新增營收記錄', addRevenueResponse.data.success, '營收記錄新增成功');
            this.createdRecords.revenue.push(addRevenueResponse.data.data.id);

            // 2. 查看營收記錄
            const revenueListResponse = await axios.get(`${this.baseURL}/api/revenue`, {
                headers: { Authorization: `Bearer ${this.tokens.manager}` }
            });

            this.logTest('查看營收記錄', revenueListResponse.data.success, 
                `找到 ${revenueListResponse.data.data.length} 筆記錄，總額: $${revenueListResponse.data.summary.total_amount}`);

            // 3. 按日期篩選營收
            const today = new Date().toISOString().split('T')[0];
            const filteredRevenueResponse = await axios.get(
                `${this.baseURL}/api/revenue?start_date=${today}&end_date=${today}`, {
                headers: { Authorization: `Bearer ${this.tokens.admin}` }
            });

            this.logTest('按日期篩選營收', filteredRevenueResponse.data.success, 
                `今日營收記錄: ${filteredRevenueResponse.data.data.length} 筆`);

        } catch (error) {
            this.logTest('營收管理流程', false, error.message);
        }
    }

    async testInventoryFlow() {
        console.log('\n📦 測試庫存管理流程...');
        
        try {
            // 1. 查看商品列表
            const productsResponse = await axios.get(`${this.baseURL}/api/products`, {
                headers: { Authorization: `Bearer ${this.tokens.employee}` }
            });

            this.logTest('查看商品列表', productsResponse.data.success, 
                `找到 ${productsResponse.data.data.length} 個商品`);

            // 2. 查看低庫存商品
            const lowStockResponse = await axios.get(`${this.baseURL}/api/products?low_stock=true`, {
                headers: { Authorization: `Bearer ${this.tokens.manager}` }
            });

            this.logTest('查看低庫存商品', lowStockResponse.data.success, 
                `低庫存商品: ${lowStockResponse.data.data.length} 個`);

            // 3. 新增叫貨申請
            if (productsResponse.data.data.length > 0) {
                const orderData = {
                    product_id: productsResponse.data.data[0].id,
                    requested_quantity: 50,
                    reason: '庫存不足需要補充',
                    urgency: 'normal'
                };

                const orderResponse = await axios.post(`${this.baseURL}/api/orders`, orderData, {
                    headers: { Authorization: `Bearer ${this.tokens.employee}` }
                });

                this.logTest('提交叫貨申請', orderResponse.data.success, 
                    `訂單號: ${orderResponse.data.data.order_number}`);
                this.createdRecords.orders.push(orderResponse.data.data.id);
            }

        } catch (error) {
            this.logTest('庫存管理流程', false, error.message);
        }
    }

    async testMaintenanceFlow() {
        console.log('\n🔧 測試維修申請流程...');
        
        try {
            // 1. 提交維修申請
            const maintenanceData = {
                title: '功能測試設備維修',
                description: '這是功能測試的維修申請，測試系統流程是否正常',
                location: '測試區域',
                urgency: 'medium',
                category: 'equipment'
            };

            const maintenanceResponse = await axios.post(`${this.baseURL}/api/maintenance`, maintenanceData, {
                headers: { Authorization: `Bearer ${this.tokens.intern}` }
            });

            this.logTest('提交維修申請', maintenanceResponse.data.success, 
                `申請編號: ${maintenanceResponse.data.data.request_number}`);
            this.createdRecords.maintenance.push(maintenanceResponse.data.data.id);

            // 2. 測試不同緊急程度的申請
            const urgentMaintenanceData = {
                title: '緊急設備故障',
                description: '緊急維修測試申請',
                location: '緊急區域',
                urgency: 'high',
                category: 'emergency'
            };

            const urgentResponse = await axios.post(`${this.baseURL}/api/maintenance`, urgentMaintenanceData, {
                headers: { Authorization: `Bearer ${this.tokens.employee}` }
            });

            this.logTest('提交緊急維修申請', urgentResponse.data.success, 
                '緊急維修申請提交成功');

        } catch (error) {
            this.logTest('維修申請流程', false, error.message);
        }
    }

    async testPermissionFlow() {
        console.log('\n🛡️ 測試權限控制流程...');
        
        try {
            // 1. 實習生嘗試訪問營收數據（應該被拒絕）
            const internRevenueResponse = await axios.get(`${this.baseURL}/api/revenue`, {
                headers: { Authorization: `Bearer ${this.tokens.intern}` }
            }).catch(e => e.response);

            this.logTest('實習生訪問營收數據被阻止', internRevenueResponse.status === 403, 
                '實習生正確被拒絕訪問營收數據');

            // 2. 員工嘗試新增其他員工（應該被拒絕）
            const employeeCreateResponse = await axios.post(`${this.baseURL}/api/employees`, {
                username: 'test_unauthorized',
                password: 'test123',
                name: '未授權測試',
                role: 'intern'
            }, {
                headers: { Authorization: `Bearer ${this.tokens.employee}` }
            }).catch(e => e.response);

            this.logTest('員工新增員工被阻止', employeeCreateResponse.status === 403, 
                '員工正確被拒絕新增員工權限');

            // 3. 管理員可以訪問所有功能
            const managerEmployeeResponse = await axios.get(`${this.baseURL}/api/employees`, {
                headers: { Authorization: `Bearer ${this.tokens.manager}` }
            });

            this.logTest('管理員訪問員工數據', managerEmployeeResponse.data.success, 
                '管理員具有適當權限');

            // 4. 無令牌訪問應被拒絕
            const noTokenResponse = await axios.get(`${this.baseURL}/api/employees`).catch(e => e.response);

            this.logTest('無令牌訪問被阻止', noTokenResponse.status === 401, 
                '正確要求認證令牌');

        } catch (error) {
            this.logTest('權限控制流程', false, error.message);
        }
    }

    logTest(testName, success, message) {
        const status = success ? '✅' : '❌';
        const result = { testName, success, message, timestamp: new Date().toISOString() };
        this.testResults.push(result);
        console.log(`${status} ${testName}: ${message}`);
    }

    showResults() {
        console.log('\n📊 功能流程測試結果:');
        console.log('========================');
        
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
        } else {
            console.log('\n🎉 所有功能流程測試通過！');
        }

        console.log('\n📋 測試涵蓋範圍:');
        console.log('✅ 用戶認證流程');
        console.log('✅ 員工管理流程');
        console.log('✅ 出勤管理流程');
        console.log('✅ 營收管理流程');
        console.log('✅ 庫存管理流程');
        console.log('✅ 維修申請流程');
        console.log('✅ 權限控制流程');

        // 清理測試數據的建議
        if (Object.values(this.createdRecords).some(arr => arr.length > 0)) {
            console.log('\n🧹 測試完成，建議清理測試數據');
        }
    }
}

async function runFunctionalTests() {
    const tester = new FunctionalFlowTester();
    await tester.runFunctionalTests();
}

if (require.main === module) {
    runFunctionalTests().catch(console.error);
}

module.exports = FunctionalFlowTester;