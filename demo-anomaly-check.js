/**
 * 異常叫貨檢查功能示範
 * 展示完整的異常檢查流程
 */

console.log('🚀 GClaude企業系統 - 異常叫貨檢查功能示範');
console.log('═══════════════════════════════════════════════════════');

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'enterprise_system.db');

// 示範數據
const demoData = {
    // 測試商品
    products: [
        {
            code: 'DEMO001',
            name: '示範雞排', 
            category: '食材',
            unit: '包',
            current_stock: 25,
            min_stock: 10,
            unit_cost: 120,
            supplier: '優質食材供應商',
            frequent_order_days: 1,  // 1天內多次叫貨算頻繁
            rare_order_days: 3,      // 3天沒叫貨算異常
            delivery_threshold: 800
        },
        {
            code: 'DEMO002',
            name: '示範珍珠奶茶',
            category: '飲料原料', 
            unit: '盒',
            current_stock: 15,
            min_stock: 5,
            unit_cost: 80,
            supplier: '飲料原料商',
            frequent_order_days: 2,  // 2天內多次叫貨算頻繁
            rare_order_days: 7,      // 7天沒叫貨算異常
            delivery_threshold: 500
        }
    ],
    
    // 模擬叫貨記錄
    orders: [
        {
            product_code: 'DEMO001',
            store_name: '內壢忠孝店',
            quantity: 10,
            days_ago: 5,  // 5天前叫過貨
            reason: '店內庫存不足'
        },
        {
            product_code: 'DEMO001', 
            store_name: '內壢忠孝店',
            quantity: 8,
            days_ago: 6,  // 6天前也叫過貨
            reason: '補充安全庫存'
        }
    ]
};

class AnomalyCheckDemo {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
    }

    async setupDemoData() {
        console.log('\n📦 設定示範數據...');
        
        // 插入示範商品
        for (const product of demoData.products) {
            await this.insertProduct(product);
        }
        
        // 插入示範訂單
        for (const order of demoData.orders) {
            await this.insertOrder(order);
        }
        
        console.log('✅ 示範數據設定完成');
    }
    
    async insertProduct(product) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT OR REPLACE INTO products (
                    uuid, code, name, category, unit, current_stock, min_stock, 
                    unit_cost, supplier, frequent_order_days, rare_order_days, delivery_threshold
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [
                uuidv4(), product.code, product.name, product.category, product.unit,
                product.current_stock, product.min_stock, product.unit_cost, product.supplier,
                product.frequent_order_days, product.rare_order_days, product.delivery_threshold
            ], (err) => {
                if (err) {
                    console.error(`插入商品 ${product.name} 失敗:`, err.message);
                    reject(err);
                } else {
                    console.log(`   ✓ 商品已添加: ${product.name}`);
                    resolve();
                }
            });
        });
    }
    
    async insertOrder(order) {
        return new Promise((resolve, reject) => {
            // 先獲取商品ID和分店ID
            this.db.get('SELECT id FROM products WHERE code = ?', [order.product_code], (err, product) => {
                if (err || !product) {
                    console.error(`找不到商品: ${order.product_code}`);
                    return resolve();
                }
                
                this.db.get('SELECT id FROM stores WHERE name = ?', [order.store_name], (err, store) => {
                    if (err || !store) {
                        console.error(`找不到分店: ${order.store_name}`);
                        return resolve();
                    }
                    
                    const orderDate = new Date();
                    orderDate.setDate(orderDate.getDate() - order.days_ago);
                    
                    const sql = `
                        INSERT INTO orders (
                            uuid, order_number, product_id, store_id, requested_quantity,
                            approved_quantity, status, reason, requested_by, requested_date
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    this.db.run(sql, [
                        uuidv4(),
                        `DEMO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        product.id, store.id, order.quantity, order.quantity,
                        'approved', order.reason, 1, orderDate.toISOString()
                    ], (err) => {
                        if (err) {
                            console.error(`插入訂單失敗:`, err.message);
                            reject(err);
                        } else {
                            console.log(`   ✓ 訂單已添加: ${order.store_name} - ${order.quantity}${demoData.products.find(p => p.code === order.product_code)?.unit || '個'}`);
                            resolve();
                        }
                    });
                });
            });
        });
    }
    
    async runAnomalyCheck() {
        console.log('\n🔍 執行異常叫貨檢查...');
        
        // 獲取所有監控商品
        const products = await this.query(`
            SELECT * FROM products 
            WHERE is_active = 1 
            AND (frequent_order_days > 0 OR rare_order_days > 0)
        `);
        
        console.log(`📋 監控商品: ${products.length} 個`);
        
        const anomalies = [];
        
        for (const product of products) {
            console.log(`\n📦 檢查商品: ${product.name}`);
            console.log(`   異常設定: 頻繁=${product.frequent_order_days}天, 稀少=${product.rare_order_days}天`);
            
            // 獲取最近的叫貨記錄
            const orders = await this.query(`
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
            
            console.log(`   最近叫貨記錄: ${orders.length} 筆`);
            
            // 檢查太久沒叫貨異常
            const rareAnomaly = this.checkRareOrderAnomaly(product, orders);
            if (rareAnomaly) {
                anomalies.push(rareAnomaly);
                console.log(`   ⚠️  太久沒叫貨異常: ${rareAnomaly.message}`);
            }
            
            // 檢查叫貨頻繁異常
            const frequentAnomaly = this.checkFrequentOrderAnomaly(product, orders);
            if (frequentAnomaly) {
                anomalies.push(frequentAnomaly);
                console.log(`   ⚠️  叫貨頻繁異常: ${frequentAnomaly.message}`);
            }
            
            if (!rareAnomaly && !frequentAnomaly) {
                console.log(`   ✅ 叫貨頻率正常`);
            }
        }
        
        return anomalies;
    }
    
    checkRareOrderAnomaly(product, orders) {
        if (!product.rare_order_days || product.rare_order_days <= 0) {
            return null;
        }
        
        const today = new Date();
        const rareThresholdDate = new Date(today.getTime() - (product.rare_order_days * 24 * 60 * 60 * 1000));
        
        if (orders.length === 0) {
            // 從未叫過貨
            const daysSinceCreation = Math.ceil((today - new Date(product.created_at)) / (24 * 60 * 60 * 1000));
            if (daysSinceCreation > product.rare_order_days) {
                return {
                    type: 'rare_order',
                    product_name: product.name,
                    anomaly_days: daysSinceCreation,
                    threshold_days: product.rare_order_days,
                    message: `${product.name} 從未叫貨，已 ${daysSinceCreation} 天 (標準: ${product.rare_order_days} 天)`
                };
            }
        } else {
            // 檢查最後一次叫貨時間
            const lastOrder = orders[0];
            const lastOrderDate = new Date(lastOrder.requested_date);
            
            if (lastOrderDate < rareThresholdDate) {
                const daysSinceLastOrder = Math.ceil((today - lastOrderDate) / (24 * 60 * 60 * 1000));
                return {
                    type: 'rare_order',
                    product_name: product.name,
                    store_name: lastOrder.store_name,
                    last_order_date: lastOrder.order_date,
                    last_order_quantity: lastOrder.requested_quantity,
                    anomaly_days: daysSinceLastOrder,
                    threshold_days: product.rare_order_days,
                    message: `${lastOrder.store_name} ${product.name} 已 ${daysSinceLastOrder} 天未叫貨 (上次: ${lastOrder.order_date}, ${lastOrder.requested_quantity}${product.unit})`
                };
            }
        }
        
        return null;
    }
    
    checkFrequentOrderAnomaly(product, orders) {
        if (!product.frequent_order_days || product.frequent_order_days <= 0 || orders.length < 2) {
            return null;
        }
        
        const today = new Date();
        const frequentThresholdDate = new Date(today.getTime() - (product.frequent_order_days * 24 * 60 * 60 * 1000));
        
        // 計算在頻繁檢查期間內的叫貨次數
        const recentOrders = orders.filter(order => {
            const orderDate = new Date(order.requested_date);
            return orderDate >= frequentThresholdDate;
        });
        
        if (recentOrders.length > 1) {
            const totalQuantity = recentOrders.reduce((sum, order) => sum + order.requested_quantity, 0);
            
            return {
                type: 'frequent_order',
                product_name: product.name,
                store_name: recentOrders[0].store_name,
                recent_orders_count: recentOrders.length,
                total_quantity: totalQuantity,
                period_days: product.frequent_order_days,
                message: `${recentOrders[0].store_name} ${product.name} 在 ${product.frequent_order_days} 天內叫貨 ${recentOrders.length} 次，總計 ${totalQuantity}${product.unit}`
            };
        }
        
        return null;
    }
    
    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
    
    close() {
        this.db.close();
    }
}

async function main() {
    const demo = new AnomalyCheckDemo();
    
    try {
        await demo.setupDemoData();
        
        const anomalies = await demo.runAnomalyCheck();
        
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('📊 異常檢查結果摘要');
        console.log('═══════════════════════════════════════════════════════');
        
        if (anomalies.length === 0) {
            console.log('✅ 所有商品叫貨頻率正常，未發現異常');
        } else {
            console.log(`⚠️  發現 ${anomalies.length} 個異常叫貨情況:`);
            console.log('');
            
            anomalies.forEach((anomaly, index) => {
                console.log(`${index + 1}. 【${anomaly.type === 'rare_order' ? '太久沒叫貨' : '叫貨過於頻繁'}】`);
                console.log(`   商品: ${anomaly.product_name}`);
                console.log(`   訊息: ${anomaly.message}`);
                
                if (anomaly.store_name) {
                    console.log(`   分店: ${anomaly.store_name}`);
                }
                
                if (anomaly.anomaly_days) {
                    console.log(`   異常天數: ${anomaly.anomaly_days} 天 (標準: ${anomaly.threshold_days} 天)`);
                }
                console.log('');
            });
            
            console.log('💡 建議處理方式:');
            console.log('   - 太久沒叫貨: 聯繫分店確認是否需要補貨');
            console.log('   - 叫貨過於頻繁: 檢查是否有異常消耗或庫存管理問題');
        }
        
        console.log('\n🎯 系統功能特色:');
        console.log('   ✓ 自動監控所有品項的叫貨頻率');
        console.log('   ✓ 可自訂每個品項的異常天數標準');
        console.log('   ✓ 支援 Telegram 自動通知管理員');
        console.log('   ✓ 完整的 API 端點供前端調用');
        console.log('   ✓ 定時檢查機制 (每日上午9點/下午6點)');
        console.log('');
        
        console.log('🚀 API 端點:');
        console.log('   POST /api/admin/check-order-anomalies    手動觸發檢查');
        console.log('   GET  /api/admin/anomaly-checker/status   檢查器狀態');
        console.log('   GET  /api/admin/order-anomalies/history  異常記錄查詢');
        
    } catch (error) {
        console.error('❌ 示範過程發生錯誤:', error.message);
    } finally {
        demo.close();
        console.log('\n✅ 異常叫貨檢查功能示範完成');
    }
}

// 執行示範
if (require.main === module) {
    main();
}

module.exports = AnomalyCheckDemo;