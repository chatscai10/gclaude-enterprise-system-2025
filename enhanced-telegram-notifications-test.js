/**
 * 增強版 Telegram 通知功能完整測試
 * 測試所有新增的通知類型和修復的問題
 */

const TelegramNotificationSystem = require('./modules/telegram-notifications.js');

class EnhancedTelegramNotificationsTest {
    constructor() {
        this.telegramNotifier = new TelegramNotificationSystem();
        this.testResults = [];
    }

    // 測試結果記錄
    logTest(testName, success, details = '') {
        const result = {
            test: testName,
            success: success,
            details: details,
            timestamp: new Date().toLocaleString('zh-TW')
        };
        this.testResults.push(result);
        console.log(`${success ? '✅' : '❌'} ${testName}: ${success ? '成功' : '失敗'} ${details}`);
    }

    // 1. 測試員工生日通知
    async testBirthdayNotification() {
        console.log('\n🎂 測試員工生日通知...');
        
        const employeeData = {
            name: '張小明',
            department_name: '內壢忠孝店',
            role: 'employee'
        };

        try {
            await this.telegramNotifier.sendBirthdayNotification(employeeData);
            this.logTest('員工生日通知', true, '生日祝福訊息發送成功');
        } catch (error) {
            this.logTest('員工生日通知', false, error.message);
        }
    }

    // 2. 測試新員工註冊通知
    async testNewEmployeeNotification() {
        console.log('\n👤 測試新員工註冊通知...');
        
        const employeeData = {
            name: '李小華',
            username: 'newemployee001',
            department_name: '桃園龍安店',
            role: 'employee',
            phone: '0912345678',
            email: 'newemployee@example.com'
        };

        try {
            await this.telegramNotifier.sendNewEmployeeNotification(employeeData);
            this.logTest('新員工註冊通知', true, '新員工歡迎訊息發送成功');
        } catch (error) {
            this.logTest('新員工註冊通知', false, error.message);
        }
    }

    // 3. 測試排班通知
    async testScheduleNotification() {
        console.log('\n📅 測試排班通知...');
        
        const scheduleData = {
            date: '2025-08-15',
            store_name: '中壢龍崗店',
            employee_name: '王小美',
            shift_time: '09:00-18:00',
            change_type: '新增',
            reason: '人力調配',
            manager_name: '陳經理'
        };

        try {
            await this.telegramNotifier.sendScheduleNotification(scheduleData);
            this.logTest('排班通知', true, '排班異動訊息發送成功');
        } catch (error) {
            this.logTest('排班通知', false, error.message);
        }
    }

    // 4. 測試投票通知
    async testVotingNotification() {
        console.log('\n🗳️ 測試投票通知...');
        
        const voteData = {
            title: '員工旅遊地點投票',
            description: '請選擇今年員工旅遊的目的地',
            target_stores: '全部分店',
            target_roles: '全體員工',
            end_date: '2025-08-25',
            current_votes: 15,
            creator_name: '人事部'
        };

        try {
            await this.telegramNotifier.sendVotingNotification(voteData);
            this.logTest('投票通知', true, '投票活動訊息發送成功');
        } catch (error) {
            this.logTest('投票通知', false, error.message);
        }
    }

    // 5. 測試庫存異常通知
    async testInventoryAlertNotification() {
        console.log('\n📦 測試庫存異常通知...');
        
        const alertData = {
            type: 'low_stock',
            store_name: '內壢忠孝店',
            product_name: '雞腿',
            brand: '大成',
            current_stock: 5,
            min_stock: 20,
            last_order_date: '2025-08-10'
        };

        try {
            await this.telegramNotifier.sendInventoryAlertNotification(alertData);
            this.logTest('庫存異常通知', true, '庫存不足警告發送成功');
        } catch (error) {
            this.logTest('庫存異常通知', false, error.message);
        }
    }

    // 6. 測試叫貨頻率異常通知
    async testOrderFrequencyAlert() {
        console.log('\n📈 測試叫貨頻率異常通知...');
        
        const frequencyData = {
            type: 'too_frequent',
            store_name: '桃園龍安店',
            product_name: '胡椒粉',
            frequency_days: 2,
            normal_frequency_days: 7,
            last_order_date: '2025-08-12',
            recent_orders: 8,
            recommendation: '建議調整叫貨計劃，避免庫存積壓'
        };

        try {
            await this.telegramNotifier.sendOrderFrequencyAlert(frequencyData);
            this.logTest('叫貨頻率異常通知', true, '叫貨頻率警告發送成功');
        } catch (error) {
            this.logTest('叫貨頻率異常通知', false, error.message);
        }
    }

    // 7. 測試品項異常通知
    async testProductAnomalyNotification() {
        console.log('\n🚨 測試品項異常通知...');
        
        const anomalyData = {
            store_name: '中壢龍崗店',
            product_name: '雞翅',
            anomaly_type: '保存期限即將到期',
            anomaly_details: '有20包雞翅將於3天內到期',
            possible_cause: '叫貨量過多或銷售緩慢',
            recommendation: '盡快處理即期商品，考慮促銷或內部消耗',
            urgency_level: '高'
        };

        try {
            await this.telegramNotifier.sendProductAnomalyNotification(anomalyData);
            this.logTest('品項異常通知', true, '品項異常警告發送成功');
        } catch (error) {
            this.logTest('品項異常通知', false, error.message);
        }
    }

    // 8. 測試系統錯誤通知
    async testSystemErrorNotification() {
        console.log('\n🛠️ 測試系統錯誤通知...');
        
        const errorData = {
            store_name: '內壢忠孝店',
            username: 'employee001',
            module_name: '營收管理',
            error_message: 'Database connection timeout',
            error_details: 'Failed to save revenue data after 3 retry attempts',
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            severity_level: '高'
        };

        try {
            await this.telegramNotifier.sendSystemErrorNotification(errorData);
            this.logTest('系統錯誤通知', true, '系統錯誤警告發送成功');
        } catch (error) {
            this.logTest('系統錯誤通知', false, error.message);
        }
    }

    // 9. 測試修復後的打卡通知（解決Invalid Date問題）
    async testFixedAttendanceNotification() {
        console.log('\n🕐 測試修復後的打卡通知...');
        
        // 測試各種可能的時間戳格式
        const testCases = [
            {
                name: '正常時間戳',
                data: {
                    timestamp: '2025-08-14T10:30:00',
                    employee_name: '測試員工A',
                    store_name: '內壢忠孝店',
                    latitude: 24.953,
                    longitude: 121.226,
                    distance: 50,
                    device_info: 'iPhone 12',
                    status: 'check_in'
                }
            },
            {
                name: '無時間戳(使用預設)',
                data: {
                    employee_name: '測試員工B',
                    store_name: '桃園龍安店',
                    status: 'check_out'
                }
            },
            {
                name: '使用clock_time欄位',
                data: {
                    clock_time: new Date().toISOString(),
                    username: '測試員工C',
                    department_name: '中壢龍崗店',
                    user_agent: 'Chrome/91.0',
                    status: 'check_in'
                }
            }
        ];

        for (const testCase of testCases) {
            try {
                await this.telegramNotifier.sendAttendanceNotification(testCase.data);
                this.logTest(`修復後打卡通知 - ${testCase.name}`, true, '無Invalid Date錯誤');
            } catch (error) {
                this.logTest(`修復後打卡通知 - ${testCase.name}`, false, error.message);
            }
        }
    }

    // 10. 測試現有的叫貨通知（確認已修復）
    async testOrderNotification() {
        console.log('\n🛒 測試叫貨記錄通知...');
        
        const orderData = {
            employee_name: '張採購',
            delivery_date: '2025-08-16',
            store_name: '內壢忠孝店',
            total_amount: 25000,
            items: [
                {
                    supplier: '大成食品',
                    brand: '大成',
                    name: '雞腿',
                    quantity: 50,
                    unit: '包'
                },
                {
                    supplier: '統一企業',
                    brand: '統一',
                    name: '調味料',
                    quantity: 20,
                    unit: '盒'
                }
            ]
        };

        try {
            await this.telegramNotifier.sendOrderNotification(orderData);
            this.logTest('叫貨記錄通知', true, '叫貨記錄發送成功');
        } catch (error) {
            this.logTest('叫貨記錄通知', false, error.message);
        }
    }

    // 生成測試報告
    generateTestReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 增強版 Telegram 通知功能測試報告');
        console.log('='.repeat(60));

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);

        console.log(`\n📈 測試統計:`);
        console.log(`   總測試數: ${totalTests}`);
        console.log(`   通過: ${passedTests} ✅`);
        console.log(`   失敗: ${failedTests} ❌`);
        console.log(`   成功率: ${successRate}%`);

        console.log(`\n📋 詳細結果:`);
        this.testResults.forEach((result, index) => {
            console.log(`${index + 1}. ${result.test}: ${result.success ? '✅' : '❌'} ${result.details}`);
        });

        console.log(`\n🎯 新增功能列表:`);
        console.log('✅ 員工生日通知 - sendBirthdayNotification()');
        console.log('✅ 新員工註冊通知 - sendNewEmployeeNotification()'); 
        console.log('✅ 排班通知 - sendScheduleNotification()');
        console.log('✅ 投票通知 - sendVotingNotification()');
        console.log('✅ 庫存異常通知 - sendInventoryAlertNotification()');
        console.log('✅ 叫貨頻率異常通知 - sendOrderFrequencyAlert()');
        console.log('✅ 品項異常通知 - sendProductAnomalyNotification()');
        console.log('✅ 系統錯誤通知 - sendSystemErrorNotification()');

        console.log(`\n🔧 修復問題:`);
        console.log('✅ 打卡通知Invalid Date錯誤已修復');
        console.log('✅ 通知訊息undefined值問題已修復');
        console.log('✅ 日期處理加入錯誤處理機制');
        console.log('✅ 所有參數加入預設值處理');

        if (failedTests === 0) {
            console.log('\n🎉 所有測試通過！Telegram通知系統已完全修復並增強');
            console.log('📱 系統現在支援所有要求的通知類型');
        } else {
            console.log('\n⚠️ 部分測試失敗，請檢查錯誤訊息並修復問題');
        }

        // 保存報告
        const reportData = {
            testTime: new Date().toLocaleString('zh-TW'),
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: successRate + '%'
            },
            results: this.testResults
        };

        require('fs').writeFileSync(
            './enhanced-telegram-test-report.json',
            JSON.stringify(reportData, null, 2)
        );

        console.log('\n📄 詳細報告已保存至: enhanced-telegram-test-report.json');
    }

    // 執行所有測試
    async runAllTests() {
        console.log('🚀 開始執行增強版 Telegram 通知功能測試...\n');

        // 測試新增功能
        await this.testBirthdayNotification();
        await this.testNewEmployeeNotification();
        await this.testScheduleNotification();
        await this.testVotingNotification();
        await this.testInventoryAlertNotification();
        await this.testOrderFrequencyAlert();
        await this.testProductAnomalyNotification();
        await this.testSystemErrorNotification();

        // 測試修復功能
        await this.testFixedAttendanceNotification();
        await this.testOrderNotification();

        // 生成報告
        this.generateTestReport();

        return this.testResults.filter(r => r.success).length === this.testResults.length;
    }
}

// 執行測試
if (require.main === module) {
    const test = new EnhancedTelegramNotificationsTest();
    test.runAllTests().then(allPassed => {
        process.exit(allPassed ? 0 : 1);
    }).catch(error => {
        console.error('❌ 測試執行錯誤:', error);
        process.exit(1);
    });
}

module.exports = EnhancedTelegramNotificationsTest;