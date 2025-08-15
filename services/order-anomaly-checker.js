/**
 * 異常叫貨檢查服務
 * 檢查品項叫貨頻率異常並發送通知
 */

const database = require('../database');
const TelegramNotificationSystem = require('../modules/telegram-notifications');

class OrderAnomalyChecker {
    constructor() {
        this.telegramNotifier = new TelegramNotificationSystem();
    }

    /**
     * 檢查所有品項的叫貨異常
     */
    async checkAllOrderAnomalies() {
        try {
            console.log('🔍 開始檢查叫貨異常...');
            
            // 獲取所有活躍品項
            const products = await database.query(`
                SELECT * FROM products 
                WHERE is_active = 1 
                AND (frequent_order_days > 0 OR rare_order_days > 0)
            `);

            console.log(`📦 檢查 ${products.length} 個品項的叫貨異常...`);

            const anomalies = [];

            for (const product of products) {
                // 檢查該品項的叫貨頻率異常
                const productAnomalies = await this.checkProductOrderAnomaly(product);
                if (productAnomalies.length > 0) {
                    anomalies.push(...productAnomalies);
                }
            }

            if (anomalies.length > 0) {
                console.log(`⚠️ 發現 ${anomalies.length} 個叫貨異常`);
                await this.sendAnomalyNotifications(anomalies);
            } else {
                console.log('✅ 未發現叫貨異常');
            }

            return anomalies;

        } catch (error) {
            console.error('檢查叫貨異常錯誤:', error);
            throw error;
        }
    }

    /**
     * 檢查特定品項的叫貨異常
     */
    async checkProductOrderAnomaly(product) {
        const anomalies = [];

        try {
            // 獲取該品項的最近叫貨記錄
            const recentOrders = await database.query(`
                SELECT 
                    o.*, s.name as store_name,
                    DATE(o.requested_date) as order_date
                FROM orders o
                LEFT JOIN stores s ON o.store_id = s.id
                WHERE o.product_id = ? 
                AND o.status IN ('approved', 'pending')
                ORDER BY o.requested_date DESC
                LIMIT 10
            `, [product.id]);

            // 檢查太久沒叫貨的異常
            const rareOrderAnomaly = await this.checkRareOrderAnomaly(product, recentOrders);
            if (rareOrderAnomaly) {
                anomalies.push(rareOrderAnomaly);
            }

            // 檢查叫貨過於頻繁的異常
            const frequentOrderAnomaly = await this.checkFrequentOrderAnomaly(product, recentOrders);
            if (frequentOrderAnomaly) {
                anomalies.push(frequentOrderAnomaly);
            }

        } catch (error) {
            console.error(`檢查品項 ${product.name} 異常錯誤:`, error);
        }

        return anomalies;
    }

    /**
     * 檢查太久沒叫貨的異常
     */
    async checkRareOrderAnomaly(product, recentOrders) {
        if (!product.rare_order_days || product.rare_order_days <= 0) {
            return null;
        }

        const today = new Date();
        const rareThresholdDate = new Date(today.getTime() - (product.rare_order_days * 24 * 60 * 60 * 1000));

        // 找最近的叫貨記錄
        const lastOrder = recentOrders.length > 0 ? recentOrders[0] : null;

        if (!lastOrder) {
            // 從未叫過貨
            return {
                type: 'rare_order',
                product_id: product.id,
                product_name: product.name,
                brand: product.supplier,
                store_name: '全部分店',
                last_order_date: null,
                last_order_quantity: 0,
                anomaly_days: Math.ceil((today - new Date(product.created_at)) / (24 * 60 * 60 * 1000)),
                threshold_days: product.rare_order_days,
                message: `${product.name} 從未叫貨，已超過 ${product.rare_order_days} 天標準`
            };
        }

        const lastOrderDate = new Date(lastOrder.requested_date);

        if (lastOrderDate < rareThresholdDate) {
            const daysSinceLastOrder = Math.ceil((today - lastOrderDate) / (24 * 60 * 60 * 1000));

            return {
                type: 'rare_order',
                product_id: product.id,
                product_name: product.name,
                brand: product.supplier,
                store_name: lastOrder.store_name,
                last_order_date: lastOrderDate.toISOString().split('T')[0],
                last_order_quantity: lastOrder.requested_quantity,
                anomaly_days: daysSinceLastOrder,
                threshold_days: product.rare_order_days,
                message: `${lastOrder.store_name} ${product.name} 進貨異常，上次進貨日期 ${lastOrder.requested_date.split('T')[0]}，上次進貨數量 ${product.name}${lastOrder.requested_quantity}${product.unit}，異常天數 ${daysSinceLastOrder}`
            };
        }

        return null;
    }

    /**
     * 檢查叫貨過於頻繁的異常
     */
    async checkFrequentOrderAnomaly(product, recentOrders) {
        if (!product.frequent_order_days || product.frequent_order_days <= 0 || recentOrders.length < 2) {
            return null;
        }

        const today = new Date();
        const frequentThresholdDate = new Date(today.getTime() - (product.frequent_order_days * 24 * 60 * 60 * 1000));

        // 計算在頻繁檢查期間內的叫貨次數
        const recentFrequentOrders = recentOrders.filter(order => {
            const orderDate = new Date(order.requested_date);
            return orderDate >= frequentThresholdDate;
        });

        // 如果在短期間內叫貨次數過多
        if (recentFrequentOrders.length > 1) {
            const totalQuantity = recentFrequentOrders.reduce((sum, order) => sum + order.requested_quantity, 0);
            const avgDaysBetweenOrders = product.frequent_order_days / recentFrequentOrders.length;

            return {
                type: 'frequent_order',
                product_id: product.id,
                product_name: product.name,
                brand: product.supplier,
                store_name: recentFrequentOrders[0].store_name,
                recent_orders_count: recentFrequentOrders.length,
                total_quantity: totalQuantity,
                period_days: product.frequent_order_days,
                avg_days_between: Math.round(avgDaysBetweenOrders * 10) / 10,
                threshold_days: product.frequent_order_days,
                message: `${recentFrequentOrders[0].store_name} ${product.name} 已經${product.frequent_order_days}天內頻繁叫貨，最近叫貨${recentFrequentOrders.length}次，總數量${totalQuantity}${product.unit}`
            };
        }

        return null;
    }

    /**
     * 發送異常通知
     */
    async sendAnomalyNotifications(anomalies) {
        try {
            // 按分店和異常類型分組
            const groupedAnomalies = this.groupAnomaliesByStoreAndType(anomalies);

            for (const [storeType, storeAnomalies] of Object.entries(groupedAnomalies)) {
                for (const [anomalyType, typeAnomalies] of Object.entries(storeAnomalies)) {
                    if (anomalyType === 'rare_order') {
                        await this.sendRareOrderNotifications(typeAnomalies);
                    } else if (anomalyType === 'frequent_order') {
                        await this.sendFrequentOrderNotifications(typeAnomalies);
                    }
                }
            }

        } catch (error) {
            console.error('發送異常通知錯誤:', error);
        }
    }

    /**
     * 發送太久沒叫貨通知
     */
    async sendRareOrderNotifications(anomalies) {
        for (const anomaly of anomalies) {
            await this.telegramNotifier.sendOrderFrequencyAlert({
                type: 'too_rare',
                product_name: anomaly.product_name,
                brand: anomaly.brand,
                frequency_days: anomaly.anomaly_days,
                normal_frequency_days: anomaly.threshold_days,
                last_purchase_date: anomaly.last_order_date,
                recent_purchases: 0,
                total_store_demand: '未統計',
                current_total_stock: '請檢查',
                recommendation: `${anomaly.product_name} 已 ${anomaly.anomaly_days} 天未叫貨，建議盡快安排進貨`,
                supplier_name: anomaly.brand
            });

            // 記錄通知日誌
            await database.run(`
                INSERT INTO system_logs (uuid, user_id, action, target_type, target_id, details)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                require('uuid').v4(), 1, 'order_anomaly_alert', 'product', 
                anomaly.product_id.toString(), anomaly.message
            ]);
        }
    }

    /**
     * 發送叫貨過於頻繁通知
     */
    async sendFrequentOrderNotifications(anomalies) {
        for (const anomaly of anomalies) {
            await this.telegramNotifier.sendOrderFrequencyAlert({
                type: 'too_frequent',
                product_name: anomaly.product_name,
                brand: anomaly.brand,
                frequency_days: anomaly.avg_days_between,
                normal_frequency_days: anomaly.threshold_days,
                last_purchase_date: new Date().toISOString().split('T')[0],
                recent_purchases: anomaly.recent_orders_count,
                total_store_demand: anomaly.total_quantity,
                current_total_stock: '請檢查',
                recommendation: `${anomaly.product_name} 在 ${anomaly.period_days} 天內叫貨 ${anomaly.recent_orders_count} 次，頻率較高，請檢查是否必要`,
                supplier_name: anomaly.brand
            });

            // 記錄通知日誌
            await database.run(`
                INSERT INTO system_logs (uuid, user_id, action, target_type, target_id, details)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                require('uuid').v4(), 1, 'order_anomaly_alert', 'product', 
                anomaly.product_id.toString(), anomaly.message
            ]);
        }
    }

    /**
     * 按分店和異常類型分組
     */
    groupAnomaliesByStoreAndType(anomalies) {
        const grouped = {};

        for (const anomaly of anomalies) {
            const storeKey = anomaly.store_name || 'unknown';
            const typeKey = anomaly.type;

            if (!grouped[storeKey]) {
                grouped[storeKey] = {};
            }

            if (!grouped[storeKey][typeKey]) {
                grouped[storeKey][typeKey] = [];
            }

            grouped[storeKey][typeKey].push(anomaly);
        }

        return grouped;
    }

    /**
     * 執行定期檢查 (可用於定時任務)
     */
    async runScheduledCheck() {
        try {
            console.log('⏰ 執行定期叫貨異常檢查...');
            const anomalies = await this.checkAllOrderAnomalies();
            
            console.log(`📊 檢查完成，發現 ${anomalies.length} 個異常`);
            
            return {
                success: true,
                anomaliesFound: anomalies.length,
                anomalies: anomalies
            };

        } catch (error) {
            console.error('定期檢查失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = OrderAnomalyChecker;