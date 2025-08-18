/**
 * 🔍 定時異常檢測服務
 * 根據系統邏輯.txt要求實現品項叫貨異常檢測
 */

const cron = require('node-cron');
const Database = require('../database/json-database');
const TelegramNotifier = require('../modules/telegram-notifier');

class ScheduledAnomalyDetector {
    constructor() {
        this.db = new Database();
        this.telegramNotifier = new TelegramNotifier();
        this.isRunning = false;
        this.lastCheckTime = null;
        
        // 定時任務配置：每天上午8:00檢查
        this.cronExpression = '0 8 * * *'; // 每天早上8點
        
        console.log('📍 定時異常檢測服務已初始化');
    }

    /**
     * 啟動定時檢測服務
     */
    start() {
        console.log('🚀 啟動定時異常檢測服務...');
        
        // 立即執行一次檢測
        this.performAnomalyCheck()
            .then(() => console.log('✅ 初始異常檢測完成'))
            .catch(err => console.error('❌ 初始異常檢測失敗:', err));
        
        // 設定定時任務
        this.scheduledTask = cron.schedule(this.cronExpression, async () => {
            console.log('⏰ 定時異常檢測觸發...');
            await this.performAnomalyCheck();
        }, {
            scheduled: true,
            timezone: "Asia/Taipei"
        });
        
        this.isRunning = true;
        console.log(`✅ 定時異常檢測已啟動，將於每天上午8:00執行`);
    }

    /**
     * 停止定時檢測服務
     */
    stop() {
        if (this.scheduledTask) {
            this.scheduledTask.stop();
            this.isRunning = false;
            console.log('⏹️ 定時異常檢測服務已停止');
        }
    }

    /**
     * 執行異常檢測
     */
    async performAnomalyCheck() {
        try {
            console.log('🔍 開始執行異常叫貨檢測...');
            this.lastCheckTime = new Date().toISOString();
            
            // 獲取所有分店
            const stores = await this.db.readTable('stores') || [];
            if (stores.length === 0) {
                console.log('⚠️ 未找到分店資料，跳過檢測');
                return;
            }

            // 獲取所有商品和異常設定
            const products = await this.db.readTable('products') || [];
            const anomalySettings = await this.db.readTable('item_anomaly_settings') || [];
            
            if (products.length === 0) {
                console.log('⚠️ 未找到商品資料，跳過檢測');
                return;
            }

            // 獲取叫貨記錄
            const orders = await this.db.readTable('orders') || [];
            
            const allAnomalies = [];

            // 對每個分店檢查異常
            for (const store of stores) {
                console.log(`🏪 檢測分店: ${store.name}`);
                const storeAnomalies = await this.detectStoreAnomalies(store, products, orders, anomalySettings);
                allAnomalies.push(...storeAnomalies);
            }

            console.log(`🔍 檢測結果: 發現 ${allAnomalies.length} 個異常`);

            // 發送Telegram通知
            if (allAnomalies.length > 0) {
                await this.sendAnomalyNotifications(allAnomalies);
            } else {
                console.log('✅ 所有分店叫貨狀況正常');
            }

            // 記錄檢測歷史
            await this.recordDetectionHistory(allAnomalies);

        } catch (error) {
            console.error('❌ 異常檢測過程中發生錯誤:', error);
            
            // 發送錯誤通知
            await this.sendErrorNotification(error);
        }
    }

    /**
     * 檢測單個分店的異常
     */
    async detectStoreAnomalies(store, products, orders, anomalySettings) {
        const storeOrders = orders.filter(order => order.store_id === store.id);
        const anomalies = [];
        const today = new Date();

        // 檢查每個商品的叫貨情況
        for (const product of products) {
            // 獲取該商品的異常設定
            const setting = anomalySettings.find(s => 
                s.product_name === product.name || 
                s.product_id === product.id
            ) || {
                frequent_order_days: 1,  // 預設值：1天內叫貨算頻繁
                rare_order_days: 7       // 預設值：7天沒叫貨算異常
            };

            // 找到該商品在該分店的所有叫貨記錄
            const productOrders = storeOrders.filter(order => 
                order.items && order.items.some(item => 
                    item.product_name === product.name ||
                    item.name === product.name
                )
            ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            if (productOrders.length === 0) {
                // 從未叫過貨
                anomalies.push({
                    type: 'never_ordered',
                    store_id: store.id,
                    store_name: store.name,
                    product_name: product.name,
                    message: `${store.name} ${product.name} 從未叫貨`,
                    severity: 'medium',
                    detected_at: today.toISOString()
                });
                continue;
            }

            // 檢查太久沒叫貨（稀少異常）
            const lastOrder = productOrders[0];
            const lastOrderDate = new Date(lastOrder.created_at);
            const daysSinceLastOrder = Math.floor((today - lastOrderDate) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastOrder >= setting.rare_order_days) {
                // 計算上次叫貨數量
                const lastOrderQuantity = lastOrder.items
                    .filter(item => item.product_name === product.name || item.name === product.name)
                    .reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

                anomalies.push({
                    type: 'rare_ordering',
                    store_id: store.id,
                    store_name: store.name,
                    product_name: product.name,
                    last_order_date: lastOrderDate.toISOString().split('T')[0],
                    last_order_quantity: lastOrderQuantity,
                    days_since_last: daysSinceLastOrder,
                    threshold_days: setting.rare_order_days,
                    message: `${store.name} ${product.name}進貨異常 上次進貨日期 ${lastOrderDate.toISOString().split('T')[0]} 上次進貨數量 ${product.name}${lastOrderQuantity}包 異常天數 ${daysSinceLastOrder}`,
                    severity: 'high',
                    detected_at: today.toISOString()
                });
            }

            // 檢查叫貨太頻繁（頻繁異常）
            const recentDays = setting.frequent_order_days;
            const recentDate = new Date();
            recentDate.setDate(today.getDate() - recentDays);
            
            const recentOrders = productOrders.filter(order => 
                new Date(order.created_at) >= recentDate
            );
            
            if (recentOrders.length > 2) { // 超過2次算頻繁
                const totalQuantity = recentOrders.reduce((sum, order) => {
                    return sum + order.items
                        .filter(item => item.product_name === product.name || item.name === product.name)
                        .reduce((itemSum, item) => itemSum + (parseInt(item.quantity) || 0), 0);
                }, 0);

                anomalies.push({
                    type: 'frequent_ordering',
                    store_id: store.id,
                    store_name: store.name,
                    product_name: product.name,
                    recent_orders_count: recentOrders.length,
                    recent_days: recentDays,
                    total_quantity: totalQuantity,
                    message: `${store.name} ${product.name} 已經${recentDays}天內頻繁叫貨 總次數 ${recentOrders.length}次 總數量 ${totalQuantity}包`,
                    severity: 'medium',
                    detected_at: today.toISOString()
                });
            }
        }

        return anomalies;
    }

    /**
     * 發送異常通知
     */
    async sendAnomalyNotifications(anomalies) {
        try {
            // 按分店分組異常
            const anomaliesByStore = anomalies.reduce((acc, anomaly) => {
                const storeKey = anomaly.store_name;
                if (!acc[storeKey]) {
                    acc[storeKey] = [];
                }
                acc[storeKey].push(anomaly);
                return acc;
            }, {});

            // 生成老闆通知訊息
            let bossMessage = '🚨 叫貨異常檢測報告\n';
            bossMessage += `📅 檢測時間: ${new Date().toLocaleString('zh-TW')}\n\n`;

            for (const [storeName, storeAnomalies] of Object.entries(anomaliesByStore)) {
                bossMessage += `🏪 ${storeName}:\n`;
                
                storeAnomalies.forEach(anomaly => {
                    switch (anomaly.type) {
                        case 'rare_ordering':
                            bossMessage += `   ⚠️ ${anomaly.message}\n`;
                            break;
                        case 'frequent_ordering':
                            bossMessage += `   🔄 ${anomaly.message}\n`;
                            break;
                        case 'never_ordered':
                            bossMessage += `   ❌ ${anomaly.message}\n`;
                            break;
                    }
                });
                bossMessage += '\n';
            }

            bossMessage += `📊 總計發現 ${anomalies.length} 個異常\n`;
            bossMessage += '🔍 請檢查庫存和進貨計劃';

            // 發送Telegram通知
            await this.telegramNotifier.sendBossNotification(bossMessage);
            console.log('✅ 異常檢測Telegram通知已發送');

            // 生成員工簡化通知
            const employeeMessage = `🔍 叫貨異常提醒\n📅 ${new Date().toLocaleDateString('zh-TW')}\n\n` +
                `發現 ${anomalies.length} 個叫貨異常，請注意庫存狀況\n` +
                `詳細資訊請洽詢管理員`;

            await this.telegramNotifier.sendEmployeeNotification(employeeMessage);

        } catch (error) {
            console.error('❌ 發送異常通知失敗:', error);
        }
    }

    /**
     * 發送錯誤通知
     */
    async sendErrorNotification(error) {
        try {
            const errorMessage = `🚨 異常檢測系統錯誤\n` +
                `⏰ 時間: ${new Date().toLocaleString('zh-TW')}\n` +
                `❌ 錯誤: ${error.message}\n` +
                `🔧 請檢查系統狀態`;

            await this.telegramNotifier.sendBossNotification(errorMessage);
        } catch (notifyError) {
            console.error('❌ 發送錯誤通知失敗:', notifyError);
        }
    }

    /**
     * 記錄檢測歷史
     */
    async recordDetectionHistory(anomalies) {
        try {
            const detectionHistory = await this.db.readTable('anomaly_detection_history') || [];
            
            const historyRecord = {
                id: Date.now(),
                detection_time: this.lastCheckTime,
                anomalies_count: anomalies.length,
                anomalies: anomalies,
                detector_version: '1.0.0',
                created_at: new Date().toISOString()
            };

            detectionHistory.push(historyRecord);
            
            // 只保留最近30天的記錄
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const filteredHistory = detectionHistory.filter(record => 
                new Date(record.created_at) >= thirtyDaysAgo
            );

            await this.db.writeTable('anomaly_detection_history', filteredHistory);
            console.log('📝 異常檢測歷史已記錄');

        } catch (error) {
            console.error('❌ 記錄檢測歷史失敗:', error);
        }
    }

    /**
     * 手動觸發檢測
     */
    async triggerManualCheck() {
        console.log('🔧 手動觸發異常檢測...');
        await this.performAnomalyCheck();
    }

    /**
     * 獲取檢測狀態
     */
    getStatus() {
        return {
            running: this.isRunning,
            last_check: this.lastCheckTime,
            next_check: this.scheduledTask ? this.scheduledTask.getNextDate() : null,
            cron_expression: this.cronExpression
        };
    }
}

// 如果直接執行此檔案，啟動檢測服務
if (require.main === module) {
    const detector = new ScheduledAnomalyDetector();
    detector.start();
    
    // 監聽程序退出信號
    process.on('SIGINT', () => {
        console.log('\n🛑 收到退出信號，停止異常檢測服務...');
        detector.stop();
        process.exit(0);
    });
    
    console.log('🎯 定時異常檢測服務已啟動，按 Ctrl+C 退出');
}

module.exports = ScheduledAnomalyDetector;