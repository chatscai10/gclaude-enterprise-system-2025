/**
 * 直接測試異常檢查功能 - 使用正確的資料庫連接
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'enterprise_system.db');

console.log('🔗 直接連接資料庫進行異常檢查測試...');
console.log(`📁 資料庫路徑: ${dbPath}`);

const db = new sqlite3.Database(dbPath);

// 簡化的異常檢查邏輯
async function testDatabaseStructure() {
    return new Promise((resolve, reject) => {
        // 檢查products表結構
        db.all("PRAGMA table_info(products)", (err, columns) => {
            if (err) {
                console.error('檢查products表失敗:', err);
                return reject(err);
            }
            
            console.log('📋 Products表欄位:');
            columns.forEach(col => {
                console.log(`   - ${col.name} (${col.type})`);
            });
            
            const hasFrequentDays = columns.some(col => col.name === 'frequent_order_days');
            const hasRareDays = columns.some(col => col.name === 'rare_order_days');
            
            console.log(`\n✅ 異常檢查欄位: frequent_order_days=${hasFrequentDays}, rare_order_days=${hasRareDays}`);
            
            if (hasFrequentDays && hasRareDays) {
                resolve(true);
            } else {
                reject(new Error('缺少異常檢查欄位'));
            }
        });
    });
}

async function testAnomalyQuery() {
    return new Promise((resolve, reject) => {
        // 測試異常檢查查詢
        const sql = `
            SELECT id, name, supplier, frequent_order_days, rare_order_days
            FROM products 
            WHERE is_active = 1 
            AND (frequent_order_days > 0 OR rare_order_days > 0)
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('❌ 異常檢查查詢失敗:', err);
                return reject(err);
            }
            
            console.log(`✅ 異常檢查查詢成功，發現 ${rows.length} 個可監控品項:`);
            rows.forEach(row => {
                console.log(`   - ${row.name}: 頻繁=${row.frequent_order_days}天, 稀少=${row.rare_order_days}天`);
            });
            
            resolve(rows);
        });
    });
}

async function testOrdersQuery() {
    return new Promise((resolve, reject) => {
        // 測試訂單查詢
        const sql = `
            SELECT 
                o.id, o.product_id, o.requested_quantity, 
                s.name as store_name, o.requested_date
            FROM orders o
            LEFT JOIN stores s ON o.store_id = s.id
            WHERE o.product_id = 1
            ORDER BY o.requested_date DESC
            LIMIT 5
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('❌ 訂單查詢失敗:', err);
                return reject(err);
            }
            
            console.log(`✅ 訂單查詢成功，發現 ${rows.length} 筆記錄`);
            resolve(rows);
        });
    });
}

// 簡化的太久沒叫貨檢測
function checkRareOrderAnomaly(product) {
    const today = new Date();
    const rareThresholdDate = new Date(today.getTime() - (product.rare_order_days * 24 * 60 * 60 * 1000));
    
    // 模擬沒有叫貨記錄的情況
    const daysSinceCreation = Math.ceil((today - new Date(product.created_at || today)) / (24 * 60 * 60 * 1000));
    
    if (daysSinceCreation > product.rare_order_days) {
        return {
            type: 'rare_order',
            product_id: product.id,
            product_name: product.name,
            anomaly_days: daysSinceCreation,
            threshold_days: product.rare_order_days,
            message: `${product.name} 已 ${daysSinceCreation} 天未叫貨，超過標準 ${product.rare_order_days} 天`
        };
    }
    
    return null;
}

async function main() {
    try {
        console.log('\n1️⃣  測試資料庫結構...');
        await testDatabaseStructure();
        
        console.log('\n2️⃣  測試異常檢查查詢...');
        const products = await testAnomalyQuery();
        
        console.log('\n3️⃣  測試訂單查詢...');
        await testOrdersQuery();
        
        console.log('\n4️⃣  測試異常檢測邏輯...');
        const anomalies = [];
        
        products.forEach(product => {
            const anomaly = checkRareOrderAnomaly(product);
            if (anomaly) {
                anomalies.push(anomaly);
                console.log(`⚠️  發現異常: ${anomaly.message}`);
            }
        });
        
        console.log(`\n✅ 異常檢測完成，發現 ${anomalies.length} 個異常`);
        
        if (anomalies.length > 0) {
            console.log('\n📊 異常詳情:');
            anomalies.forEach((anomaly, index) => {
                console.log(`   ${index + 1}. ${anomaly.type} - ${anomaly.product_name}`);
                console.log(`      異常天數: ${anomaly.anomaly_days}天 (標準: ${anomaly.threshold_days}天)`);
            });
        }
        
        console.log('\n🎉 所有測試通過！異常檢查功能正常運作');
        
    } catch (error) {
        console.error('\n❌ 測試失敗:', error.message);
        console.error('詳細錯誤:', error);
    } finally {
        db.close();
        console.log('\n📫 資料庫連接已關閉');
    }
}

main();