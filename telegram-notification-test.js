/**
 * Telegram通知系統實際測試
 * 測試各種通知場景
 */

const TelegramNotificationSystem = require('./modules/telegram-notifications');

class TelegramNotificationTest {
    constructor() {
        this.telegramNotifier = new TelegramNotificationSystem();
        this.testResults = [];
    }

    async runTest(testName, testFunction) {
        console.log(`\n📝 測試: ${testName}`);
        
        try {
            const result = await testFunction();
            console.log(`✅ ${testName} - 成功`);
            this.testResults.push({ name: testName, status: 'SUCCESS', result });
            return result;
        } catch (error) {
            console.log(`❌ ${testName} - 失敗: ${error.message}`);
            this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
            return false;
        }
    }

    // 測試1: 登入通知
    async testLoginNotification() {
        const testUser = {
            id: 1,
            name: '測試管理員',
            username: 'admin',
            role: 'admin',
            department_name: '管理部'
        };

        const location = {
            ip: '192.168.1.100',
            device: 'Chrome/120.0.0.0'
        };

        return await this.telegramNotifier.sendLoginNotification(testUser, location);
    }

    // 測試2: 營收通知
    async testRevenueNotification() {
        const revenueData = {
            store_name: '內壢忠孝店',
            employee_name: '王店長',
            date: '2025-08-14',
            order_count: 95,
            income_items: {
                on_site_sales: 125000,
                panda_orders: 38000,
                uber_orders: 12000,
                oil_recycling: 800
            },
            expense_items: {
                gas: 8500,
                utilities: 4200,
                supplies: 11000,
                cleaning: 2500
            },
            total_income: 175800,
            total_expense: 26200,
            bonus_type: '平日獎金',
            notes: 'Telegram測試營收記錄'
        };

        return await this.telegramNotifier.sendRevenueNotification(revenueData);
    }

    // 測試3: 出勤通知
    async testAttendanceNotification() {
        const attendanceData = {
            employee_name: '張員工',
            action: '上班打卡',
            time: new Date().toISOString(),
            location: '桃園龍安店',
            coordinates: {
                latitude: 24.9939,
                longitude: 121.3008
            }
        };

        return await this.telegramNotifier.sendAttendanceNotification(attendanceData);
    }

    // 測試4: 訂單通知
    async testOrderNotification() {
        const orderData = {
            employee_name: '李實習生',
            product_name: '香雞排',
            quantity: 50,
            reason: '庫存不足，需要補貨',
            urgency: 'high',
            order_number: 'ORD-20250814-001'
        };

        return await this.telegramNotifier.sendOrderNotification(orderData);
    }

    // 測試5: 維修通知
    async testMaintenanceNotification() {
        const maintenanceData = {
            employee_name: '系統管理員',
            title: '收銀機故障',
            description: '收銀機無法正常啟動，顯示藍屏錯誤',
            location: '中壢龍崗店',
            urgency: 'urgent',
            request_number: 'MR-20250814-001'
        };

        return await this.telegramNotifier.sendMaintenanceNotification(maintenanceData);
    }

    // 測試6: 系統錯誤通知
    async testSystemErrorNotification() {
        const errorData = {
            error_type: 'API錯誤',
            message: 'Telegram通知測試模擬錯誤',
            timestamp: new Date().toISOString(),
            severity: 'medium',
            details: {
                endpoint: '/api/test',
                user: 'admin',
                ip: '192.168.1.100'
            }
        };

        return await this.telegramNotifier.sendSystemErrorNotification(errorData);
    }

    async run() {
        console.log('🚀 開始Telegram通知系統實際測試...');
        console.log('📱 確保您的Telegram機器人和群組已正確配置');
        
        // 依序執行所有測試
        await this.runTest('登入通知', () => this.testLoginNotification());
        await new Promise(resolve => setTimeout(resolve, 2000)); // 延遲避免頻率限制
        
        await this.runTest('營收通知', () => this.testRevenueNotification());
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.runTest('出勤通知', () => this.testAttendanceNotification());
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.runTest('訂單通知', () => this.testOrderNotification());
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.runTest('維修通知', () => this.testMaintenanceNotification());
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.runTest('系統錯誤通知', () => this.testSystemErrorNotification());
        
        this.generateReport();
    }

    generateReport() {
        console.log('\n📊 Telegram通知測試報告:');
        console.log('=====================================');
        
        const total = this.testResults.length;
        const successful = this.testResults.filter(r => r.status === 'SUCCESS').length;
        const failed = total - successful;
        
        console.log(`總測試數: ${total}`);
        console.log(`成功: ${successful}`);
        console.log(`失敗: ${failed}`);
        console.log(`成功率: ${((successful / total) * 100).toFixed(2)}%`);
        
        if (failed > 0) {
            console.log('\n失敗的測試:');
            this.testResults.filter(r => r.status === 'FAILED').forEach(result => {
                console.log(`- ${result.name}: ${result.error}`);
            });
        }
        
        console.log('\n💡 提醒:');
        console.log('- 請檢查您的Telegram群組是否收到測試訊息');
        console.log('- 如果有失敗的測試，請檢查網路連接和Telegram配置');
        console.log('- Bot Token: 7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc');
        console.log('- 群組ID: -1002658082392');
        
        return successful === total;
    }
}

if (require.main === module) {
    const test = new TelegramNotificationTest();
    test.run().catch(console.error);
}

module.exports = TelegramNotificationTest;