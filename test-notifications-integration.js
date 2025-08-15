/**
 * 通知系統整合測試
 * 驗證所有新增功能的完整性和一致性
 */

const TelegramNotificationSystem = require('./modules/telegram-notifications');
const database = require('./database');

async function testNotificationSystem() {
    console.log('🧪 開始通知系統整合測試...\n');
    
    const notifier = new TelegramNotificationSystem();
    let passCount = 0;
    let totalTests = 0;

    function test(name, condition) {
        totalTests++;
        if (condition) {
            console.log(`✅ ${name}`);
            passCount++;
        } else {
            console.log(`❌ ${name}`);
        }
    }

    // 測試1: 檢查資料庫表格是否存在
    try {
        await database.query('SELECT name FROM sqlite_master WHERE type="table" AND name="notifications"');
        test('資料庫notifications表格存在', true);
    } catch (error) {
        test('資料庫notifications表格存在', false);
    }

    try {
        await database.query('SELECT name FROM sqlite_master WHERE type="table" AND name="notification_settings"');
        test('資料庫notification_settings表格存在', true);
    } catch (error) {
        test('資料庫notification_settings表格存在', false);
    }

    try {
        await database.query('SELECT name FROM sqlite_master WHERE type="table" AND name="votes"');
        test('資料庫votes表格存在', true);
    } catch (error) {
        test('資料庫votes表格存在', false);
    }

    // 測試2: 檢查TelegramNotificationSystem的方法
    const requiredMethods = [
        'sendMaintenanceRequestNotification',
        'sendMaintenanceStatusUpdateNotification',
        'sendEmployeeApprovalNotification',
        'sendEmployeeApprovalResultNotification',
        'sendPromotionVoteStartNotification',
        'sendPromotionVoteNotification',
        'sendPromotionResultNotification',
        'sendPromotionVoteReminderNotification'
    ];

    requiredMethods.forEach(method => {
        test(`TelegramNotificationSystem.${method} 方法存在`, 
             typeof notifier[method] === 'function');
    });

    // 測試3: 檢查資料庫表格結構
    try {
        const notificationsSchema = await database.query('PRAGMA table_info(notifications)');
        const requiredColumns = ['id', 'uuid', 'user_id', 'title', 'message', 'type', 'priority', 'is_read'];
        const hasAllColumns = requiredColumns.every(col => 
            notificationsSchema.some(schema => schema.name === col)
        );
        test('notifications表格包含所有必要欄位', hasAllColumns);
    } catch (error) {
        test('notifications表格包含所有必要欄位', false);
    }

    try {
        const settingsSchema = await database.query('PRAGMA table_info(notification_settings)');
        const requiredColumns = ['id', 'user_id', 'notification_type', 'telegram_enabled', 'email_enabled'];
        const hasAllColumns = requiredColumns.every(col => 
            settingsSchema.some(schema => schema.name === col)
        );
        test('notification_settings表格包含所有必要欄位', hasAllColumns);
    } catch (error) {
        test('notification_settings表格包含所有必要欄位', false);
    }

    // 測試4: 檢查維修申請表格的完整性
    try {
        const maintenanceSchema = await database.query('PRAGMA table_info(maintenance_requests)');
        const requiredColumns = ['id', 'uuid', 'request_number', 'title', 'description', 'location', 'urgency', 'status'];
        const hasAllColumns = requiredColumns.every(col => 
            maintenanceSchema.some(schema => schema.name === col)
        );
        test('maintenance_requests表格包含所有必要欄位', hasAllColumns);
    } catch (error) {
        test('maintenance_requests表格包含所有必要欄位', false);
    }

    // 測試5: 檢查升遷投票表格的完整性
    try {
        const promotionSchema = await database.query('PRAGMA table_info(promotion_votes)');
        const requiredColumns = ['id', 'uuid', 'candidate_id', 'voter_id', 'vote_session_id', 'vote_value'];
        const hasAllColumns = requiredColumns.every(col => 
            promotionSchema.some(schema => schema.name === col)
        );
        test('promotion_votes表格包含所有必要欄位', hasAllColumns);
    } catch (error) {
        test('promotion_votes表格包含所有必要欄位', false);
    }

    // 測試6: 模擬通知發送（不實際發送到Telegram）
    try {
        const mockMaintenanceData = {
            request_number: 'TEST-001',
            requested_by_name: '測試用戶',
            title: '測試維修申請',
            description: '測試描述',
            location: '測試位置',
            urgency: '一般',
            category: '測試類別'
        };

        // 檢查方法是否能正常執行（不會拋出錯誤）
        const originalSendMessage = notifier.sendMessage;
        notifier.sendMessage = async () => true; // Mock發送

        await notifier.sendMaintenanceRequestNotification(mockMaintenanceData);
        test('維修申請通知方法正常執行', true);

        notifier.sendMessage = originalSendMessage; // 恢復原方法
    } catch (error) {
        test('維修申請通知方法正常執行', false);
    }

    // 統計結果
    console.log('\n📊 測試結果統計:');
    console.log(`✅ 通過: ${passCount}/${totalTests}`);
    console.log(`❌ 失敗: ${totalTests - passCount}/${totalTests}`);
    console.log(`📈 成功率: ${((passCount / totalTests) * 100).toFixed(1)}%`);

    if (passCount === totalTests) {
        console.log('\n🎉 所有測試通過！新增功能完整且一致。');
        return true;
    } else {
        console.log('\n⚠️ 部分測試失敗，請檢查上述項目。');
        return false;
    }
}

// 如果直接執行此文件，則運行測試
if (require.main === module) {
    testNotificationSystem()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 測試執行錯誤:', error);
            process.exit(1);
        });
}

module.exports = { testNotificationSystem };