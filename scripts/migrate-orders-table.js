/**
 * 遷移orders表格以支援異常檢查功能
 * 添加store_id欄位
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔄 開始遷移orders表格...');

const dbPath = path.join(__dirname, '..', 'enterprise_system.db');
const db = new sqlite3.Database(dbPath);

async function migrateOrdersTable() {
    return new Promise((resolve, reject) => {
        // 開始事務
        db.serialize(() => {
            db.run('BEGIN TRANSACTION', (err) => {
                if (err) {
                    console.error('開始事務失敗:', err);
                    return reject(err);
                }
                
                console.log('✅ 事務開始');
                
                // 檢查store_id欄位是否存在
                db.get("PRAGMA table_info(orders)", (err, row) => {
                    if (err) {
                        console.error('檢查表結構失敗:', err);
                        db.run('ROLLBACK');
                        return reject(err);
                    }
                    
                    // 獲取所有欄位信息
                    db.all("PRAGMA table_info(orders)", (err, columns) => {
                        if (err) {
                            console.error('獲取表結構失敗:', err);
                            db.run('ROLLBACK');
                            return reject(err);
                        }
                        
                        console.log('📋 現有orders表欄位:');
                        columns.forEach(col => {
                            console.log(`   - ${col.name} (${col.type})`);
                        });
                        
                        // 檢查是否已有store_id欄位
                        const hasStoreId = columns.some(col => col.name === 'store_id');
                        
                        if (hasStoreId) {
                            console.log('✅ store_id欄位已存在，無需遷移');
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    console.error('提交事務失敗:', err);
                                    return reject(err);
                                }
                                resolve();
                            });
                            return;
                        }
                        
                        console.log('🔧 需要添加store_id欄位，開始遷移...');
                        
                        // 創建新的orders表
                        const createNewTableSQL = `
                            CREATE TABLE orders_new (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                uuid TEXT UNIQUE NOT NULL,
                                order_number TEXT UNIQUE NOT NULL,
                                product_id INTEGER NOT NULL,
                                store_id INTEGER,
                                requested_quantity INTEGER NOT NULL,
                                approved_quantity INTEGER,
                                unit_cost DECIMAL(10,2),
                                total_cost DECIMAL(15,2),
                                status TEXT DEFAULT 'pending',
                                urgency TEXT DEFAULT 'normal',
                                reason TEXT,
                                requested_by INTEGER NOT NULL,
                                approved_by INTEGER,
                                requested_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                                approved_date DATETIME,
                                delivery_date DATETIME,
                                supplier TEXT,
                                notes TEXT,
                                FOREIGN KEY (product_id) REFERENCES products(id),
                                FOREIGN KEY (store_id) REFERENCES stores(id),
                                FOREIGN KEY (requested_by) REFERENCES users(id),
                                FOREIGN KEY (approved_by) REFERENCES users(id)
                            )
                        `;
                        
                        db.run(createNewTableSQL, (err) => {
                            if (err) {
                                console.error('創建新表失敗:', err);
                                db.run('ROLLBACK');
                                return reject(err);
                            }
                            
                            console.log('✅ 新orders表創建成功');
                            
                            // 複製舊數據到新表 (store_id預設為1)
                            const copyDataSQL = `
                                INSERT INTO orders_new (
                                    id, uuid, order_number, product_id, store_id,
                                    requested_quantity, approved_quantity, unit_cost, total_cost,
                                    status, urgency, reason, requested_by, approved_by,
                                    requested_date, approved_date, delivery_date, supplier, notes
                                )
                                SELECT 
                                    id, uuid, order_number, product_id, 1 as store_id,
                                    requested_quantity, approved_quantity, unit_cost, total_cost,
                                    status, urgency, reason, requested_by, approved_by,
                                    requested_date, approved_date, delivery_date, supplier, notes
                                FROM orders
                            `;
                            
                            db.run(copyDataSQL, (err) => {
                                if (err) {
                                    console.error('複製數據失敗:', err);
                                    db.run('ROLLBACK');
                                    return reject(err);
                                }
                                
                                console.log('✅ 舊數據複製成功');
                                
                                // 刪除舊表
                                db.run('DROP TABLE orders', (err) => {
                                    if (err) {
                                        console.error('刪除舊表失敗:', err);
                                        db.run('ROLLBACK');
                                        return reject(err);
                                    }
                                    
                                    console.log('✅ 舊表已刪除');
                                    
                                    // 重命名新表
                                    db.run('ALTER TABLE orders_new RENAME TO orders', (err) => {
                                        if (err) {
                                            console.error('重命名表失敗:', err);
                                            db.run('ROLLBACK');
                                            return reject(err);
                                        }
                                        
                                        console.log('✅ 表重命名成功');
                                        
                                        // 提交事務
                                        db.run('COMMIT', (err) => {
                                            if (err) {
                                                console.error('提交事務失敗:', err);
                                                return reject(err);
                                            }
                                            
                                            console.log('✅ 遷移完成並提交');
                                            resolve();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

// 檢查products表是否有異常檢查欄位
async function checkProductsTable() {
    return new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(products)", (err, columns) => {
            if (err) {
                console.error('檢查products表失敗:', err);
                return reject(err);
            }
            
            console.log('\n📋 現有products表欄位:');
            columns.forEach(col => {
                console.log(`   - ${col.name} (${col.type})`);
            });
            
            const hasFrequentDays = columns.some(col => col.name === 'frequent_order_days');
            const hasRareDays = columns.some(col => col.name === 'rare_order_days');
            const hasDeliveryThreshold = columns.some(col => col.name === 'delivery_threshold');
            
            if (hasFrequentDays && hasRareDays && hasDeliveryThreshold) {
                console.log('✅ products表異常檢查欄位完整');
            } else {
                console.log('⚠️ products表缺少異常檢查欄位:');
                if (!hasFrequentDays) console.log('   - frequent_order_days');
                if (!hasRareDays) console.log('   - rare_order_days');
                if (!hasDeliveryThreshold) console.log('   - delivery_threshold');
            }
            
            resolve();
        });
    });
}

// 執行遷移
async function runMigration() {
    try {
        console.log('🔍 檢查orders表結構...');
        await migrateOrdersTable();
        
        console.log('\n🔍 檢查products表結構...');
        await checkProductsTable();
        
        console.log('\n🎉 資料庫遷移完成！');
        console.log('📝 遷移摘要:');
        console.log('   ✅ orders表添加了store_id欄位');
        console.log('   ✅ 現有訂單數據已保留 (store_id預設為1)');
        console.log('   ✅ 支援異常叫貨檢查功能');
        
    } catch (error) {
        console.error('❌ 遷移失敗:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('關閉資料庫失敗:', err);
            } else {
                console.log('📫 資料庫連接已關閉');
            }
        });
    }
}

// 如果作為主程序執行
if (require.main === module) {
    runMigration();
}

module.exports = { migrateOrdersTable, checkProductsTable };